import { ChevronDownIcon } from "@/components/icons";
import { chip } from "@/components/ui";

type Option = { value: string; label: string };

type ToolbarSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  /** Options regroupées sous des intertitres (`<optgroup>`), après `options`. */
  groups?: { label: string; options: Option[] }[];
  /** Première option, vide (« Tous les types ») ; sans elle, une valeur est toujours choisie. */
  placeholder?: string;
  /** Chip encre pleine quand un filtre est actif. */
  highlight?: boolean;
};

/** Menu déroulant habillé en chip, précédé de son étiquette : « JEU  [Rouge Feu ▾] ». */
export function ToolbarSelect({ label, value, onChange, options, groups = [], placeholder, highlight = false }: ToolbarSelectProps) {
  const renderOptions = (list: Option[]) =>
    list.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ));

  return (
    <label className="inline-flex items-center gap-2">
      <span className="t-caption">{label}</span>
      <span className="relative inline-flex">
        <select value={value} onChange={(e) => onChange(e.target.value)} className={`${chip(highlight)} appearance-none pr-7 ${highlight ? "" : "text-ink"}`}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {renderOptions(options)}
          {groups.map((g) => (
            <optgroup key={g.label} label={g.label}>
              {renderOptions(g.options)}
            </optgroup>
          ))}
        </select>
        <ChevronDownIcon size={12} className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2" />
      </span>
    </label>
  );
}
