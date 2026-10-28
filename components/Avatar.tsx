const AVATAR_STYLE = "adventurer";

export function avatarUrl(seed: string) {
  return `https://api.dicebear.com/9.x/${AVATAR_STYLE}/svg?seed=${encodeURIComponent(
    seed,
  )}`;
}

type AvatarProps = {
  name: string;
  avatar?: string | null;
  className?: string;
};

export default function Avatar({ name, avatar, className = "w-10 h-10" }: AvatarProps) {
  if (avatar) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl(avatar)}
        alt={name}
        className={`rounded-full bg-indigo-50 border shrink-0 ${className}`}
      />
    );
  }

  const initials = (name || "")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-700 shrink-0 ${className}`}
    >
      {initials}
    </div>
  );
}
