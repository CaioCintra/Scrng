"use client";

import React, { useEffect, useRef, useState } from "react";
import { LuTrophy } from "react-icons/lu";
import Modal from "./Modal";

type RafflePlayer = { id: string; name: string };

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
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full h-auto"
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
    <Modal open={open} onClose={onClose} title="Sorteio" locked={spinning}>
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

          <ul className="flex flex-col gap-1 max-h-72 overflow-y-auto">
            {players.map((p) => (
              <li key={p.id}>
                <label className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggle(p.id)}
                    className="h-4 w-4 accent-indigo-600"
                  />
                  <span className="truncate">{p.name}</span>
                </label>
              </li>
            ))}
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

          <div className="min-h-14 text-center">
            {winner ? (
              <div className="animate-pop-in flex flex-col items-center gap-1">
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-600">
                  <LuTrophy /> Vencedor
                </span>
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
    </Modal>
  );
}
