import { useCallback, useEffect, useState } from "react";

const KEY = "meta-course-session";

export type StoredSession = { token: string; username: string; admin: boolean };

export function useSession() {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw) as StoredSession);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const save = useCallback((value: StoredSession) => {
    localStorage.setItem(KEY, JSON.stringify(value));
    setSession(value);
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setSession(null);
  }, []);

  return { session, ready, save, clear };
}
