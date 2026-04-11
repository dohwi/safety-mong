import { AuthForm } from "@/components/auth-form";
import { BrandMascot } from "@/components/brand-mascot";
import { signup } from "@/lib/actions/auth";

export const metadata = { title: "회원가입 - 안전몽" };

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="flex flex-col items-center gap-8 w-full">
        <BrandMascot variant="safety" size={176} priority className="h-auto w-36 drop-shadow-sm sm:w-40" />
        <div className="text-center">
          <h1 className="font-brand text-4xl font-bold text-[#222222]">안전몽</h1>
          <p className="text-[#6B7280] mt-2">실험몽과 함께 교강사 계정을 만드세요</p>
        </div>
        <AuthForm action={signup} mode="signup" />
      </div>
    </div>
  );
}
