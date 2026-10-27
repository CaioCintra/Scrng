"use client";

import React, { useEffect, useState } from "react";
import { getRoomSettings, updateRoomSettings } from "@/app/service/rooms";
import { useGlobal } from "@/context/GlobalContext";
import FormError from "./FormError";
import Modal from "./Modal";
import Spinner, { Skeleton } from "./Spinner";
import Switch from "./Switch";

const NUMBER_INPUT_CLASS =
  "py-2 rounded-lg border border-gray-300 outline-none text-center font-semibold transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

type RoomSettings = {
  PlayerLimit: number;
  PlayersCanEditPoints: boolean;
  PlayersCanEditName: boolean;
  EmojisEnabled: boolean;
  EmojiLimit: number;
  EmojiCooldown: number;
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
  EmojisEnabled: false,
  EmojiLimit: 10,
  EmojiCooldown: 5,
};

export default function EditRoomModal({
  open,
  roomId,
  onClose,
  onUpdated,
}: EditRoomModalProps) {
  const [settings, setSettings] = useState<RoomSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError, showSuccess } = useGlobal();

  useEffect(() => {
    if (!open || !roomId) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getRoomSettings(roomId);
        if (res?.error) {
          setError(res.error);
        } else {
          setSettings({
            PlayerLimit: res.PlayerLimit ?? DEFAULT_SETTINGS.PlayerLimit,
            PlayersCanEditPoints:
              res.PlayersCanEditPoints ?? DEFAULT_SETTINGS.PlayersCanEditPoints,
            PlayersCanEditName:
              res.PlayersCanEditName ?? DEFAULT_SETTINGS.PlayersCanEditName,
            EmojisEnabled: res.EmojisEnabled ?? DEFAULT_SETTINGS.EmojisEnabled,
            EmojiLimit: res.EmojiLimit ?? DEFAULT_SETTINGS.EmojiLimit,
            EmojiCooldown: res.EmojiCooldown ?? DEFAULT_SETTINGS.EmojiCooldown,
          });
        }
      } catch (err) {
        showError(err, "Erro ao carregar configurações");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, roomId, showError]);

  const set = <K extends keyof RoomSettings>(key: K, value: RoomSettings[K]) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const handleNumberChange =
    (key: "PlayerLimit" | "EmojiLimit" | "EmojiCooldown", max: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = Number(e.target.value);
      if (isNaN(value)) value = 1;
      if (value < 1) value = 1;
      if (value > max) value = max;
      set(key, value);
    };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await updateRoomSettings(roomId, settings);
      if (res?.error) {
        setError(res.error);
        return;
      }
      onUpdated?.();
      onClose();
      showSuccess("Configurações salvas!");
    } catch (err) {
      showError(err, "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurações da sala"
      locked={saving}
    >
      {loading ? (
        <div className="flex flex-col gap-5" aria-busy="true">
          <Skeleton className="h-16" />
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <FormError message={error} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Limite de jogadores
            </label>
            <input
              type="number"
              min={1}
              max={999}
              value={settings.PlayerLimit}
              onChange={handleNumberChange("PlayerLimit", 999)}
              className={`w-full px-3 ${NUMBER_INPUT_CLASS}`}
            />
          </div>

          <Switch
            label="Jogadores podem editar seu nome"
            checked={settings.PlayersCanEditName}
            onChange={(checked) => set("PlayersCanEditName", checked)}
          />

          <Switch
            label="Jogadores podem editar seus pontos"
            checked={settings.PlayersCanEditPoints}
            onChange={(checked) => set("PlayersCanEditPoints", checked)}
          />

          <Switch
            label="Jogadores podem enviar emojis"
            description="As reações aparecem na tela da sala."
            checked={settings.EmojisEnabled}
            onChange={(checked) => set("EmojisEnabled", checked)}
          />

          {settings.EmojisEnabled && (
            <div className="animate-fade-in rounded-lg bg-gray-50 border border-gray-100 p-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite de emojis por jogador
              </label>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={settings.EmojiLimit}
                  onChange={handleNumberChange("EmojiLimit", 999)}
                  aria-label="Quantidade de emojis"
                  className={`w-16 px-1 bg-white ${NUMBER_INPUT_CLASS}`}
                />
                <span>{settings.EmojiLimit === 1 ? "emoji" : "emojis"} a cada</span>
                <input
                  type="number"
                  min={1}
                  max={3600}
                  value={settings.EmojiCooldown}
                  onChange={handleNumberChange("EmojiCooldown", 3600)}
                  aria-label="Intervalo em segundos"
                  className={`w-16 px-1 bg-white ${NUMBER_INPUT_CLASS}`}
                />
                <span>{settings.EmojiCooldown === 1 ? "segundo" : "segundos"}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <button
          onClick={onClose}
          type="button"
          disabled={saving}
          className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          type="button"
          disabled={saving || loading}
          className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <Spinner />}
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </Modal>
  );
}
