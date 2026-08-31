CREATE TABLE public.telegram_chats (
  chat_id BIGINT PRIMARY KEY,
  telegram_username TEXT,
  first_name TEXT,
  assigned_student TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.telegram_chats TO service_role;

ALTER TABLE public.telegram_chats ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.telegram_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cron_secret TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.telegram_config TO service_role;

ALTER TABLE public.telegram_config ENABLE ROW LEVEL SECURITY;