"use client";

import React, { useEffect, useRef, useState } from "react";

export type DropdownItem = {
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  onClick: () => void;
};

type DropdownMenuProps = {
  items: DropdownItem[];
  label: string;
  buttonClassName: string;
  children: React.ReactNode;
};

export default function DropdownMenu({
  items,
  label,
  buttonClassName,
  children,
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className={buttonClassName}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {children}
      </button>

      {open && (
        <div
          role="menu"
          className="animate-pop-in absolute right-0 top-full mt-2 min-w-44 bg-white text-gray-800 shadow-lg border border-gray-100 rounded-lg py-1.5 z-50"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                item.onClick();
              }}
              className={`w-full flex items-center gap-2.5 text-left text-sm px-4 py-2 cursor-pointer transition ${
                item.danger
                  ? "text-red-600 hover:bg-red-50"
                  : "hover:bg-gray-100"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
