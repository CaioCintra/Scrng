"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRoom } from "../../service/rooms";
import { useGlobal } from "@/context/GlobalContext";

type Player = { id: string; name: string; points: number };
type RoomType = { id?: string; name?: string; description?: string; players?: Player[] } | null;

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useGlobal();
  const [room, setRoom] = useState<RoomType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const id = params?.id as string | undefined;

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!id) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getRoom(id);
        if (res?.error) {
          setError(res.error);
          setRoom(null);
        } else {
          // ensure the response is treated as RoomType
          setRoom((res as RoomType) ?? null);
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, user, router]);

  return (
    <div className="min-h-screen p-8 flex items-center justify-center text-black">
      <div className="w-full max-w-3xl p-6 bg-white rounded-xl shadow">
        {loading ? (
          <p>Carregando sala...</p>
        ) : error ? (
          <div>
            <p className="text-red-600">Erro: {error}</p>
            <button
              onClick={() => router.back()}
              className="mt-3 px-3 py-2 rounded bg-slate-200"
            >
              Voltar
            </button>
          </div>
        ) : room ? (
          <div>
            <h1 className="text-4xl font-bold mb-2 text-center">{room?.name ?? "Sala"}</h1>

            {/* Players list */}
            <section className="mt-6">
              <h2 className="text-xl font-semibold mb-3">Jogadores</h2>

              <div className="grid gap-3">
                {((room?.players ?? []) as Player[]).length === 0 ? (
                  <p className="text-sm text-neutral-500">Nenhum jogador na sala.</p>
                ) : (
                  (room?.players ?? []).map((p: Player) => {
                    const initials = (p.name || "").split(" ").map(s => s[0]).filter(Boolean).slice(0,2).join("").toUpperCase();
                    return (
                      <div key={p.id} className="flex items-center gap-4 p-3 rounded-lg border bg-white">
                        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-700">
                          {initials}
                        </div>

                        <div className="flex-1">
                          <div className="text-lg font-medium text-gray-800">{p.name}</div>
                          <div className="text-sm text-gray-500">{p.points} pontos</div>
                        </div>

                        <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xl font-semibold">{p.points}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <div className="flex gap-3 mt-6">
              <button className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">Entrar</button>
              <button onClick={() => router.back()} className="px-4 py-2 rounded bg-neutral-600 text-white hover:bg-neutral-700">Voltar</button>
            </div>
          </div>
        ) : (
          <div>
            <p>Nenhuma sala encontrada.</p>
            <button
              onClick={() => router.back()}
              className="mt-3 px-3 py-2 rounded bg-slate-200"
            >
              Voltar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
