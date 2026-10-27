"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { translateError } from "@/app/service/errors";

export type ToastType = "error" | "success";
export type ToastDetail = { type: ToastType; message: string };

function dispatchToast(detail: ToastDetail) {
	window.dispatchEvent(new CustomEvent<ToastDetail>("scrng:toast", { detail }));
}

type GlobalContextType = {
	user: unknown | undefined;
	setUser: (u: unknown) => void;
	showError: (error: unknown, fallback?: string) => void;
	showSuccess: (message: string) => void;
};

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children, initialUser }: { children: React.ReactNode; initialUser?: unknown }) {
	const [user, _setUser] = useState<unknown | undefined>(initialUser);

	const showError = useCallback((error: unknown, fallback = "Ocorreu um erro") => {
		const message =
			typeof error === "string"
				? error
				: error && typeof error === "object" && ("error" in error || "message" in error)
					? String("error" in error ? error.error : error.message)
					: error instanceof Error
						? error.message
						: fallback;
		dispatchToast({ type: "error", message: translateError(message) });
	}, []);

	const showSuccess = useCallback((message: string) => {
		dispatchToast({ type: "success", message });
	}, []);

	const setUser = (u: unknown) => {
		_setUser(u);
		try {
			if (typeof document !== "undefined") {
				const name = "scrng_user";
				if (u === undefined || u === null) {
					document.cookie = `${name}=; path=/; Max-Age=0`;
				} else {
					const str = encodeURIComponent(JSON.stringify(u));
					document.cookie = `${name}=${str}; path=/; Max-Age=${60 * 60 * 24 * 7}`;
				}
			}
		} catch {
			// ignore cookie errors
		}
	};

	return <GlobalContext.Provider value={{ user, setUser, showError, showSuccess }}>{children}</GlobalContext.Provider>;
}

export function useGlobal() {
	const ctx = useContext(GlobalContext);
	if (!ctx) throw new Error("useGlobal must be used within GlobalProvider");
	return ctx;
}

