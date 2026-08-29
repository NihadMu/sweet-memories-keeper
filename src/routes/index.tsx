import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { LoginCard } from "@/components/LoginCard";
import { ALL_LESSONS, COURSE_TITLE, MODULES, formatDuration } from "@/lib/course";
import { getMyProgress, login, saveProgress } from "@/lib/course.functions";
import { useSession } from "@/lib/useSession";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meta Course — Satış, Onboarding ve Hizmet Teslimatı Eğitimi" },
      {
        name: "description",
        content:
          "Meta Course: satış toplantısı, onboarding ve hizmet teslimatı bölümlerinden oluşan video eğitim programı.",
      },
      { property: "og:title", content: "Meta Course" },
      { property: "og:description", content: "Satış toplantısı, onboarding ve hizmet teslimatı video eğitimleri." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

type ProgressRow = {
  lesson_id: string;
  seconds_watched: number;
  duration_seconds: number;
  completed: boolean;
};

function Home() {
  const { session, ready, save, clear } = useSession();
  const navigate = useNavigate();
  const [progress, setProgress] = useState<Record<string, ProgressRow>>({});
  const [activeId, setActiveId] = useState(ALL_LESSONS[0]!.id);
  const [loadError, setLoadError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const lastSaved = useRef(0);

  const refresh = useCallback(async (token: string) => {
    try {
      const result = await getMyProgress({ data: { token } });
      const map: Record<string, ProgressRow> = {};
      for (const row of result.progress) map[row.lesson_id] = row as ProgressRow;
      setProgress(map);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "İlerleme yüklenemedi.");
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    if (session.admin) {
      navigate({ to: "/admin" });
      return;
    }
    void refresh(session.token);
  }, [session, refresh, navigate]);

  const activeLesson = useMemo(
    () => ALL_LESSONS.find((l) => l.id === activeId) ?? ALL_LESSONS[0]!,
    [activeId],
  );

  const completedCount = ALL_LESSONS.filter((l) => progress[l.id]?.completed).length;
  const percent = Math.round((completedCount / ALL_LESSONS.length) * 100);

  const push = useCallback(
    async (completed: boolean) => {
      const video = videoRef.current;
      if (!video || !session) return;
      const duration = Number.isFinite(video.duration) ? video.duration : activeLesson.durationSeconds;
      try {
        await saveProgress({
          data: {
            token: session.token,
            lessonId: activeLesson.id,
            secondsWatched: Math.floor(video.currentTime),
            durationSeconds: Math.floor(duration),
            completed,
          },
        });
        await refresh(session.token);
      } catch {
        /* sessiz geç, bir sonraki kayıtta tekrar denenir */
      }
    },
    [session, activeLesson, refresh],
  );

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    const now = Date.now();
    const ratio = video.duration ? video.currentTime / video.duration : 0;
    if (ratio >= 0.9 && !progress[activeLesson.id]?.completed) {
      lastSaved.current = now;
      void push(true);
      return;
    }
    if (now - lastSaved.current > 15000) {
      lastSaved.current = now;
      void push(false);
    }
  }

  if (!ready) return null;

  if (!session) {
    return (
      <LoginCard
        onSubmit={async (username, password) => {
          const result = await login({ data: { username, password } });
          if (!result.ok) return result.error;
          save({ token: result.token, username: result.user.username, admin: result.user.admin });
          return null;
        }}
      />
    );
  }

  if (session.admin) return null;

  return (
    <div className="min-h-screen bg-muted">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <h1 className="text-lg font-semibold tracking-tight">{COURSE_TITLE}</h1>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{session.username}</span>
            <button onClick={clear} className="rounded-md border border-border px-3 py-1.5 hover:bg-muted">
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <section>
          <div className="overflow-hidden rounded-xl border border-border bg-black">
            <video
              key={activeLesson.id}
              ref={videoRef}
              className="aspect-video w-full"
              controls
              playsInline
              preload="metadata"
              src={`/api/public/video/${activeLesson.id}?t=${encodeURIComponent(session.token)}`}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => void push(true)}
              onPause={() => void push(false)}
            />
          </div>
          <div className="mt-4 rounded-xl border border-border bg-card p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {ALL_LESSONS.find((l) => l.id === activeLesson.id)?.moduleTitle}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">{activeLesson.title}</h2>
            <div className="mt-3 flex items-center gap-3 text-sm text-muted-foreground">
              <span>{formatDuration(activeLesson.durationSeconds)}</span>
              {progress[activeLesson.id]?.completed ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  Tamamlandı
                </span>
              ) : null}
            </div>
            {loadError ? <p className="mt-3 text-sm text-destructive">{loadError}</p> : null}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium">İlerleme</p>
              <p className="text-sm text-muted-foreground">
                {completedCount}/{ALL_LESSONS.length}
              </p>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>

          {MODULES.map((module) => (
            <div key={module.id} className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold">{module.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{module.description}</p>
              <ul className="mt-3 space-y-1">
                {module.lessons.map((lesson) => {
                  const done = progress[lesson.id]?.completed;
                  const active = lesson.id === activeLesson.id;
                  return (
                    <li key={lesson.id}>
                      <button
                        onClick={() => setActiveId(lesson.id)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                          active ? "bg-primary/10 text-primary" : "hover:bg-muted"
                        }`}
                      >
                        <span
                          className={`flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                            done ? "border-primary bg-primary text-primary-foreground" : "border-border"
                          }`}
                        >
                          {done ? "✓" : ""}
                        </span>
                        <span className="flex-1">{lesson.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDuration(lesson.durationSeconds)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </aside>
      </main>
    </div>
  );
}
