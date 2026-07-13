"use client";
import { useState, useEffect, useCallback, useRef } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const ACCENT = "#4B6741";

interface Review { id: number; name: string; text: string; stars: number; created_at: string; }
interface VideoReview { id: string; url: string; name: string; caption: string; isLocal?: boolean; }

function getVideoEmbed(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  return null;
}

function getVideoThumb(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`;
  return "";
}

export default function ReviewsAdminPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [videos, setVideos] = useState<VideoReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [addReviewForm, setAddReviewForm] = useState({ name: "", text: "", stars: 5 });
  const [addingReview, setAddingReview] = useState(false);
  const [tab, setTab] = useState<"reviews" | "videos">("reviews");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadCaption, setUploadCaption] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/reviews`);
      const d = await r.json();
      setReviews(d.reviews || []);
    } catch {}
  }, []);

  const fetchVideos = useCallback(async () => {
    try {
      const r = await fetch(`${API_BASE}/settings/customer_videos`);
      const d = await r.json();
      if (d.value) setVideos(JSON.parse(d.value));
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([fetchReviews(), fetchVideos()]).finally(() => setLoading(false));
  }, [fetchReviews, fetchVideos]);

  const deleteReview = async (id: number) => {
    if (!confirm("حذف هذا الريفيو؟")) return;
    try {
      const r = await fetch(`${API_BASE}/reviews/${id}`, { method: "DELETE" });
      const d = await r.json();
      setReviews(d.reviews || []);
    } catch {}
  };

  const addReview = async () => {
    if (!addReviewForm.name.trim() || !addReviewForm.text.trim()) return;
    setAddingReview(true);
    try {
      const r = await fetch(`${API_BASE}/reviews`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addReviewForm),
      });
      const d = await r.json();
      setReviews(d.reviews || []);
      setAddReviewForm({ name: "", text: "", stars: 5 });
    } catch {}
    setAddingReview(false);
  };

  const saveVideos = async (list: VideoReview[]) => {
    setVideoSaving(true);
    try {
      await fetch(`${API_BASE}/settings/customer_videos`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: JSON.stringify(list) }),
      });
      setVideoSaved(true);
      setTimeout(() => setVideoSaved(false), 2000);
    } catch {}
    setVideoSaving(false);
  };

  const uploadVideoFile = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const CHUNK = 4 * 1024 * 1024; // 4 MB per chunk
    const total = Math.ceil(file.size / CHUNK);
    const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
    const filename = `video-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    setUploading(true);
    setUploadProgress(0);
    try {
      let finalUrl = "";
      for (let i = 0; i < total; i++) {
        const chunk = file.slice(i * CHUNK, (i + 1) * CHUNK);
        const form = new FormData();
        form.append("chunk", chunk, filename);
        form.append("chunkIndex", String(i));
        form.append("totalChunks", String(total));
        form.append("filename", filename);
        const res = await fetch(`${API_BASE}/upload/video/chunk`, { method: "POST", body: form });
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || `خطأ ${res.status}`); }
        const data = await res.json();
        setUploadProgress(Math.round(((i + 1) / total) * 100));
        if (data.done) finalUrl = data.url;
      }
      const newVideo: VideoReview = {
        id: Date.now().toString(), url: finalUrl,
        name: uploadName.trim() || "عميل", caption: uploadCaption.trim(), isLocal: true,
      };
      const updated = [newVideo, ...videos];
      setVideos(updated);
      await saveVideos(updated);
      setUploadName(""); setUploadCaption("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) { alert("فشل الرفع: " + (e?.message || "خطأ غير معروف")); }
    setUploading(false);
    setUploadProgress(0);
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("حذف هذا الفيديو؟")) return;
    const updated = videos.filter(v => v.id !== id);
    setVideos(updated);
    await saveVideos(updated);
  };

  if (loading) return <div style={{ padding: 60, textAlign: "center", color: "#888" }}>جاري التحميل...</div>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#1a1a2e", direction: "rtl" }}>⭐ إدارة آراء العملاء</h1>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#f3f4f6", borderRadius: 12, padding: 4, width: "fit-content" }}>
        {([["reviews", "⭐ التقييمات النصية", reviews.length], ["videos", "🎬 فيديوهات العملاء", videos.length]] as const).map(([key, label, count]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding: "9px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: "inherit",
              background: tab === key ? "#fff" : "transparent",
              color: tab === key ? ACCENT : "#888",
              boxShadow: tab === key ? "0 1px 4px rgba(0,0,0,.1)" : "none" }}>
            {label} <span style={{ fontSize: 11, background: tab === key ? "#e8f0e0" : "#e5e7eb", padding: "2px 8px", borderRadius: 10, marginRight: 4 }}>{count}</span>
          </button>
        ))}
      </div>

      {/* REVIEWS TAB */}
      {tab === "reviews" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 14px", fontWeight: 800, fontSize: 15, color: "#1a1a2e", direction: "rtl" }}>➕ إضافة تقييم يدوياً</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <input placeholder="اسم العميل" value={addReviewForm.name}
                onChange={e => setAddReviewForm(p => ({ ...p, name: e.target.value }))}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, fontFamily: "inherit", direction: "rtl" }} />
              <select value={addReviewForm.stars} onChange={e => setAddReviewForm(p => ({ ...p, stars: Number(e.target.value) }))}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, fontFamily: "inherit" }}>
                {[5,4,3,2,1].map(s => <option key={s} value={s}>{s} نجوم</option>)}
              </select>
            </div>
            <textarea placeholder="نص التقييم..." value={addReviewForm.text}
              onChange={e => setAddReviewForm(p => ({ ...p, text: e.target.value }))}
              rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, fontFamily: "inherit", direction: "rtl", resize: "vertical", boxSizing: "border-box", marginBottom: 10 }} />
            <button onClick={addReview} disabled={addingReview}
              style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: ACCENT, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", opacity: addingReview ? 0.7 : 1 }}>
              {addingReview ? "جاري الإضافة..." : "➕ إضافة التقييم"}
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reviews.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#aaa", background: "#fff", borderRadius: 16 }}>لا توجد تقييمات</div>}
            {reviews.map(r => (
              <div key={r.id} style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", display: "flex", alignItems: "flex-start", gap: 14, direction: "rtl" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 800, fontSize: 14, color: "#1a1a2e" }}>{r.name}</span>
                    <span style={{ fontSize: 12, color: "#bd9a52" }}>{"★".repeat(r.stars || 5)}</span>
                    <span style={{ fontSize: 11, color: "#aaa" }}>{r.created_at ? new Date(r.created_at).toLocaleDateString("ar-EG") : ""}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.7 }}>"{r.text}"</p>
                </div>
                <button onClick={() => deleteReview(r.id)}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#dc2626", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
                  حذف
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIDEOS TAB */}
      {tab === "videos" && (
        <div>
          <div style={{ background: "#fff", borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
            <p style={{ margin: "0 0 14px", fontWeight: 800, fontSize: 15, color: "#1a1a2e", direction: "rtl" }}>📁 رفع فيديو من جهازك</p>
            <div style={{ border: "2px dashed #d1e7c8", borderRadius: 12, padding: "24px 20px", textAlign: "center", marginBottom: 14, background: "#f8fdf4", cursor: "pointer" }}
              onClick={() => fileRef.current?.click()}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎬</div>
              <p style={{ margin: 0, fontWeight: 700, color: ACCENT, fontSize: 14 }}>اضغط لاختيار فيديو</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "#aaa" }}>MP4, WebM, MOV — حتى 500MB</p>
              <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }}
                onChange={e => e.target.files?.[0] && setUploadName("")} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <input placeholder="اسم العميل (اختياري)" value={uploadName}
                onChange={e => setUploadName(e.target.value)}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, fontFamily: "inherit", direction: "rtl" }} />
              <input placeholder="وصف قصير (اختياري)" value={uploadCaption}
                onChange={e => setUploadCaption(e.target.value)}
                style={{ padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 14, fontFamily: "inherit", direction: "rtl" }} />
            </div>
            {uploading && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ background: "#e5e7eb", borderRadius: 20, height: 8, overflow: "hidden" }}>
                  <div style={{ background: ACCENT, height: "100%", width: `${uploadProgress}%`, transition: "width .3s", borderRadius: 20 }} />
                </div>
                <p style={{ margin: "6px 0 0", fontSize: 12, color: "#888", textAlign: "center" }}>{uploadProgress}% جاري الرفع...</p>
              </div>
            )}
            <button onClick={uploadVideoFile} disabled={uploading}
              style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: uploading ? "#888" : ACCENT, color: "#fff", fontWeight: 700, fontSize: 14, cursor: uploading ? "wait" : "pointer" }}>
              {uploading ? `جاري الرفع... ${uploadProgress}%` : "⬆️ رفع الفيديو"}
            </button>
          </div>

          {/* Videos grid */}
          {videos.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "#aaa", background: "#fff", borderRadius: 16 }}>لم تُضف فيديوهات بعد</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
            {videos.map(v => {
              const embed = getVideoEmbed(v.url);
              const thumb = getVideoThumb(v.url);
              const isLocal = v.isLocal || (!embed && !thumb && v.url.includes('/uploads/'));
              return (
                <div key={v.id} style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  {isLocal ? (
                    <video src={v.url} controls style={{ width: "100%", height: 180, objectFit: "cover", display: "block", background: "#000" }} />
                  ) : embed ? (
                    <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                      <iframe src={embed} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                        frameBorder="0" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    </div>
                  ) : thumb ? (
                    <img src={thumb} alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover" }} />
                  ) : (
                    <div style={{ background: "#f3f4f6", height: 160, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#aaa" }}>معاينة غير متاحة</div>
                  )}
                  <div style={{ padding: "12px 14px", direction: "rtl" }}>
                    <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: 14, color: "#1a1a2e" }}>{v.name}</p>
                    {v.caption && <p style={{ margin: "0 0 10px", fontSize: 12, color: "#888" }}>{v.caption}</p>}
                    <button onClick={() => deleteVideo(v.id)}
                      style={{ padding: "5px 14px", borderRadius: 8, border: "none", background: "#fee2e2", color: "#dc2626", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
