"use client";

import { addPlayer } from "@/app/service/rooms";
import { useState } from "react";
import { IoMdAdd } from "react-icons/io";
import { useGlobal } from "@/context/GlobalContext";
import FormError from "./FormError";
import Modal from "./Modal";
import Spinner from "./Spinner";

export default function PlayerAdd({
  roomId,
  onUpdated,
}: {
  roomId: undefined | string;
  onUpdated: () => void;
}) {
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showError, showSuccess } = useGlobal();

  const close = () => {
    setAdding(false);
    setName("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const playerName = name.trim();
    if (!playerName) return setError("Digite o nome do jogador.");

    setSaving(true);
    setError(null);
    try {
      const res = await addPlayer(roomId, playerName);
      if (res?.error) {
        setError(res.error);
        return;
      }
      onUpdated();
      showSuccess(`${playerName} entrou na sala!`);
      // mantém o modal aberto para adicionar vários jogadores em sequência
      setName("");
    } catch (err) {
      showError(err, "Erro ao adicionar jogador");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setAdding(true)}
        className="mt-4 px-4 w-16 h-16 shadow shadow-black fixed bottom-10 right-10 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition text-2xl hover:text-4xl items-center justify-center flex hover:-translate-y-1 hover:scale-110 cursor-pointer"
        aria-label="Adicionar jogador"
        title="Adicionar jogador"
      >
        <IoMdAdd />
      </button>

      <Modal open={adding} onClose={close} title="Adicionar jogador" locked={saving}>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            placeholder="Nome do jogador"
            maxLength={40}
            autoFocus
          />

          <div className="mt-3">
            <FormError message={error} />
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={close}
              disabled={saving}
              className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition disabled:opacity-50"
            >
              Fechar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Spinner />}
              {saving ? "Adicionando..." : "Adicionar"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
