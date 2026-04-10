import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { JoinForm } from "@/components/join-form";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = db.select().from(sessions).where(eq(sessions.code, code.toUpperCase())).get();

  if (!session) notFound();
  if (session.phase === "closed") notFound();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        <h1 className="text-2xl font-bold text-[#222222]">안전몽</h1>
        <p className="text-[#6a6a6a]">닉네임을 입력하여 참여하세요</p>
        <JoinForm sessionId={session.id} />
      </div>
    </div>
  );
}
