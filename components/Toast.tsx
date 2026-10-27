"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiX } from "react-icons/fi";
import type { ToastDetail } from "@/context/GlobalContext";

type ToastItem = ToastDetail & { id: number };

// tempo que cada aviso fica na tela (ms)
const DURATION = { error: 5000, success: 2500 };

const STYLES = {
  error: {
    box: "border-red-200 bg-red-50 text-red-800",
    icon: "text-red-500",
    close: "text-red-500 hover:bg-red-100 hover:text-red-800",
  },
  success: {
    box: "border-green-200 bg-green-50 text-green-800",
    icon: "text-green-600",
    close: "text-green-600 hover:bg-green-100 hover:text-green-800",
  },
};

export default function Toast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastDetail>).detail;
      const id = nextId.current++;
      setToasts((prev) => [
        // evita empilhar a mesma mensagem repetida
        ...prev.filter((t) => t.message !== detail.message).slice(-2),
        { ...detail, id },
      ]);
      setTimeout(() => dismiss(id), DURATION[detail.type]);
    };

    window.addEventListener("scrng:toast", handleToast);
    return () => window.removeEventListener("scrng:toast", handleToast);
  }, [dismiss]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 top-4 z-[200] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => {
        const style = STYLES[t.type];
        const Icon = t.type === "error" ? FiAlertCircle : FiCheckCircle;
        return (
          <div
            key={t.id}
            role={t.type === "error" ? "alert" : "status"}
            className={`animate-toast-in flex items-start gap-3 rounded-xl border p-4 shadow-lg ${style.box}`}
          >
            <Icon className={`mt-0.5 shrink-0 ${style.icon}`} size={18} />
            <p className="flex-1 text-sm font-medium">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className={`-m-1 cursor-pointer rounded-full p-1 transition ${style.close}`}
              aria-label="Fechar aviso"
            >
              <FiX size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
