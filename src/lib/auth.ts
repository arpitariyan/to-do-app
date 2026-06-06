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
