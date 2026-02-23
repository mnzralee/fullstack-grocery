'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // In a real app, you'd look up the user's list ID from the session.
    // For now, check your seed output for the list ID and paste it here.
    const listId = 'PASTE_YOUR_LIST_ID_HERE';
    router.replace(`/grocery/${listId}`);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-500">Redirecting to your grocery list...</p>
    </div>
  );
}
