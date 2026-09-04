import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";

import { ALL_LESSONS, COURSE_TITLE, formatDuration } from "@/lib/course";
import { getAdminOverview, getAdminSubmissions } from "@/lib/course.functions";
import { getTelegramChats, sendTelegramTask } from "@/lib/telegram.functions";
import { useSession } from "@/lib/useSession";

const TASK_TEMPLATES = [
  {
    label: "Bölümü tamamla",
    title: "Günlük Görev",
    text: "Bugün en az 1 bölümü izleyip tamamla ve görev cevabını siteden gönder.",
  },
  {
    label: "Satış toplantısı provası",
    title: "Görev: Satış Toplantısı",
    text: "Satış toplantısı senaryosunu baştan sona sesli prova et ve kaydını görev alanına yükle.",
  },
  {
    label: "Onboarding dosyası",
    title: "Görev: Onboarding",
    text: "Bir müşteri için Drive klasörü ve onboarding dokümanını hazırla, bağlantısını gönder.",
  },
  {
    label: "Hedef kitle çalışması",
    title: "Görev: Hedef Kitle",
    text: "Seçtiğin bir işletme için 3 farklı hedef kitle oluştur ve neden seçtiğini yaz.",
  },
  {
    label: "Kreatif üretimi",
    title: "Görev: Kreatif",
    text: "2 farklı reklam kreatifi hazırla, metinleriyle birlikte görev alanından gönder.",
  },
  {
    label: "Hatırlatma",
    title: "Hatırlatma",
    text: "Bugün eğitime devam etmeyi unutma. Küçük adımlar büyük fark yaratır 💪",
  },
];

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
type Submissions = Awaited<ReturnType<typeof getAdminSubmissions>>;

function AdminPage() {
  const { session, ready, clear } = useSession();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Overview>([]);
  const [error, setError] = useState<string | null>(null);
  const [openUser, setOpenUser] = useState<string | null>(null);
  const [subs, setSubs] = useState<Submissions>([]);
  const [chats, setChats] = useState<Awaited<ReturnType<typeof getTelegramChats>>>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [msgTitle, setMsgTitle] = useState("");
  const [msgText, setMsgText] = useState("");
  const [includeLink, setIncludeLink] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendMsg, setSendMsg] = useState<string | null>(null);

  const load = useCallback(async (token: string) => {
    try {
      const [overview, submissions, telegramChats] = await Promise.all([
        getAdminOverview({ data: { token } }),
        getAdminSubmissions({ data: { token } }),
        getTelegramChats({ data: { token } }),
      ]);
      setRows(overview);
      setSubs(submissions);
      setChats(telegramChats);
      setSelected(telegramChats.map((c) => c.chat_id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Veriler yüklenemedi.");
    }
  }, []);

  async function send() {
    if (!session) return;
    if (selected.length === 0) {
      setSendMsg("En az bir öğrenci seçin.");
      return;
    }
    if (msgText.trim().length < 2) {
      setSendMsg("Mesaj yazın veya hazır görev seçin.");
      return;
    }
    setSending(true);
    setSendMsg(null);
    try {
      const res = await sendTelegramTask({
        data: {
          token: session.token,
          chatIds: selected,
          title: msgTitle.trim() || undefined,
          message: msgText.trim(),
          includeLink,
        },
      });
      setSendMsg(`${res.sent} kişiye gönderildi${res.failed ? `, ${res.failed} başarısız` : ""}.`);
      setMsgText("");
      setMsgTitle("");
    } catch (e) {
      setSendMsg(e instanceof Error ? e.message : "Gönderilemedi.");
    } finally {
      setSending(false);
    }
  }

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

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Telegram ile görev gönder</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Hazır bir görev seç ya da kendi mesajını yaz, seçtiğin öğrencilere Telegram'dan gitsin.
          </p>

          {chats.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Henüz kayıtlı Telegram sohbeti yok. Öğrenci botu açıp bir kez /start yazmalı.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {chats.map((c) => {
                const on = selected.includes(c.chat_id);
                return (
                  <button
                    key={c.chat_id}
                    onClick={() =>
                      setSelected((prev) =>
                        on ? prev.filter((id) => id !== c.chat_id) : [...prev, c.chat_id],
                      )
                    }
                    className={`rounded-full border px-3 py-1.5 text-sm ${
                      on ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                    }`}
                  >
                    {c.assigned_student ?? c.first_name ?? c.telegram_username ?? c.chat_id}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {TASK_TEMPLATES.map((t) => (
              <button
                key={t.label}
                onClick={() => {
                  setMsgTitle(t.title);
                  setMsgText(t.text);
                }}
                className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
              >
                {t.label}
              </button>
            ))}
          </div>

          <input
            value={msgTitle}
            onChange={(e) => setMsgTitle(e.target.value)}
            placeholder="Başlık (opsiyonel)"
            className="mt-3 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <textarea
            value={msgText}
            onChange={(e) => setMsgText(e.target.value)}
            rows={4}
            placeholder="Görev / mesaj metni…"
            className="mt-2 w-full rounded-lg border border-border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={includeLink}
                onChange={(e) => setIncludeLink(e.target.checked)}
              />
              Site linkini ekle
            </label>
            <button
              onClick={() => void send()}
              disabled={sending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
            >
              {sending ? "Gönderiliyor…" : "Telegram'dan Gönder"}
            </button>
            {sendMsg ? <span className="text-sm text-muted-foreground">{sendMsg}</span> : null}
          </div>
        </section>


        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold">Gönderilen görevler</h2>
          {subs.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">Henüz görev gönderilmedi.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border">
              {subs.map((s) => (
                <li key={s.id} className="py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{s.username}</span>
                    <span className="text-muted-foreground">
                      {s.lessonTitle} · {new Date(s.createdAt).toLocaleString("tr-TR")}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{s.content}</p>
                  {s.link ? (
                    <a href={s.link} target="_blank" rel="noreferrer" className="mt-1 inline-block text-primary underline">
                      {s.link}
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
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
                <div className="flex items-center gap-2">

                  <button
                    onClick={() => setOpenUser(open ? null : row.userId)}
                    className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-muted"
                  >
                    {open ? "Gizle" : "Detay"}
                  </button>
                </div>
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
