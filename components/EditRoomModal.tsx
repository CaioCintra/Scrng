"use client";

import React, { useEffect, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { getRoomSettings, updateRoomSettings } from "@/app/service/rooms";
import { useGlobal } from "@/context/GlobalContext";

type RoomSettings = {
  PlayerLimit: number;
  PlayersCanEditPoints: boolean;
  PlayersCanEditName: boolean;
};

type EditRoomModalProps = {
  open: boolean;
  roomId: string;
  onClose: () => void;
  onUpdated?: () => void;
};

const DEFAULT_SETTINGS: RoomSettings = {
  PlayerLimit: 10,
  PlayersCanEditPoints: false,
  PlayersCanEditName: false,
};

export default function EditRoomModal({
  open,
  roomId,
  onClose,
  onUpdated,
}: EditRoomModalProps) {
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useGlobal();

  useEffect(() => {
    if (!open || !roomId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getRoomSettings(roomId);
        if (res?.error) {
          setError(res.error);
          showError(res.error);
        } else {
          setSettings({
            PlayerLimit: res.PlayerLimit ?? DEFAULT_SETTINGS.PlayerLimit,
            PlayersCanEditPoints:
              res.PlayersCanEditPoints ?? DEFAULT_SETTINGS.PlayersCanEditPoints,
            PlayersCanEditName:
              res.PlayersCanEditName ?? DEFAULT_SETTINGS.PlayersCanEditName,
          });
        }
      } catch (err) {
        setError(String(err));
        showError(err, "Erro ao carregar configurações");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, roomId, showError]);

  if (!open) return null;

  const set = <K extends keyof RoomSettings>(key: K, value: RoomSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = Number(e.target.value);
    if (isNaN(value)) value = 1;
    if (value < 1) value = 1;
    if (value > 999) value = 999;
    set("PlayerLimit", value);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await updateRoomSettings(roomId, settings);
      if (res?.error) {
        setError(res.error);
        showError(res.error);
        return;
      }
      onUpdated?.();
      onClose();
    } catch (err) {
      showError(err, "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-lg p-6 text-black">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 cursor-pointer p-1 rounded-full hover:bg-gray-100"
        >
          <IoMdClose size={20} />
        </button>

        <h3 className="text-lg font-semibold text-center mb-4">
          Configurações da sala
        </h3>

        {loading ? (
          <p className="text-center text-gray-500 py-6">Carregando...</p>
        ) : (
          <div className="flex flex-col gap-5">
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Limite de jogadores
              </label>
              <input
                type="number"
                min={1}
                max={999}
                value={settings.PlayerLimit}
                onChange={handleLimitChange}
                className="w-full px-3 py-2 rounded-lg border outline-none focus:border-indigo-400 text-center font-semibold"
              />
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-600">
                Jogadores podem editar seu nome
              </span>
              <input
                type="checkbox"
                checked={settings.PlayersCanEditName}
                onChange={(e) => set("PlayersCanEditName", e.target.checked)}
                className="w-5 h-5 accent-indigo-600 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium text-gray-600">
                Jogadores podem editar seus pontos
              </span>
              <input
                type="checkbox"
                checked={settings.PlayersCanEditPoints}
                onChange={(e) => set("PlayersCanEditPoints", e.target.checked)}
                className="w-5 h-5 accent-indigo-600 cursor-pointer"
              />
            </label>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            type="button"
            className="cursor-pointer flex-1 px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            type="button"
            disabled={saving || loading}
            className="cursor-pointer flex-1 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
