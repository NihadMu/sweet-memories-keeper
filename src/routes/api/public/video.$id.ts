import { createFileRoute } from "@tanstack/react-router";

import { LESSON_IDS } from "@/lib/course";
import { verifySession } from "@/lib/session.server";

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive/drive/v3/files";

async function handle(request: Request, id: string, method: "GET" | "HEAD") {
  const url = new URL(request.url);
  const token = url.searchParams.get("t");
  if (!verifySession(token)) return new Response("Unauthorized", { status: 401 });
  if (!LESSON_IDS.has(id)) return new Response("Not found", { status: 404 });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`,
    "X-Connection-Api-Key": process.env["GOOGLE_DRIVE_API_KEY"] ?? "",
  };
  const range = request.headers.get("range");
  if (range) headers["Range"] = range;

  const upstream = await fetch(`${GATEWAY}/${id}?alt=media&supportsAllDrives=true`, {
    method,
    headers,
  });

  if (!upstream.ok && upstream.status !== 206) {
    const body = await upstream.text();
    console.error(`Drive stream failed [${upstream.status}]: ${body.slice(0, 500)}`);
    return new Response("Video yüklenemedi", { status: upstream.status });
  }

  const out = new Headers();
  for (const key of ["content-type", "content-length", "content-range", "accept-ranges", "etag"]) {
    const value = upstream.headers.get(key);
    if (value) out.set(key, value);
  }
  if (!out.has("content-type")) out.set("content-type", "video/mp4");
  if (!out.has("accept-ranges")) out.set("accept-ranges", "bytes");
  out.set("cache-control", "private, max-age=3600");

  return new Response(method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers: out,
  });
}

export const Route = createFileRoute("/api/public/video/$id")({
  server: {
    handlers: {
      GET: async ({ request, params }) => handle(request, params.id, "GET"),
      HEAD: async ({ request, params }) => handle(request, params.id, "HEAD"),
    },
  },
});
