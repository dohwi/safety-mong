import { NextRequest, NextResponse } from "next/server";
import { logout } from "@/lib/actions/auth";

export async function POST(request: NextRequest) {
  await logout();
  
  // 요청의 Origin 정보를 사용하여 동적으로 리다이렉트 URL 생성
  const origin = request.headers.get("origin") || request.nextUrl.origin;
  return NextResponse.redirect(new URL("/login", origin));
}
