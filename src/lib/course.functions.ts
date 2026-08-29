import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  adminOverview,
  listProgress,
  loginUser,
  requireSession,
  upsertProgress,
} from "./course.server";

export const login = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ username: z.string().min(1), password: z.string().optional().default("") }).parse(data),
  )
  .handler(async ({ data }) => loginUser(data.username, data.password));

export const getMyProgress = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const session = requireSession(data.token);
    return { user: { username: session.username, admin: session.admin }, progress: await listProgress(session.uid) };
  });

export const saveProgress = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        lessonId: z.string(),
        secondsWatched: z.number().min(0),
        durationSeconds: z.number().min(0),
        completed: z.boolean(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const session = requireSession(data.token);
    return upsertProgress({
      userId: session.uid,
      lessonId: data.lessonId,
      secondsWatched: data.secondsWatched,
      durationSeconds: data.durationSeconds,
      completed: data.completed,
    });
  });

export const getAdminOverview = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const session = requireSession(data.token);
    if (!session.admin) throw new Error("Bu sayfaya erişim yetkiniz yok.");
    return adminOverview();
  });

export const submitTask = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        token: z.string(),
        lessonId: z.string(),
        content: z.string().min(3).max(5000),
        link: z.string().max(500).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const session = requireSession(data.token);
    const { createSubmission } = await import("./course.server");
    return createSubmission({
      userId: session.uid,
      username: session.username,
      lessonId: data.lessonId,
      content: data.content,
      link: data.link,
    });
  });

export const getMySubmissions = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const session = requireSession(data.token);
    const { listMySubmissions } = await import("./course.server");
    return listMySubmissions(session.uid);
  });

export const getAdminSubmissions = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ token: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const session = requireSession(data.token);
    if (!session.admin) throw new Error("Bu sayfaya erişim yetkiniz yok.");
    const { adminSubmissions } = await import("./course.server");
    return adminSubmissions();
  });
