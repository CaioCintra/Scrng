/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useGlobal } from "../context/GlobalContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRooms, createRoom, deleteRoom } from "./service/rooms";

export default function Home() {
  const { user } = useGlobal();

  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>([]);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openTooltip, setOpenTooltip] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchRooms = async () => {
      try {
        const userId =
          (user as { id?: string })?.id ?? (user as unknown as string);
        const res = await getRooms(userId);
        if (res?.error) {
          console.error("Failed to load rooms:", res.error);
          return;
        }
        setRooms(res ?? []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRooms();
  }, [router, user]);

  async function handleCreateRoom() {
    setError(null);

    if (!roomName.trim()) {
      setError("Digite o nome da sala");
      return;
    }

    setCreating(true);

    try {
      const userId =
        (user as { id?: string })?.id ?? (user as unknown as string);

      const res = await createRoom(userId, roomName);

      if (res?.error) {
        setError(res.error);
        return;
      }

      // Atualizar lista
      const updated = await getRooms(userId);
      setRooms(updated ?? []);

      // Fechar modal
      setShowModal(false);
      setRoomName("");
    } catch (err: any) {
      setError(err.message || "Erro ao criar sala");
    } finally {
      setCreating(false);
    }
  }

  if (!user) return null;

  return (
    <div className="w-full h-full p-10 items-center justify-center flex flex-col gap-4">
      <p className="text-2xl self-center">Escolha ou crie uma sala</p>

      {rooms.length === 0 ? (
        <p className="text-center mt-4">Nenhuma sala encontrada.</p>
      ) : (
        <ul className="w-full max-w-md mt-4 space-y-2 relative">
          {rooms.map((room) => (
            <li
              key={room.id}
              className="p-4 mt-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition flex justify-between items-center relative"
            >
              {/* Nome da sala */}
              <h3
                className="text-3xl font-semibold text-center flex-1"
                onClick={() => router.push(`/rooms/${room.id}`)}
              >
                {room.name}
              </h3>

              {/* Ícone de opções */}
              <button
                onClick={(e) => {
                  e.stopPropagation(); // evita abrir a sala ao clicar no ícone
                  setOpenTooltip((prev) => (prev === room.id ? null : room.id));
                }}
                className="cursor-pointer w-12 h-12 text-4xl relative p-2 rounded-full hover:bg-indigo-800 transition flex items-center justify-center"
              >
                ⋮
              </button>

              {/* Tooltip */}
              {openTooltip === room.id && (
                <div className="absolute right-0 top-14 bg-white text-black shadow-lg rounded-lg p-3 w-40 z-10 flex flex-col gap-2">
                  {/* <button
                    className="text-left px-2 py-1 rounded hover:bg-gray-100 cursor-pointer"
                    onClick={() => {
                      setOpenTooltip(null);
                      // abra aqui o modal de editar sala
                    }}
                  >
                    Editar sala
                  </button> */}

                  <button
                    className="text-left px-2 py-1 rounded hover:bg-gray-100 cursor-pointer text-red-600"
                    onClick={async () => {
                      setOpenTooltip(null);
                      deleteRoom(room.id);
                      const userId =
                        (user as { id?: string })?.id ??
                        (user as unknown as string);
                      const updated = await getRooms(userId);
                      setRooms(updated ?? []);
                    }}
                  >
                    Remover sala
                  </button>
                </div>
              )}
            </li>
          ))}

          {/* Criar nova sala */}
          <li
            key="create-new-room"
            onClick={() => setShowModal(true)}
            className="p-2 m-5 rounded-full bg-gray-400 hover:bg-gray-500 cursor-pointer transition"
          >
            <h3 className="text-3xl font-semibold text-center">
              Criar nova sala
            </h3>
          </li>
        </ul>
      )}

      {/* ---------------- Modal ---------------- */}
      {showModal && (
        <div className="fixed inset-0 text-black bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-xl w-96 relative">
            <h2 className="text-xl font-semibold mb-4">Criar nova sala</h2>

            <label className="flex flex-col gap-1 text-sm">
              Nome da sala
              <input
                className="px-3 py-2 rounded-lg border border-slate-300 outline-none"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Ex: Campeonato de Exemplo"
              />
            </label>

            {error && <div className="text-sm text-red-600 mt-2">{error}</div>}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              >
                Cancelar
              </button>

              <button
                onClick={handleCreateRoom}
                disabled={creating}
                className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {creating ? "Criando..." : "Criar sala"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
