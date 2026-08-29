import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { ALL_LESSONS, COURSE_TITLE, formatDuration } from "@/lib/course";
import { getAdminOverview } from "@/lib/course.functions";
import { useSession } from "@/lib/useSession";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Yönetici Paneli — Meta Course" },
      { name: "description", content: "Öğrencilerin ders ilerlemesini ve tamamlanma durumunu takip edin." },
      { property: "og:title", content: "Yönetici Paneli — Meta Course" },
      { property: "og:description", content: "Öğrenci ilerleme takibi." },
      { property: "og:url", content: "/admin" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/admin" }],
  }),
  component: AdminPage,
});

type Overview = Awaited<ReturnType<typeof getAdminOverview>>;

function AdminPage() {
  const { session, ready, clear } = useSession();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Overview>([]);
  const [error, setError] = useState<string | null>(null);
  const [openUser, setOpenUser] = useState<string | null>(null);

  const load = useCallback(async (token: string) => {
    try {
      setRows(await getAdminOverview({ data: { token } }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Veriler yüklenemedi.");
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      navigate({ to: "/" });
      return;
    }
    if (!session.admin) {
      navigate({ to: "/" });
      return;
    }
    void load(session.token);
  }, [ready, session, navigate, load]);

  if (!ready || !session?.admin) return null;

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">{COURSE_TITLE} · Yönetici</h1>
          <button onClick={clear} className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted">
            Çıkış
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {rows.length === 0 && !error ? (
          <p className="text-sm text-muted-foreground">Henüz öğrenci verisi yok.</p>
        ) : null}

        {rows.map((row) => {
          const percent = Math.round((row.completedCount / row.totalLessons) * 100);
          const open = openUser === row.userId;
          return (
            <div key={row.userId} className="rounded-xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-semibold">{row.username}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.completedCount}/{row.totalLessons} ders tamamlandı · Toplam izleme{" "}
                    {formatDuration(row.watchedSeconds)}
                    {row.lastSeen
                      ? ` · Son aktivite ${new Date(row.lastSeen).toLocaleString("tr-TR")}`
                      : ""}
                  </p>
                </div>
                <button
                  onClick={() => setOpenUser(open ? null : row.userId)}
                  className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                >
                  {open ? "Gizle" : "Detay"}
                </button>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${percent}%` }} />
              </div>

              {open ? (
                <ul className="mt-4 divide-y divide-border border-t border-border">
                  {ALL_LESSONS.map((lesson) => {
                    const item = row.lessons.find((l) => l.lessonId === lesson.id);
                    const watched = item?.secondsWatched ?? 0;
                    const ratio = Math.min(100, Math.round((watched / lesson.durationSeconds) * 100));
                    return (
                      <li key={lesson.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="flex-1">
                          <span className="text-muted-foreground">{lesson.moduleTitle} · </span>
                          {lesson.title}
                        </span>
                        <span className="text-muted-foreground">
                          {formatDuration(watched)} / {formatDuration(lesson.durationSeconds)} ({ratio}%)
                        </span>
                        <span
                          className={
                            item?.completed ? "font-medium text-primary" : "text-muted-foreground"
                          }
                        >
                          {item?.completed ? "Tamamlandı" : "—"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </main>
    </div>
  );
}
