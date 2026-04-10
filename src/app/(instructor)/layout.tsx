import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function InstructorLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#c1c1c1]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/dashboard" className="text-xl font-bold text-[#222222]">
            안전몽
          </a>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#6a6a6a]">{session.name}</span>
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="text-sm text-[#6a6a6a] hover:text-[#222222]">
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
