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
import { FiArrowLeft, FiSettings, FiSmartphone, FiTrash2, FiUsers } from "react-icons/fi";
import EditRoomModal from "@/components/EditRoomModal";
import FloatingEmojis from "@/components/FloatingEmojis";
import DropdownMenu from "@/components/DropdownMenu";
import ConfirmModal from "@/components/ConfirmModal";
import { Skeleton } from "@/components/Spinner";
import AuctionPanel from "@/components/AuctionPanel";
import AuctionStartModal from "@/components/AuctionStartModal";
import { useAuction } from "@/hooks/useAuction";
import { LuGavel } from "react-icons/lu";

type Player = { id: string; name: string; points: number; avatar?: string };
type RoomType = {
  id?: string;
  name?: string;
  players?: Player[];
  EmojisEnabled?: boolean;
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
  const { user, showError, showSuccess } = useGlobal();
  const [room, setRoom] = useState<RoomType>(null);
  const [loading, setLoading] = useState(true);

  const [points, setpoints] = useState(10);
  const [roomPoints, setRoomPoints] = useState(10);

  const [error, setError] = useState<string | null>(null);
  const [playerToRemove, setPlayerToRemove] = useState<Player | null>(null);

  const [sort, setSort] = useState<"points" | "alpha">("points");
  const [qrModalPlayer, setQrModalPlayer] = useState<Player | null>(null);

  const id = params?.id as string | undefined;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [auctionModalOpen, setAuctionModalOpen] = useState(false);
  // resultado que o dono já fechou, para não reabrir no próximo polling
  const [dismissedAuction, setDismissedAuction] = useState<string | null>(null);
  const { auction, now, applyResponse } = useAuction(user ? id : undefined, {
    keepResult: true,
  });
  const auctionRunning = auction?.status === "RUNNING";

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

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getRoom(id);
      if (res?.error) {
        setError(res.error);
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
  }, [id, showError]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    load();
  }, [user, router, load]);

  // atualiza a tela na hora e só desfaz se a API falhar
  const applyPoints = async (
    delta: number,
    playerId: string | null,
    request: () => Promise<{ error?: string } | null>,
  ) => {
    if (!delta) return;
    setRoom((prev) =>
      prev
        ? {
            ...prev,
            players: prev.players?.map((p) =>
              playerId === null || p.id === playerId
                ? { ...p, points: p.points + delta }
                : p,
            ),
          }
        : prev,
    );
    try {
      const res = await request();
      if (res?.error) {
        showError(res.error);
        refreshRoom();
      }
    } catch (err) {
      showError(err, "Erro ao atualizar pontuação");
      refreshRoom();
    }
  };

  const handleRemovePlayer = async () => {
    if (!playerToRemove || !room?.id) return;
    try {
      const res = await removePlayer(room.id, playerToRemove.id);
      if (res?.error) {
        showError(res.error);
        return false;
      }
      setRoom((prev) =>
        prev
          ? {
              ...prev,
              players: prev.players?.filter((p) => p.id !== playerToRemove.id),
            }
          : prev,
      );
      showSuccess(`${playerToRemove.name} foi removido da sala.`);
    } catch (err) {
      showError(err, "Erro ao remover jogador");
      return false;
    }
  };

  // polling: mantém a sala sincronizada sem precisar recarregar a página
  useEffect(() => {
    if (!id || !user) return;

    pollRef.current = setInterval(refreshRoom, POLL_INTERVAL);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [id, user, refreshRoom]);

  // lances reservam e devolvem pontos: atualiza o placar quando o líder muda
  const auctionLeader = auction?.leaderId;
  const auctionStatus = auction?.status;
  useEffect(() => {
    if (auctionStatus) refreshRoom();
  }, [auctionLeader, auctionStatus, refreshRoom]);

  const sortedPlayers = [...(room?.players ?? [])].sort((a, b) => {
    if (sort === "alpha") return a.name.localeCompare(b.name);
    return b.points - a.points;
  });

  return (
    <>
      <div className="p-4 md:p-8 flex items-center justify-center text-black">
        <div className="w-full max-w-3xl p-4 md:p-6 bg-white rounded-xl shadow">
          {loading ? (
            <div aria-busy="true">
              <Skeleton className="h-10 w-1/2 mx-auto" />
              <Skeleton className="h-12 w-72 max-w-full mx-auto mt-6 rounded-full" />
              <Skeleton className="h-6 w-28 mt-6" />
              <div className="grid gap-3 mt-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 p-3 rounded-lg border"
                  >
                    <Skeleton className="w-20 h-20 md:w-24 md:h-24 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-6">
              <p className="text-lg font-semibold">Não foi possível abrir a sala</p>
              <p className="text-sm text-gray-500 mt-1">{error}</p>
              <div className="flex gap-3 justify-center mt-5">
                <button
                  onClick={() => router.push("/")}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition"
                >
                  Voltar às salas
                </button>
                <button
                  onClick={load}
                  className="cursor-pointer px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
                >
                  Tentar novamente
                </button>
              </div>
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
                    onClick={() => setAuctionModalOpen(true)}
                    disabled={auctionRunning}
                    className="cursor-pointer p-2 rounded border bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Abrir leilão"
                    title={auctionRunning ? "Leilão em andamento" : "Abrir leilão"}
                  >
                    <LuGavel size={18} />
                  </button>
                  <button
                    onClick={() => setSettingsOpen(true)}
                    className="cursor-pointer p-2 rounded border bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                    aria-label="Configurações da sala"
                    title="Configurações da sala"
                  >
                    <FiSettings size={18} />
                  </button>
                </div>

                {/* Ordenação */}
                <div className="flex gap-3 justify-center md:justify-end">
                  <button
                    onClick={() => setSort("points")}
                    aria-label="Ordenar por pontos"
                    aria-pressed={sort === "points"}
                    title="Ordenar por pontos"
                    className={`cursor-pointer p-2 rounded border transition ${
                      sort === "points"
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <LuArrowUp10 size={18} />
                  </button>

                  <button
                    onClick={() => setSort("alpha")}
                    aria-label="Ordenar por nome"
                    aria-pressed={sort === "alpha"}
                    title="Ordenar por nome"
                    className={`cursor-pointer p-2 rounded border transition ${
                      sort === "alpha"
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                  onClick={() =>
                    applyPoints(roomPoints, null, () =>
                      addRoomPoints(id, roomPoints),
                    )
                  }
                  aria-label={`Adicionar ${roomPoints} pontos a todos`}
                  title="Adicionar a todos"
                  className="cursor-pointer px-3 py-1 h-10 w-10 md:h-12 md:w-12 rounded-full bg-green-400 text-green-950 hover:bg-green-600 active:scale-90 transition flex items-center justify-center"
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
                  className="w-24 md:w-32 px-3 py-1 rounded-full text-center font-bold bg-gray-100 focus:bg-gray-200 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                />

                <button
                  onClick={() =>
                    applyPoints(-roomPoints, null, () =>
                      addRoomPoints(id, -roomPoints),
                    )
                  }
                  aria-label={`Remover ${roomPoints} pontos de todos`}
                  title="Remover de todos"
                  className="cursor-pointer px-3 py-1 h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-400 text-red-950 hover:bg-red-600 active:scale-90 transition flex items-center justify-center"
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
                    <div className="flex flex-col items-center text-center py-8 px-4 rounded-lg border border-dashed text-neutral-500">
                      <FiUsers size={28} className="text-neutral-400" />
                      <p className="mt-2 font-medium text-neutral-600">
                        Nenhum jogador na sala
                      </p>
                      <p className="text-sm">
                        Toque no botão + no canto da tela para adicionar.
                      </p>
                    </div>
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
                          className="animate-fade-in flex flex-col md:flex-row md:items-center gap-4 p-3 rounded-lg border bg-white relative transition hover:shadow-md hover:border-indigo-100"
                        >
                          {p.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
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
                              {p.points} {Math.abs(p.points) === 1 ? "ponto" : "pontos"}
                            </div>
                          </div>

                          {/* Botões */}
                          <div className="flex flex-wrap justify-center md:justify-end gap-2 items-center">
                            <button
                              onClick={() =>
                                applyPoints(points, p.id, () =>
                                  addPoints(id, p.id, points),
                                )
                              }
                              aria-label={`Adicionar ${points} pontos a ${p.name}`}
                              className="cursor-pointer px-3 py-1 h-10 w-10 md:h-12 md:w-12 rounded-full bg-green-400 text-green-950 hover:bg-green-600 active:scale-90 transition flex items-center justify-center"
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
                              className="w-24 md:w-32 px-3 py-1 rounded-full text-center font-bold bg-gray-100 focus:bg-gray-200 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                            />

                            <button
                              onClick={() =>
                                applyPoints(-points, p.id, () =>
                                  addPoints(id, p.id, -points),
                                )
                              }
                              aria-label={`Remover ${points} pontos de ${p.name}`}
                              className="cursor-pointer px-3 py-1 h-10 w-10 md:h-12 md:w-12 rounded-full bg-red-400 text-red-950 hover:bg-red-600 active:scale-90 transition flex items-center justify-center"
                            >
                              <IoMdRemove />
                            </button>
                          </div>

                          <div
                            key={p.points}
                            className="animate-pop-in px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-lg font-semibold mx-auto md:mx-0 tabular-nums"
                          >
                            {p.points}
                          </div>

                          {/* Menu do jogador */}
                          <div className="flex justify-center md:justify-end">
                            <DropdownMenu
                              label={`Opções de ${p.name}`}
                              buttonClassName="cursor-pointer p-2 rounded-full hover:bg-gray-200 transition text-gray-700"
                              items={[
                                {
                                  label: "Acesso remoto",
                                  icon: <FiSmartphone />,
                                  onClick: () => setQrModalPlayer(p),
                                },
                                {
                                  label: "Remover jogador",
                                  icon: <FiTrash2 />,
                                  danger: true,
                                  onClick: () => setPlayerToRemove(p),
                                },
                              ]}
                            >
                              <SlOptionsVertical />
                            </DropdownMenu>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              <div className="flex gap-3 mt-6 items-center justify-center">
                <button
                  onClick={() => router.push("/")}
                  className="cursor-pointer px-4 py-2 rounded w-full bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                >
                  <FiArrowLeft />
                  Voltar
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-lg font-semibold">Sala não encontrada</p>
              <button
                onClick={() => router.push("/")}
                className="cursor-pointer mt-4 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition"
              >
                Voltar às salas
              </button>
            </div>
          )}
        </div>
      </div>

      <PlayerAdd roomId={id} onUpdated={refreshRoom} />

      <QrCodeModal
        key={qrModalPlayer?.id}
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
      <ConfirmModal
        open={!!playerToRemove}
        title="Remover jogador?"
        message={
          <>
            <strong>{playerToRemove?.name}</strong> será removido da sala junto
            com seus pontos.
          </>
        }
        confirmLabel="Remover"
        onConfirm={handleRemovePlayer}
        onClose={() => setPlayerToRemove(null)}
      />
      <FloatingEmojis roomId={id!} enabled={!!room?.EmojisEnabled} />
      <AuctionStartModal
        open={auctionModalOpen}
        roomId={id!}
        onClose={() => setAuctionModalOpen(false)}
        onStarted={applyResponse}
      />
      {auction && auction.id !== dismissedAuction && (
        <AuctionPanel
          key={auction.id}
          roomId={id!}
          auction={auction}
          now={now}
          onCancelled={(res, sentAt) => {
            applyResponse(res, sentAt);
            setDismissedAuction(auction.id);
          }}
          onDismiss={() => setDismissedAuction(auction.id)}
        />
      )}
    </>
  );
}
