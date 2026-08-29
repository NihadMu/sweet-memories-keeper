import { ALL_LESSONS, LESSON_IDS } from "./course";
import { hashPassword, signSession, verifySession } from "./session.server";

const SESSION_DAYS = 30;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function loginUser(username: string, password: string) {
  const db = await admin();
  const { data, error } = await db
    .from("course_users")
    .select("id, username, password_hash, is_admin")
    .ilike("username", username.trim())
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.password_hash !== hashPassword(password)) {
    return { ok: false as const, error: "Kullanıcı adı veya parola hatalı." };
  }
  const token = signSession({
    uid: data.id,
    username: data.username,
    admin: data.is_admin,
    exp: Date.now() + SESSION_DAYS * 864e5,
  });
  return { ok: true as const, token, user: { username: data.username, admin: data.is_admin } };
}

export function requireSession(token: string) {
  const session = verifySession(token);
  if (!session) throw new Error("Oturum süresi doldu, tekrar giriş yapın.");
  return session;
}

export async function listProgress(userId: string) {
  const db = await admin();
  const { data, error } = await db
    .from("course_progress")
    .select("lesson_id, seconds_watched, duration_seconds, completed, updated_at")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function upsertProgress(input: {
  userId: string;
  lessonId: string;
  secondsWatched: number;
  durationSeconds: number;
  completed: boolean;
}) {
  if (!LESSON_IDS.has(input.lessonId)) throw new Error("Geçersiz ders.");
  const db = await admin();
  const existing = await db
    .from("course_progress")
    .select("seconds_watched, completed")
    .eq("user_id", input.userId)
    .eq("lesson_id", input.lessonId)
    .maybeSingle();

  const seconds = Math.max(Math.round(input.secondsWatched), existing.data?.seconds_watched ?? 0);
  const completed = input.completed || existing.data?.completed || false;

  const { error } = await db.from("course_progress").upsert(
    {
      user_id: input.userId,
      lesson_id: input.lessonId,
      seconds_watched: seconds,
      duration_seconds: Math.round(input.durationSeconds),
      completed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );
  if (error) throw new Error(error.message);
  return { ok: true as const };
}

export async function adminOverview() {
  const db = await admin();
  const [{ data: users, error: uErr }, { data: rows, error: pErr }] = await Promise.all([
    db.from("course_users").select("id, username, is_admin, created_at").order("username"),
    db.from("course_progress").select("user_id, lesson_id, seconds_watched, duration_seconds, completed, updated_at"),
  ]);
  if (uErr) throw new Error(uErr.message);
  if (pErr) throw new Error(pErr.message);

  const totalLessons = ALL_LESSONS.length;
  return (users ?? [])
    .filter((u) => !u.is_admin)
    .map((u) => {
      const mine = (rows ?? []).filter((r) => r.user_id === u.id);
      const completed = mine.filter((r) => r.completed);
      const lastSeen = mine
        .map((r) => r.updated_at)
        .sort()
        .at(-1);
      return {
        userId: u.id,
        username: u.username,
        totalLessons,
        completedCount: completed.length,
        watchedSeconds: mine.reduce((sum, r) => sum + (r.seconds_watched ?? 0), 0),
        lastSeen: lastSeen ?? null,
        lessons: mine.map((r) => ({
          lessonId: r.lesson_id,
          secondsWatched: r.seconds_watched ?? 0,
          durationSeconds: r.duration_seconds ?? 0,
          completed: r.completed,
          updatedAt: r.updated_at,
        })),
      };
    });
}
