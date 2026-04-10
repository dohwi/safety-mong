import { AuthForm } from "@/components/auth-form";
import { signup } from "@/lib/actions/auth";

export const metadata = { title: "회원가입 - 안전몽" };

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-8 w-full">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#222222]">안전몽</h1>
          <p className="text-[#6a6a6a] mt-2">교강사 계정 만들기</p>
        </div>
        <AuthForm action={signup} mode="signup" />
      </div>
    </div>
  );
}
