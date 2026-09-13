import { typeColor } from "@/lib/type-colors";

export function TypeBadge({ type, size = "sm" }: { type: { slug: string; nameFr: string }; size?: "sm" | "md" }) {
  return (
    <span
      className={`inline-block rounded font-medium text-white ${size === "sm" ? "px-1.5 py-px text-[11px]" : "px-2.5 py-0.5 text-sm"}`}
      style={{ backgroundColor: typeColor(type.slug), textShadow: "0 1px 1px rgb(0 0 0 / 0.35)" }}
    >
      {type.nameFr}
    </span>
  );
}
