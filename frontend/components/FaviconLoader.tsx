"use client";
import { useEffect } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const CACHE_KEY = "favicon_cache";

function applyFavicon(value: string) {
  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = value;
}

export default function FaviconLoader() {
  useEffect(() => {
    // Apply cached favicon immediately (no flicker)
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) applyFavicon(cached);

    // Fetch fresh value in background, update cache
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
