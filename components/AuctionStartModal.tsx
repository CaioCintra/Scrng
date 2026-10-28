"use client";

import React, { useState } from "react";
import { startAuction } from "@/app/service/auctions";
import type { AuctionResponse } from "@/hooks/useAuction";
import FormError from "./FormError";
import Modal from "./Modal";
import Spinner from "./Spinner";

const INPUT_CLASS =
  "w-full px-3 py-2 rounded-lg border border-gray-300 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

type AuctionStartModalProps = {
  open: boolean;
  roomId: string;
  onClose: () => void;
  onStarted: (res: AuctionResponse, sentAt: number) => void;
};

export default function AuctionStartModal({
  open,
  roomId,
  onClose,
  onStarted,
}: AuctionStartModalProps) {
  const [item, setItem] = useState("");
  const [startingBid, setStartingBid] = useState(10);
  const [minIncrement, setMinIncrement] = useState(1);
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [bidResetSeconds, setBidResetSeconds] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNumber =
    (setter: (v: number) => void, min = 1, max = 999999) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = Math.floor(Number(e.target.value));
      if (isNaN(value) || value < min) value = min;
      if (value > max) value = max;
      setter(value);
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const sentAt = Date.now();
    const res = await startAuction(roomId, {
      item: item.trim() || undefined,
      startingBid,
      minIncrement,
      durationSeconds,
      bidResetSeconds,
    });
    setSaving(false);
    if (res?.error) {
      setError(res.error);
      return;
    }
    onStarted(res as AuctionResponse, sentAt);
    setItem("");
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="Abrir leilão" locked={saving}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormError message={error} />

        <div>
          <label htmlFor="auction-item" className="block text-sm font-medium text-gray-700 mb-1">
            O que está sendo leiloado? <span className="text-gray-400">(opcional)</span>
          </label>
          <input
            id="auction-item"
            type="text"
            maxLength={60}
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Ex.: Carta bônus"
            className={INPUT_CLASS}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="auction-start" className="block text-sm font-medium text-gray-700 mb-1">
              Lance inicial
            </label>
            <input
              id="auction-start"
              type="number"
              min={1}
              value={startingBid}
              onChange={handleNumber(setStartingBid)}
              className={`${INPUT_CLASS} text-center font-semibold`}
            />
          </div>
          <div>
            <label htmlFor="auction-step" className="block text-sm font-medium text-gray-700 mb-1">
              Aumento mínimo
            </label>
            <input
              id="auction-step"
              type="number"
              min={1}
              value={minIncrement}
              onChange={handleNumber(setMinIncrement)}
              className={`${INPUT_CLASS} text-center font-semibold`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="auction-duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duração (s)
            </label>
            <input
              id="auction-duration"
              type="number"
              min={5}
              max={3600}
              value={durationSeconds}
              onChange={handleNumber(setDurationSeconds, 5, 3600)}
              className={`${INPUT_CLASS} text-center font-semibold`}
            />
          </div>
          <div>
            <label htmlFor="auction-reset" className="block text-sm font-medium text-gray-700 mb-1">
              Após um lance (s)
            </label>
            <input
              id="auction-reset"
              type="number"
              min={1}
              max={3600}
              value={bidResetSeconds}
              onChange={handleNumber(setBidResetSeconds, 1, 3600)}
              className={`${INPUT_CLASS} text-center font-semibold`}
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 rounded-lg bg-gray-50 border border-gray-100 p-3">
          O leilão começa com {durationSeconds} segundos. Sempre que alguém dá um lance com
          menos de {bidResetSeconds} segundos restantes, o tempo volta para {bidResetSeconds}.
          Os pontos de quem for superado são devolvidos na hora.
        </p>

        <div className="flex gap-3 mt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Spinner />}
            {saving ? "Abrindo..." : "Começar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
