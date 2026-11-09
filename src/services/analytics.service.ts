import { getSupabaseServerClient } from '@/lib/supabase/server';
import { Database, IssuePriority, IssueStatus, ServiceResponse } from '@/types/database.types';

export type IssueRow = Database['public']['Tables']['issues']['Row'];
export type LocationRow = Database['public']['Tables']['locations']['Row'];
export type ZoneScoreSnapshotRow = Database['public']['Tables']['zone_score_snapshots']['Row'];
export type MonthlyReportRow = Database['public']['Tables']['monthly_reports']['Row'];

export interface IssueSearchFilters {
  searchTerm?: string;
  category?: string;
  building?: string;
  floor?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  startDate?: string;
  endDate?: string;
  sortBy?: 'created_at' | 'sla_deadline' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface AreaRankingItem {
  location_id: string;
  building: string;
  floor: string;
  specific_area: string;
  category: string;
  cleanliness_score: number;
  open_issues_count: number;
  resolved_issues_count: number;
  sla_breach_rate: number;
  avg_rating: number | null;
  snapshot_date: string;
}

class AnalyticsService {
  /**
   * Dynamic Query Builder (#68-#75)
   * Composable full-text search and multi-facet filtering on public.issues
   */
  public async searchIssues(
    filters: IssueSearchFilters
  ): Promise<ServiceResponse<{ issues: (IssueRow & { location: LocationRow })[]; total: number }>> {
    try {
      const serverClient = await getSupabaseServerClient();

      let query = serverClient
        .from('issues')
        .select('*, location:locations!inner(*)', { count: 'exact' });

      // 1. Full-text search using PostgreSQL tsvector GIN index (#68)
      if (filters.searchTerm && filters.searchTerm.trim() !== '') {
        query = query.textSearch('search_vector', filters.searchTerm.trim(), {
          type: 'websearch',
          config: 'english',
        });
      }

      // 2. Filter by Category (#70)
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      // 3. Filter by Status (#72)
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // 4. Filter by Priority (#73)
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      // 5. Filter by Location (Building & Floor) (#71)
      if (filters.building) {
        query = query.eq('location.building', filters.building);
      }
      if (filters.floor) {
        query = query.eq('location.floor', filters.floor);
      }

      // 6. Filter by Date Range (#74)
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      // 7. Multi-column Dynamic Sorting (#75)
      const sortBy = filters.sortBy || 'created_at';
      const ascending = filters.sortOrder === 'asc';
      query = query.order(sortBy, { ascending });

      // 8. Pagination
      const limit = filters.limit ?? 20;
      const offset = filters.offset ?? 0;
      query = query.range(offset, offset + limit - 1);

      const { data, count, error } = await query;

      if (error) return { data: null, error: error.message };

      return {
        data: {
          issues: (data || []) as unknown as (IssueRow & { location: LocationRow })[],
          total: count || 0,
        },
        error: null,
      };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Area Cleanliness Ranking (#84, ADR 006)
   * Strictly reads from pre-computed zone_score_snapshots (CQRS-Lite).
   */
  public async getAreaCleanlinessRankings(
    date?: string
  ): Promise<ServiceResponse<AreaRankingItem[]>> {
    try {
      const serverClient = await getSupabaseServerClient();

      let query = serverClient
        .from('zone_score_snapshots')
        .select('*, location:locations(*)')
        .order('cleanliness_score', { ascending: false });

      if (date) {
        query = query.eq('snapshot_date', date);
      } else {
        // Latest snapshot date
        const { data: latestDateRow } = await serverClient
          .from('zone_score_snapshots')
          .select('snapshot_date')
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latestDateRow) {
          query = query.eq('snapshot_date', (latestDateRow as { snapshot_date: string }).snapshot_date);
        }
      }

      const { data, error } = await query;
      if (error) return { data: null, error: error.message };

      const rankings: AreaRankingItem[] = (data || []).map((row: any) => ({
        location_id: row.location_id,
        building: row.location?.building || 'Unknown',
        floor: row.location?.floor || 'Unknown',
        specific_area: row.location?.specific_area || 'Unknown',
        category: row.location?.category || 'General',
        cleanliness_score: Number(row.cleanliness_score),
        open_issues_count: row.open_issues_count,
        resolved_issues_count: row.resolved_issues_count,
        sla_breach_rate: Number(row.sla_breach_rate),
        avg_rating: row.avg_rating ? Number(row.avg_rating) : null,
        snapshot_date: row.snapshot_date,
      }));

      return { data: rankings, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Campus Cleanliness Leaderboard (#85, ADR 002)
   * Ranks AREAS/ZONES only, targeting top-performing facilities.
   */
  public async getCampusLeaderboard(
    limit = 10
  ): Promise<ServiceResponse<AreaRankingItem[]>> {
    try {
      const rankingsResponse = await this.getAreaCleanlinessRankings();
      if (rankingsResponse.error || !rankingsResponse.data) {
        return { data: null, error: rankingsResponse.error };
      }

      return {
        data: rankingsResponse.data.slice(0, limit),
        error: null,
      };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }

  /**
   * Monthly Immutable Report Viewer (#86)
   */
  public async getMonthlyReport(reportMonth: string): Promise<ServiceResponse<MonthlyReportRow>> {
    try {
      const serverClient = await getSupabaseServerClient();
      const { data, error } = await serverClient
        .from('monthly_reports')
        .select('*')
        .eq('report_month', reportMonth)
        .order('revision', { ascending: false })
        .limit(1)
        .single();

      if (error) return { data: null, error: error.message };
      return { data: data as MonthlyReportRow, error: null };
    } catch (err) {
      return { data: null, error: (err as Error).message };
    }
  }
}

export const analyticsService = new AnalyticsService();
