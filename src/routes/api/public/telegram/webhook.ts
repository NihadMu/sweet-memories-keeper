import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";

import { getSupabase } from "@/lib/telegram.server";

/**
 * Telegram botundan gelen güncellemeleri alır.
 * Güvenlik: X-Telegram-Bot-Api-Secret-Token başlığı bot kurulumunda belirlenen
 * gizli değerle eşleşmelidir (bot token'ından türetilir).
 */
export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expectedSecret = deriveTelegramWebhookSecret(process.env["TELEGRAM_API_KEY"]);
        if (!expectedSecret) return new Response("Not configured", { status: 500 });

        const actual = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
        if (actual !== expectedSecret) {
          return new Response("Unauthorized", { status: 401 });
        }

        const update = (await request.json()) as {
          message?: { chat?: { id?: number; first_name?: string; username?: string }; text?: string };
        };
        const chat = update.message?.chat;
        if (!chat?.id) return Response.json({ ok: true });

        const db = await getSupabase();
        await db.from("telegram_chats").upsert(
          {
            chat_id: chat.id,
            telegram_username: chat.username ?? null,
            first_name: chat.first_name ?? null,
          },
          { onConflict: "chat_id" },
        );

        return Response.json({ ok: true });
      },
    },
  },
});

function deriveTelegramWebhookSecret(token: string | undefined): string | null {
  if (!token) return null;
  return createHash("sha256").update(`telegram-webhook:${token}`).digest("base64url");
}
