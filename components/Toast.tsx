"use client";

import { useEffect, useState } from "react";

export default function Toast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const handleError = (event: Event) => {
      const nextMessage = (event as CustomEvent<string>).detail;
      setMessage(nextMessage);
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => setMessage(null), 5000);
    };

    window.addEventListener("scrng:error", handleError);
    return () => {
      window.removeEventListener("scrng:error", handleError);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  if (!message) return null;

  return (
    <div className="fixed right-4 top-4 z-[200] w-[min(24rem,calc(100vw-2rem))] rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 shadow-lg" role="alert">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium">{message}</p>
        <button
          type="button"
          onClick={() => setMessage(null)}
          className="text-lg leading-none text-red-600 hover:text-red-900"
          aria-label="Fechar mensagem de erro"
        >
          &times;
        </button>
      </div>
    </div>
  );
}