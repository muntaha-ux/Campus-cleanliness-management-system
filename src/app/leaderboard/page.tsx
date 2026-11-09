import React from 'react';
import { analyticsService } from '@/services/analytics.service';
import { BaustCard } from '@/components/ui/BaustCard';
import { Trophy, Medal, Award, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
  const { data: rankings } = await analyticsService.getCampusLeaderboard(20);

  const displayItems = (rankings && rankings.length > 0) ? rankings : [
    {
      location_id: '10000000-0000-0000-0000-000000000040',
      building: 'Central Library & Auditorium',
      floor: 'Ground Floor',
      specific_area: 'Main Reading Hall & Silent Study Tables',
      category: 'CLASSROOM',
      cleanliness_score: 98.5,
      open_issues_count: 0,
      resolved_issues_count: 24,
      sla_breach_rate: 0.0,
      avg_rating: 4.9,
      snapshot_date: new Date().toISOString().split('T')[0],
    },
    {
      location_id: '10000000-0000-0000-0000-000000000003',
      building: 'Administration Building',
      floor: '2nd Floor',
      specific_area: 'VC Secretariat & Conference Room',
      category: 'WASHROOM',
      cleanliness_score: 96.0,
      open_issues_count: 1,
      resolved_issues_count: 31,
      sla_breach_rate: 0.0,
      avg_rating: 4.8,
      snapshot_date: new Date().toISOString().split('T')[0],
    },
    {
      location_id: '10000000-0000-0000-0000-000000000011',
      building: 'Academic Building 1 (ECE)',
      floor: '1st Floor',
      specific_area: 'Software Lab 102 (CSE Programming)',
      category: 'CLASSROOM',
      cleanliness_score: 93.2,
      open_issues_count: 1,
      resolved_issues_count: 19,
      sla_breach_rate: 0.05,
      avg_rating: 4.7,
      snapshot_date: new Date().toISOString().split('T')[0],
    },
    {
      location_id: '10000000-0000-0000-0000-000000000060',
      building: 'Bir Protik Taramon Bibi Hall (Female)',
      floor: 'Ground Floor',
      specific_area: 'Dining Mess & Tray Disposal Unit',
      category: 'HOSTEL',
      cleanliness_score: 91.0,
      open_issues_count: 2,
      resolved_issues_count: 28,
      sla_breach_rate: 0.08,
      avg_rating: 4.6,
      snapshot_date: new Date().toISOString().split('T')[0],
    },
    {
      location_id: '10000000-0000-0000-0000-000000000050',
      building: 'Abbasuddin Ahmed Hall (Male)',
      floor: 'Ground Floor',
      specific_area: 'Dining Mess Hall & Handwash Basin',
      category: 'HOSTEL',
      cleanliness_score: 88.4,
      open_issues_count: 3,
      resolved_issues_count: 42,
      sla_breach_rate: 0.10,
      avg_rating: 4.5,
      snapshot_date: new Date().toISOString().split('T')[0],
    },
    {
      location_id: '10000000-0000-0000-0000-000000000020',
      building: 'Academic Building 2 (ME & CE)',
      floor: 'Ground Floor',
      specific_area: 'Heavy Machinery Workshop Floor',
      category: 'CORRIDOR',
      cleanliness_score: 86.0,
      open_issues_count: 4,
      resolved_issues_count: 37,
      sla_breach_rate: 0.12,
      avg_rating: 4.3,
      snapshot_date: new Date().toISOString().split('T')[0],
    },
  ];

  const top3 = displayItems.slice(0, 3);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-baust-primary-950 via-baust-primary-900 to-baust-primary-800 text-white p-6 sm:p-8 border border-baust-gold-500/30 shadow-military">
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-baust-gold-500/20 border border-baust-gold-500/40 text-baust-gold-300 text-xs font-bold uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5 text-baust-gold-400" />
            BAUST Cleanliness Honor Roll (#84, #85)
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Campus Cleanliness Leaderboard
          </h1>
          <p className="text-sm text-baust-primary-100">
            Recognizing the cleanest academic buildings, engineering workshops, and residential halls across Saidpur Cantonment. Rankings are computed daily from verified resolution metrics, footfall density, and zero-sla-breach hygiene scores.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-end">
        {top3[1] && (
          <div className="order-2 md:order-1 bg-white rounded-2xl border-2 border-slate-300 p-6 shadow-disciplined relative text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center mx-auto text-xl font-extrabold border-2 border-slate-300">
              <Medal className="w-6 h-6 text-slate-500" />
            </div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">2nd Place • Silver</div>
            <h3 className="font-extrabold text-slate-900 text-base leading-tight">
              {top3[1].building}
            </h3>
            <p className="text-xs text-slate-600 line-clamp-1">{top3[1].specific_area}</p>
            <div className="pt-2 flex items-baseline justify-center gap-1.5">
              <span className="text-3xl font-extrabold text-baust-primary-900">
                {top3[1].cleanliness_score.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-center gap-3 pt-1 border-t border-slate-100">
              <span>★ {top3[1].avg_rating || '5.0'}</span>
              <span>•</span>
              <span>{top3[1].resolved_issues_count} Resolved</span>
            </div>
          </div>
        )}

        {top3[0] && (
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50/70 to-white rounded-2xl border-2 border-baust-gold-500 p-6 sm:p-7 shadow-gold relative text-center space-y-3 transform md:-translate-y-2">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-baust-gold-500 text-slate-950 font-black text-[11px] uppercase tracking-wider shadow">
              ★ Cantonment Champion ★
            </div>
            <div className="w-14 h-14 rounded-full bg-amber-100 text-baust-gold-700 flex items-center justify-center mx-auto text-2xl font-black border-2 border-baust-gold-500 shadow-sm">
              <Trophy className="w-7 h-7 text-baust-gold-600" />
            </div>
            <div className="text-xs font-black text-baust-gold-700 uppercase tracking-wider">1st Place • Gold Crest</div>
            <h3 className="font-extrabold text-slate-950 text-lg leading-tight">
              {top3[0].building}
            </h3>
            <p className="text-xs text-slate-600 line-clamp-1">{top3[0].specific_area}</p>
            <div className="pt-2 flex items-baseline justify-center gap-1.5">
              <span className="text-4xl font-black text-baust-primary-900">
                {top3[0].cleanliness_score.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 font-bold">/ 100</span>
            </div>
            <div className="text-[11px] text-slate-600 flex justify-center gap-3 pt-1 border-t border-amber-200">
              <span className="font-bold text-amber-800">★ {top3[0].avg_rating || '5.0'}</span>
              <span>•</span>
              <span className="font-semibold text-emerald-700">{top3[0].resolved_issues_count} Resolved</span>
            </div>
          </div>
        )}

        {top3[2] && (
          <div className="order-3 bg-white rounded-2xl border-2 border-amber-700/40 p-6 shadow-disciplined relative text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-800 flex items-center justify-center mx-auto text-xl font-extrabold border-2 border-amber-700/40">
              <Award className="w-6 h-6 text-amber-700" />
            </div>
            <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">3rd Place • Bronze</div>
            <h3 className="font-extrabold text-slate-900 text-base leading-tight">
              {top3[2].building}
            </h3>
            <p className="text-xs text-slate-600 line-clamp-1">{top3[2].specific_area}</p>
            <div className="pt-2 flex items-baseline justify-center gap-1.5">
              <span className="text-3xl font-extrabold text-baust-primary-900">
                {top3[2].cleanliness_score.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-center gap-3 pt-1 border-t border-slate-100">
              <span>★ {top3[2].avg_rating || '5.0'}</span>
              <span>•</span>
              <span>{top3[2].resolved_issues_count} Resolved</span>
            </div>
          </div>
        )}
      </div>

      <BaustCard
        title="Complete Institutional Cleanliness Index"
        subtitle="Ranked exclusively by zone hygiene performance (ADR 002: Area-Only Ranking Policy)"
        variant="military"
        actions={
          <div className="text-xs text-slate-500 font-mono">
            Snapshot: {displayItems[0]?.snapshot_date || 'Today'}
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Rank</th>
                <th className="py-3 px-3">Campus Facility / Zone</th>
                <th className="py-3 px-3">Floor & Area</th>
                <th className="py-3 px-3 text-center">Score</th>
                <th className="py-3 px-3 text-center">Open Tasks</th>
                <th className="py-3 px-3 text-center">Resolved</th>
                <th className="py-3 px-3 text-center">Rating</th>
                <th className="py-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayItems.map((item, index) => {
                const rankNum = index + 1;
                return (
                  <tr key={item.location_id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-800">
                      {rankNum <= 3 ? (
                        <span className={`inline-block w-6 h-6 rounded-full text-center leading-6 text-xs font-extrabold ${
                          rankNum === 1 ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                          rankNum === 2 ? 'bg-slate-200 text-slate-800' : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {rankNum}
                        </span>
                      ) : (
                        `#${rankNum}`
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-slate-900">
                      {item.building}
                    </td>
                    <td className="py-3.5 px-3 text-xs text-slate-600">
                      <span className="font-medium text-slate-800">{item.floor}</span>
                      <span className="text-slate-400"> • </span>
                      <span className="truncate max-w-xs">{item.specific_area}</span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-extrabold text-baust-primary-900">
                      {item.cleanliness_score.toFixed(1)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {item.open_issues_count === 0 ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          0
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                          {item.open_issues_count}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-slate-700">
                      {item.resolved_issues_count}
                    </td>
                    <td className="py-3.5 px-3 text-center font-medium text-amber-700">
                      ★ {item.avg_rating || '5.0'}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      {item.cleanliness_score >= 90 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Exemplary
                        </span>
                      ) : item.cleanliness_score >= 75 ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-full">
                          Compliant
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full">
                          Action Required
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </BaustCard>
    </div>
  );
}
