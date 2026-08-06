import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/") {
    const q = req.nextUrl.searchParams.get("q");
    if (q && q.trim()) {
      const url = req.nextUrl.clone();
      url.pathname = "/cari";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/"],
};
