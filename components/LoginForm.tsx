"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobal } from "../context/GlobalContext";
import { authUser, createUser } from "@/app/service/login";
import { translateError } from "@/app/service/errors";
import { FiEye, FiEyeOff } from "react-icons/fi";
import FormError from "./FormError";
import Modal from "./Modal";
import Spinner from "./Spinner";

const INPUT_CLASS =
  "w-full px-3 py-2 rounded-lg border border-slate-300 outline-none text-sm transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        className={`${INPUT_CLASS} pr-10`}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded text-gray-400 hover:text-gray-700 transition"
        aria-label={visible ? "Esconder senha" : "Mostrar senha"}
      >
        {visible ? <FiEyeOff size={16} /> : <FiEye size={16} />}
      </button>
    </div>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const { setUser, user, showError, showSuccess } = useGlobal();
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
      const response = await authUser(login.trim(), password);

      if (response?.error) {
        setError(response.error);
        return;
      }

      const user = response?.user ?? response;
      setUser(user);
      router.push("/");
    } catch (err: unknown) {
      setError(translateError(err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  }

  function closeModal() {
    setShowModal(false);
    setNewUser("");
    setNewPass("");
    setNewPassConfirm("");
    setModalError(null);
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    setModalError(null);

    if (!newUser.trim()) return setModalError("Digite um nome de usuário.");
    if (!newPass.trim()) return setModalError("Digite uma senha.");
    if (newPass !== newPassConfirm)
      return setModalError("As senhas não coincidem.");

    setCreating(true);

    try {
      const res = await createUser(newUser.trim(), newPass);

      if (res?.error) {
        setModalError(res.error);
        return;
      }

      // já deixa o login preenchido com o usuário recém-criado
      setLogin(newUser.trim());
      setPassword("");
      closeModal();
      showSuccess("Usuário criado! Agora é só entrar.");
    } catch (err: unknown) {
      showError(err, "Erro ao criar usuário");
    } finally {
      setCreating(false);
    }
  }

  if (user) return null;

  return (
    <div className="min-h-[calc(100vh-144px)] flex items-center justify-center p-4 text-neutral-800">
      <form
        onSubmit={handleSubmit}
        className="animate-pop-in w-full max-w-sm p-8 rounded-xl shadow-lg bg-gradient-to-b from-white to-slate-50 flex flex-col gap-3"
      >
        <div className="mb-3">
          <h2 className="m-0 text-3xl font-semibold">Entrar</h2>
          <p className="text-sm text-gray-500 mt-1">
            Acesse suas salas e placares.
          </p>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          Login
          <input
            className={INPUT_CLASS}
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="Seu usuário"
            autoComplete="username"
            autoFocus
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          Senha
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="Sua senha"
            autoComplete="current-password"
            required
          />
        </label>

        <FormError message={error} />

        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer mt-2 px-3 py-2.5 rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-60 hover:bg-indigo-700 transition flex items-center justify-center gap-2"
        >
          {loading && <Spinner />}
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="cursor-pointer text-center text-sm text-indigo-600 hover:underline mt-2"
        >
          Não tem conta? Criar novo usuário
        </button>
      </form>

      {/* Modal Criar Usuário */}
      <Modal
        open={showModal}
        onClose={closeModal}
        title="Novo usuário"
        locked={creating}
        className="max-w-md"
      >
        <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Usuário
            <input
              className={INPUT_CLASS}
              value={newUser}
              onChange={(e) => setNewUser(e.target.value)}
              placeholder="Nome de usuário"
              autoComplete="username"
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Senha
            <PasswordInput
              value={newPass}
              onChange={setNewPass}
              placeholder="Crie uma senha"
              autoComplete="new-password"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Confirmar senha
            <PasswordInput
              value={newPassConfirm}
              onChange={setNewPassConfirm}
              placeholder="Repita a senha"
              autoComplete="new-password"
            />
          </label>

          <FormError message={modalError} />

          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={closeModal}
              disabled={creating}
              className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={creating}
              className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {creating && <Spinner />}
              {creating ? "Criando..." : "Criar usuário"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
