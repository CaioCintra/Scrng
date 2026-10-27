"use client";

import React, { useState } from "react";
import Modal from "./Modal";
import Spinner from "./Spinner";

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => Promise<boolean | void> | boolean | void;
  onClose: () => void;
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      // onConfirm retorna false quando a ação falhou e o modal deve continuar aberto
      const ok = await onConfirm();
      if (ok !== false) onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} locked={busy}>
      <p className="text-sm text-gray-600 text-center">{message}</p>

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onClose}
          disabled={busy}
          className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={busy}
          autoFocus
          className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {busy && <Spinner />}
          {busy ? "Removendo..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
