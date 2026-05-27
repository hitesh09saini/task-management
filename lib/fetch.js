// Client-side fetch wrapper that detects expired sessions and redirects.

export async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  if (res.status === 401 && typeof window !== "undefined") {
    // Avoid redirect loop on the login page
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = `/login?expired=1`;
    }
  }
  return res;
}
