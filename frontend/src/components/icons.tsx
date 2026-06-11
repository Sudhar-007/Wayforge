/**
 * Shared icon set for the Wayforge UI. These are pure presentational SVGs —
 * no app logic. Each is a small functional component that spreads SVG props so
 * callers can size/style it.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const Icon = {
  logo: (p: IconProps) => (
    <svg width="17" height="17" viewBox="0 0 24 24" strokeWidth="2.2" {...base} {...p}>
      <circle cx="6" cy="18" r="2.3" fill="currentColor" stroke="none" />
      <circle cx="18" cy="6" r="2.3" fill="currentColor" stroke="none" />
      <path d="M8 17L16 8" strokeDasharray="0.1 4" />
    </svg>
  ),
  spark: (p: IconProps) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...p}>
      <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor" />
      <path d="M19 14l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z" fill="currentColor" opacity="0.7" />
    </svg>
  ),
  penPlus: (p: IconProps) => (
    <svg width="20" height="20" viewBox="0 0 24 24" strokeWidth="1.8" {...base} {...p}>
      <path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" />
      <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L13 14l-4 1 1-4 8.5-8.5z" />
    </svg>
  ),
  arrow: (p: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" {...base} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  back: (p: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" {...base} {...p}>
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  ),
  target: (p: IconProps) => (
    <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.8" {...base} {...p}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  ),
  route: (p: IconProps) => (
    <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.8" {...base} {...p}>
      <circle cx="6" cy="19" r="2.4" />
      <circle cx="18" cy="5" r="2.4" />
      <path d="M8.4 18.5h6.1a3 3 0 0 0 3-3v-3M6 16.5V9a3 3 0 0 1 3-3h6.6" />
    </svg>
  ),
  edit: (p: IconProps) => (
    <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.8" {...base} {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  ),
  pencil: (p: IconProps) => (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="2" {...base} {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  ),
  sun: (p: IconProps) => (
    <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.8" {...base} {...p}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  moon: (p: IconProps) => (
    <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.8" {...base} {...p}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  ),
  github: (p: IconProps) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 .5C5.73.5.75 5.48.75 11.75c0 4.97 3.22 9.18 7.69 10.67.56.1.77-.24.77-.54 0-.27-.01-1.15-.02-2.09-3.13.68-3.79-1.34-3.79-1.34-.51-1.3-1.25-1.64-1.25-1.64-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.39-1.22.71-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.11 1.15.9-.25 1.87-.38 2.83-.38.96 0 1.93.13 2.83.38 2.16-1.45 3.11-1.15 3.11-1.15.61 1.55.23 2.7.11 2.98.72.79 1.16 1.79 1.16 3.02 0 4.32-2.64 5.28-5.15 5.55.4.34.76 1.02.76 2.06 0 1.49-.01 2.69-.01 3.06 0 .3.2.65.78.54 4.46-1.49 7.68-5.7 7.68-10.67C23.25 5.48 18.27.5 12 .5z" />
    </svg>
  ),
  google: (p: IconProps) => (
    <svg width="18" height="18" viewBox="0 0 18 18" {...p}>
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z" />
    </svg>
  ),
  linkedin: (p: IconProps) => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .78 0 1.74v20.52C0 23.22.79 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.74V1.74C24 .78 23.2 0 22.22 0z" />
    </svg>
  ),
  close: (p: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" {...base} {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  plus: (p: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" {...base} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  trash: (p: IconProps) => (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="1.8" {...base} {...p}>
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  ),
  check: (p: IconProps) => (
    <svg width="13" height="13" viewBox="0 0 24 24" strokeWidth="3" {...base} {...p}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  zoomIn: (p: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" {...base} {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  zoomOut: (p: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="2" {...base} {...p}>
      <path d="M5 12h14" />
    </svg>
  ),
  fit: (p: IconProps) => (
    <svg width="15" height="15" viewBox="0 0 24 24" strokeWidth="2" {...base} {...p}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  ),
  grid: (p: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.8" {...base} {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  link: (p: IconProps) => (
    <svg width="13" height="13" viewBox="0 0 24 24" strokeWidth="2" {...base} {...p}>
      <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
    </svg>
  ),
  user: (p: IconProps) => (
    <svg width="16" height="16" viewBox="0 0 24 24" strokeWidth="1.8" {...base} {...p}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  ),
  alert: (p: IconProps) => (
    <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.9" {...base} {...p}>
      <path d="M10.3 3.7 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  ),
};
