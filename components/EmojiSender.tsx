"use client";

import React, { useEffect, useState } from "react";
import {
  ROOM_EMOJIS,
  createEmojiSession,
  getEmojiSession,
  sendEmoji,
} from "@/app/service/rooms";

type EmojiSenderProps = {
  roomId: string;
  playerId: string;
};

// a sessão fica guardada na aba, assim recarregar a página não zera o limite
const storageKey = (playerId: string) => `scrng_emoji_session_${playerId}`;

function readStoredSession(playerId: string) {
  try {
    return sessionStorage.getItem(storageKey(playerId));
  } catch {
    return null;
  }
}

function storeSession(playerId: string, sessionId: string) {
  try {
    sessionStorage.setItem(storageKey(playerId), sessionId);
  } catch {
    // ignora falhas de armazenamento
  }
}

export default function EmojiSender({ roomId, playerId }: EmojiSenderProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const start = async () => {
      setError(null);
      const stored = readStoredSession(playerId);
      if (stored) {
        const res = await getEmojiSession(roomId, stored);
        if (cancelled) return;
        if (!res?.error) {
          setSessionId(stored);
          setRemaining(res.remaining);
          setDisabled(!res.enabled);
          return;
        }
        // sessão expirada ou de outra sala: cria uma nova
      }

      const res = await createEmojiSession(roomId, playerId);
      if (cancelled) return;
      if (res?.error) {
        if (res.status === 403) setDisabled(true);
        else setError(res.error);
        return;
      }
      storeSession(playerId, res.sessionId);
      setSessionId(res.sessionId);
      setRemaining(res.remaining);
    };

    start();
    return () => {
      cancelled = true;
    };
  }, [roomId, playerId]);

  const handleSend = async (emoji: string) => {
    if (!sessionId || sending || !remaining) return;
    setSending(true);
    setError(null);
    try {
      const res = await sendEmoji(roomId, sessionId, emoji);
      if (res?.error) {
        if (res.status === 429) setRemaining(0);
        else if (res.status === 403) setDisabled(true);
        else setError(res.error);
        return;
      }
      setRemaining(res.remaining);
    } finally {
      setSending(false);
    }
  };

  if (disabled) return null;

  const exhausted = remaining === 0;

  return (
    <div className="mt-2 w-full">
      <p className="text-xs sm:text-sm uppercase tracking-wide text-gray-400 mb-2">
        Reações
      </p>

      <div className="grid grid-cols-4 gap-2">
        {ROOM_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => handleSend(emoji)}
            disabled={!sessionId || sending || exhausted}
            className="cursor-pointer h-12 rounded-xl bg-gray-100 text-2xl hover:bg-gray-200 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label={`Enviar ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {remaining === null
          ? "Carregando..."
          : exhausted
            ? "Você atingiu o limite de emojis."
            : `${remaining} ${remaining === 1 ? "emoji restante" : "emojis restantes"}`}
      </p>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
