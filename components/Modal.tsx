"use client";

import React, { useEffect, useRef } from "react";
import { IoMdClose } from "react-icons/io";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  // impede fechar enquanto uma ação está em andamento
  locked?: boolean;
  className?: string;
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  locked = false,
  className = "max-w-sm",
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !locked) onClose();
    };
    document.addEventListener("keydown", handleKey);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, locked, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onMouseDown={(e) => {
        if (e.target === overlayRef.current && !locked) onClose();
      }}
      className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`animate-pop-in relative w-full ${className} max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-xl p-6 text-black`}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={locked}
          className="absolute top-3 right-3 cursor-pointer p-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition disabled:opacity-40"
          aria-label="Fechar"
        >
          <IoMdClose size={20} />
        </button>

        {title && (
          <h3 className="text-lg font-semibold text-center mb-4 px-6">
            {title}
          </h3>
        )}

        {children}
      </div>
    </div>
  );
}
