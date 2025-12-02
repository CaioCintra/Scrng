"use client";

import { addPlayer } from "@/app/service/rooms";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { IoMdAdd } from "react-icons/io";

export default function PlayerAdd({
  roomId,
  onUpdated,
}: {
  roomId: undefined | string;
  onUpdated: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);

  return (
    <>
      <button
        onClick={async () => {
          setAdding(true);
        }}
        className="mt-4 px-4 w-16 h-16 shadow shadow-black fixed bottom-10 right-10 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition text-2xl hover:text-4xl items-center justify-center flex hover:-translate-y-1 hover:scale-110 cursor-pointer"
      >
        <IoMdAdd />
      </button>
      {adding && (
        <div className="fixed inset-0 text-black bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h2 className="text-2xl font-semibold mb-4">Adicionar Jogador</h2>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded mb-4"
              placeholder="Nome do jogador"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAdding(false)}
                className="cursor-pointer px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
              >
                Cancelar
              </button>

              <button
                onClick={async () => {
                  if (name.trim() === "") return;
                  await addPlayer(roomId, name.trim());
                  setAdding(false);
                  setName("");
                  onUpdated();
                  router.refresh();
                }}
                className="cursor-pointer px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
