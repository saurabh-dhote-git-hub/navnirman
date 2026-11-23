import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

const TOKEN_KEY = "navnirman_access_token";

export async function saveToken(token) {
  await SecureStoragePlugin.set({ key: TOKEN_KEY, value: token });
}

export async function readToken() {
  try {
    const result = await SecureStoragePlugin.get({ key: TOKEN_KEY });
    return result.value || null;
  } catch {
    return null;
  }
}

export async function clearToken() {
  try {
    await SecureStoragePlugin.remove({ key: TOKEN_KEY });
  } catch {
    // A missing token is already a logged-out state.
  }
}
