"use client";

import React from "react";
import { LuGavel, LuHistory, LuTrophy } from "react-icons/lu";
import Modal from "./Modal";

type GamesMenuModalProps = {
  open: boolean;
  onClose: () => void;
  auctionRunning: boolean;
  pollStatus?: "OPEN" | "CLOSED";
  onAuction: () => void;
  onAuctionHistory: () => void;
  onPoll: () => void;
};

type GameCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  badge?: string;
  tone: string;
  onClick: () => void;
  disabled?: boolean;
};

function GameCard({ icon, title, description, badge, tone, onClick, disabled }: GameCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="cursor-pointer w-full flex items-center gap-4 p-4 rounded-xl border text-left bg-white hover:shadow-md hover:border-indigo-200 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none"
    >
      <span className={`shrink-0 h-12 w-12 rounded-full flex items-center justify-center ${tone}`}>
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-gray-800">{title}</span>
          {badge && (
            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-green-100 text-green-700">
              {badge}
            </span>
          )}
        </span>
        <span className="block text-sm text-gray-500">{description}</span>
      </span>
    </button>
  );
}

export default function GamesMenuModal({
  open,
  onClose,
  auctionRunning,
  pollStatus,
  onAuction,
  onAuctionHistory,
  onPoll,
}: GamesMenuModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Jogos">
      <div className="flex flex-col gap-3">
        <GameCard
          icon={<LuGavel size={22} />}
          title="Leilão"
          description="Jogadores disputam um item dando lances com seus pontos."
          badge={auctionRunning ? "Em andamento" : undefined}
          tone="bg-amber-100 text-amber-800"
          disabled={auctionRunning}
          onClick={() => {
            onClose();
            onAuction();
          }}
        />
        <GameCard
          icon={<LuTrophy size={22} />}
          title="Bolão"
          description="Cada jogador escreve um palpite; você revela tudo e dá os pontos."
          badge={
            pollStatus === "OPEN"
              ? "Recebendo respostas"
              : pollStatus === "CLOSED"
                ? "Encerrado"
                : undefined
          }
          tone="bg-indigo-100 text-indigo-800"
          onClick={() => {
            onClose();
            onPoll();
          }}
        />
        <button
          type="button"
          onClick={() => {
            onClose();
            onAuctionHistory();
          }}
          className="cursor-pointer mt-1 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <LuHistory /> Histórico de leilões
        </button>
      </div>
    </Modal>
  );
}
