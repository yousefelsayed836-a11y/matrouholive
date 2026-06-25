import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    // Forward to backend which saves to disk
    const backendForm = new FormData();
    backendForm.append("image", file);
    const res = await fetch(`${BACKEND}/api/upload`, { method: "POST", body: backendForm });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data.error || "Upload failed" }, { status: 500 });
    return NextResponse.json({ url: data.url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ connected: true, storage: "local" });
}
