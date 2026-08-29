CREATE TABLE public.course_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.course_users TO service_role;
ALTER TABLE public.course_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.course_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.course_users(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  seconds_watched integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT ALL ON public.course_progress TO service_role;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;

INSERT INTO public.course_users (username, password_hash, is_admin) VALUES
  ('Cavid', '33d06987819955310d9bd82b7f331fb82910ec775fdbebba89b63c1294473227', false),
  ('admin', 'bade630712e6338aa2944d511cd585bd13d7ab46098b1d669abb217447068090', true);