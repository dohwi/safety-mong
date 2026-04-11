"use client";

const items = [
  {
    className: "left-[2%] top-[6%] w-28 h-28 opacity-[0.18] lab-float-1",
    svg: (
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M24 8h16v4l6 20v16a8 8 0 01-8 8H26a8 8 0 01-8-8V32l6-20V8z" stroke="#4F7CFF" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M24 36c4 3 12 3 16 0" stroke="#4F7CFF" strokeWidth="2" strokeLinecap="round" />
        <line x1="22" y1="8" x2="42" y2="8" stroke="#4F7CFF" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="32" cy="40" rx="8" ry="6" fill="#4F7CFF" opacity="0.08" />
      </svg>
    ),
  },
  {
    className: "left-[78%] top-[3%] w-24 h-24 opacity-[0.16] lab-float-2",
    svg: (
      <svg viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="20" r="6" stroke="#7C5CFF" strokeWidth="2" />
        <circle cx="20" cy="40" r="6" stroke="#7C5CFF" strokeWidth="2" />
        <circle cx="44" cy="40" r="6" stroke="#7C5CFF" strokeWidth="2" />
        <line x1="32" y1="26" x2="24" y2="34" stroke="#7C5CFF" strokeWidth="2" />
        <line x1="32" y1="26" x2="40" y2="34" stroke="#7C5CFF" strokeWidth="2" />
        <line x1="26" y1="40" x2="38" y2="40" stroke="#7C5CFF" strokeWidth="2" />
        <circle cx="32" cy="20" r="3" fill="#7C5CFF" opacity="0.1" />
      </svg>
    ),
  },
  {
    className: "left-[10%] top-[44%] w-36 h-36 opacity-[0.14] lab-float-3",
    svg: (
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M28 8v20l-14 20a4 4 0 003.3 6.3h29.4A4 4 0 0050 48L36 28V8" stroke="#4F7CFF" strokeWidth="2.5" strokeLinejoin="round" />
        <line x1="24" y1="8" x2="40" y2="8" stroke="#4F7CFF" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 40h24" stroke="#4F7CFF" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 48h28" stroke="#4F7CFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
        <ellipse cx="32" cy="42" rx="12" ry="4" fill="#4F7CFF" opacity="0.06" />
      </svg>
    ),
  },
  {
    className: "left-[66%] top-[34%] w-28 h-28 opacity-[0.16] lab-float-4",
    svg: (
      <svg viewBox="0 0 64 64" fill="none">
        <rect x="26" y="6" width="12" height="48" rx="6" stroke="#5EE6D6" strokeWidth="2.5" />
        <path d="M26 16h12M26 36h12" stroke="#5EE6D6" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="48" r="3" fill="#5EE6D6" opacity="0.15" />
        <rect x="28" y="20" width="8" height="12" rx="2" fill="#5EE6D6" opacity="0.06" />
      </svg>
    ),
  },
  {
    className: "left-[86%] top-[58%] w-24 h-24 opacity-[0.18] lab-float-5",
    svg: (
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M14 52l18-40 18 40" stroke="#4F7CFF" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M20 42h24" stroke="#4F7CFF" strokeWidth="2" strokeLinecap="round" />
        <path d="M14 52h36" stroke="#4F7CFF" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="32" cy="34" r="4" fill="#4F7CFF" opacity="0.08" />
      </svg>
    ),
  },
  {
    className: "left-[40%] top-[72%] w-24 h-24 opacity-[0.15] lab-float-6",
    svg: (
      <svg viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="28" r="18" stroke="#7C5CFF" strokeWidth="2" />
        <circle cx="32" cy="28" r="6" stroke="#7C5CFF" strokeWidth="2" />
        <line x1="32" y1="10" x2="32" y2="4" stroke="#7C5CFF" strokeWidth="2" strokeLinecap="round" />
        <line x1="32" y1="46" x2="32" y2="52" stroke="#7C5CFF" strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="28" x2="8" y2="28" stroke="#7C5CFF" strokeWidth="2" strokeLinecap="round" />
        <line x1="50" y1="28" x2="56" y2="28" stroke="#7C5CFF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="28" r="10" fill="#7C5CFF" opacity="0.05" />
      </svg>
    ),
  },
  {
    className: "left-[55%] top-[12%] w-22 h-22 opacity-[0.14] lab-float-7",
    svg: (
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M20 8c0 20 12 24 12 44" stroke="#5EE6D6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 8c0 12 6 18 6 30" stroke="#5EE6D6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M44 8c0 16-6 22-6 38" stroke="#5EE6D6" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="16" y1="8" x2="48" y2="8" stroke="#5EE6D6" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="32" cy="30" rx="6" ry="10" fill="#5EE6D6" opacity="0.05" />
      </svg>
    ),
  },
  {
    className: "left-[22%] top-[22%] w-28 h-28 opacity-[0.16] lab-float-8",
    svg: (
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M12 18h40v32a8 8 0 01-8 8H20a8 8 0 01-8-8V18z" stroke="#4F7CFF" strokeWidth="2.5" />
        <path d="M8 18h48" stroke="#4F7CFF" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 18V12a8 8 0 0116 0v6" stroke="#4F7CFF" strokeWidth="2.5" />
        <rect x="22" y="30" width="20" height="16" rx="3" fill="#4F7CFF" opacity="0.05" />
      </svg>
    ),
  },
  {
    className: "left-[46%] top-[0%] w-22 h-22 opacity-[0.14] lab-float-9",
    svg: (
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M8 20c8-8 16 8 24 0s16-8 24 0" stroke="#7C5CFF" strokeWidth="3" strokeLinecap="round" />
        <path d="M8 32c8-8 16 8 24 0s16-8 24 0" stroke="#7C5CFF" strokeWidth="3" strokeLinecap="round" />
        <path d="M8 44c8-8 16 8 24 0s16-8 24 0" stroke="#7C5CFF" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    className: "left-[0%] top-[74%] w-28 h-28 opacity-[0.14] lab-float-10",
    svg: (
      <svg viewBox="0 0 64 64" fill="none">
        <rect x="18" y="28" width="28" height="30" rx="3" stroke="#4F7CFF" strokeWidth="2.5" />
        <path d="M24 28V18a8 8 0 0116 0v10" stroke="#4F7CFF" strokeWidth="2.5" />
        <circle cx="32" cy="43" r="6" stroke="#4F7CFF" strokeWidth="2" />
        <line x1="32" y1="43" x2="32" y2="49" stroke="#4F7CFF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="43" r="2.5" fill="#4F7CFF" opacity="0.15" />
      </svg>
    ),
  },
  {
    className: "left-[73%] top-[79%] w-24 h-24 opacity-[0.16] lab-float-1",
    svg: (
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M18 8h28l-4 20v18a8 8 0 01-8 8h-4a8 8 0 01-8-8V28L18 8z" stroke="#5EE6D6" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M24 28c4 2 12 2 16 0" stroke="#5EE6D6" strokeWidth="2" strokeLinecap="round" />
        <line x1="14" y1="8" x2="50" y2="8" stroke="#5EE6D6" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="32" cy="36" rx="6" ry="10" fill="#5EE6D6" opacity="0.06" />
      </svg>
    ),
  },
  {
    className: "left-[33%] top-[52%] w-24 h-24 opacity-[0.14] lab-float-3",
    svg: (
      <svg viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="22" r="10" stroke="#7C5CFF" strokeWidth="2.5" />
        <line x1="32" y1="32" x2="32" y2="56" stroke="#7C5CFF" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="22" y1="56" x2="42" y2="56" stroke="#7C5CFF" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="32" cy="22" r="4" fill="#7C5CFF" opacity="0.1" />
        <line x1="28" y1="42" x2="36" y2="42" stroke="#7C5CFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      </svg>
    ),
  },
];

export function LabBg() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {items.map((item, i) => (
        <div key={i} className={`absolute ${item.className}`}>
          {item.svg}
        </div>
      ))}
    </div>
  );
}
