import { useCallback, useEffect, useState } from "react";

/** Hatırlatma saatleri — Azerbaycan saatiyle (UTC+4). */
export const REMINDER_TIMES = ["08:30", "14:00", "23:15"];

export const REMINDER_MESSAGES: { title: string; body: string }[] = [
  { title: "Bugün bir bölüm izleyelim mi?", body: "10 dakikan varsa yeni bir derse başlayabilirsin." },
  { title: "Kaldığın yerden devam", body: "Yarım bıraktığın bölüm seni bekliyor." },
  { title: "Küçük adımlar büyük fark", body: "Günde tek bölüm bile ilerlemeni hızlandırır." },
  { title: "Görevini gönderdin mi?", body: "İzlediğin bölümün görevini tamamlayıp gönderebilirsin." },
  { title: "Serini bozma", body: "Bugünkü dersini tamamlayarak ilerlemeni sürdür." },
  { title: "Hedefe biraz daha yaklaş", body: "Bir bölüm daha izle, kursu bitirmene az kaldı." },
  { title: "Pratik zamanı", body: "Öğrendiklerini uygulamak için görev alanını kullan." },
  { title: "Hazırsan başlayalım", body: "Yeni bölüm birkaç dakikanı alacak." },
  { title: "Akşam tekrarı", body: "Günü bir bölüm izleyerek kapatmaya ne dersin?" },
];

const KEY = "mc_reminders";

type State = { enabled: boolean; lastSlot: string | null };

function read(): State {
  if (typeof window === "undefined") return { enabled: false, lastSlot: null };
  try {
    return { enabled: false, lastSlot: null, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return { enabled: false, lastSlot: null };
  }
}

function write(state: State) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function pickMessage(seed: string) {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return REMINDER_MESSAGES[hash % REMINDER_MESSAGES.length]!;
}

/** Şu an geçilmiş en son hatırlatma dilimi (ör. "2026-08-30-15"). */
function currentSlot(now = new Date()) {
  const hours = REMINDER_HOURS.filter((h) => now.getHours() >= h);
  if (hours.length === 0) return null;
  const hour = hours[hours.length - 1]!;
  const day = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  return `${day}-${hour}`;
}

export function useDailyReminders(username: string) {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    setEnabled(read().enabled && Notification.permission === "granted");
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      const slot = currentSlot();
      if (!slot) return;
      const state = read();
      if (state.lastSlot === slot) return;
      write({ enabled: true, lastSlot: slot });
      const msg = pickMessage(`${username}-${slot}`);
      try {
        new Notification(msg.title, { body: msg.body, icon: "/favicon.ico", tag: slot });
      } catch {
        /* yoksay */
      }
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [enabled, username]);

  const toggle = useCallback(async () => {
    if (!("Notification" in window)) return;
    if (enabled) {
      setEnabled(false);
      write({ ...read(), enabled: false });
      return;
    }
    const result = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") return;
    // Açılışta bugünün geçmiş dilimlerini tekrar göstermemek için işaretle.
    write({ enabled: true, lastSlot: currentSlot() });
    setEnabled(true);
    new Notification("Hatırlatmalar açıldı", {
      body: `Her gün ${REMINDER_HOURS.join(":00, ")}:00 saatlerinde seni derse çağıracağız.`,
      icon: "/favicon.ico",
    });
  }, [enabled]);

  /** Deneme amaçlı: farklı mesajlardan 3 bildirimi art arda gönderir. */
  const sendTest = useCallback(async () => {
    if (!("Notification" in window)) return;
    const result = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    setPermission(result);
    if (result !== "granted") return;
    const base = Math.floor(Math.random() * REMINDER_MESSAGES.length);
    for (let i = 0; i < 3; i++) {
      const msg = REMINDER_MESSAGES[(base + i) % REMINDER_MESSAGES.length]!;
      window.setTimeout(() => {
        try {
          new Notification(msg.title, { body: msg.body, icon: "/favicon.ico", tag: `test-${Date.now()}-${i}` });
        } catch {
          /* yoksay */
        }
      }, i * 1500);
    }
  }, []);

  return { enabled, permission, toggle, sendTest };
}
