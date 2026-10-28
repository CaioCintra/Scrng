type AuctionTimerProps = {
  remaining: number;
  // duração inicial do leilão (s), usada como referência para o anel
  total: number;
  size?: "sm" | "lg";
};

const SIZES = {
  sm: { box: 64, stroke: 6, text: "text-2xl" },
  lg: { box: 160, stroke: 12, text: "text-6xl" },
};

// anel de contagem regressiva que muda de cor nos últimos segundos
export default function AuctionTimer({ remaining, total, size = "lg" }: AuctionTimerProps) {
  const { box, stroke, text } = SIZES[size];
  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, remaining / (total * 1000));
  const seconds = Math.ceil(remaining / 1000);

  const color =
    seconds <= 3 ? "text-red-500" : seconds <= 5 ? "text-amber-500" : "text-indigo-500";

  return (
    <div
      className={`relative shrink-0 ${seconds <= 3 && remaining > 0 ? "animate-timer-pulse" : ""}`}
      style={{ width: box, height: box }}
      role="timer"
      aria-label={`${seconds} segundos restantes`}
    >
      <svg width={box} height={box} className="-rotate-90">
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-gray-200"
        />
        <circle
          cx={box / 2}
          cy={box / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          className={`${color} transition-[stroke-dashoffset] duration-100 ease-linear`}
        />
      </svg>
      <span
        key={seconds}
        className={`animate-pop-in absolute inset-0 flex items-center justify-center font-extrabold tabular-nums ${text} ${color}`}
      >
        {seconds}
      </span>
    </div>
  );
}

// contagem antes de os lances serem liberados
export function AuctionStartCountdown({ remaining, size = "lg" }: Omit<AuctionTimerProps, "total">) {
  const { box, text } = SIZES[size];
  const seconds = Math.ceil(remaining / 1000);

  return (
    <div
      className="relative shrink-0 rounded-full bg-amber-100 ring-4 ring-amber-300 flex items-center justify-center"
      style={{ width: box, height: box }}
      role="timer"
      aria-label={`Leilão começa em ${seconds} segundos`}
    >
      <span key={seconds} className={`animate-winner-in font-extrabold tabular-nums text-amber-600 ${text}`}>
        {seconds}
      </span>
    </div>
  );
}
