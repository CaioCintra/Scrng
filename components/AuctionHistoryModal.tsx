"use client";

import React, { useEffect, useState } from "react";
import { getAuctionHistory } from "@/app/service/auctions";
import { LuGavel } from "react-icons/lu";
import Avatar from "./Avatar";
import FormError from "./FormError";
import Modal from "./Modal";
import { Skeleton } from "./Spinner";

type HistoryAuction = {
  id: string;
  item: string | null;
  status: "FINISHED" | "CANCELLED";
  startingBid: number;
  currentBid: number | null;
  leaderId: string | null;
  leaderName: string | null;
  leaderAvatar: string | null;
  createdAt: string;
  finishedAt: string | null;
  bidCount: number;
};

type AuctionHistoryModalProps = {
  open: boolean;
  roomId: string;
  onClose: () => void;
};

const pts = (n: number) => `${n} ${Math.abs(n) === 1 ? "ponto" : "pontos"}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AuctionHistoryModal({ open, roomId, onClose }: AuctionHistoryModalProps) {
  const [auctions, setAuctions] = useState<HistoryAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !roomId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      const res = await getAuctionHistory(roomId);
      if (res?.error) setError(res.error);
      else setAuctions(res as HistoryAuction[]);
      setLoading(false);
    };
    load();
  }, [open, roomId]);

  const sold = auctions.filter((a) => a.status === "FINISHED" && a.currentBid !== null);
  const totalSpent = sold.reduce((sum, a) => sum + (a.currentBid ?? 0), 0);

  // total gasto por jogador, do maior para o menor
  const byPlayer = Object.values(
    sold.reduce<Record<string, { name: string; avatar: string | null; spent: number; won: number }>>(
      (acc, a) => {
        const key = a.leaderId ?? `removed:${a.leaderName}`;
        const entry = (acc[key] ??= {
          name: a.leaderName ?? "Jogador removido",
          avatar: a.leaderAvatar,
          spent: 0,
          won: 0,
        });
        entry.spent += a.currentBid ?? 0;
        entry.won += 1;
        return acc;
      },
      {},
    ),
  ).sort((a, b) => b.spent - a.spent);

  return (
    <Modal open={open} onClose={onClose} title="Histórico de leilões" className="max-w-lg">
      {loading ? (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-16" />
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : error ? (
        <FormError message={error} />
      ) : auctions.length === 0 ? (
        <div className="flex flex-col items-center text-center py-8 px-4 rounded-lg border border-dashed text-neutral-500">
          <LuGavel size={28} className="text-neutral-400" />
          <p className="mt-2 font-medium text-neutral-600">Nenhum leilão ainda</p>
          <p className="text-sm">Os leilões encerrados aparecem aqui.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-xl bg-indigo-50 px-3 py-2">
              <p className="text-2xl font-extrabold tabular-nums text-indigo-700">{sold.length}</p>
              <p className="text-xs text-gray-500">
                {sold.length === 1 ? "item arrematado" : "itens arrematados"}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 px-3 py-2">
              <p className="text-2xl font-extrabold tabular-nums text-amber-700">{totalSpent}</p>
              <p className="text-xs text-gray-500">pontos gastos</p>
            </div>
          </div>

          {byPlayer.length > 0 && (
            <section>
              <h4 className="text-sm font-semibold text-gray-500 mb-2">Por jogador</h4>
              <ul className="flex flex-col gap-1.5">
                {byPlayer.map((p, i) => (
                  <li key={`${p.name}-${i}`} className="flex items-center gap-3 text-sm">
                    <Avatar name={p.name} avatar={p.avatar} className="w-7 h-7 text-xs" />
                    <span className="flex-1 min-w-0 truncate font-medium">{p.name}</span>
                    <span className="text-gray-500">
                      {p.won} {p.won === 1 ? "item" : "itens"}
                    </span>
                    <span className="w-24 text-right font-bold tabular-nums text-indigo-700">
                      {pts(p.spent)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h4 className="text-sm font-semibold text-gray-500 mb-2">Leilões</h4>
            <ul className="flex flex-col gap-2">
              {auctions.map((a) => {
                const wasSold = a.status === "FINISHED" && a.currentBid !== null;
                return (
                  <li key={a.id} className="flex items-center gap-3 rounded-lg border px-3 py-2">
                    {wasSold ? (
                      <Avatar
                        name={a.leaderName ?? "?"}
                        avatar={a.leaderAvatar}
                        className="w-10 h-10 text-sm"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                        <LuGavel />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{a.item || "Leilão sem nome"}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {wasSold
                          ? `${a.leaderName ?? "Jogador removido"} · ${a.bidCount} ${a.bidCount === 1 ? "lance" : "lances"}`
                          : a.status === "CANCELLED"
                            ? "Cancelado"
                            : "Sem lances"}
                        {" · "}
                        {formatDate(a.finishedAt ?? a.createdAt)}
                      </p>
                    </div>
                    {wasSold ? (
                      <span className="font-bold tabular-nums text-indigo-700 whitespace-nowrap">
                        {pts(a.currentBid!)}
                      </span>
                    ) : (
                      <span className="text-xs rounded-full bg-gray-100 px-2 py-0.5 text-gray-500">
                        {a.status === "CANCELLED" ? "Cancelado" : "Não vendido"}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}
    </Modal>
  );
}
