import { createHash, createHmac, timingSafeEqual } from "node:crypto";

const SALT = "mc_v1_";

export function hashPassword(password: string) {
  return createHash("sha256").update(SALT + password).digest("hex");
}

function secret() {
  const value = process.env["COURSE_SESSION_SECRET"];
  if (!value) throw new Error("COURSE_SESSION_SECRET is not set");
  return value;
}

export type SessionPayload = {
  uid: string;
  username: string;
  admin: boolean;
  exp: number;
};

function b64url(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

export function signSession(payload: SessionPayload) {
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", secret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}

export function verifySession(token: string | null | undefined): SessionPayload | null {
  if (!token || !token.includes(".")) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = createHmac("sha256", secret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (!payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
