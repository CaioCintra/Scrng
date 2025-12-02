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
        if (res?.error)
          return console.error("Failed to load rooms:", res.error);

        setRooms(res ?? []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRooms();
  }, [router, user]);

  async function handleCreateRoom() {
    setError(null);

    if (!roomName.trim()) return setError("Digite o nome da sala");

    setCreating(true);

    try {
      const userId =
        (user as { id?: string })?.id ?? (user as unknown as string);

      const res = await createRoom(userId, roomName);
      if (res?.error) return setError(res.error);

      const updated = await getRooms(userId);
      setRooms(updated ?? []);

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
    <div className="w-full min-h-screen px-4 py-10 flex flex-col items-center gap-4">
      <p className="text-xl md:text-2xl font-semibold text-center">
        Escolha ou crie uma sala
      </p>

      {rooms.length === 0 ? (
        <p className="text-center mt-4 text-sm md:text-base">
          Nenhuma sala encontrada.
        </p>
      ) : (
        <ul className="w-full max-w-md mt-4 space-y-3 relative">
          {rooms.map((room) => (
            <li
              key={room.id}
              className="px-4 py-3 md:p-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 cursor-pointer flex justify-between items-center transition relative"
            >
              <h3
                className="text-xl md:text-2xl font-semibold flex-1 text-center"
                onClick={() => router.push(`/rooms/${room.id}`)}
              >
                {room.name}
              </h3>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenTooltip((prev) => (prev === room.id ? null : room.id));
                }}
                className="w-10 h-10 md:w-12 md:h-12 text-2xl md:text-3xl rounded-full hover:bg-indigo-800 flex items-center justify-center transition"
              >
                ⋮
              </button>

              {openTooltip === room.id && (
                <div className="absolute right-2 top-14 bg-white text-black shadow-lg rounded-lg p-3 w-36 md:w-40 z-10 flex flex-col gap-2">
                  <button
                    className="text-left px-2 py-1 rounded hover:bg-gray-100 cursor-pointer text-red-600"
                    onClick={async () => {
                      setOpenTooltip(null);
                      await deleteRoom(room.id);
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

          <li
            key="create-new-room"
            onClick={() => setShowModal(true)}
            className="p-3 md:p-4 mt-4 rounded-full bg-gray-400 hover:bg-gray-500 cursor-pointer transition"
          >
            <h3 className="text-xl md:text-2xl font-semibold text-center">
              Criar nova sala
            </h3>
          </li>
        </ul>
      )}

      {showModal && (
        <div className="fixed inset-0 text-black bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl w-full max-w-sm relative">
            <h2 className="text-lg md:text-xl font-semibold mb-4">
              Criar nova sala
            </h2>

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
                className="flex-1 px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
              >
                Cancelar
              </button>

              <button
                onClick={handleCreateRoom}
                disabled={creating}
                className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition"
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
