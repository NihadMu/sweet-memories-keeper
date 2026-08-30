import { createClient } from "@supabase/supabase-js";

export interface TelegramChat {
  chat_id: number;
  telegram_username: string | null;
  first_name: string | null;
  assigned_student: string | null;
}

export async function getSupabase() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function sendTelegramMessage(chatId: string | number, text: string): Promise<boolean> {
  const token = process.env["TELEGRAM_API_KEY"];
  if (!token) return false;
  try {
    const res = await fetch("https://connector-gateway.lovable.dev/telegram/sendMessage", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
        "X-Connection-Api-Key": token,
      },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function getLinkedChats(): Promise<TelegramChat[]> {
  const db = await getSupabase();
  const { data } = await db
    .from("telegram_chats")
    .select("chat_id, telegram_username, first_name, assigned_student")
    .order("chat_id");
  return (data ?? []) as TelegramChat[];
}
