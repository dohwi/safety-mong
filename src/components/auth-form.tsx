"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ActionState } from "@/lib/actions/auth";

interface AuthFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  mode: "login" | "signup";
}

function useFormFields(mode: "login" | "signup") {
  const isDev = process.env.NODE_ENV === "development";
  const [email, setEmail] = useState(isDev && mode === "login" ? "test@teacher.com" : "");
  const [password, setPassword] = useState(isDev && mode === "login" ? "test1234" : "");
  const [prevMode, setPrevMode] = useState(mode);

  if (prevMode !== mode) {
    setPrevMode(mode);
    if (isDev && mode === "login") {
      setEmail("test@teacher.com");
      setPassword("test1234");
    } else {
      setEmail("");
      setPassword("");
    }
  }

  return { email, setEmail, password, setPassword };
}

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const router = useRouter();
  const { email, setEmail, password, setPassword } = useFormFields(mode);

  useEffect(() => {
    if (state?.success) router.push("/dashboard");
  }, [state?.success, router]);

  const inputCls = "w-full px-4 py-2.5 border border-[rgba(0,0,0,0.08)] rounded-xl bg-white text-[#222222] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[rgba(79,124,255,0.15)] focus:border-[rgba(79,124,255,0.5)] transition-all duration-200 hover:border-[rgba(0,0,0,0.15)]";

  return (
    <form action={formAction} className="space-y-4 w-full max-w-sm">
      {state?.error && (
        <div className="bg-[rgba(239,68,68,0.06)] text-[#EF4444] px-4 py-3 rounded-xl text-sm border border-[rgba(239,68,68,0.15)]">
          {state.error}
        </div>
      )}

      {mode === "signup" && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#6B7280] mb-1">이름</label>
          <input id="name" name="name" type="text" required className={inputCls} placeholder="홍길동" />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#6B7280] mb-1">이메일</label>
        <input 
          id="email" 
          name="email" 
          type="email" 
          required 
          className={inputCls} 
          placeholder="instructor@university.ac.kr" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[#6B7280] mb-1">비밀번호</label>
        <input 
          id="password" 
          name="password" 
          type="password" 
          required 
          minLength={mode === "signup" ? 8 : 1} 
          className={inputCls} 
          placeholder={mode === "signup" ? "8자 이상 입력" : "비밀번호 입력"} 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 bg-[#4F7CFF] text-white font-medium rounded-xl hover:bg-[#6B91FF] transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
      </button>

      <p className="text-center text-sm text-[#9CA3AF]">
        {mode === "login" ? (
          <>계정이 없으신가요? <Link href="/signup" className="text-[#4F7CFF] hover:underline">회원가입</Link></>
        ) : (
          <>이미 계정이 있으신가요? <Link href="/login" className="text-[#4F7CFF] hover:underline">로그인</Link></>
        )}
      </p>
    </form>
  );
}
