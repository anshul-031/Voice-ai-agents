// Very lightweight in-memory session store for Exotel calls.
// For production, consider Redis or durable storage.

export interface ExotelSessionMeta {
  call_sid?: string;
  from?: string;
  to?: string;
  userId?: string;
  custom?: Record<string, string>;
  createdAt: number;
}

const SESSIONS = new Map<string, ExotelSessionMeta>();

export function setSession(sessionId: string, meta: Omit<ExotelSessionMeta, 'createdAt'>) {
  SESSIONS.set(sessionId, { ...meta, createdAt: Date.now() });
}

export function getSession(sessionId: string): ExotelSessionMeta | undefined {
  return SESSIONS.get(sessionId);
}

export function deleteSession(sessionId: string) {
  SESSIONS.delete(sessionId);
}

export function gcSessions(maxAgeMs: number = 60 * 60 * 1000) {
  const now = Date.now();
  for (const [id, meta] of SESSIONS.entries()) {
    if (now - meta.createdAt > maxAgeMs) SESSIONS.delete(id);
  }
}
