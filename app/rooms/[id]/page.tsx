"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getRoom } from "../../service/rooms";
import { addPoints, addRoomPoints, removePlayer } from "../../service/players";
import { useGlobal } from "@/context/GlobalContext";
import { IoMdAdd, IoMdRemove } from "react-icons/io";
import PlayerAdd from "@/components/PlayerAdd";
import QrCodeModal from "@/components/QrCodeModal";
import { LuAArrowDown, LuArrowUp10 } from "react-icons/lu";
import { SlOptionsVertical } from "react-icons/sl";
import { FiSettings } from "react-icons/fi";
import EditRoomModal from "@/components/EditRoomModal";

type Player = { id: string; name: string; points: number; avatar?: string };
type RoomType = {
  id?: string;
  name?: string;
  players?: Player[];
} | null;

const AVATAR_STYLE = "adventurer";
function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(
    seed,
  )}`;
}

// intervalo de auto-atualização da sala (ms)
const POLL_INTERVAL = 5000;

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, showError } = useGlobal();
  const [room, setRoom] = useState<RoomType>(null);
  const [loading, setLoading] = useState(false);

  const [points, setpoints] = useState(10);
  const [roomPoints, setRoomPoints] = useState(10);

  const [error, setError] = useState<string | null>(null);
  const [openMenuPlayerId, setOpenMenuPlayerId] = useState<string | null>(null);

  const [sort, setSort] = useState<"points" | "alpha">("points");
  const [qrModalPlayer, setQrModalPlayer] = useState<Player | null>(null);

  const id = params?.id as string | undefined;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);

  // busca silenciosa, sem mexer no estado de loading (usada no polling)
  const refreshRoom = useCallback(async () => {
    if (!id) return;
    try {
      const res = await getRoom(id);
      if (!res?.error) {
        setRoom((res as RoomType) ?? null);
      }
    } catch {
      // silencioso: evita quebrar a UI em falhas pontuais de polling
    }
  }, [id]);

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
          showError(res.error);
          setRoom(null);
        } else {
          setRoom((res as RoomType) ?? null);
        }
      } catch (err) {
        setError(String(err));
        showError(err, "Erro ao carregar sala");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user, router, showError]);

  // polling: mantém a sala sincronizada sem precisar recarregar a página
  useEffect(() => {
    if (!id || !user) return;

    pollRef.current = setInterval(refreshRoom, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id, user, refreshRoom]);

  const sortedPlayers = [...(room?.players ?? [])].sort((a, b) => {
    if (sort === "alpha") return a.name.localeCompare(b.name);
    return b.points - a.points;
  });

  return (
    <>
      <div className="p-4 md:p-8 flex items-center justify-center text-black">
        <div className="w-full max-w-3xl p-4 md:p-6 bg-white rounded-xl shadow">
          {loading ? (
            <p>Carregando sala...</p>
          ) : error ? (
            <div>
              <p className="text-red-600">Erro: {error}</p>
              <button
                onClick={() => router.back()}
                className="mt-3 px-3 py-2 rounded bg-slate-200 cursor-pointer"
              >
                Voltar
              </button>
            </div>
          ) : room ? (
            <div>
              {/* HEADER DA SALA */}
              <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4">
                <div className="flex-1 flex justify-center">
                  <h1 className="text-3xl md:text-4xl font-bold text-center break-words">
                    {room?.name ?? "Sala"}
                  </h1>
                </div>
                <div className="flex gap-3 justify-center md:justify-end">
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="cursor-pointer p-2 rounded border bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    aria-label="Configurações da sala"
                  >
                    <FiSettings size={18} />
                  </button>

                  {/* botões de ordenação existentes */}
                </div>

                {/* Ordenação */}
                <div className="flex gap-3 justify-center md:justify-end">
                  <button
                    onClick={() => setSort("points")}
                    className={`cursor-pointer p-2 rounded border transition ${
                      sort === "points"
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <LuArrowUp10 size={18} />
                  </button>

                  <button
                    onClick={() => setSort("alpha")}
                    className={`cursor-pointer p-2 rounded border transition ${
                      sort === "alpha"
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    <LuAArrowDown size={18} />
                  </button>
                </div>
              </div>

              {/* Pontuação geral */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <p className="font-bold text-center w-full md:w-auto">
                  Pontuação Geral
                </p>

                <button
                  onClick={async () => {
                    try {
                      const res = await addRoomPoints(id, roomPoints);
                      if (res?.error) return showError(res.error);
                      refreshRoom();
                    } catch (err) {
                      showError(err, "Erro ao atualizar pontuação");
                    }
                  }}
                  className="cursor-pointer px-3 py-1 h-10 w-10 md:h-12 md:w-12 rounded-full bg-green-400 text-green-950 hover:bg-green-600 transition flex items-center justify-center"
                >
                  <IoMdAdd />
                </button>

                <input
                  type="number"
                  min={0}
                  max={9999}
                  value={roomPoints}
                  onChange={(e) => {
                    let value = Number(e.target.value);
                    if (isNaN(value)) value = 0;
                    if (value < 0) value = 0;
                    if (value > 9999) value = 9999;
                    setRoomPoints(value);
                  }}
                  className="w-24 md:w-32 px-3 py-1 rounded-full text-center font-bold bg-gray-100 focus:bg-gray-200 outline-none"
                />

                <button
                  onClick={async () => {
                    try {
                      const res = await addRoomPoints(id, -roomPoints);
                      if (res?.error) return showError(res.error);
                      refreshRoom();
                    } catch (err) {
                      showError(err, "Erro ao atualizar pontuação");
                    }
                  }}
                  className="cursor-pointer px-3 py-1 h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-400 text-red-950 hover:bg-red-600 transition flex items-center justify-center"
                >
                  <IoMdRemove />
                </button>
              </div>

              {/* Lista de jogadores */}
              <section className="mt-6">
                <h2 className="text-xl font-semibold mb-3 text-center md:text-left">
                  Jogadores
                </h2>

                <div className="grid gap-3">
                  {sortedPlayers.length === 0 ? (
                    <p className="text-sm text-neutral-500 text-center">
                      Nenhum jogador na sala.
                    </p>
                  ) : (
                    sortedPlayers.map((p: Player) => {
                      const initials = (p.name || "")
                        .split(" ")
                        .map((s) => s[0])
                        .filter(Boolean)
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      return (
                        <div
                          key={p.id}
                          className="flex flex-col md:flex-row md:items-center gap-4 p-3 rounded-lg border bg-white relative"
                        >
                          {p.avatar ? (
                            <img
                              src={avatarUrl(p.avatar)}
                              alt={p.name}
                              className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-100 border mx-auto md:mx-0"
                            />
                          ) : (
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-700 mx-auto md:mx-0">
                              {initials}
                            </div>
                          )}

                          <div className="flex-1 text-center md:text-left">
                            <div className="text-lg font-medium text-gray-800 break-words">
                              {p.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {p.points} pontos
                            </div>
                          </div>

                          {/* Botões */}
                          <div className="flex flex-wrap justify-center md:justify-end gap-2 items-center">
                            <button
                              onClick={async () => {
                                try {
                                  const res = await addPoints(id, p.id, points);
                                  if (res?.error) return showError(res.error);
                                  refreshRoom();
                                } catch (err) {
                                  showError(err, "Erro ao atualizar pontuação");
                                }
                              }}
                              className="cursor-pointer px-3 py-1 h-10 w-10 md:h-12 md:w-12 rounded-full bg-green-400 text-green-950 hover:bg-green-600 transition flex items-center justify-center"
                            >
                              <IoMdAdd />
                            </button>

                            <input
                              type="number"
                              min={0}
                              max={9999}
                              value={points}
                              onChange={(e) => {
                                let value = Number(e.target.value);
                                if (isNaN(value)) value = 0;
                                if (value < 0) value = 0;
                                if (value > 9999) value = 9999;
                                setpoints(value);
                              }}
                              className="w-24 md:w-32 px-3 py-1 rounded-full text-center font-bold bg-gray-100 focus:bg-gray-200 outline-none"
                            />

                            <button
                              onClick={async () => {
                                try {
                                  const res = await addPoints(id, p.id, -points);
                                  if (res?.error) return showError(res.error);
                                  refreshRoom();
                                } catch (err) {
                                  showError(err, "Erro ao atualizar pontuação");
                                }
                              }}
                              className="cursor-pointer px-3 py-1 h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-400 text-red-950 hover:bg-red-600 transition flex items-center justify-center"
                            >
                              <IoMdRemove />
                            </button>
                          </div>

                          <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-lg font-semibold mx-auto md:mx-0">
                            {p.points}
                          </div>

                          {/* Menu do jogador */}
                          <div className="flex justify-center md:justify-end">
                            <button
                              className="cursor-pointer relative p-2 rounded-full hover:bg-gray-200 transition"
                              onClick={() =>
                                setOpenMenuPlayerId(
                                  openMenuPlayerId === p.id ? null : p.id,
                                )
                              }
                            >
                              <SlOptionsVertical className="text-gray-700" />

                              {openMenuPlayerId === p.id && (
                                <div className="absolute right-0 mt-2 w-40 bg-white shadow-lg border rounded-lg py-2 z-50">
                                  <div
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                      setOpenMenuPlayerId(null);
                                      setQrModalPlayer(p);
                                    }}
                                  >
                                    Acesso remoto
                                  </div>

                                  <div
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 cursor-pointer"
                                    onClick={async () => {
                                      setOpenMenuPlayerId(null);
                                      try {
                                        const res = await removePlayer(room.id, p.id);
                                        if (res?.error) return showError(res.error);
                                        refreshRoom();
                                      } catch (err) {
                                        showError(err, "Erro ao remover jogador");
                                      }
                                    }}
                                  >
                                    Remover jogador
                                  </div>
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <div className="flex gap-3 mt-6 items-center justify-center">
                <button
                  onClick={() => router.back()}
                  className="cursor-pointer px-4 py-2 rounded w-full bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  Voltar
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p>Nenhuma sala encontrada.</p>
              <button
                onClick={() => router.back()}
                className="cursor-pointer mt-3 px-3 py-2 rounded bg-slate-200"
              >
                Voltar
              </button>
            </div>
          )}
        </div>
      </div>

      <PlayerAdd roomId={id} onUpdated={refreshRoom} />

      <QrCodeModal
        open={!!qrModalPlayer}
        url={`${process.env.NEXT_PUBLIC_SYSTEM_URL}/users/${qrModalPlayer?.id}`}
        playerName={qrModalPlayer?.name}
        onClose={() => setQrModalPlayer(null)}
      />
      <EditRoomModal
        open={settingsOpen}
        roomId={id!}
        onClose={() => setSettingsOpen(false)}
        onUpdated={refreshRoom}
      />
    </>
  );
}
