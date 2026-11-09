import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { UserRole } from '@/types/database.types';

// Map roles to their designated home routes
const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: '/admin',
  STAFF: '/staff',
  TEACHER: '/teacher',
  STUDENT: '/student',
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Bypass static assets, images, and favicon
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
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: '', ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        response.cookies.set({ name, value: '', ...options });
      },
    },
  });

  // Verify authenticated session
  const { data: { user } } = await supabase.auth.getUser();

  let userRole: UserRole | null = null;
  let isActive = true;

  if (user) {
    // Fetch live profile to inspect role and active status
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single();

    if (profile) {
      userRole = profile.role as UserRole;
      isActive = profile.is_active;
    } else {
      userRole = (user.user_metadata?.role as UserRole) || 'STUDENT';
    }

    // Prohibit deactivated accounts from accessing the system (#16)
    if (!isActive) {
      await supabase.auth.signOut();
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'Your account has been deactivated. Please contact campus administration.');
      return NextResponse.redirect(loginUrl);
    }

    // Propagate authenticated headers
    response.headers.set('x-user-id', user.id);
    response.headers.set('x-user-role', userRole);
    response.headers.set('x-user-email', user.email || '');
  }

  const isAuthRoute =
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password';

  // 1. Authenticated users navigating to login/register get redirected to their dashboard
  if (user && isAuthRoute && userRole) {
    const destination = ROLE_HOME[userRole] || '/student';
    return NextResponse.redirect(new URL(destination, request.url));
  }

  // 2. Protected routes check
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
    return NextResponse.redirect(loginUrl);
  }

  // 3. Role-Based Access Control (RBAC) (#12)
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
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // Staff routes
    if (pathname.startsWith('/staff')) {
      if (userRole !== 'STAFF' && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // Teacher routes
    if (pathname.startsWith('/teacher')) {
      if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }
    }

    // Student routes
    if (pathname.startsWith('/student')) {
      if (userRole !== 'STUDENT' && userRole !== 'ADMIN') {
        return NextResponse.redirect(new URL('/unauthorized', request.url));
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
