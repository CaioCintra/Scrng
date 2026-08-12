"use client";

import React, { useState } from "react";
import { IoMdClose } from "react-icons/io";

type QrCodeModalProps = {
  open: boolean;
  url: string;
  playerName?: string;
  onClose: () => void;
};

export default function QrCodeModal({
  open,
  url,
  playerName,
  onClose,
}: QrCodeModalProps) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    url,
  )}`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-sm bg-white rounded-xl shadow-lg p-6 text-black">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 cursor-pointer p-1 rounded-full hover:bg-gray-100"
        >
          <IoMdClose size={20} />
        </button>

        <h3 className="text-lg font-semibold text-center mb-3">
          Acesso remoto{playerName ? ` de ${playerName}` : ""}
        </h3>

        <div className="flex justify-center mb-5">
          <img
            src={qrSrc}
            alt="QR Code de acesso remoto"
            width={220}
            height={220}
            className="p-2 rounded-lg border-2 border-gray-200"
          />
        </div>

                <div className="flex justify-center">
          <button
            type="button"
            onClick={handleCopyUrl}
            className="w-1/2 mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 text-center break-all transition hover:bg-slate-100"
          >
            {copied ? "URL copiada!" : "Copiar URL"}
          </button>
        </div>

        <button
          onClick={onClose}
          className="cursor-pointer w-full px-4 py-2 rounded bg-slate-200 hover:bg-slate-300 transition"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
