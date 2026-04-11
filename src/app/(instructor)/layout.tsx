import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

export default async function InstructorLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const navTextClass = "flex h-5 items-center text-sm leading-none text-[#6B7280]";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-[rgba(0,0,0,0.08)] bg-[#F8F9FB]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-[#222222]">
            <Image
              src="/mascots/safety-mong-profile.png"
              alt="안전몽 로고"
              width={36}
              height={36}
              className="h-9 w-9 rounded-full object-cover ring-1 ring-[rgba(0,0,0,0.06)]"
            />
            <span className="font-brand text-2xl font-bold">안전몽</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className={navTextClass}>{session.name}</span>
            <form action="/api/auth/logout" method="POST" className="flex h-5 items-center">
              <button type="submit" className={`${navTextClass} cursor-pointer border-0 bg-transparent p-0 hover:text-[#222222] transition-colors`}>
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">{children}</main>
    </div>
  );
}
