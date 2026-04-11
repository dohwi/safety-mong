import Image from "next/image";

const mascotMap = {
  experiment: {
    src: "/mascots/experiment-mong.png",
    alt: "실험몽 마스코트",
  },
  surprisedExperiment: {
    src: "/mascots/surprised-experiment-mong.png",
    alt: "놀란 실험몽 마스코트",
  },
  safety: {
    src: "/mascots/safety-mong.png",
    alt: "안전몽 마스코트",
  },
} as const;

export function BrandMascot({
  variant,
  size = 160,
  className = "",
  priority = false,
}: {
  variant: keyof typeof mascotMap;
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const mascot = mascotMap[variant];

  return (
    <Image
      src={mascot.src}
      alt={mascot.alt}
      width={size}
      height={size}
      priority={priority}
      className={className}
    />
  );
}
