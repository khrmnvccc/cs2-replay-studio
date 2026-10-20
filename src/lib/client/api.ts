"use client";
import { toast } from "sonner";

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** JSON API chaqiruvi: xato bo'lsa server xabari bilan ApiError tashlaydi. */
export async function api<T = Record<string, unknown>>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, ...rest } = init;
  let res: Response;
  try {
    res = await fetch(url, {
      ...rest,
      headers: { ...(json !== undefined ? { "Content-Type": "application/json" } : {}), ...rest.headers },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError("Tarmoq xatosi — internet aloqasini tekshiring", 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((data as { error?: string }).error ?? `Xato (${res.status})`, res.status);
  return data as T;
}

export function toastError(e: unknown) {
  toast.error(e instanceof Error ? e.message : "Noma'lum xato");
}
