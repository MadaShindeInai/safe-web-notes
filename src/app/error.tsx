"use client";

import { useEffect } from "react";

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
    <div className="-mt-16 flex min-h-dvh flex-col items-center justify-center bg-gray-50">
      <h2 className="mb-4 font-(family-name:--font-geist-sans) text-2xl font-bold text-[#333333]">
        Something went wrong
      </h2>
      <p className="mb-6 max-w-md text-center font-(family-name:--font-geist-sans) text-gray-600">
        We couldn&apos;t load this page. This may be a temporary issue — please
        try again.
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-[#333333] px-4 py-2 font-(family-name:--font-geist-sans) text-sm text-white transition-colors hover:bg-[#555555]"
      >
        Try again
      </button>
    </div>
  );
}
