"use client";

import React, { useState } from "react";
import { IoMdAdd, IoMdRemove } from "react-icons/io";
import { LuCircleCheck, LuClock, LuEye, LuTrophy } from "react-icons/lu";
import { closePoll, finishPoll, startPoll } from "@/app/service/polls";
import type { Poll, PollResponse } from "@/hooks/usePoll";
import FormError from "./FormError";
import Modal from "./Modal";
import Spinner from "./Spinner";

type PlayerLite = { id: string; name: string; points: number; avatar?: string };

type PollPanelProps = {
  open: boolean;
  roomId: string;
  poll: Poll | null;
  players: PlayerLite[];
  onClose: () => void;
  onChanged: (res: PollResponse, sentAt: number) => void;
  onAddPoints: (playerId: string, delta: number) => void;
};

const INPUT_CLASS =
  "w-full px-3 py-2 rounded-lg border border-gray-300 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

const AVATAR_STYLE = "adventurer";
const avatarUrl = (seed: string) =>
  `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(seed)}`;

export default function PollPanel({
  open,
  roomId,
  poll,
  players,
  onClose,
  onChanged,
  onAddPoints,
}: PollPanelProps) {
  const [question, setQuestion] = useState("");
  const [step, setStep] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (call: () => Promise<PollResponse & { error?: string }>) => {
    setBusy(true);
    setError(null);
    const sentAt = Date.now();
    const res = await call();
    setBusy(false);
    if (res?.error) {
      setError(res.error);
      return false;
    }
    onChanged(res, sentAt);
    return true;
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await run(() => startPoll(roomId, question.trim() || undefined))) setQuestion("");
  };

  const pointsOf = (id: string) => players.find((p) => p.id === id)?.points;
  const pending = poll ? players.filter((p) => !poll.answeredPlayerIds.includes(p.id)) : [];

  return (
    <Modal open={open} onClose={onClose} title="Bolão" locked={busy} className="max-w-xl">
      <FormError message={error} />

      {!poll && (
        <form onSubmit={handleStart} className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="poll-question"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Qual é a pergunta? <span className="text-gray-400">(opcional)</span>
            </label>
            <input
              id="poll-question"
              type="text"
              maxLength={120}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex.: Quem vence o jogo de hoje?"
              className={INPUT_CLASS}
              autoFocus
            />
          </div>
          <p className="text-xs text-gray-500 rounded-lg bg-gray-50 border border-gray-100 p-3">
            Cada jogador escreve o que quiser pelo celular. As respostas ficam escondidas até
            você encerrar o bolão. Depois, você dá os pontos para quem acertou.
          </p>
          <button
            type="submit"
            disabled={busy}
            className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Spinner />}
            {busy ? "Abrindo..." : "Abrir bolão"}
          </button>
        </form>
      )}

      {poll?.status === "OPEN" && (
        <div className="flex flex-col gap-4">
          {poll.question && (
            <p className="text-center text-lg font-semibold break-words">{poll.question}</p>
          )}
          <div className="rounded-xl bg-indigo-50 text-indigo-700 text-center py-4">
            <p
              key={poll.answerCount}
              className="animate-pop-in text-4xl font-extrabold tabular-nums"
            >
              {poll.readyPlayerIds.length}/{players.length}
            </p>
            <p className="text-sm">jogadores prontos</p>
          </div>
          {players.length > 0 && (
            <ul className="grid gap-2">
              {players.map((p) => {
                const ready = poll.readyPlayerIds.includes(p.id);
                return (
                  <li
                    key={p.id}
                    className={`flex items-center justify-between gap-3 px-3 py-2 rounded-lg border transition ${
                      ready
                        ? "bg-green-50 border-green-200 text-green-800"
                        : "bg-gray-50 border-gray-200 text-gray-600"
                    }`}
                  >
                    <span className="min-w-0 break-words font-medium">{p.name}</span>
                    <span
                      className="flex items-center gap-1.5 text-xs shrink-0"
                      title={ready ? "Pronto" : "Ainda escrevendo"}
                    >
                      {ready ? (
                        <LuCircleCheck size={20} className="text-green-600" />
                      ) : (
                        <LuClock size={20} className="text-gray-400" />
                      )}
                      {ready ? "Pronto" : "Escrevendo"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={async () => {
                if (await run(() => finishPoll(roomId, poll.id))) onClose();
              }}
              className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition disabled:opacity-50"
            >
              Cancelar bolão
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => run(() => closePoll(roomId, poll.id))}
              className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {busy ? <Spinner /> : <LuEye />}
              Encerrar e revelar
            </button>
          </div>
        </div>
      )}

      {poll?.status === "CLOSED" && (
        <div className="flex flex-col gap-4">
          {poll.question && (
            <p className="text-center text-lg font-semibold break-words">{poll.question}</p>
          )}

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <LuTrophy /> Pontos por toque:
            <input
              type="number"
              min={0}
              max={9999}
              value={step}
              onChange={(e) => {
                let value = Number(e.target.value);
                if (isNaN(value) || value < 0) value = 0;
                if (value > 9999) value = 9999;
                setStep(value);
              }}
              aria-label="Quantidade de pontos"
              className="w-24 px-3 py-1 rounded-full text-center font-bold bg-gray-100 focus:bg-gray-200 focus:ring-2 focus:ring-indigo-200 outline-none transition text-black"
            />
          </div>

          <div className="grid gap-3">
            {poll.answers.length === 0 && (
              <p className="text-center text-sm text-gray-500 py-4">Ninguém respondeu.</p>
            )}
            {poll.answers.map((a) => (
              <div
                key={a.id}
                className="animate-fade-in flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border bg-white"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  {a.playerAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl(a.playerAvatar)}
                      alt={a.playerName}
                      className="w-12 h-12 rounded-full bg-gray-100 border shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-700 shrink-0">
                      {a.playerName.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm text-gray-500 break-words">
                      {a.playerName}
                      {pointsOf(a.playerId) !== undefined && (
                        <span className="ml-2 tabular-nums text-indigo-700 font-semibold">
                          {pointsOf(a.playerId)} pts
                        </span>
                      )}
                    </p>
                    <p className="text-base font-medium text-gray-900 break-words whitespace-pre-wrap">
                      {a.text}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => onAddPoints(a.playerId, step)}
                    aria-label={`Adicionar ${step} pontos a ${a.playerName}`}
                    className="cursor-pointer h-10 w-10 rounded-full bg-green-400 text-green-950 hover:bg-green-600 active:scale-90 transition flex items-center justify-center"
                  >
                    <IoMdAdd />
                  </button>
                  <button
                    onClick={() => onAddPoints(a.playerId, -step)}
                    aria-label={`Remover ${step} pontos de ${a.playerName}`}
                    className="cursor-pointer h-10 w-10 rounded-full bg-red-400 text-red-950 hover:bg-red-600 active:scale-90 transition flex items-center justify-center"
                  >
                    <IoMdRemove />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {pending.length > 0 && (
            <p className="text-xs text-gray-500 text-center">
              Sem resposta: {pending.map((p) => p.name).join(", ")}
            </p>
          )}

          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              if (await run(() => finishPoll(roomId, poll.id))) onClose();
            }}
            className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy && <Spinner />}
            Concluir bolão
          </button>
        </div>
      )}
    </Modal>
  );
}
