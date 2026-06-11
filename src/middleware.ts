import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Paths that require authentication
  if (pathname.startsWith("/portal")) {
    const sessionCookie = request.cookies.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    const session = await verifyToken(sessionCookie);
    if (!session) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("session");
      return response;
    }
    return NextResponse.next();
  }

  // Paths that should not be accessible if already authenticated (redirect to portal)
  if (pathname === "/" || pathname === "/login") {
    // If the URL contains ?clear=1, delete the session and redirect back to /login
    if (request.nextUrl.searchParams.get("clear") === "1") {
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("session");
      return response;
    }

    const sessionCookie = request.cookies.get("session")?.value;
    if (sessionCookie) {
      const session = await verifyToken(sessionCookie);
      if (session) {
        return NextResponse.redirect(new URL("/portal", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/portal/:path*"],
};
