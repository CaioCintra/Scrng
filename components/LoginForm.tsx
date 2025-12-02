"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobal } from "../context/GlobalContext";
import { authUser, createUser } from "@/app/service/login";

export default function LoginForm() {
  const router = useRouter();
  const { setUser, user } = useGlobal();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newPassConfirm, setNewPassConfirm] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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

  async function handleCreateUser() {
    setModalError(null);

    if (!newUser.trim()) {
      setModalError("Digite um nome de usuário");
      return;
    }
    if (!newPass.trim()) {
      setModalError("Digite uma senha");
      return;
    }
    if (newPass !== newPassConfirm) {
      setModalError("As senhas não coincidem");
      return;
    }

    setCreating(true);

    try {
      const res = await createUser(newUser, newPass);

      if (res?.error) {
        setModalError(res.error);
        return;
      }

      // Fechar o modal
      setShowModal(false);
      setNewUser("");
      setNewPass("");
      setNewPassConfirm("");
      setModalError(null);
    } catch (err: any) {
      setModalError(err.message || "Erro ao criar usuário");
    } finally {
      setCreating(false);
    }
  }

  if (user) return null;

  return (
    <div className="min-h-[calc(100vh-220px)] flex items-center justify-center p-6 text-neutral-800">
      <form
        onSubmit={handleSubmit}
        className="w-1/4 p-10 rounded-xl shadow-lg bg-linear-to-b from-white to-slate-50 flex flex-col gap-3"
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

        {/* Botão para abrir modal */}
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="cursor-pointer text-center text-sm text-indigo-600 hover:underline mt-2"
        >
          Criar novo usuário
        </button>
      </form>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-96 relative">
            <h2 className="text-xl font-semibold mb-4">Novo usuário</h2>

            <label className="flex flex-col gap-1 text-sm">
              Usuário
              <input
                className="px-3 py-2 rounded-lg border border-slate-300 outline-none"
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                placeholder="Nome de usuário"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm mt-3">
              Senha
              <input
                type="password"
                className="px-3 py-2 rounded-lg border border-slate-300 outline-none"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Senha"
              />
            </label>

            <label className="flex flex-col gap-1 text-sm mt-3">
              Confirmar senha
              <input
                type="password"
                className="px-3 py-2 rounded-lg border border-slate-300 outline-none"
                value={newPassConfirm}
                onChange={(e) => setNewPassConfirm(e.target.value)}
                placeholder="Repita a senha"
              />
            </label>

            {modalError && (
              <div className="text-sm text-red-600 mt-2">{modalError}</div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              >
                Cancelar
              </button>

              <button
                onClick={handleCreateUser}
                disabled={creating}
                className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
              >
                {creating ? "Criando..." : "Criar usuário"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
