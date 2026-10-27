import { FiAlertCircle } from "react-icons/fi";

export default function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="animate-fade-in flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      <FiAlertCircle className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
