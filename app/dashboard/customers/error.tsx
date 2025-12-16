'use client';
 
import { useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
 
  return (
    <main className="flex h-full flex-col items-center justify-center gap-2">
      <ExclamationTriangleIcon className="w-10 text-gray-400" />
      <h2 className="text-xl font-semibold">문제가 발생했습니다!</h2>
      <button
        className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
        onClick={
          () => reset()
        }
      >
        다시 시도
      </button>
    </main>
  );
}
