"use client";

import React, { useEffect, useRef, useState } from "react";
import { ROOM_EMOJIS, sendEmoji } from "@/app/service/rooms";

type EmojiSenderProps = {
  roomId: string;
  playerId: string;
};

export default function EmojiSender({ roomId, playerId }: EmojiSenderProps) {
  const [disabled, setDisabled] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // contador para reiniciar a animação mesmo tocando no mesmo emoji
  const [popped, setPopped] = useState<{ emoji: string; n: number } | null>(null);

  const waitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
    };
  }, []);

  const handleSend = async (emoji: string) => {
    if (waiting) return;
    setError(null);
    setPopped((prev) => ({ emoji, n: (prev?.n ?? 0) + 1 }));
    const res = await sendEmoji(roomId, playerId, emoji);
    if (!res?.error) return;

    if (res.status === 429) {
      // libera o envio quando o intervalo da sala termina
      setWaiting(true);
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
      waitTimeoutRef.current = setTimeout(
        () => setWaiting(false),
        (res.retryAfter ?? 1) * 1000,
      );
    } else if (res.status === 403) {
      setDisabled(true);
    } else {
      setError(res.error);
    }
  };

  if (disabled) return null;

  return (
    <div className="mt-2 w-full">
      <p className="text-xs sm:text-sm uppercase tracking-wide text-gray-400 mb-2">
        Reações
      </p>

      <div className="grid grid-cols-4 gap-2">
        {ROOM_EMOJIS.map((emoji) => (
          <button
            key={popped?.emoji === emoji ? `${emoji}-${popped.n}` : emoji}
            type="button"
            onClick={() => handleSend(emoji)}
            disabled={waiting}
            className={`cursor-pointer h-12 rounded-xl bg-gray-100 text-2xl hover:bg-indigo-50 hover:shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed ${
              popped?.emoji === emoji ? "animate-emoji-pop" : ""
            }`}
            aria-label={`Enviar ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {waiting && (
        <p
          role="status"
          className="animate-fade-in mt-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700"
        >
          Aguarde um pouco para enviar mais emojis.
        </p>
      )}

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
