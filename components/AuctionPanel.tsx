"use client";

import React, { useState } from "react";
import { cancelAuction } from "@/app/service/auctions";
import { useCountdown, type Auction, type AuctionResponse } from "@/hooks/useAuction";
import { useGlobal } from "@/context/GlobalContext";
import { FiMaximize2, FiMinimize2, FiX } from "react-icons/fi";
import { LuGavel } from "react-icons/lu";
import AuctionTimer from "./AuctionTimer";
import Avatar from "./Avatar";
import Confetti from "./Confetti";
import Spinner from "./Spinner";

type AuctionPanelProps = {
  roomId: string;
  auction: Auction;
  now: () => number;
  onCancelled: (res: AuctionResponse, sentAt: number) => void;
  onDismiss: () => void;
};

const pts = (n: number) => `${n} ${Math.abs(n) === 1 ? "ponto" : "pontos"}`;

// leilão exibido na tela da sala: lances ao vivo e, no fim, o vencedor
export default function AuctionPanel({
  roomId,
  auction,
  now,
  onCancelled,
  onDismiss,
}: AuctionPanelProps) {
  const remaining = useCountdown(auction.endsAt, now);
  const [minimized, setMinimized] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const { showError, showSuccess } = useGlobal();

  if (auction.status === "FINISHED") {
    return <AuctionResult auction={auction} onDismiss={onDismiss} />;
  }
  if (auction.status !== "RUNNING") return null;

  const handleCancel = async () => {
    setCancelling(true);
    const sentAt = Date.now();
    const res = await cancelAuction(roomId, auction.id);
    setCancelling(false);
    setConfirmCancel(false);
    if (res?.error) {
      showError(res.error);
      return;
    }
    onCancelled(res as AuctionResponse, sentAt);
    showSuccess(
      auction.leaderName
        ? `Leilão cancelado. ${auction.leaderName} recebeu os pontos de volta.`
        : "Leilão cancelado.",
    );
  };

  const ending = remaining <= 0;

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="animate-pop-in cursor-pointer fixed bottom-24 right-4 z-[95] flex items-center gap-3 rounded-2xl bg-white pl-2 pr-4 py-2 shadow-xl ring-1 ring-black/5 text-black hover:shadow-2xl transition"
        aria-label="Expandir leilão"
      >
        <AuctionTimer remaining={remaining} size="sm" />
        <span className="text-left">
          <span className="block text-xs uppercase tracking-wide text-gray-400">
            {auction.leaderName ?? "Sem lances"}
          </span>
          <span className="block text-xl font-extrabold tabular-nums text-indigo-700">
            {auction.currentBid ?? auction.startingBid}
          </span>
        </span>
        <FiMaximize2 className="text-gray-400" />
      </button>
    );
  }

  return (
    <div className="animate-fade-in fixed inset-0 z-[95] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Leilão em andamento"
        className="animate-pop-in relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-5 md:p-8 shadow-2xl text-black"
      >
        <button
          type="button"
          onClick={() => setMinimized(true)}
          className="absolute top-3 right-3 cursor-pointer p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
          aria-label="Minimizar leilão"
          title="Minimizar"
        >
          <FiMinimize2 size={18} />
        </button>

        <div className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-widest text-amber-600">
          <LuGavel /> Leilão
        </div>
        {auction.item && (
          <h2 className="mt-1 text-center text-2xl md:text-3xl font-bold break-words">
            {auction.item}
          </h2>
        )}

        <div className="mt-6 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
          <AuctionTimer remaining={remaining} />

          <div className="text-center md:text-left min-w-0">
            {auction.currentBid === null ? (
              <>
                <p className="text-xs uppercase tracking-wide text-gray-400">Lance inicial</p>
                <p className="text-5xl md:text-6xl font-extrabold tabular-nums text-indigo-700">
                  {auction.startingBid}
                </p>
                <p className="mt-2 text-gray-500">Aguardando o primeiro lance...</p>
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-wide text-gray-400">Maior lance</p>
                <p
                  key={auction.currentBid}
                  className="animate-bid-flash rounded-xl px-2 -mx-2 text-5xl md:text-6xl font-extrabold tabular-nums text-indigo-700"
                >
                  {auction.currentBid}
                </p>
                <div className="mt-2 flex items-center justify-center md:justify-start gap-2">
                  <Avatar
                    name={auction.leaderName ?? "?"}
                    avatar={auction.leaderAvatar}
                    className="w-9 h-9 text-sm"
                  />
                  <span className="font-semibold text-lg break-words">
                    {auction.leaderName ?? "Jogador removido"}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          {ending
            ? "Encerrando..."
            : `Próximo lance mínimo: ${auction.minBid} · aumento mínimo de ${auction.minIncrement}`}
        </p>

        <section className="mt-6">
          <h3 className="text-sm font-semibold text-gray-500 mb-2">
            Lances {auction.bidCount > 0 && `(${auction.bidCount})`}
          </h3>
          {auction.bids.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6 rounded-lg border border-dashed">
              Os jogadores dão lances pelo celular, no acesso remoto.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {auction.bids.map((bid, i) => (
                <li
                  key={bid.id}
                  className={`animate-pop-in flex items-center gap-3 rounded-lg border px-3 py-2 ${
                    i === 0 ? "border-indigo-200 bg-indigo-50" : "opacity-70"
                  }`}
                >
                  <Avatar name={bid.playerName} avatar={bid.playerAvatar} className="w-8 h-8 text-xs" />
                  <span className="flex-1 min-w-0 truncate font-medium">{bid.playerName}</span>
                  <span className="font-bold tabular-nums text-indigo-700">{bid.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-6 flex justify-center">
          {confirmCancel ? (
            <div className="animate-fade-in flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-gray-600">Cancelar e devolver os pontos?</span>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                disabled={cancelling}
                className="cursor-pointer px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 transition disabled:opacity-50"
              >
                Não
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="cursor-pointer px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60 flex items-center gap-2"
              >
                {cancelling && <Spinner />}
                Sim, cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCancel(true)}
              disabled={ending}
              className="cursor-pointer text-sm text-red-600 hover:underline disabled:opacity-40 disabled:no-underline"
            >
              Cancelar leilão
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AuctionResult({ auction, onDismiss }: { auction: Auction; onDismiss: () => void }) {
  const sold = auction.currentBid !== null;

  return (
    <div className="animate-fade-in fixed inset-0 z-[95] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {sold && <Confetti />}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Resultado do leilão"
        className="animate-winner-in relative w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl text-black"
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 cursor-pointer p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition"
          aria-label="Fechar"
        >
          <FiX size={20} />
        </button>

        {sold ? (
          <>
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">
              Arrematado!
            </p>
            {auction.item && (
              <p className="mt-1 text-lg font-semibold text-gray-600 break-words">{auction.item}</p>
            )}
            <div className="mt-6 flex justify-center">
              <div className="rounded-full p-1.5 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 shadow-lg">
                <Avatar
                  name={auction.leaderName ?? "?"}
                  avatar={auction.leaderAvatar}
                  className="w-28 h-28 text-3xl border-4 border-white"
                />
              </div>
            </div>
            <h2 className="mt-4 text-3xl font-extrabold break-words">
              {auction.leaderName ?? "Jogador removido"}
            </h2>
            <p className="mt-2 text-gray-600">
              venceu com{" "}
              <span className="font-bold text-indigo-700">{pts(auction.currentBid!)}</span>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {auction.bidCount} {auction.bidCount === 1 ? "lance" : "lances"} no total
            </p>
          </>
        ) : (
          <>
            <LuGavel size={40} className="mx-auto text-gray-300" />
            <h2 className="mt-3 text-2xl font-bold">Sem lances</h2>
            <p className="mt-2 text-gray-500">
              Ninguém deu lance{auction.item ? ` em ${auction.item}` : ""}. Nada foi arrematado.
            </p>
          </>
        )}

        <button
          type="button"
          onClick={onDismiss}
          autoFocus
          className="cursor-pointer mt-8 w-full px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
