const REPO = process.env.NEXT_PUBLIC_GITHUB_REPO || "yousefelsayed836-a11y/matrouholive";

function compressToBase64(file: File, maxDim: number, quality: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        // return only the base64 part (no data:... prefix)
        resolve(canvas.toDataURL("image/jpeg", quality).split(",")[1]);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadToGitHub(file: File, maxDim = 1400, quality = 0.82): Promise<string> {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  if (!token) throw new Error("NEXT_PUBLIC_GITHUB_TOKEN غير محدد — أضفه في إعدادات Vercel");

  const base64 = await compressToBase64(file, maxDim, quality);
  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const filename = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${filename}`, {
    method: "PUT",
    headers: { Authorization: `token ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: `upload ${filename}`, content: base64 }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `GitHub error ${res.status}`);
  }

  return `https://raw.githubusercontent.com/${REPO}/main/${filename}`;
}
