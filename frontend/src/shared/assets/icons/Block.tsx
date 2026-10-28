import { useId, type SVGProps } from "react";

export interface BlockProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const Block = ({
  width = 500,
  height = 500,
  ...props
}: BlockProps) => {
  const id = useId();

  const circleGradient = `${id}-circle`;
  const whiteGradient = `${id}-white`;
  const darkGradient = `${id}-dark`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Blue circular background */}
        <radialGradient
          id={circleGradient}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(250 235) rotate(90) scale(220)"
        >
          <stop offset="0" stopColor="#17A7FA" />
          <stop offset="0.65" stopColor="#109CF6" />
          <stop offset="1" stopColor="#0B93EF" />
        </radialGradient>

        {/* Off-white blocks */}
        <linearGradient
          id={whiteGradient}
          x1="200"
          y1="110"
          x2="280"
          y2="330"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#FAFAF9" />
          <stop offset="1" stopColor="#F1F1F0" />
        </linearGradient>

        {/* Dark selected block */}
        <linearGradient
          id={darkGradient}
          x1="255"
          y1="170"
          x2="350"
          y2="225"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#555452" />
          <stop offset="0.55" stopColor="#494846" />
          <stop offset="1" stopColor="#41413F" />
        </linearGradient>
      </defs>

      {/* No navy rectangular background */}

      {/* ========================================
          BLUE CIRCLE
         ======================================== */}

      <circle
        cx="250"
        cy="220"
        r="180"
        fill={`url(#${circleGradient})`}
      />

      {/* ========================================
          TOP BLOCK
         ======================================== */}

      <rect
        x="204"
        y="112"
        width="92"
        height="50"
        rx="10"
        fill={`url(#${whiteGradient})`}
      />

      {/* ========================================
          SECOND ROW
         ======================================== */}

      {/* Left */}
      <rect
        x="151"
        y="171"
        width="98"
        height="50"
        rx="10"
        fill={`url(#${whiteGradient})`}
      />

      {/* Right / selected dark block */}
      <rect
        x="258"
        y="171"
        width="98"
        height="50"
        rx="10"
        fill={`url(#${darkGradient})`}
      />

      {/* ========================================
          BOTTOM ROW
         ======================================== */}

      {/* Bottom left */}
      <rect
        x="100"
        y="230"
        width="96"
        height="50"
        rx="10"
        fill={`url(#${whiteGradient})`}
      />

      {/* Bottom center */}
      <rect
        x="202"
        y="230"
        width="96"
        height="50"
        rx="10"
        fill={`url(#${whiteGradient})`}
      />

      {/* Bottom right */}
      <rect
        x="304"
        y="230"
        width="96"
        height="50"
        rx="10"
        fill={`url(#${whiteGradient})`}
      />
    </svg>
  );
};

export default Block;