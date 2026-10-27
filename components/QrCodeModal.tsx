"use client";

import React, { useState } from "react";
import { FiCheck, FiCopy, FiExternalLink } from "react-icons/fi";
import Modal from "./Modal";
import { Skeleton } from "./Spinner";

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
  const [qrLoaded, setQrLoaded] = useState(false);

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
    <Modal
      open={open}
      onClose={onClose}
      title={`Acesso remoto${playerName ? ` de ${playerName}` : ""}`}
    >
      <p className="text-sm text-gray-500 text-center -mt-2 mb-4">
        Aponte a câmera do celular para o código para abrir o placar do jogador.
      </p>

      <div className="flex justify-center mb-5">
        <div className="relative w-[236px] h-[236px] p-2 rounded-lg border-2 border-gray-200">
          {!qrLoaded && <Skeleton className="absolute inset-2" />}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={qrSrc}
            alt="QR Code de acesso remoto"
            width={220}
            height={220}
            onLoad={() => setQrLoaded(true)}
            className={`transition-opacity ${qrLoaded ? "opacity-100" : "opacity-0"}`}
          />
        </div>
      </div>

      <div className="flex justify-center gap-2 mb-4">
        <button
          type="button"
          onClick={handleCopyUrl}
          className={`cursor-pointer flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
            copied
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
          }`}
        >
          {copied ? <FiCheck /> : <FiCopy />}
          {copied ? "URL copiada!" : "Copiar URL"}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
        >
          <FiExternalLink />
          Abrir
        </a>
      </div>

      <button
        onClick={onClose}
        className="cursor-pointer w-full px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition"
      >
        Fechar
      </button>
    </Modal>
  );
}
