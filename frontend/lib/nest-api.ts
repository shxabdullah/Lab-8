const DEFAULT_NEST_API_URL = "http://127.0.0.1:3000";

export async function forwardToNest(path: string, init?: RequestInit) {
  const baseUrl = (process.env.NEST_API_URL || DEFAULT_NEST_API_URL).replace(/\/$/, "");
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });
    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: { "Content-Type": response.headers.get("Content-Type") || "application/json" },
    });
  } catch (error) {
    console.error("NestJS API request failed", error);
    return Response.json(
      { error: "The store backend is unavailable. Start NestJS on port 3000 and try again." },
      { status: 503 },
    );
  }
}
