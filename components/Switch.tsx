type SwitchProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function Switch({ label, description, checked, onChange }: SwitchProps) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer select-none">
      <span>
        <span className="block text-sm font-medium text-gray-700">{label}</span>
        {description && (
          <span className="block text-xs text-gray-400 mt-0.5">{description}</span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 ${
          checked ? "bg-indigo-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </label>
  );
}
