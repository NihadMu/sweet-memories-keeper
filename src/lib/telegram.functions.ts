import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSession } from "./course.server";

const SITE_URL = "https://metacoursetimeflty.lovable.app";

function requireAdmin(token: string) {
  const session = requireSession(token);
  if (!session.admin) throw new Error("Bu işlem için yetkiniz yok.");
  return session;
}

export const getTelegramChats = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { getLinkedChats } = await import("./telegram.server");
    return getLinkedChats();
  });

export const sendTelegramTask = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        chatIds: z.array(z.number()).min(1),
        title: z.string().max(200).optional(),
        message: z.string().min(2).max(3000),
        includeLink: z.boolean().optional().default(true),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    requireAdmin(data.token);
    const { sendTelegramMessage } = await import("./telegram.server");
    const text = [
      data.title ? `📌 ${data.title}` : null,
      data.message,
      data.includeLink ? `\n🔗 ${SITE_URL}` : null,
    ]
      .filter(Boolean)
      .join("\n\n");

    const results = await Promise.all(
      data.chatIds.map(async (chatId) => ({ chatId, ok: await sendTelegramMessage(chatId, text) })),
    );
    const sent = results.filter((r) => r.ok).length;
    return { sent, failed: results.length - sent };
  });
