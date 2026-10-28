"use client";

import React, { useEffect, useState } from "react";
import { placeBid } from "@/app/service/auctions";
import { useAuction, useCountdown, type AuctionResponse } from "@/hooks/useAuction";
import { LuGavel } from "react-icons/lu";
import AuctionTimer from "./AuctionTimer";
import Confetti from "./Confetti";
import Spinner from "./Spinner";

type AuctionBidderProps = {
  roomId: string;
  playerId: string;
  points: number;
  // chamado quando os pontos do jogador mudam por causa do leilão
  onPointsChange: () => void;
};

const QUICK_STEPS = [5, 10, 50];

const pts = (n: number) => `${n} ${Math.abs(n) === 1 ? "ponto" : "pontos"}`;

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // nem todo navegador permite vibrar
  }
}

// interface de lances no celular do jogador: só aparece com um leilão ativo
export default function AuctionBidder({
  roomId,
  playerId,
  points,
  onPointsChange,
}: AuctionBidderProps) {
  const { auction, now, applyResponse } = useAuction(roomId);
  const remaining = useCountdown(auction?.endsAt, now);
  const [amount, setAmount] = useState(0);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ type: "error" | "info"; text: string } | null>(null);

  const auctionId = auction?.id;
  const status = auction?.status;
  const isLeader = !!auction && auction.leaderId === playerId;
  const minBid = auction?.minBid ?? 0;

  // começa cada leilão no lance mínimo e acompanha o mínimo conforme ele sobe
  const [tracked, setTracked] = useState<{ id?: string; minBid: number }>({ minBid: 0 });
  if (tracked.id !== auctionId || tracked.minBid !== minBid) {
    const isNew = tracked.id !== auctionId;
    setTracked({ id: auctionId, minBid });
    if (isNew) setNotice(null);
    if (isNew || amount < minBid) setAmount(minBid);
  }

  // detecta quando o jogador deixa de liderar porque alguém deu um lance maior
  const [ledAuction, setLedAuction] = useState<string | null>(null);
  const [outbidCount, setOutbidCount] = useState(0);
  if (isLeader && auctionId && ledAuction !== auctionId) setLedAuction(auctionId);
  if (!isLeader && ledAuction !== null) {
    setLedAuction(null);
    if (ledAuction === auctionId && status === "RUNNING") {
      setNotice({ type: "info", text: "Você foi superado! Seus pontos voltaram." });
      setOutbidCount((n) => n + 1);
    }
  }

  // vibra e atualiza os pontos devolvidos
  useEffect(() => {
    if (outbidCount === 0) return;
    vibrate([120, 60, 120]);
    onPointsChange();
  }, [outbidCount, onPointsChange]);

  // ao terminar (ou ser cancelado), sincroniza os pontos com o resultado final
  useEffect(() => {
    if (status && status !== "RUNNING") onPointsChange();
  }, [status, onPointsChange]);

  if (!auction) return null;

  if (auction.status === "CANCELLED") {
    return (
      <div className="animate-fade-in w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-600">
        O leilão foi cancelado. Os pontos reservados foram devolvidos.
      </div>
    );
  }

  if (auction.status === "FINISHED") {
    const won = auction.leaderId === playerId && auction.currentBid !== null;
    return (
      <div
        className={`animate-winner-in w-full rounded-2xl border p-4 text-center ${
          won ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-gray-50"
        }`}
      >
        {won && <Confetti />}
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
          {won ? "Você arrematou!" : "Leilão encerrado"}
        </p>
        {auction.item && <p className="mt-1 font-semibold break-words">{auction.item}</p>}
        <p className="mt-1 text-sm text-gray-600">
          {auction.currentBid === null
            ? "Ninguém deu lance."
            : won
              ? `Você gastou ${pts(auction.currentBid)}.`
              : `${auction.leaderName ?? "Alguém"} venceu com ${pts(auction.currentBid)}.`}
        </p>
      </div>
    );
  }

  const ending = remaining <= 0;
  const canAffordMin = points >= minBid;
  const invalid = amount < minBid || amount > points;

  const handleBid = async () => {
    if (sending || isLeader || ending || invalid) return;
    setSending(true);
    setNotice(null);
    const sentAt = Date.now();
    const res = await placeBid(roomId, auction.id, playerId, amount);
    setSending(false);
    if (res?.error) {
      vibrate(80);
      setNotice({ type: "error", text: res.error });
      if (res.minBid) setAmount((prev) => Math.max(prev, res.minBid));
      onPointsChange();
      return;
    }
    vibrate(30);
    applyResponse(res as AuctionResponse, sentAt);
    onPointsChange();
  };

  return (
    <div className="animate-pop-in w-full rounded-2xl border-2 border-amber-300 bg-gradient-to-b from-amber-50 to-white p-4 text-left">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-600">
          <LuGavel /> Leilão ao vivo
        </span>
        <span className="text-xs text-gray-500">Seus pontos: <strong className="tabular-nums">{points}</strong></span>
      </div>
      {auction.item && <p className="mt-1 text-lg font-bold break-words">{auction.item}</p>}

      <div className="mt-3 flex items-center gap-4">
        <AuctionTimer remaining={remaining} total={auction.durationSeconds} size="sm" />
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            {auction.currentBid === null ? "Lance inicial" : "Maior lance"}
          </p>
          <p
            key={auction.currentBid ?? "start"}
            className="animate-bid-flash rounded-lg text-3xl font-extrabold tabular-nums text-indigo-700"
          >
            {auction.currentBid ?? auction.startingBid}
          </p>
          <p className="text-sm text-gray-600 truncate">
            {auction.currentBid === null
              ? "Seja o primeiro a dar lance!"
              : isLeader
                ? "Você está vencendo!"
                : `${auction.leaderName ?? "Alguém"} está vencendo`}
          </p>
        </div>
      </div>

      {isLeader ? (
        <div className="animate-fade-in mt-4 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
          Você está na frente! Seus {pts(auction.currentBid ?? 0)} ficam reservados e voltam se
          alguém der um lance maior.
        </div>
      ) : !canAffordMin ? (
        <div className="mt-4 rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
          Você precisa de pelo menos {pts(minBid)} para dar um lance.
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_STEPS.map((step) => (
              <button
                key={step}
                type="button"
                onClick={() => setAmount((prev) => Math.min(points, prev + step))}
                disabled={amount + step > points}
                className="cursor-pointer flex-1 px-2 py-1.5 rounded-full bg-white border text-sm font-semibold hover:bg-indigo-50 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +{step}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount(points)}
              className="cursor-pointer flex-1 px-2 py-1.5 rounded-full bg-white border text-sm font-semibold text-amber-700 hover:bg-amber-50 transition"
            >
              Tudo
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={minBid}
              max={points}
              value={amount}
              onChange={(e) => {
                const value = Math.floor(Number(e.target.value));
                setAmount(isNaN(value) ? 0 : Math.max(0, value));
              }}
              onKeyDown={(e) => e.key === "Enter" && handleBid()}
              aria-label="Valor do lance"
              className="w-24 shrink-0 px-2 py-2 rounded-lg border border-gray-300 text-center font-bold outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
            <button
              type="button"
              onClick={handleBid}
              disabled={sending || ending || invalid}
              className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {sending && <Spinner />}
              {ending ? "Encerrando..." : `Dar lance de ${amount}`}
            </button>
          </div>

          <p className="mt-1.5 text-xs text-gray-500">
            {amount > points
              ? `Você só tem ${pts(points)}.`
              : amount < minBid
                ? `O lance mínimo agora é ${minBid}.`
                : `Lance mínimo: ${minBid}`}
          </p>
        </div>
      )}

      {notice && (
        <p
          role="status"
          className={`animate-fade-in mt-3 rounded-lg px-3 py-2 text-xs ${
            notice.type === "error"
              ? "bg-red-50 border border-red-200 text-red-700"
              : "bg-amber-50 border border-amber-200 text-amber-800"
          }`}
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}
