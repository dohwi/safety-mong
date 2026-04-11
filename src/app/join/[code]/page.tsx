import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { JoinForm } from "@/components/join-form";
import { BrandMascot } from "@/components/brand-mascot";

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const session = db.select().from(sessions).where(eq(sessions.code, code.toUpperCase())).get();

  if (!session) notFound();
  if (session.phase === "closed") notFound();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full mx-auto text-center space-y-6">
        <div className="flex flex-col items-center gap-4">
          <BrandMascot variant="safety" size={168} priority className="h-auto w-36 drop-shadow-sm sm:w-40" />
          <div className="space-y-2">
            <h1 className="font-brand text-3xl font-bold text-[#222222]">안전몽</h1>
            <p className="text-[#6B7280]">닉네임을 입력하여 참여하세요</p>
          </div>
        </div>
        <JoinForm sessionId={session.id} />
      </div>
    </div>
  );
}
