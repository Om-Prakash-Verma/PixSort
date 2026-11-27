export interface BasicUser {
  uid: string;
  isGuest?: boolean;
}

let cachedConfigPromise: Promise<Record<string, any> | null> | null = null;

/**
 * Fetches and caches the public Firebase client config once per session.
 */
export async function getFirebaseConfig(): Promise<Record<string, any> | null> {
  if (!cachedConfigPromise) {
    cachedConfigPromise = fetch('/api/drive/config')
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null);
  }
  return cachedConfigPromise;
}

/**
 * Initializes (or reuses) the Firebase Auth instance.
 */
export async function getFirebaseAuthInstance() {
  const config = await getFirebaseConfig();
  if (!config) return null;
  const { initializeApp, getApps } = await import('firebase/app');
  const { getAuth } = await import('firebase/auth');
  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(config);
  return getAuth(app);
}

/**
 * Builds auth headers: uses a verified Firebase Bearer token for signed-in users,
 * or a scoped guest `x-user-id` for ephemeral Guest Explorer sessions.
 */
export async function getAuthHeaders(currentUser?: BasicUser | null): Promise<Record<string, string>> {
  if (currentUser?.isGuest) {
    return { 'x-user-id': currentUser.uid };
  }

  try {
    const auth = await getFirebaseAuthInstance();
    if (auth) {
      await auth.authStateReady();
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        return { Authorization: `Bearer ${token}` };
      }
    }
  } catch {
    // ignore
  }

  if (currentUser?.uid?.startsWith('guest_')) {
    return { 'x-user-id': currentUser.uid };
  }

  return {};
}

/**
 * Wrapper around fetch() that automatically attaches auth headers.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  currentUser?: BasicUser | null
): Promise<Response> {
  const authHeaders = await getAuthHeaders(currentUser);
  const headers = new Headers(init.headers);
  for (const [k, v] of Object.entries(authHeaders)) {
    if (!headers.has(k)) headers.set(k, v);
  }
  return fetch(input, { ...init, headers });
}
