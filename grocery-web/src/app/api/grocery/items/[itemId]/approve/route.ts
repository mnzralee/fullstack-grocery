import { NextResponse } from 'next/server';
import { groceryClient, getErrorMessage, getAuthHeaders } from '@/lib/backendClient';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await params;
    const body = await req.json();
    const headers = await getAuthHeaders();
    const response = await groceryClient.post(
      `/items/${itemId}/approve`,
      body,
      { headers },
    );
    return NextResponse.json(response.data);
  } catch (error) {
    const message = getErrorMessage(error);
    const status = (error as any)?.response?.status ?? 500;
    return NextResponse.json(
      { success: false, message },
      { status },
    );
  }
}
