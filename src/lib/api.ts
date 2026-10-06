export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string, public fields?: Record<string, string[]>) {
    super(message);
  }
}

/** Small fetch wrapper for client components. Throws ApiError with the server's message. */
export async function api<T = any>(url: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, {
    method: opts.method ?? (opts.body ? "POST" : "GET"),
    headers: opts.body ? { "Content-Type": "application/json" } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    credentials: "same-origin",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error ?? "Something went wrong", data.code, data.fields);
  return data as T;
}

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");
