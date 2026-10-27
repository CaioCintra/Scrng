"use client";

import React, { useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import Modal from "./Modal";
import Spinner from "./Spinner";

type EditProfileModalProps = {
  open: boolean;
  currentName: string;
  currentAvatar?: string;
  canEditName?: boolean;
  onClose: () => void;
  // retorna false quando não conseguiu salvar, mantendo o modal aberto
  onSave: (data: { name: string; avatar: string }) => Promise<boolean | void> | boolean | void;
};

const AVATAR_STYLE = "adventurer";

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(
    seed,
  )}`;
}

function randomSeed() {
  return Math.random().toString(36).slice(2, 10);
}

export default function EditProfileModal({
  open,
  currentName,
  currentAvatar,
  canEditName = true,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(currentName);
  const [seed, setSeed] = useState(currentAvatar || randomSeed());
  const [options, setOptions] = useState<string[]>(() => {
    const base = currentAvatar ? [currentAvatar] : [];
    while (base.length < 6) base.push(randomSeed());
    return base;
  });
  const [saving, setSaving] = useState(false);

  const regenerate = () => {
    setOptions(Array.from({ length: 6 }, () => randomSeed()));
  };

  const handleSave = async () => {
    const finalName = canEditName ? name.trim() : currentName;
    if (!finalName) return;
    setSaving(true);
    try {
      const ok = await onSave({ name: finalName, avatar: seed });
      if (ok !== false) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Editar perfil" locked={saving}>
      <div className="flex justify-center mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={seed}
          src={avatarUrl(seed)}
          alt="Avatar selecionado"
          className="animate-pop-in w-24 h-24 rounded-full border-2 border-indigo-100 bg-indigo-50"
        />
      </div>

      <label className="block text-sm font-medium text-gray-700 mb-1">
        Nome
      </label>
      <input
        type="text"
        value={canEditName ? name : currentName}
        onChange={(e) => canEditName && setName(e.target.value)}
        disabled={!canEditName}
        className={`w-full px-3 py-2 rounded-lg border border-gray-300 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 ${
          !canEditName ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
        }`}
        maxLength={40}
      />
      {!canEditName ? (
        <p className="text-xs text-gray-400 mt-1 mb-4">
          A edição do nome foi desativada pelo dono da sala.
        </p>
      ) : (
        <div className="mb-4" />
      )}

      <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
          Escolha um avatar
        </label>
        <button
          onClick={regenerate}
          type="button"
          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 cursor-pointer transition"
        >
          <FiRefreshCw size={12} />
          Gerar novos
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {options.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSeed(s)}
            aria-pressed={seed === s}
            className={`rounded-full p-1 border-2 transition cursor-pointer hover:scale-105 ${
              seed === s
                ? "border-indigo-500 bg-indigo-50"
                : "border-transparent hover:border-indigo-200"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={avatarUrl(s)}
              alt="Opção de avatar"
              className="w-full aspect-square rounded-full bg-gray-50"
            />
          </button>
        ))}
      </div>

      <div className="flex gap-3">
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
          disabled={saving || (canEditName && !name.trim())}
          className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving && <Spinner />}
          {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </Modal>
  );
}
