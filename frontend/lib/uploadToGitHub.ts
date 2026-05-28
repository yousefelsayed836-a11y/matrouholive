function compressToBlob(file: File, maxDim: number, quality: number): Promise<Blob> {
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
        canvas.toBlob(b => b ? resolve(b) : reject(new Error("toBlob failed")), "image/jpeg", quality);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  });
}

// Uploads via the Next.js API route /api/upload (GITHUB_TOKEN stays server-side on Vercel)
export async function uploadToGitHub(file: File, maxDim = 1400, quality = 0.82): Promise<string> {
  const compressed = await compressToBlob(file, maxDim, quality);
  const formData = new FormData();
  formData.append("image", compressed, "image.jpg");

  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const text = await res.text();
  let data: { url?: string; error?: string };
  try { data = JSON.parse(text); } catch { throw new Error("فشل الاتصال بالسيرفر"); }
  if (!data.url) throw new Error(data.error || "فشل الرفع");
  return data.url;
}
