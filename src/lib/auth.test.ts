import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "./auth";
import type { SessionPayload } from "./auth";

describe("Auth", () => {
  describe("encrypt/decrypt", () => {
    it("encrypts and decrypts a session payload", async () => {
      const payload: SessionPayload = {
        userId: 1,
        email: "test@example.com",
        name: "Test User",
      };

      const token = await encrypt(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");

      const decrypted = await decrypt(token);
      expect(decrypted).toMatchObject(payload);
      expect(decrypted!.userId).toBe(1);
      expect(decrypted!.email).toBe("test@example.com");
      expect(decrypted!.name).toBe("Test User");
    });

    it("returns null for invalid token", async () => {
      const result = await decrypt("invalid-token");
      expect(result).toBeNull();
    });

    it("returns null for expired token", async () => {
      const { SignJWT } = await import("jose");
      const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);
      const token = await new SignJWT({ userId: 1, email: "t@t.com", name: "T" })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("0s")
        .sign(secret);

      const result = await decrypt(token);
      expect(result).toBeNull();
    });

    it("returns null for token signed with wrong secret", async () => {
      const { SignJWT } = await import("jose");
      const wrongSecret = new TextEncoder().encode("wrong-secret-key-for-testing-min-32!!");
      const token = await new SignJWT({ userId: 1 })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("1h")
        .sign(wrongSecret);

      const result = await decrypt(token);
      expect(result).toBeNull();
    });
  });
});
