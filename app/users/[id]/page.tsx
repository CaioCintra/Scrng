"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlayer, updatePlayer, getRoomSettings } from "../../service/rooms";
import { addPoints } from "../../service/players";
import EditProfileModal from "@/components/EditProfileModal";
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
};

const DEFAULT_SETTINGS: RoomSettings = {
  PlayerLimit: 10,
  // por padrão o jogador NÃO pode editar nada
  PlayersCanEditPoints: false,
  PlayersCanEditName: false,
};

const AVATAR_STYLE = "adventurer";
function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(
    seed,
  )}`;
}

export default function UserPage() {
  const params = useParams();
  const router = useRouter();
  const [player, setPlayer] = useState<Player>(null);
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [pointsStep, setPointsStep] = useState(10);

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
      setError(res.error);
      return;
    }
    setPlayer((prev) => (prev ? { ...prev, ...payload } : prev));
  };

  const handleAddPoints = async (delta: number) => {
    if (!player?.id || !player.roomId || !settings.PlayersCanEditPoints) return;
    await addPoints(player.roomId, player.id, delta);
    refreshPlayer();
  };

  return (
    <div className="w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-[#0A0A0A] text-black">
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
            <div className="relative">
              {player.avatar ? (
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
                className="cursor-pointer absolute -bottom-1 -right-1 p-2 rounded-full bg-indigo-600 text-white shadow hover:bg-indigo-700 transition"
                aria-label="Editar perfil"
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
              <div className="px-6 py-4 rounded-2xl bg-indigo-50 text-indigo-700 text-4xl sm:text-5xl font-extrabold">
                {player.points}
              </div>

              {/* Controles de pontos: só aparecem se a sala permitir */}
              {settings.PlayersCanEditPoints && (
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => handleAddPoints(-pointsStep)}
                    className="cursor-pointer h-10 w-10 rounded-full bg-red-400 text-red-950 hover:bg-red-600 transition flex items-center justify-center"
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
                    className="w-20 px-2 py-1 rounded-full text-center font-bold bg-gray-100 focus:bg-gray-200 outline-none"
                  />

                  <button
                    onClick={() => handleAddPoints(pointsStep)}
                    className="cursor-pointer h-10 w-10 rounded-full bg-green-400 text-green-950 hover:bg-green-600 transition flex items-center justify-center"
                  >
                    <IoMdAdd />
                  </button>
                </div>
              )}
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
