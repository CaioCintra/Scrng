"use client";

import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

type EditProfileModalProps = {
  open: boolean;
  currentName: string;
  currentAvatar?: string;
  canEditName?: boolean;
  onClose: () => void;
  onSave: (data: { name: string; avatar: string }) => Promise<void> | void;
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

  if (!open) return null;

  const regenerate = () => {
    setOptions(Array.from({ length: 6 }, () => randomSeed()));
  };

  const handleSave = async () => {
    const finalName = canEditName ? name.trim() : currentName;
    if (!finalName) return;
    setSaving(true);
    try {
      await onSave({ name: finalName, avatar: seed });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-lg p-6 text-black max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 cursor-pointer p-1 rounded-full hover:bg-gray-100"
        >
          <IoMdClose size={20} />
        </button>

        <h3 className="text-lg font-semibold text-center mb-4">
          Editar perfil
        </h3>

        <div className="flex justify-center mb-4">
          <img
            src={avatarUrl(seed)}
            alt="Avatar selecionado"
            className="w-24 h-24 rounded-full border bg-gray-50"
          />
        </div>

        <label className="block text-sm font-medium text-gray-600 mb-1">
          Nome
        </label>
        <input
          type="text"
          value={canEditName ? name : currentName}
          onChange={(e) => canEditName && setName(e.target.value)}
          disabled={!canEditName}
          className={`w-full px-3 py-2 rounded-lg border outline-none focus:border-indigo-400 ${
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
          <label className="block text-sm font-medium text-gray-600">
            Escolha um avatar
          </label>
          <button
            onClick={regenerate}
            type="button"
            className="text-xs text-indigo-600 hover:underline cursor-pointer"
          >
            Gerar novos
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {options.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSeed(s)}
              className={`rounded-full p-1 border-2 transition cursor-pointer ${
                seed === s ? "border-indigo-500" : "border-transparent"
              }`}
            >
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
            className="cursor-pointer flex-1 px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            type="button"
            disabled={saving || (canEditName && !name.trim())}
            className="cursor-pointer flex-1 px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
