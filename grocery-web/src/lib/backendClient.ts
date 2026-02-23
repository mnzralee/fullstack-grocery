import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3060';

function createClient(baseURL: string): AxiosInstance {
  return axios.create({
    baseURL: `${baseURL}/api/v1/grocery`,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export const groceryClient = createClient(BACKEND_URL);

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message
      ?? error.response?.data?.message
      ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
