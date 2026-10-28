"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { getPlayer, updatePlayer, getRoomSettings } from "../../service/rooms";
import { addPoints } from "../../service/players";
import EditProfileModal from "@/components/EditProfileModal";
import EmojiSender from "@/components/EmojiSender";
import AuctionBidder from "@/components/AuctionBidder";
import { Skeleton } from "@/components/Spinner";
import { useGlobal } from "@/context/GlobalContext";
import { FiEdit2 } from "react-icons/fi";
import { IoMdAdd, IoMdRemove } from "react-icons/io";

type Player = {
  id: string;
  name: string;
  points: number;
  roomId?: string;
  roomName?: string;
  avatar?: string;
} | null;

type RoomSettings = {
  PlayerLimit: number;
  PlayersCanEditPoints: boolean;
  PlayersCanEditName: boolean;
  EmojisEnabled: boolean;
};

const DEFAULT_SETTINGS: RoomSettings = {
  PlayerLimit: 10,
  // por padrão o jogador NÃO pode editar nada
  PlayersCanEditPoints: false,
  PlayersCanEditName: false,
  EmojisEnabled: false,
};

// intervalo de atualização dos pontos do jogador (ms)
const POLL_INTERVAL = 5000;

const AVATAR_STYLE = "adventurer";
function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(
    seed,
  )}`;
}

export default function UserPage() {
  const params = useParams();
  const [player, setPlayer] = useState<Player>(null);
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pointsStep, setPointsStep] = useState(10);
  const { showError, showSuccess } = useGlobal();

  const id = params?.id as string | undefined;

  const refreshPlayer = useCallback(async () => {
    if (!id) return;
    const res = await getPlayer(id);
    if (!res?.error) {
      setPlayer((res as Player) ?? null);
    }
  }, [id]);

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
          return;
        }

        const p = (res as Player) ?? null;
        setPlayer(p);

        // busca as regras da sala do jogador, se houver roomId
        if (p?.roomId) {
          const s = await getRoomSettings(p.roomId);
          if (!s?.error) {
            setSettings({
              PlayerLimit: s.PlayerLimit ?? DEFAULT_SETTINGS.PlayerLimit,
              PlayersCanEditPoints:
                s.PlayersCanEditPoints ?? DEFAULT_SETTINGS.PlayersCanEditPoints,
              PlayersCanEditName:
                s.PlayersCanEditName ?? DEFAULT_SETTINGS.PlayersCanEditName,
              EmojisEnabled: s.EmojisEnabled ?? DEFAULT_SETTINGS.EmojisEnabled,
            });
          }
          // se falhar ao buscar as regras, mantém o padrão (tudo bloqueado)
        }
      } catch (err) {
        setError(String(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // mantém os pontos sincronizados com o que o dono da sala altera
  useEffect(() => {
    if (!id || !player?.id) return;
    const interval = setInterval(refreshPlayer, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [id, player?.id, refreshPlayer]);

  const initials = (player?.name || "")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleSaveProfile = async (data: { name: string; avatar: string }) => {
    if (!player?.id) return;
    // se o jogador não pode editar o nome, garante que o valor original é mantido
    const payload = settings.PlayersCanEditName
      ? data
      : { name: player.name, avatar: data.avatar };

    const res = await updatePlayer(player.id, payload);
    if (res?.error) {
      showError(res.error);
      return false;
    }
    setPlayer((prev) => (prev ? { ...prev, ...payload } : prev));
    showSuccess("Perfil atualizado!");
  };

  const handleAddPoints = async (delta: number) => {
    if (!delta || !player?.id || !player.roomId || !settings.PlayersCanEditPoints)
      return;
    // atualiza na hora e só desfaz se a API falhar
    setPlayer((prev) => (prev ? { ...prev, points: prev.points + delta } : prev));
    try {
      const res = await addPoints(player.roomId, player.id, delta);
      if (res?.error) showError(res.error);
    } catch (err) {
      showError(err, "Erro ao atualizar pontuação");
    }
    refreshPlayer();
  };

  return (
    <div className="w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#0A0A0A] text-black">
      <div className="w-full max-w-sm sm:max-w-md p-5 sm:p-8 bg-white rounded-2xl shadow-lg">
        {loading ? (
          <div className="flex flex-col items-center gap-4" aria-busy="true">
            <Skeleton className="w-24 h-24 sm:w-32 sm:h-32 rounded-full" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-20 w-full mt-2 rounded-2xl" />
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <p className="text-lg font-semibold">Não foi possível abrir o placar</p>
            <p className="text-sm text-gray-500 mt-1 wrap-break-word">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-5 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
            >
              Tentar novamente
            </button>
          </div>
        ) : player ? (
          <div className="animate-fade-in flex flex-col items-center text-center gap-4">
            {/* Leilão: só aparece enquanto houver um em andamento (ou o resultado recente) */}
            {player.roomId && (
              <AuctionBidder
                roomId={player.roomId}
                playerId={player.id}
                points={player.points}
                onPointsChange={refreshPlayer}
              />
            )}

            <div className="relative">
              {player.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl(player.avatar)}
                  alt={player.name}
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-indigo-50 border shrink-0"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-indigo-100 flex items-center justify-center text-3xl sm:text-4xl font-bold text-indigo-700 shrink-0">
                  {initials}
                </div>
              )}

              <button
                onClick={() => setEditOpen(true)}
                className="cursor-pointer absolute -bottom-1 -right-1 p-2 rounded-full bg-indigo-600 text-white shadow ring-4 ring-white hover:bg-indigo-700 hover:scale-110 transition"
                aria-label="Editar perfil"
                title="Editar perfil"
              >
                <FiEdit2 size={14} />
              </button>
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
              <div className="px-6 py-4 rounded-2xl bg-indigo-50 text-indigo-700 text-4xl sm:text-5xl font-extrabold tabular-nums">
                <span key={player.points} className="animate-pop-in inline-block">
                  {player.points}
                </span>
              </div>

              {/* Controles de pontos: só aparecem se a sala permitir */}
              {settings.PlayersCanEditPoints && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleAddPoints(-pointsStep)}
                    aria-label={`Remover ${pointsStep} pontos`}
                    className="cursor-pointer h-10 w-10 rounded-full bg-red-400 text-red-950 hover:bg-red-600 active:scale-90 transition flex items-center justify-center"
                  >
                    <IoMdRemove />
                  </button>

                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={pointsStep}
                    onChange={(e) => {
                      let value = Number(e.target.value);
                      if (isNaN(value)) value = 0;
                      if (value < 0) value = 0;
                      if (value > 9999) value = 9999;
                      setPointsStep(value);
                    }}
                    aria-label="Quantidade de pontos"
                    className="w-20 px-2 py-1 rounded-full text-center font-bold bg-gray-100 focus:bg-gray-200 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                  />

                  <button
                    onClick={() => handleAddPoints(pointsStep)}
                    aria-label={`Adicionar ${pointsStep} pontos`}
                    className="cursor-pointer h-10 w-10 rounded-full bg-green-400 text-green-950 hover:bg-green-600 active:scale-90 transition flex items-center justify-center"
                  >
                    <IoMdAdd />
                  </button>
                </div>
              )}
            </div>

            {/* Envio de emojis para a tela da sala: só aparece se a sala permitir */}
            {settings.EmojisEnabled && player.roomId && (
              <EmojiSender roomId={player.roomId} playerId={player.id} />
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-lg font-semibold">Jogador não encontrado</p>
            <p className="text-sm text-gray-500 mt-1">
              Ele pode ter sido removido da sala. Peça um novo QR Code ao dono da sala.
            </p>
          </div>
        )}
      </div>

      {player && (
        <EditProfileModal
          open={editOpen}
          currentName={player.name}
          currentAvatar={player.avatar}
          canEditName={settings.PlayersCanEditName}
          onClose={() => setEditOpen(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}
