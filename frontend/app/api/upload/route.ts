import { NextRequest, NextResponse } from "next/server";

const REPO = process.env.GITHUB_REPO || "yousefelsayed836-a11y/matrouholive";

export async function POST(req: NextRequest) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GITHUB_TOKEN not configured on Vercel" }, { status: 500 });
  }

  try {
    const form = await req.formData();
    const file = form.get("image") as File | null;
    if (!file) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const filename = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const ghRes = await fetch(`https://api.github.com/repos/${REPO}/contents/${filename}`, {
      method: "PUT",
      headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ message: `upload ${filename}`, content: base64 }),
    });

    if (!ghRes.ok) {
      const err = await ghRes.json().catch(() => ({}));
      return NextResponse.json({ error: err.message || `GitHub error ${ghRes.status}` }, { status: 500 });
    }

    return NextResponse.json({ url: `https://raw.githubusercontent.com/${REPO}/main/${filename}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const connected = !!(process.env.GITHUB_TOKEN);
  return NextResponse.json({ connected, repo: connected ? REPO : null });
}
