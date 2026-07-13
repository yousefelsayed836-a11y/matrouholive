import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    // Forward the raw multipart body directly — avoids rebuilding FormData server-side
    const contentType = req.headers.get("content-type") || "";
    const body = await req.arrayBuffer();

    let res: Response;
    try {
      res = await fetch(`${BACKEND}/api/upload/video/chunk`, {
        method: "POST",
        headers: { "content-type": contentType },
        body,
      });
    } catch (fetchErr: any) {
      return NextResponse.json({ error: `Backend unreachable: ${fetchErr.message}` }, { status: 502 });
    }

    const resContentType = res.headers.get("content-type") || "";
    if (!resContentType.includes("application/json")) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Backend error (${res.status}): ${text.slice(0, 300)}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
