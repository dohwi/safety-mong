"use server";

import { z } from "zod";
import { hash, compare } from "bcryptjs";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSession, deleteSession } from "@/lib/auth";

const signupSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  name: z.string().min(2, "이름은 2자 이상이어야 합니다"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
});

const loginSchema = z.object({
  email: z.string().email("유효한 이메일을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

export type ActionState = { error?: string; success?: boolean } | null;

export async function signup(_: ActionState, formData: FormData): Promise<ActionState> {
  const result = signupSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { email, name, password } = result.data;

  const existing = db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    return { error: "이미 등록된 이메일입니다" };
  }

  const passwordHash = await hash(password, 12);

  const user = db.insert(users).values({
    email,
    name,
    passwordHash,
    createdAt: new Date().toISOString(),
  }).returning().get();

  await createSession({ userId: user.id, email: user.email, name: user.name });
  return { success: true };
}

export async function login(_: ActionState, formData: FormData): Promise<ActionState> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { error: result.error.errors[0].message };
  }

  const { email, password } = result.data;

  const user = db.select().from(users).where(eq(users.email, email)).get();
  if (!user) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다" };
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다" };
  }

  await createSession({ userId: user.id, email: user.email, name: user.name });
  return { success: true };
}

export async function logout(): Promise<void> {
  await deleteSession();
}
