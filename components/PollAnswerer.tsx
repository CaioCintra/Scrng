"use client";

import React, { useState } from "react";
import { LuTrophy } from "react-icons/lu";
import { answerPoll } from "@/app/service/polls";
import { usePoll } from "@/hooks/usePoll";
import FormError from "./FormError";
import Spinner from "./Spinner";

type PollAnswererProps = {
  roomId: string;
  playerId: string;
};

// bolão no celular do jogador: só aparece com um bolão aberto ou recém-encerrado
export default function PollAnswerer({ roomId, playerId }: PollAnswererProps) {
  const { poll, refresh } = usePoll(roomId, playerId);
  const [text, setText] = useState("");
  const [editedFor, setEditedFor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!poll) return null;

  // começa o campo com a resposta já enviada (ao reabrir a página, por exemplo)
  if (editedFor !== poll.id) {
    setEditedFor(poll.id);
    setText(poll.myAnswer ?? "");
    setError(null);
  }

  const header = (
    <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-600">
      <LuTrophy /> Bolão
    </span>
  );

  if (poll.status === "CLOSED") {
    return (
      <div className="animate-fade-in w-full rounded-2xl border border-gray-200 bg-gray-50 p-4 text-left">
        {header}
        {poll.question && <p className="mt-1 font-semibold break-words">{poll.question}</p>}
        <p className="mt-2 text-sm text-gray-600">
          Bolão encerrado!{" "}
          {poll.myAnswer ? (
            <>
              Sua resposta: <strong className="break-words">{poll.myAnswer}</strong>
            </>
          ) : (
            "Você não respondeu."
          )}
        </p>
      </div>
    );
  }

  const saved = poll.myAnswer !== null && poll.myAnswer === text.trim();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending || !text.trim()) return;
    setSending(true);
    setError(null);
    const res = await answerPoll(roomId, poll.id, playerId, text.trim());
    setSending(false);
    if (res?.error) {
      setError(res.error);
      refresh();
      return;
    }
    try {
      navigator.vibrate?.(30);
    } catch {
      // nem todo navegador permite vibrar
    }
    refresh();
  };

  return (
    <form
      onSubmit={handleSend}
      className="animate-pop-in w-full rounded-2xl border-2 border-indigo-300 bg-linear-to-b from-indigo-50 to-white p-4 text-left"
    >
      {header}
      <p className="mt-1 text-lg font-bold break-words">
        {poll.question ?? "Escreva o seu palpite"}
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={300}
        rows={3}
        placeholder="Digite sua resposta..."
        aria-label="Sua resposta"
        className="mt-3 w-full resize-none px-3 py-2 rounded-lg border border-gray-300 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />

      <div className="mt-3">
        <FormError message={error} />
      </div>

      <button
        type="submit"
        disabled={sending || !text.trim() || saved}
        className="cursor-pointer mt-3 w-full px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {sending && <Spinner />}
        {saved
          ? "Resposta enviada ✓"
          : poll.myAnswer !== null
            ? "Atualizar resposta"
            : "Enviar resposta"}
      </button>
      <p className="mt-1.5 text-xs text-gray-500">
        As respostas só aparecem quando o bolão for encerrado. Você pode mudar a sua até lá.
      </p>
    </form>
  );
}
