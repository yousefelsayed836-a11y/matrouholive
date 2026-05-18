"use client";
import { useEffect } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000") + "/api";

export default function FaviconLoader() {
  useEffect(() => {
    fetch(`${API_BASE}/settings/favicon`)
      .then(r => r.json())
      .then(d => {
        if (!d.value) return;
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement("link");
          link.rel = "icon";
          document.head.appendChild(link);
        }
        link.href = d.value;
      })
      .catch(() => {});
  }, []);
  return null;
}
