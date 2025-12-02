"use client";

import { useGlobal } from "@/context/GlobalContext";
import Link from "next/link";

export default function Header() {
  const { user } = useGlobal();

  function handleLogout() {
    document.cookie = "scrng_user=; path=/; max-age=0";
    window.location.href = "/login";
  }

  return (
    <header className="w-full p-12 text-white relative flex justify-center">
      <Link href="/" className="text-6xl">
        Scrng
      </Link>

      {!!user && (
        <button
          onClick={handleLogout}
          className="absolute right-12 top-1/2 -translate-y-1/2 bg-indigo-600 px-8 py-2 rounded-full hover:bg-indigo-700 transition cursor-pointer"
        >
          Sair
        </button>
      )}
    </header>
  );
}
