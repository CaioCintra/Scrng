/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useGlobal } from "../context/GlobalContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getRooms } from "./service/rooms";

export default function Home() {
  const { user } = useGlobal();

  const router = useRouter();
  const [rooms, setRooms] = useState<unknown[]>([]);

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
        setRooms((res as unknown[]) ?? []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchRooms();
  }, [router, user]);

  if (!user) {
    return null;
  } else {
    return (
      <div className="w-full h-full p-10 items-center justify-center flex flex-col gap-4">
        <p className="text-6xl self-center">Scrng</p>
        <p className="text-2xl self-center">Escolha ou crie uma sala</p>
        {rooms.length === 0 ? (
          <p className="text-center mt-4">Nenhuma sala encontrada.</p>
        ) : (
          <ul className="w-full max-w-md mt-4 space-y-2">
            {rooms.map((room: any) => (
              <li
                key={room.id}
                className="p-4 border rounded-lg bg-indigo-600 hover:bg-indigo-700 cursor-pointer transition"
                onClick={() => router.push(`/rooms/${room.id}`)}
              >
                <h3 className="text-3xl font-semibold">{room.name}</h3>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}
