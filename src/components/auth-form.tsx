"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/actions/auth";

interface AuthFormProps {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  mode: "login" | "signup";
}

export function AuthForm({ action, mode }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4 w-full max-w-sm">
      {state?.error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
          {state.error}
        </div>
      )}

      {mode === "signup" && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[#222222] mb-1">
            이름
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full px-4 py-2.5 border border-[#c1c1c1] rounded-lg text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
            placeholder="홍길동"
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#222222] mb-1">
          이메일
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full px-4 py-2.5 border border-[#c1c1c1] rounded-lg text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
          placeholder="instructor@university.ac.kr"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-[#222222] mb-1">
          비밀번호
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : 1}
          className="w-full px-4 py-2.5 border border-[#c1c1c1] rounded-lg text-[#222222] focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
          placeholder={mode === "signup" ? "8자 이상 입력" : "비밀번호 입력"}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full py-2.5 bg-[#3b82f6] text-white font-medium rounded-lg hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
      </button>

      <p className="text-center text-sm text-[#6a6a6a]">
        {mode === "login" ? (
          <>
            계정이 없으신가요?{" "}
            <a href="/signup" className="text-[#3b82f6] hover:underline">
              회원가입
            </a>
          </>
        ) : (
          <>
            이미 계정이 있으신가요?{" "}
            <a href="/login" className="text-[#3b82f6] hover:underline">
              로그인
            </a>
          </>
        )}
      </p>
    </form>
  );
}
