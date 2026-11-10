"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentPoll } from "@/app/service/polls";

export type PollAnswerItem = {
  id: string;
  playerId: string;
  playerName: string;
  playerAvatar: string | null;
  text: string;
};

export type Poll = {
  id: string;
  roomId: string;
  question: string | null;
  status: "OPEN" | "CLOSED" | "DONE";
  createdAt: string;
  closedAt: string | null;
  answerCount: number;
  answeredPlayerIds: string[];
  myAnswer: string | null;
  // só vem preenchido depois que o bolão é encerrado
  answers: PollAnswerItem[];
};

export type PollResponse = { poll: Poll | null };

const POLL_INTERVAL = 2000;

export function usePoll(roomId: string | undefined, playerId?: string) {
  const [poll, setPoll] = useState<Poll | null>(null);
  // ignora respostas de requisições mais antigas que a última aplicada
  const lastSentRef = useRef(0);

  const apply = useCallback((res: PollResponse, sentAt: number) => {
    if (sentAt < lastSentRef.current) return;
    lastSentRef.current = sentAt;
    setPoll(res.poll);
  }, []);

  const refresh = useCallback(async () => {
    if (!roomId) return;
    const sentAt = Date.now();
    const res = await getCurrentPoll(roomId, playerId);
    if (res && !res.error) apply(res as PollResponse, sentAt);
  }, [roomId, playerId, apply]);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const loop = async () => {
      await refresh();
      if (!cancelled) timer = setTimeout(loop, POLL_INTERVAL);
    };
    loop();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [roomId, refresh]);

  return { poll, refresh, applyResponse: apply };
}
