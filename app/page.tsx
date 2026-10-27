"use client";

import { useGlobal } from "../context/GlobalContext";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getRooms, createRoom, deleteRoom } from "./service/rooms";
import { FiTrash2 } from "react-icons/fi";
import { IoMdAdd } from "react-icons/io";
import { SlOptionsVertical } from "react-icons/sl";
import DropdownMenu from "@/components/DropdownMenu";
import ConfirmModal from "@/components/ConfirmModal";
import FormError from "@/components/FormError";
import Modal from "@/components/Modal";
import Spinner, { Skeleton } from "@/components/Spinner";

type Room = { id: string; name: string; players?: { id: string }[] };

export default function Home() {
  const { user, showError, showSuccess } = useGlobal();

  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
  const [openingRoomId, setOpeningRoomId] = useState<string | null>(null);

  const userId = (user as { id?: string })?.id ?? (user as unknown as string);

  const fetchRooms = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await getRooms(userId);
      if (res?.error) {
        setLoadError(res.error);
        return;
      }
      setRooms(res ?? []);
    } catch (err) {
      setLoadError(String(err));
      showError(err, "Erro ao carregar salas");
    } finally {
      setLoading(false);
    }
  }, [userId, showError]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    fetchRooms();
  }, [router, user, fetchRooms]);

  function closeModal() {
    setShowModal(false);
    setRoomName("");
    setError(null);
  }

  async function handleCreateRoom(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!roomName.trim()) return setError("Digite o nome da sala.");

    setCreating(true);

    try {
      const res = await createRoom(userId, roomName.trim());
      if (res?.error) {
        setError(res.error);
        return;
      }

      await fetchRooms();
      closeModal();
      showSuccess("Sala criada!");
    } catch (err: unknown) {
      showError(err, "Erro ao criar sala");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteRoom() {
    if (!roomToDelete) return;
    try {
      const deleted = await deleteRoom(roomToDelete.id);
      if (deleted?.error) {
        showError(deleted.error);
        return false;
      }
      setRooms((prev) => prev.filter((r) => r.id !== roomToDelete.id));
      showSuccess("Sala removida.");
    } catch (err) {
      showError(err, "Erro ao remover sala");
      return false;
    }
  }

  if (!user) return null;

  return (
    <div className="w-full min-h-screen px-4 py-10 flex flex-col items-center gap-4">
      <p className="text-xl md:text-2xl font-semibold text-center">
        Escolha ou crie uma sala
      </p>

      {loading ? (
        <div className="w-full max-w-md mt-4 space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 md:h-20 bg-indigo-600/30" />
          ))}
        </div>
      ) : loadError ? (
        <div className="w-full max-w-md mt-4 rounded-lg bg-white/5 border border-white/10 p-6 text-center">
          <p className="text-sm md:text-base text-red-300">{loadError}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchRooms();
            }}
            className="cursor-pointer mt-4 px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 transition text-sm"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <ul className="w-full max-w-md mt-4 space-y-3 relative">
          {rooms.length === 0 && (
            <li className="text-center py-6 text-sm md:text-base text-gray-400">
              Você ainda não tem salas. Crie a primeira abaixo!
            </li>
          )}

          {rooms.map((room) => {
            const playerCount = room.players?.length ?? 0;
            return (
              <li
                key={room.id}
                onClick={() => {
                  setOpeningRoomId(room.id);
                  router.push(`/rooms/${room.id}`);
                }}
                className="animate-fade-in px-4 py-3 md:p-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-900/40 cursor-pointer flex justify-between items-center transition relative"
              >
                {/* espaço igual ao do menu para manter o nome centralizado */}
                <span className="w-10 md:w-12 flex justify-center">
                  {openingRoomId === room.id && <Spinner className="w-5 h-5" />}
                </span>

                <div className="flex-1 text-center min-w-0">
                  <h3 className="text-xl md:text-2xl font-semibold break-words">
                    {room.name}
                  </h3>
                  <p className="text-xs md:text-sm text-indigo-200">
                    {playerCount === 0
                      ? "Nenhum jogador"
                      : `${playerCount} ${playerCount === 1 ? "jogador" : "jogadores"}`}
                  </p>
                </div>

                <DropdownMenu
                  label={`Opções da sala ${room.name}`}
                  buttonClassName="cursor-pointer w-10 h-10 md:w-12 md:h-12 rounded-full hover:bg-indigo-800 flex items-center justify-center transition"
                  items={[
                    {
                      label: "Remover sala",
                      icon: <FiTrash2 />,
                      danger: true,
                      onClick: () => setRoomToDelete(room),
                    },
                  ]}
                >
                  <SlOptionsVertical className="text-lg md:text-xl" />
                </DropdownMenu>
              </li>
            );
          })}

          <li key="create-new-room">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="w-full p-3 md:p-4 mt-4 rounded-full bg-gray-400 hover:bg-gray-500 cursor-pointer transition flex items-center justify-center gap-2 text-xl md:text-2xl font-semibold"
            >
              <IoMdAdd />
              Criar nova sala
            </button>
          </li>
        </ul>
      )}

      <Modal
        open={showModal}
        onClose={closeModal}
        title="Criar nova sala"
        locked={creating}
      >
        <form onSubmit={handleCreateRoom}>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            Nome da sala
            <input
              className="px-3 py-2 rounded-lg border border-slate-300 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Ex: Campeonato de Exemplo"
              maxLength={60}
              autoFocus
            />
          </label>

          <div className="mt-3">
            <FormError message={error} />
          </div>

          <div className="flex gap-3 mt-4">
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
              className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 transition flex items-center justify-center gap-2"
            >
              {creating && <Spinner />}
              {creating ? "Criando..." : "Criar sala"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={!!roomToDelete}
        title="Remover sala?"
        message={
          <>
            A sala <strong>{roomToDelete?.name}</strong> e todos os seus
            jogadores serão removidos. Essa ação não pode ser desfeita.
          </>
        }
        confirmLabel="Remover sala"
        onConfirm={handleDeleteRoom}
        onClose={() => setRoomToDelete(null)}
      />
    </div>
  );
}
