import { createFileRoute } from "@tanstack/react-router";

import { getSupabase, sendTelegramMessage } from "@/lib/telegram.server";

const GREETINGS = [
  "Salam! 👋 Ders vaxtıdır — bugünkü dərsini izləməyi unutma!",
  "Xatırlatma 📚 Bu günkü dərsini tamamladınmı? Qaldığın yerdən davam et!",
  "Görevini yoxla ✍️ Bu günkü tapşırığını göndərməyi unutma!",
  "Kiçik addımlar böyük nəticələr gətirir 🚀 Bu gün 10 dəqiqə belə izlə!",
  "Dərs seriyani davam etdir 💪 İzini itirmə, bu gün də irəlilə!",
  "Davam et! 🎯 Hər dərs səni hədəfə bir addım daha yaxınlaşdırır.",
  "Bugün də məzuniyyət yoxdur 😄 Dərsini aç və 10 dəqiqə izlə!",
  "Sən bacarırsan! 💡 Qaldığın yerdən davam et, nəticə göz oxşayacaq.",
];

export const Route = createFileRoute("/api/public/telegram/cron")({
  server: {
    handlers: {
      POST: async ({ request }) => run(request),
      GET: async ({ request }) => run(request),
    },
  },
});

async function run(request: Request): Promise<Response> {
  const db = await getSupabase();
  const { data: cfg } = await db.from("telegram_config").select("cron_secret").limit(1).maybeSingle();
  if (!cfg) return new Response("Not configured", { status: 500 });

  const provided = request.headers.get("x-cron-secret") ?? "";
  if (provided !== cfg.cron_secret) return new Response("Unauthorized", { status: 401 });

  const { data: chats, error } = await db.from("telegram_chats").select("chat_id");
  if (error || !chats || chats.length === 0) return Response.json({ ok: true, sent: 0 });

  const text = GREETINGS[Math.floor(Math.random() * GREETINGS.length)] ?? GREETINGS[0]!;
  await Promise.all(
    chats.map((c) =>
      sendTelegramMessage(String(c.chat_id), text).catch(() => null),
    ),
  );
  return Response.json({ ok: true, sent: chats.length });
}
