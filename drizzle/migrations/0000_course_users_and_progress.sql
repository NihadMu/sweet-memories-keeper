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
  ('Nihad', 'f07591dbe93a82a070a49858208a580abd01ffa3f8ee816a3c7ec04343e706d6', true);