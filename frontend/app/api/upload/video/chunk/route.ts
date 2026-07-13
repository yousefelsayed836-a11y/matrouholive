import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const chunk = form.get("chunk") as Blob | null;
    const filename = form.get("filename") as string | null;
    const chunkIndex = form.get("chunkIndex") as string | null;
    const totalChunks = form.get("totalChunks") as string | null;

    if (!chunk || !filename || chunkIndex === null || !totalChunks) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const backendForm = new FormData();
    backendForm.append("chunk", chunk, filename);
    backendForm.append("chunkIndex", chunkIndex);
    backendForm.append("totalChunks", totalChunks);
    backendForm.append("filename", filename);

    const res = await fetch(`${BACKEND}/api/upload/video/chunk`, { method: "POST", body: backendForm });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.error || "Upload failed" }, { status: res.status });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
