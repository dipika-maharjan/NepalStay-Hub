const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5051"
).replace(/\/+$/, "");

export const normalizeImageUrl = (
  imageUrl?: string | null,
  fallback = "/images/main-section.png",
): string => {
  const url = imageUrl?.trim() || "";
  if (!url) {
    return fallback;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (url.startsWith("/uploads/") || url.startsWith("/api/")) {
    return process.env.NODE_ENV === "development"
      ? url
      : `${BACKEND_URL}${url}`;
  }

  if (url.startsWith("/")) {
    return url;
  }

  if (url.startsWith("uploads/")) {
    return `${BACKEND_URL}/${url}`;
  }

  return url;
};
