import { AuthForm } from "@/components/auth-form";
import { login } from "@/lib/actions/auth";

export const metadata = { title: "로그인 - 안전몽" };

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-8 w-full">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#222222]">안전몽</h1>
          <p className="text-[#6a6a6a] mt-2">실험실 안전수칙 실시간 퀴즈 플랫폼</p>
        </div>
        <AuthForm action={login} mode="login" />
      </div>
    </div>
  );
}
