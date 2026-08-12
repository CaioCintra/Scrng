"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlayer } from "../../service/rooms";

type Player = {
  id: string;
  name: string;
  points: number;
  roomId?: string;
  roomName?: string;
} | null;

export default function UserPage() {
  const params = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState<Player>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const id = params?.id as string | undefined;

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getPlayer(id);
        if (res?.error) {
          setError(res.error);
          setPlayer(null);
        } else {
          setPlayer((res as Player) ?? null);
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const initials = (player?.name || "")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gray-50 text-black">
      <div className="w-full max-w-sm sm:max-w-md p-5 sm:p-8 bg-white rounded-2xl shadow-lg">
        {loading ? (
          <p className="text-center text-gray-500">Carregando jogador...</p>
        ) : error ? (
          <div className="text-center">
            <p className="text-red-600 wrap-break-word">Erro: {error}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 transition cursor-pointer"
            >
              Voltar
            </button>
          </div>
        ) : player ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-indigo-100 flex items-center justify-center text-3xl sm:text-4xl font-bold text-indigo-700 shrink-0">
              {initials}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold wrap-break-word w-full">
              {player.name}
            </h1>

            {player.roomName && (
              <p className="text-sm sm:text-base text-gray-500 wrap-break-word">
                Sala: {player.roomName}
              </p>
            )}

            <div className="mt-2 w-full">
              <p className="text-xs sm:text-sm uppercase tracking-wide text-gray-400 mb-1">
                Pontuação
              </p>
              <div className="px-6 py-4 rounded-2xl bg-indigo-50 text-indigo-700 text-4xl sm:text-5xl font-extrabold">
                {player.points}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p>Nenhum jogador encontrado.</p>
            <button
              onClick={() => router.back()}
              className="mt-4 px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 transition cursor-pointer"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
