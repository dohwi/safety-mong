"use client";

const SHAPES = [
  {
    svg: (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <path d="M15 6h10v8l6 14a4 4 0 01-3.6 5.7H12.6A4 4 0 019 28L15 14V6z" fill="currentColor" opacity="0.85" />
        <rect x="13" y="4" width="14" height="4" rx="2" fill="currentColor" />
        <ellipse cx="20" cy="26" rx="5" ry="3" fill="white" opacity="0.25" />
      </svg>
    ),
    color: "text-[#4F7CFF]",
  },
  {
    svg: (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <path d="M14 4h12v3H14zM15 7h10l2 20a5 5 0 01-5 5.4h-4A5 5 0 0113 27L15 7z" fill="currentColor" opacity="0.85" />
        <ellipse cx="20" cy="26" rx="4" ry="2.5" fill="white" opacity="0.25" />
      </svg>
    ),
    color: "text-[#7C5CFF]",
  },
  {
    svg: (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <path d="M17 4h6v10l8 16a4 4 0 01-3.5 6H12.5a4 4 0 01-3.5-6L17 14V4z" fill="currentColor" opacity="0.85" />
        <circle cx="20" cy="28" r="3" fill="white" opacity="0.3" />
        <circle cx="18" cy="30" r="1.5" fill="white" opacity="0.2" />
      </svg>
    ),
    color: "text-[#5EE6D6]",
  },
  {
    svg: (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <rect x="14" y="4" width="12" height="3" rx="1.5" fill="currentColor" />
        <rect x="16" y="7" width="8" height="26" rx="4" fill="currentColor" opacity="0.85" />
        <rect x="18" y="24" width="4" height="6" rx="2" fill="white" opacity="0.3" />
      </svg>
    ),
    color: "text-[#F59E0B]",
  },
  {
    svg: (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <circle cx="20" cy="20" r="12" fill="currentColor" opacity="0.2" />
        <circle cx="20" cy="20" r="8" fill="currentColor" opacity="0.35" />
        <circle cx="20" cy="20" r="4" fill="currentColor" opacity="0.55" />
      </svg>
    ),
    color: "text-[#4F7CFF]",
  },
  {
    svg: (
      <svg viewBox="0 0 40 40" fill="none" className="w-full h-full">
        <path d="M18 4h4v8l6 14a3 3 0 01-2.7 4.3h-10.6A3 3 0 0112 26L18 12V4z" fill="currentColor" opacity="0.85" />
        <path d="M18 4h4v2h-4z" fill="currentColor" />
        <rect x="16" y="22" width="8" height="4" rx="2" fill="white" opacity="0.2" />
      </svg>
    ),
    color: "text-[#22C55E]",
  },
];

const ANIM_CLASSES = [
  "lab-float-1",
  "lab-float-2",
  "lab-float-3",
  "lab-float-4",
  "lab-float-5",
  "lab-float-6",
];

interface FloatingLabShapesProps {
  count?: number;
}

export function FloatingLabShapes({ count = 6 }: FloatingLabShapesProps) {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-[#4F7CFF]/20 rounded-full blur-3xl animate-pulse" />
      {SHAPES.slice(0, count).map((shape, i) => (
        <div
          key={i}
          className={`absolute ${shape.color} ${ANIM_CLASSES[i % ANIM_CLASSES.length]} drop-shadow-lg`}
          style={{
            width: `${28 + (i % 3) * 8}px`,
            height: `${28 + (i % 3) * 8}px`,
            left: `${10 + ((i * 38) % 70)}%`,
            top: `${5 + ((i * 23) % 60)}%`,
            transform: `rotate(${(i * 30) % 60 - 15}deg)`,
          }}
        >
          {shape.svg}
        </div>
      ))}
      <div className="relative w-40 h-40" />
    </div>
  );
}
