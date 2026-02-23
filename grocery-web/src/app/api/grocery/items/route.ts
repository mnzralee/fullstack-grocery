import { NextResponse } from 'next/server';
import { groceryClient, getErrorMessage } from '@/lib/backendClient';

// GET /api/grocery/items?listId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const listId = searchParams.get('listId');

    if (!listId) {
      return NextResponse.json(
        { success: false, message: 'listId is required' },
        { status: 400 },
      );
    }

    const response = await groceryClient.get(`/lists/${listId}`);
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

// POST /api/grocery/items
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { listId, ...itemData } = body;

    if (!listId) {
      return NextResponse.json(
        { success: false, message: 'listId is required' },
        { status: 400 },
      );
    }

    const response = await groceryClient.post(`/lists/${listId}/items`, itemData);
    return NextResponse.json(response.data, { status: 201 });
  } catch (error) {
    const message = getErrorMessage(error);
    const status = (error as any)?.response?.status ?? 500;
    return NextResponse.json(
      { success: false, message },
      { status },
    );
  }
}
