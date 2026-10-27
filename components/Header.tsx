"use client";

import { useGlobal } from "@/context/GlobalContext";
import Link from "next/link";
import { FiLogOut } from "react-icons/fi";

export default function Header() {
  const { user } = useGlobal();

  function handleLogout() {
    document.cookie = "scrng_user=; path=/; max-age=0";
    window.location.href = "/login";
  }

  return (
    <header className="w-full p-6 md:p-12 text-white relative flex justify-center items-center">
      <Link
        href="/"
        className="text-4xl md:text-6xl font-bold tracking-tight hover:opacity-90 transition"
      >
        Scrng
      </Link>

      {!!user && (
        <button
          onClick={handleLogout}
          className="
            absolute 
            right-4 md:right-12 
            top-1/2 
            -translate-y-1/2
            flex items-center gap-2
            bg-indigo-600
            px-4 py-2 md:px-8 md:py-2 
            shadow-md shadow-black/30
            text-sm md:text-base
            rounded-full 
            hover:bg-indigo-700 
            transition 
            cursor-pointer
          "
        >
          <FiLogOut className="hidden sm:block" />
          Sair
        </button>
      )}
    </header>
  );
}
