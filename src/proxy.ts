import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { UserRole } from '@/types/database.types';

// Map roles to their designated home routes
const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: '/admin',
  STAFF: '/staff',
  TEACHER: '/teacher',
  STUDENT: '/student',
};

/**
 * Next.js 16 Routing Proxy
 * Handles auth token rotation via @supabase/ssr getAll/setAll,
 * protects private routes, and enforces strict RBAC before page render.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Bypass static assets, internal paths, and images
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Verify and refresh user session
  const { data: { user } } = await supabase.auth.getUser();

  let userRole: UserRole | null = null;
  let isActive = true;

  if (user) {
    // 1. Read metadata for immediate role resolution
    userRole = (user.user_metadata?.role as UserRole) || null;

    // 2. Fetch live profile to inspect verified role and active status
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .single();

      if (profile) {
        userRole = (profile.role as UserRole) || userRole;
        isActive = profile.is_active !== false;
      }
    } catch {
      // Fallback to metadata role if database query encounters transient issues
    }

    if (!userRole) {
      userRole = 'STUDENT';
    }

    // Helper: copy refreshed session cookies to any redirect response
    const makeRedirect = (targetUrl: string | URL) => {
      const redirectRes = NextResponse.redirect(new URL(targetUrl, request.url));
      response.cookies.getAll().forEach((c) => {
        redirectRes.cookies.set(c.name, c.value);
      });
      return redirectRes;
    };

    // Prohibit deactivated accounts from accessing the system (#16)
    if (!isActive) {
      await supabase.auth.signOut();
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'Your account has been deactivated. Please contact campus administration.');
      return makeRedirect(loginUrl);
    }

    // Propagate authenticated headers to downstream Server Components
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-role', userRole);
    response.headers.set('x-user-email', user.email || '');

    // If an authenticated user visits auth pages, redirect to their home workstation
    const isAuthRoute =
      pathname === '/login' ||
      pathname === '/register' ||
      pathname === '/forgot-password';

    if (isAuthRoute) {
      const destination = ROLE_HOME[userRole] || '/student';
      return makeRedirect(destination);
    }
  }

  // Helper: copy refreshed session cookies to any redirect response
  const makeRedirect = (targetUrl: string | URL) => {
    const redirectRes = NextResponse.redirect(new URL(targetUrl, request.url));
    response.cookies.getAll().forEach((c) => {
      redirectRes.cookies.set(c.name, c.value);
    });
    return redirectRes;
  };

  // Protected routes check
  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/staff') ||
    pathname.startsWith('/teacher') ||
    pathname.startsWith('/student') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/api/admin');

  if (isProtected && !user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', pathname);
    return makeRedirect(loginUrl);
  }

  // Role-Based Access Control (RBAC) (#12)
  if (user && userRole) {
    // Admin routes
    if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
      if (userRole !== 'ADMIN') {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Forbidden: Admin privilege required' },
            { status: 403 }
          );
        }
        return makeRedirect('/unauthorized');
      }
    }

    // Staff routes
    if (pathname.startsWith('/staff')) {
      if (userRole !== 'STAFF' && userRole !== 'ADMIN') {
        return makeRedirect('/unauthorized');
      }
    }

    // Teacher routes
    if (pathname.startsWith('/teacher')) {
      if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
        return makeRedirect('/unauthorized');
      }
    }

    // Student routes
    if (pathname.startsWith('/student')) {
      if (userRole !== 'STUDENT' && userRole !== 'ADMIN') {
        return makeRedirect('/unauthorized');
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
