CREATE TABLE public.course_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.course_users(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  content text NOT NULL,
  link text,
  emailed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX course_submissions_user_idx ON public.course_submissions (user_id, created_at DESC);

GRANT ALL ON public.course_submissions TO service_role;

ALTER TABLE public.course_submissions ENABLE ROW LEVEL SECURITY;
