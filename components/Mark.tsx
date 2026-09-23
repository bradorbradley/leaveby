/**
 * The geometry of the app: four circles cut from a square make a star, two
 * circles overlapped make a lens. Everything decorative is built from these.
 */
export const STAR = "M50 0A50 50 0 0 0 100 50A50 50 0 0 0 50 100A50 50 0 0 0 0 50A50 50 0 0 0 50 0Z";
export const LENS = "M50 0A62 62 0 0 1 50 100A62 62 0 0 1 50 0Z";

export function Mark({ size = 24, className = "" }: { size?: number; className?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 100 100" className={`shrink-0 ${className}`}>
      <path d={STAR} fill="var(--ink)" />
      <circle cx="50" cy="50" r="9" fill="var(--coral)" />
    </svg>
  );
}

/** A quiet composition behind the big time: a lens, a star, a half circle, a dot. */
export function Geometry({ tone = "paper" }: { tone?: "paper" | "coral" | "mustard" }) {
  const lens = tone === "paper" ? "var(--coral-pale)" : "rgba(252,250,246,0.55)";
  const star = tone === "mustard" ? "var(--coral-soft)" : "var(--mustard-soft)";
  const half = tone === "coral" ? "var(--coral-soft)" : "var(--coral-pale)";
  return (
    <svg aria-hidden="true" viewBox="0 0 390 300" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 h-full w-full">
      <path d={LENS} transform="translate(95 -10) scale(2.0 3.2)" fill={lens} />
      <path d="M0 300A120 120 0 0 1 120 180V300Z" fill={half} />
      <path d={STAR} transform="translate(26 18) scale(0.62)" fill={star} />
      <path d={STAR} transform="translate(318 216) scale(0.34)" fill="var(--ink)" opacity="0.9" />
      <circle cx="335" cy="233" r="3.2" fill="var(--paper)" />
      <circle cx="57" cy="49" r="3.5" fill="var(--paper)" />
    </svg>
  );
}
