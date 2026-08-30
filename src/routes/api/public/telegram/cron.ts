import { createFileRoute } from "@tanstack/react-router";

import { getSupabase } from "@/lib/telegram.server";

const GREETINGS = [
  "Salam! 👋 Ders vaxtıdır — bugünkü dərsini izləməyi unutma!",
  "Xatırlatma 📚 Bu günkü dərsini tamamladınmı? Qaldığın yerdən davam et!",
  "Görevini yoxla ✍️ Bu günkü tapşırığını göndərməyi unutma!",
  "Kiçik addımlar böyük nəticələr gətirir 🚀 Bu gün 10 dəqiqə belə izlə!",
  "Dərs seriyani davam etdir 💪 İzini itirmə, bu gün də irəlilə!",
];

/**
 * Cron (pg_cron) bu endpoint'i düzenli çağırır; her öğrenciye hatırlatma mesajı gider.
 * Güvenlik: x-telegram-cron-secret başlığı veritabanındaki gizli değerle eşleşmelidir.
 */
export const Route = createFileRoute("/api/public/telegram/cron")({
  server: {
    handlers: {
      POST: async () => run(),
      GET: async () => run(),
    },
  },
});

async function run(): Promise<Response> {
  const db = await getSupabase();
  const { data: cfg } = await db.from("telegram_config").select("cron_secret").limit(1).maybeSingle();
  if (!cfg) return new Response("Not configured", { status: 500 });

  const { data: chats, error } = await db.from("telegram_chats").select("chat_id");
  if (error || !chats || chats.length === 0) return Response.json({ ok: true, sent: 0 });

  const text = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
  await Promise.all(
    chats.map((c) =>
      sendTelegramMessage(String(c.chat_id), text).catch(() => null),
    ),
  );
  return Response.json({ ok: true, sent: chats.length });
}

async function sendTelegramMessage(chatId: string, text: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  void supabaseAdmin;
  const token = process.env["TELEGRAM_API_KEY"];
  if (!token) return;
  await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
      "X-Connection-Api-Key": token,
    },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}
