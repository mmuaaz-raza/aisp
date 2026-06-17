import { NextRequest } from "next/server";

const BACKEND = process.env.PYTHON_BACKEND_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendRes = await fetch(`${BACKEND}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!backendRes.ok) {
      const errText = await backendRes.text();
      return new Response(errText, { status: backendRes.status });
    }

    // Stream the response straight through to the client
    const contentType =
      backendRes.headers.get("content-type") ?? "text/plain";

    return new Response(backendRes.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    console.error("[/api/chat] Error:", err);
    return new Response("Backend unavailable", { status: 503 });
  }
}
