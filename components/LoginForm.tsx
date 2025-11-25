"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobal } from "../context/GlobalContext";
import { authUser } from "@/app/service/login";

export default function LoginForm() {
  const router = useRouter();
  const { setUser, user } = useGlobal();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [router, user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await authUser(login, password);

      if (response?.error) {
        setError(response.error);
        return;
      }

      const user = response?.user ?? response;
      setUser(user);
      router.push("/");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : String(err ?? "Erro ao logar");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return null;
  }else
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-neutral-800">
      <form
        onSubmit={handleSubmit}
        className="w-1/4 p-10 rounded-xl shadow-lg bg-linear-to-b from-white to-slate-50 flex flex-col gap-3 "
      >
        <h2 className="m-0 mb-3 text-3xl font-semibold">Entrar</h2>

        <label className="flex flex-col gap-2 text-sm">
          Login
          <input
            className="mt-1 px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="Seu usuário"
            required
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          Senha
          <input
            className="mt-1 px-3 py-2 rounded-lg border border-slate-200 outline-none text-sm"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha"
            required
          />
        </label>

        {error && <div className="text-sm text-red-600 mt-1">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 px-3 py-2 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-60 hover:bg-indigo-700 transition"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
