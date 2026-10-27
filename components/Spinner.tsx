type SpinnerProps = {
  className?: string;
};

export default function Spinner({ className = "w-4 h-4" }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Carregando"
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
    />
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />;
}
