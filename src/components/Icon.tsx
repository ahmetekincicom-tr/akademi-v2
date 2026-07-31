/**
 * Small stroke-based icon set. Replaces the unicode glyphs the panels used to
 * render (◧ ▶ ✕ ⌕ …), which picked a different font on every platform and
 * never lined up with their labels.
 */

export type IconName =
  | "grid"
  | "play"
  | "playCircle"
  | "file"
  | "folder"
  | "clock"
  | "calendar"
  | "message"
  | "plus"
  | "user"
  | "users"
  | "book"
  | "card"
  | "plug"
  | "sliders"
  | "shield"
  | "arrowLeft"
  | "arrowRight"
  | "search"
  | "x"
  | "check"
  | "download"
  | "external"
  | "chevronRight"
  | "logout"
  | "upload"
  | "sparkle"
  | "instagram"
  | "linkedin"
  | "whatsapp";

const paths: Record<IconName, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
    </>
  ),
  play: <path d="M7 4.5v15l12-7.5-12-7.5z" />,
  playCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5v7l6-3.5-6-3.5z" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </>
  ),
  folder: <path d="M3 7.5A2 2 0 0 1 5 5.5h3.6l1.8 2.2H19a2 2 0 0 1 2 2v8.3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 1.9" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M3.5 10h17M8.5 3v4M15.5 3v4" />
    </>
  ),
  message: <path d="M20.5 11.6a8 8 0 0 1-8.6 8 9 9 0 0 1-3.8-.9L3.5 20.5l1.8-4.6a8 8 0 0 1-1.3-4.3 8 8 0 0 1 8.6-8 8.2 8.2 0 0 1 7.9 8z" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  user: (
    <>
      <path d="M20 21v-1.8a4.2 4.2 0 0 0-4.2-4.2H8.2A4.2 4.2 0 0 0 4 19.2V21" />
      <circle cx="12" cy="7.5" r="4" />
    </>
  ),
  users: (
    <>
      <path d="M16.5 21v-1.8a4.2 4.2 0 0 0-4.2-4.2H6.2A4.2 4.2 0 0 0 2 19.2V21" />
      <circle cx="9.2" cy="7.5" r="4" />
      <path d="M22 21v-1.8a4.2 4.2 0 0 0-3.2-4.07M16 3.7a4.2 4.2 0 0 1 0 7.6" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.2a2.7 2.7 0 0 1 2.7-2.7H20" />
      <path d="M6.7 3H20v18.5H6.7A2.7 2.7 0 0 1 4 18.8V5.7A2.7 2.7 0 0 1 6.7 3z" />
    </>
  ),
  card: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 10h19" />
    </>
  ),
  plug: (
    <>
      <path d="M9.5 14.5a4.5 4.5 0 0 0 6.6.4l2.7-2.7a4.6 4.6 0 0 0-6.5-6.5l-1.5 1.5" />
      <path d="M14.5 9.5a4.5 4.5 0 0 0-6.6-.4l-2.7 2.7a4.6 4.6 0 0 0 6.5 6.5l1.5-1.5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 21v-6.5M4 10.5V3M12 21v-9M12 8V3M20 21v-4.5M20 12.5V3" />
      <path d="M1.5 14.5h5M9.5 8h5M17.5 16.5h5" />
    </>
  ),
  shield: <path d="M12 21.5s7.5-3.7 7.5-9.3V5.6L12 2.7 4.5 5.6v6.6c0 5.6 7.5 9.3 7.5 9.3z" />,
  arrowLeft: <path d="M19 12H5.5M11.5 18.5 5 12l6.5-6.5" />,
  arrowRight: <path d="M5 12h13.5M12.5 5.5 19 12l-6.5 6.5" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4.5-4.5" />
    </>
  ),
  x: <path d="M18 6 6 18M6 6l12 12" />,
  check: <path d="m20 6.5-11 11-5-5" />,
  download: (
    <>
      <path d="M21 15.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.5" />
      <path d="m7.5 10.5 4.5 4.5 4.5-4.5M12 15V3" />
    </>
  ),
  upload: (
    <>
      <path d="M21 15.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3.5" />
      <path d="m7.5 7.5 4.5-4.5 4.5 4.5M12 3v12" />
    </>
  ),
  external: (
    <>
      <path d="M18 13.5V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5.5" />
      <path d="M15 3h6v6M10.5 13.5 21 3" />
    </>
  ),
  chevronRight: <path d="m9.5 18 6-6-6-6" />,
  logout: (
    <>
      <path d="M9.5 21H5.5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 16.5 4.5-4.5L16 7.5M20.5 12h-11" />
    </>
  ),
  sparkle: <path d="M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5 10.1 12.8 4.5 10.9 10.1 9z" />,
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </>
  ),
  linkedin: (
    <>
      <path d="M4.5 9.5v11M4.5 4.6v.05" />
      <path d="M10 20.5v-6.2a3.3 3.3 0 0 1 6.6 0v6.2M10 9.5v11" />
    </>
  ),
  whatsapp: (
    <>
      <path d="M3.5 20.5l1.3-4.3a8 8 0 1 1 3 3z" />
      <path d="M9 9.2c.2 1.6 1.3 3.2 2.7 4.2.8.6 1.7 1 2.4 1 .5 0 .9-.5 1-1.1l-1.6-.8-.8.8a6 6 0 0 1-2-2l.8-.8-.8-1.6c-.6.1-1.1.5-1.1 1z" />
    </>
  ),
};

// Filled shapes read wrong with a stroke-only treatment.
const dolu: IconName[] = ["play", "sparkle"];

export function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.7,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const filled = dolu.includes(name);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={filled ? undefined : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
