import { account, ID } from './appwrite';
import type { Models } from 'react-native-appwrite';

export type AppwriteUser = Models.User<Models.Preferences>;

// ─── Register ─────────────────────────────────────────────────────────────────

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AppwriteUser> {
  await account.create(ID.unique(), email, password, name);
  return login(email, password);
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<AppwriteUser> {
  await account.createEmailPasswordSession(email, password);
  return account.get();
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logout(): Promise<void> {
  await account.deleteSession('current');
}

// ─── Get Current User ─────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<AppwriteUser | null> {
  try {
    return await account.get();
  } catch {
    return null;
  }
}

// ─── Get Session ──────────────────────────────────────────────────────────────

export async function getSession(): Promise<Models.Session | null> {
  try {
    return await account.getSession('current');
  } catch {
    return null;
  }
}

// ─── Password Recovery ────────────────────────────────────────────────────────

export async function recoverPassword(email: string): Promise<Models.Token> {
  // Appwrite requires the URL to be a registered platform hostname.
  // Using https://localhost/reset-password will succeed in sending the email.
  return await account.createRecovery(email, 'https://localhost/reset-password');
}

export async function resetPassword(userId: string, secret: string, newPassword: string): Promise<Models.Token> {
  return await account.updateRecovery(userId, secret, newPassword);
}

export async function directAdminPasswordReset(email: string, newPassword: string): Promise<void> {
  const serverKey = process.env.EXPO_PUBLIC_APPWRITE_SERVER_KEY;
  if (!serverKey) {
    throw new Error("Server key not configured. Cannot perform direct reset.");
  }
  
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1';
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '';

  const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': projectId,
    'X-Appwrite-Key': serverKey,
  };

  // 1. Search for user by email
  const searchRes = await fetch(`${endpoint}/users?search=${encodeURIComponent(email)}`, { headers });
  
  if (!searchRes.ok) {
    throw new Error("Failed to communicate with the server.");
  }
  
  const searchData = await searchRes.json();
  const user = searchData.users?.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    throw new Error("No account found with this email address.");
  }
  
  // 2. Update their password directly
  const updateRes = await fetch(`${endpoint}/users/${user.$id}/password`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ password: newPassword })
  });
  
  if (!updateRes.ok) {
    throw new Error("Failed to update the password securely.");
  }
}
