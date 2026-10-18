import NextAuth from "next-auth";
import { NextResponse } from "next/server";
const { auth } = NextAuth({ providers: [], session: { strategy: "jwt" } });
export default auth((request) => {
  if (!request.auth?.user) {
    const url = new URL("/masuk", request.url);
    url.searchParams.set("lanjut", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
});
export const config = { matcher: ["/dashboard/:path*"], runtime: "nodejs" };
