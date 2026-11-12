/**
 * Client-safe ID helper.
 * `crypto.randomUUID()` is unavailable in some browsers on non-HTTPS LAN IPs
 * (e.g. http://192.168.x.x), which would crash the chat UI and block all clicks.
 */
export function createClientId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // insecure context / restricted environment
    }
  }

  return `tc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
}
