"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentAuction } from "@/app/service/auctions";

export type AuctionBid = {
  id: string;
  playerId: string | null;
  playerName: string;
  playerAvatar: string | null;
  amount: number;
  createdAt: string;
};

export type Auction = {
  id: string;
  roomId: string;
  item: string | null;
  startingBid: number;
  minIncrement: number;
  durationSeconds: number;
  bidResetSeconds: number;
  minBid: number;
  status: "RUNNING" | "FINISHED" | "CANCELLED";
  endsAt: string;
  currentBid: number | null;
  leaderId: string | null;
  leaderName: string | null;
  leaderAvatar: string | null;
  createdAt: string;
  finishedAt: string | null;
  bidCount: number;
  bids: AuctionBid[];
};

export type AuctionResponse = { serverNow: number; auction: Auction | null };

// intervalo de busca enquanto há leilão rodando e quando não há (ms)
const POLL_RUNNING = 1000;
const POLL_IDLE = 3000;

type Options = {
  // mantém o resultado na tela mesmo depois que a API para de retorná-lo
  keepResult?: boolean;
};

export function useAuction(roomId: string | undefined, { keepResult = false }: Options = {}) {
  const [auction, setAuction] = useState<Auction | null>(null);
  // diferença entre o relógio do servidor e o do aparelho
  const offsetRef = useRef(0);
  // ignora respostas de requisições mais antigas que a última aplicada
  const lastSentRef = useRef(0);
  const runningRef = useRef(false);

  const now = useCallback(() => Date.now() + offsetRef.current, []);

  const apply = useCallback(
    (res: AuctionResponse, sentAt: number) => {
      if (sentAt < lastSentRef.current) return;
      lastSentRef.current = sentAt;
      offsetRef.current = res.serverNow - (sentAt + Date.now()) / 2;
      setAuction((prev) => {
        if (!res.auction && keepResult && prev?.status === "FINISHED") return prev;
        return res.auction;
      });
    },
    [keepResult],
  );

  const refresh = useCallback(async () => {
    if (!roomId) return;
    const sentAt = Date.now();
    const res = await getCurrentAuction(roomId);
    if (res && !res.error) apply(res as AuctionResponse, sentAt);
  }, [roomId, apply]);

  const running = auction?.status === "RUNNING";
  useEffect(() => {
    runningRef.current = running;
  }, [running]);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    const loop = async () => {
      await refresh();
      if (cancelled) return;
      timer = setTimeout(loop, runningRef.current ? POLL_RUNNING : POLL_IDLE);
    };
    loop();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [roomId, refresh]);

  // busca o resultado logo que o prazo acaba, sem esperar o próximo ciclo
  const endsAt = auction?.endsAt;
  useEffect(() => {
    if (!running || !endsAt) return;
    const wait = new Date(endsAt).getTime() - now() + 250;
    const timer = setTimeout(refresh, Math.max(0, wait));
    return () => clearTimeout(timer);
  }, [running, endsAt, now, refresh]);

  // applyResponse aplica a resposta de um lance/abertura sem esperar o polling
  return { auction, now, refresh, applyResponse: apply };
}

// milissegundos restantes, atualizados algumas vezes por segundo
export function useCountdown(endsAt: string | undefined, now: () => number) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!endsAt) return;
    const end = new Date(endsAt).getTime();
    const tick = () => setRemaining(Math.max(0, end - now()));
    tick();
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [endsAt, now]);

  return endsAt ? remaining : 0;
}
