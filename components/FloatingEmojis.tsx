"use client";

import React, { useEffect, useRef, useState } from "react";
import { getRoomEmojis } from "@/app/service/rooms";

type FloatingEmojisProps = {
  roomId: string;
  enabled: boolean;
};

type RoomEmoji = { id: string; emoji: string; createdAt: string };
type FloatingEmoji = { id: string; emoji: string; left: number; delay: number };

// intervalo de busca de novos emojis (ms)
const POLL_INTERVAL = 2000;
// duração da animação de subida (ms), igual à do globals.css
const FLOAT_DURATION = 4000;

export default function FloatingEmojis({ roomId, enabled }: FloatingEmojisProps) {
  const [floating, setFloating] = useState<FloatingEmoji[]>([]);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !roomId) return;

    let cancelled = false;
    let firstLoad = true;

    const poll = async () => {
      const res = await getRoomEmojis(roomId);
      if (cancelled || !Array.isArray(res)) return;

      const fresh = (res as RoomEmoji[]).filter(
        (r) => !seenRef.current.has(r.id),
      );
      fresh.forEach((r) => seenRef.current.add(r.id));

      // na primeira busca só marca como vistos, para não exibir emojis antigos
      if (firstLoad) {
        firstLoad = false;
        return;
      }
      if (fresh.length === 0) return;

      // espalha os emojis do mesmo lote ao longo do intervalo de polling
      const items = fresh.map((r, i) => ({
        id: r.id,
        emoji: r.emoji,
        left: 5 + Math.random() * 90,
        delay: Math.round((i / fresh.length) * POLL_INTERVAL),
      }));
      setFloating((prev) => [...prev, ...items]);

      const ids = new Set(items.map((i) => i.id));
      setTimeout(() => {
        setFloating((prev) => prev.filter((f) => !ids.has(f.id)));
      }, FLOAT_DURATION + POLL_INTERVAL);
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [roomId, enabled]);

  if (!enabled || floating.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[90] overflow-hidden"
      aria-hidden="true"
    >
      {floating.map((f) => (
        <span
          key={f.id}
          className="emoji-float absolute bottom-0 text-5xl md:text-6xl"
          style={{ left: `${f.left}%`, animationDelay: `${f.delay}ms` }}
        >
          {f.emoji}
        </span>
      ))}
    </div>
  );
}
