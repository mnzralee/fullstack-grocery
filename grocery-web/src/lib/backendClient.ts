import axios from 'axios';
import type { AxiosInstance } from 'axios';

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

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.error?.message
      ?? error.response?.data?.message
      ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
}
