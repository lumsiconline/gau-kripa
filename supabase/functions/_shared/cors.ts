const ALLOWED_ORIGINS = [
  "https://gaukripa.site",
  "https://www.gaukripa.site",
  "https://lumsiconline.github.io"
];

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "";
  const isAllowed =
    !origin ||
    ALLOWED_ORIGINS.includes(origin) ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:") ||
    /^https:\/\/[a-z0-9-]+\.run\.app$/i.test(origin) ||
    /^https:\/\/([a-z0-9-]+\.)?github\.io$/i.test(origin);

  return {
    "Access-Control-Allow-Origin": isAllowed ? (origin || "*") : "https://gaukripa.site",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Vary": "Origin"
  };
}

export function handleCorsPreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 204, headers: getCorsHeaders(req) });
  }
  return null;
}

export function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req),
      "Content-Type": "application/json"
    }
  });
}
