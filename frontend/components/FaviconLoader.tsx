"use client";
import { useEffect } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const CACHE_KEY = "favicon_cache";

function applyFavicon(value: string) {
  // Remove all existing favicon link tags to avoid duplicates
  document.querySelectorAll("link[rel~='icon'], link[rel='shortcut icon']").forEach(el => el.remove());
  const link = document.createElement("link");
  link.rel = "icon";
  link.type = value.startsWith("data:image/png") ? "image/png" : value.startsWith("data:image/svg") ? "image/svg+xml" : "image/x-icon";
  link.href = value;
  document.head.appendChild(link);
}

export default function FaviconLoader() {
  useEffect(() => {
    // Apply cached favicon immediately on mount (before API call)
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) applyFavicon(cached);

    // Fetch fresh value, update cache + DOM
    fetch(`${API_BASE}/settings/favicon`)
      .then(r => r.json())
      .then(d => {
        if (!d.value) return;
        applyFavicon(d.value);
        localStorage.setItem(CACHE_KEY, d.value);
      })
      .catch(() => {});
  }, []);
  return null;
}
