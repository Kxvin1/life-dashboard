import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = ["/login", "/register", "/home"];

  // If the user is not authenticated and trying to access a protected route
  if (!token && !publicRoutes.includes(pathname)) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // If the user is authenticated and trying to access auth pages
  if (
    token &&
    (pathname === "/login" || pathname === "/register" || pathname === "/home")
  ) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|images).*)"],
};
