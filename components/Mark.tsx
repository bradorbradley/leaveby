export function Mark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block shrink-0 bg-lilac-deep ${className}`}
      style={{ width: size, height: size, borderRadius: "50% 50% 50% 22%" }}
    >
      <span className="absolute rounded-full bg-butter" style={{ inset: size * 0.26 }} />
    </span>
  );
}
