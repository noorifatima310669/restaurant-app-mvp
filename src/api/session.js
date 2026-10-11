export const SESSION_KEY = '@urbanfork_session_v2';
export function createSessionStore(storage) {
  return {
    async restore() {
      try {
        const value = JSON.parse(await storage.getItem(SESSION_KEY));
        if (typeof value?.token !== 'string' || !value.token || !value.user?._id
          || !['customer', 'manager'].includes(value.user.role)) {
          await storage.removeItem(SESSION_KEY); return null;
        }
        return value;
      } catch { await storage.removeItem(SESSION_KEY); return null; }
    },
    async save(session) { await storage.setItem(SESSION_KEY, JSON.stringify(session)); },
    async clear() { await storage.removeItem(SESSION_KEY); },
  };
}
