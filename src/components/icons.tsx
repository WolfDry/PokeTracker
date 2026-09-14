import type { SVGProps } from "react";

// Icônes du design system : trait 1.75, grille 20 (24 pour Pokédex), héritent de la couleur du texte.

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, viewBox = "0 0 20 20", children, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      {children}
    </svg>
  );
}

export const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="9" r="5.5" />
    <path d="m13.5 13.5 3.5 3.5" />
  </Icon>
);

export const SunIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10" cy="10" r="3.5" />
    <path d="M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7l1.4 1.4M13.9 13.9l1.4 1.4M4.7 15.3l1.4-1.4M13.9 6.1l1.4-1.4" />
  </Icon>
);

export const MoonIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M16 12.5A6.5 6.5 0 0 1 7.5 4a6.5 6.5 0 1 0 8.5 8.5Z" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon size={14} {...p}>
    <path d="m4 10.5 4 4 8-9" />
  </Icon>
);

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10 4v12M4 10h12" />
  </Icon>
);

export const MinusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 10h12" />
  </Icon>
);

export const StarIcon = (p: IconProps) => (
  <Icon size={16} {...p}>
    <path d="m10 2.5 2.3 4.9 5.2.7-3.8 3.7.9 5.2L10 14.5 5.4 17l.9-5.2L2.5 8.1l5.2-.7Z" />
  </Icon>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Icon size={16} {...p}>
    <path d="m7 4 6 6-6 6" />
  </Icon>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Icon size={16} {...p}>
    <path d="m4 7 6 6 6-6" />
  </Icon>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <Icon size={16} {...p}>
    <path d="M16 10H4M9 5l-5 5 5 5" />
  </Icon>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Icon size={16} {...p}>
    <path d="M4 10h12M11 5l5 5-5 5" />
  </Icon>
);

export const UserIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="10" cy="7" r="3.5" />
    <path d="M3.5 17a6.5 6.5 0 0 1 13 0" />
  </Icon>
);

/** Carnet : onglet Pokédex. */
export const PokedexIcon = (p: IconProps) => (
  <Icon size={20} viewBox="0 0 24 24" {...p}>
    <path d="M4 19V6.2C4 5.0799 4 4.51984 4.21799 4.09202C4.40973 3.71569 4.71569 3.40973 5.09202 3.21799C5.51984 3 6.0799 3 7.2 3H16.8C17.9201 3 18.4802 3 18.908 3.21799C19.2843 3.40973 19.5903 3.71569 19.782 4.09202C20 4.51984 20 5.0799 20 6.2V17H6C4.89543 17 4 17.8954 4 19ZM4 19C4 20.1046 4.89543 21 6 21H20M9 7H15M9 11H15M19 17V21" />
  </Icon>
);

/** Carte : onglet Rencontres. */
export const MapIcon = (p: IconProps) => (
  <Icon size={20} {...p}>
    <path d="M3 5.5 8 3.5l4 2 5-2v11l-5 2-4-2-5 2z" />
    <path d="M8 3.5v11M12 5.5v11" />
  </Icon>
);

/** Pokéball : onglet Captures. */
export const BallIcon = (p: IconProps) => (
  <Icon size={20} {...p}>
    <circle cx="10" cy="10" r="7" />
    <path d="M3 10h4.5M12.5 10H17" />
    <circle cx="10" cy="10" r="2.5" />
  </Icon>
);

export const PokeballIcon = (p: IconProps) => (
  <Icon size={40} {...p}>
    <path d="M450.46,256.09C449.35,175.17,399.81,102.71,324,73.79,247.59,44.67,157.49,69,105.82,132.13,54.4,195,46.61,285.58,88.49,355.68c41.8,69.95,123.74,106,203.55,91.63,91-16.37,156.14-98.12,158.35-189.14A20.16,20.16,0,0,0,450.46,256.09ZM119.05,174.38C152.76,118,220.23,87,285,99.43c69.4,13.29,120.43,70.47,128.83,139H318.41c-8.26-27.36-32-48-62.62-48-29.65,0-55.15,20.65-63.11,48H97.74A158,158,0,0,1,119.05,174.38ZM286.13,256.1c-2,38.75-60.67,39.4-60.67,0S284.17,217.33,286.13,256.1Zm24,149.79C246.85,428.58,175,408.74,132.3,356.82a157.53,157.53,0,0,1-34.57-83H192.6c7.91,27.39,33.7,48,63.19,48,30.67,0,54.36-20.68,62.62-48h95.45C406.61,333,367.54,385.32,310.14,405.89Z" />
  </Icon>
);