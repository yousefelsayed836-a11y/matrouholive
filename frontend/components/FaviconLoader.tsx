"use client";
import { useEffect } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";
const CACHE_KEY = "favicon_cache";

function applyFavicon(value: string) {
  const type = value.startsWith("data:image/png") ? "image/png"
    : value.startsWith("data:image/svg") ? "image/svg+xml"
    : "image/x-icon";
  // Update existing tag in-place — never remove React-managed elements
  let link = document.head.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = type;
  link.href = value;
}

export default function FaviconLoader() {
  useEffect(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) applyFavicon(cached);

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
