"use client";

import React, { useEffect, useRef, useState } from "react";
import { Poppins } from "next/font/google";
import { LuCheck, LuTrophy } from "react-icons/lu";
import Modal from "./Modal";

const font = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

type RafflePlayer = { id: string; name: string; avatar?: string };

function Avatar({ player, size }: { player: RafflePlayer; size: number }) {
  const style = { width: size, height: size };
  if (player.avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={player.avatar} alt="" style={style} className="rounded-full bg-gray-100 border shrink-0" />
    );
  }
  return (
    <span
      style={{ ...style, fontSize: size / 2.5 }}
      className="rounded-full bg-gray-200 text-gray-700 font-semibold flex items-center justify-center shrink-0"
    >
      {player.name.trim().charAt(0).toUpperCase()}
    </span>
  );
}

type RaffleModalProps = {
  open: boolean;
  players: RafflePlayer[];
  onClose: () => void;
};

const SIZE = 300;
const C = SIZE / 2;
const R = C - 6;
const SPIN_MS = 5000;

function point(angleDeg: number, radius: number) {
  const a = (angleDeg * Math.PI) / 180;
  return { x: C + radius * Math.sin(a), y: C - radius * Math.cos(a) };
}

function randomInt(max: number) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] % max;
}

function Wheel({ names, rotation, spinning }: { names: string[]; rotation: number; spinning: boolean }) {
  const n = names.length;
  const step = 360 / n;
  return (
    <div className="relative mx-auto" style={{ width: SIZE, maxWidth: "100%" }}>
      {/* ponteiro */}
      <div
        className="absolute left-1/2 -top-1 -translate-x-1/2 z-10 w-0 h-0"
        style={{
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderTop: "20px solid #1f2937",
        }}
      />
      <div className="overflow-hidden rounded-full">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-auto block"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? `transform ${SPIN_MS}ms cubic-bezier(0.12, 0.6, 0.1, 1)` : "none",
        }}
      >
        {n === 1 ? (
          <circle cx={C} cy={C} r={R} fill="hsl(235 70% 60%)" />
        ) : (
          names.map((_, i) => {
            const p1 = point(i * step, R);
            const p2 = point((i + 1) * step, R);
            return (
              <path
                key={i}
                d={`M ${C} ${C} L ${p1.x} ${p1.y} A ${R} ${R} 0 ${step > 180 ? 1 : 0} 1 ${p2.x} ${p2.y} Z`}
                fill={`hsl(${(i * 360) / n + 235} 70% ${i % 2 ? 62 : 55}%)`}
                stroke="white"
                strokeWidth={2}
              />
            );
          })
        )}
        {names.map((name, i) => {
          const mid = (i + 0.5) * step;
          const pos = point(mid, R * 0.62);
          const label = name.length > 12 ? name.slice(0, 11) + "…" : name;
          const fontSize = n > 14 ? 9 : n > 8 ? 11 : 13;
          return (
            <text
              key={i}
              x={pos.x}
              y={pos.y}
              transform={`rotate(${mid - 90} ${pos.x} ${pos.y})`}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize}
              fontWeight={600}
              fill="white"
            >
              {label}
            </text>
          );
        })}
        <circle cx={C} cy={C} r={14} fill="white" stroke="#1f2937" strokeWidth={3} />
      </svg>
      </div>
    </div>
  );
}

export default function RaffleModal({ open, players, onClose }: RaffleModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [stage, setStage] = useState<"select" | "wheel">("select");
  const [wheelPlayers, setWheelPlayers] = useState<RafflePlayer[]>([]);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState<RafflePlayer | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ao abrir, começa com todos selecionados
  useEffect(() => {
    if (open) {
      setSelected(new Set(players.map((p) => p.id)));
      setStage("select");
      setWinner(null);
      setSpinning(false);
      setRotation(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const allSelected = players.length > 0 && selected.size === players.length;
  const chosen = players.filter((p) => selected.has(p.id));

  const spin = (list: RafflePlayer[]) => {
    if (spinning || list.length < 2) return;
    const idx = randomInt(list.length);
    const step = 360 / list.length;
    // leva o centro do setor sorteado até o ponteiro (topo), com pequena variação dentro do setor
    const jitter = (Math.random() - 0.5) * step * 0.7;
    const current = ((rotation % 360) + 360) % 360;
    const target = (((-(idx + 0.5) * step + jitter) % 360) + 360) % 360;
    const delta = ((target - current + 360) % 360) + 360 * 6;
    setWinner(null);
    setSpinning(true);
    setRotation(rotation + delta);
    timer.current = setTimeout(() => {
      setSpinning(false);
      setWinner(list[idx]);
    }, SPIN_MS + 100);
  };

  const start = () => {
    setWheelPlayers(chosen);
    setStage("wheel");
    setRotation(0);
    setWinner(null);
    // espera a roda montar antes de girar para a transição funcionar
    timer.current = setTimeout(() => spin(chosen), 50);
  };

  return (
    <Modal open={open} onClose={onClose} title={<span className={font.className}>Sorteio</span>} locked={spinning} className="max-w-md">
      <div className={font.className}>
      {stage === "select" ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {selected.size} de {players.length} participando
            </span>
            <button
              type="button"
              onClick={() => setSelected(allSelected ? new Set() : new Set(players.map((p) => p.id)))}
              className="cursor-pointer text-indigo-600 hover:text-indigo-800 font-medium"
            >
              {allSelected ? "Limpar" : "Selecionar todos"}
            </button>
          </div>

          <ul className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto p-1">
            {players.map((p) => {
              const on = selected.has(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    aria-pressed={on}
                    className={`cursor-pointer relative w-full flex flex-col items-center gap-2 px-2 py-3 rounded-xl border-2 transition ${
                      on
                        ? "border-indigo-500 bg-indigo-50 shadow-sm"
                        : "border-gray-200 bg-white opacity-60 hover:opacity-100 hover:border-gray-300"
                    }`}
                  >
                    <Avatar player={p} size={56} />
                    <span className="w-full truncate text-sm font-medium text-gray-800 text-center">{p.name}</span>
                    {on && (
                      <span className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                        <LuCheck size={13} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {players.length < 2 && (
            <p className="text-xs text-gray-500">Adicione ao menos 2 jogadores para sortear.</p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={start}
              disabled={selected.size < 2}
              className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Girar roleta
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Wheel names={wheelPlayers.map((p) => p.name)} rotation={rotation} spinning={spinning} />

          <div className="min-h-36 flex items-center justify-center text-center">
            {winner ? (
              <div className="animate-pop-in flex flex-col items-center gap-1">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
                  <LuTrophy /> Vencedor
                </span>
                <Avatar player={winner} size={72} />
                <span className="text-2xl font-bold text-gray-800 break-words">{winner.name}</span>
              </div>
            ) : (
              <span className="text-sm text-gray-500">Girando...</span>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStage("select")}
              disabled={spinning}
              className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 transition disabled:opacity-50"
            >
              Participantes
            </button>
            <button
              type="button"
              onClick={() => spin(wheelPlayers)}
              disabled={spinning}
              className="cursor-pointer flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-60"
            >
              Girar de novo
            </button>
          </div>
        </div>
      )}
      </div>
    </Modal>
  );
}
