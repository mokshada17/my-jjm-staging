import { useId, type SVGProps } from "react";

export interface SubDivisionProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const SubDivision = ({
  width = 500,
  height = 500,
  ...props
}: SubDivisionProps) => {
  const id = useId();

  const blueGradient = `${id}-blue`;
  const nodeGradient = `${id}-node`;
  const pinkGradient = `${id}-pink`;

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
        {/* Blue connectors / borders */}
        <linearGradient
          id={blueGradient}
          x1="100"
          y1="50"
          x2="400"
          y2="430"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#1596FA" />
          <stop offset="0.5" stopColor="#119BFF" />
          <stop offset="1" stopColor="#078BF3" />
        </linearGradient>

        {/* Slight off-white nodes */}
        <linearGradient
          id={nodeGradient}
          x1="200"
          y1="50"
          x2="300"
          y2="430"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F6F7F8" />
        </linearGradient>

        {/* Pink centers */}
        <linearGradient
          id={pinkGradient}
          x1="190"
          y1="80"
          x2="315"
          y2="420"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#F3288E" />
          <stop offset="0.5" stopColor="#F02A8A" />
          <stop offset="1" stopColor="#EB2785" />
        </linearGradient>
      </defs>

      {/* =====================================================
          CONNECTORS

          Drawn first so all lines sit behind the nodes.
         ===================================================== */}

      <g
        stroke={`url(#${blueGradient})`}
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Top node -> second level */}
        <path
          d="
            M250 133
            V108

            M250 108
            H143

            C135 108 132 112 132 120

            V170
          "
        />

        <path
          d="
            M250 108
            H357

            C365 108 368 112 368 120

            V170
          "
        />

        {/* Left second-level node -> lower branch */}
        <path d="M132 243 V286" />

        <path
          d="
            M132 286
            H78

            C71 286 68 290 68 297

            V328
          "
        />

        <path
          d="
            M132 286
            H195

            C202 286 205 290 205 297

            V328
          "
        />

        {/* Right second-level node -> lower branch */}
        <path d="M368 243 V286" />

        <path
          d="
            M368 286
            H305

            C298 286 295 290 295 297

            V328
          "
        />

        <path
          d="
            M368 286
            H422

            C429 286 432 290 432 297

            V328
          "
        />
      </g>

      {/* =====================================================
          REUSABLE VISUAL NODE STRUCTURE

          Every node:
          - blue outer rounded square
          - white inner area
          - pink center
         ===================================================== */}

      {/* ================= TOP NODE ================= */}

      <g>
        <rect
          x="214"
          y="66"
          width="72"
          height="72"
          rx="14"
          fill={`url(#${blueGradient})`}
        />

        <rect
          x="221"
          y="73"
          width="58"
          height="58"
          rx="10"
          fill={`url(#${nodeGradient})`}
        />

        <rect
          x="238"
          y="90"
          width="24"
          height="24"
          rx="3"
          fill={`url(#${pinkGradient})`}
        />
      </g>

      {/* ================= LEFT MIDDLE ================= */}

      <g>
        <rect
          x="96"
          y="170"
          width="72"
          height="72"
          rx="14"
          fill={`url(#${blueGradient})`}
        />

        <rect
          x="103"
          y="177"
          width="58"
          height="58"
          rx="10"
          fill={`url(#${nodeGradient})`}
        />

        <rect
          x="120"
          y="194"
          width="24"
          height="24"
          rx="3"
          fill={`url(#${pinkGradient})`}
        />
      </g>

      {/* ================= RIGHT MIDDLE ================= */}

      <g>
        <rect
          x="332"
          y="170"
          width="72"
          height="72"
          rx="14"
          fill={`url(#${blueGradient})`}
        />

        <rect
          x="339"
          y="177"
          width="58"
          height="58"
          rx="10"
          fill={`url(#${nodeGradient})`}
        />

        <rect
          x="356"
          y="194"
          width="24"
          height="24"
          rx="3"
          fill={`url(#${pinkGradient})`}
        />
      </g>

      {/* =====================================================
          BOTTOM LEFT NODE
         ===================================================== */}

      <g>
        <rect
          x="32"
          y="328"
          width="72"
          height="72"
          rx="14"
          fill={`url(#${blueGradient})`}
        />

        <rect
          x="39"
          y="335"
          width="58"
          height="58"
          rx="10"
          fill={`url(#${nodeGradient})`}
        />

        <rect
          x="56"
          y="352"
          width="24"
          height="24"
          rx="3"
          fill={`url(#${pinkGradient})`}
        />
      </g>

      {/* =====================================================
          BOTTOM CENTER-LEFT NODE
         ===================================================== */}

      <g>
        <rect
          x="169"
          y="328"
          width="72"
          height="72"
          rx="14"
          fill={`url(#${blueGradient})`}
        />

        <rect
          x="176"
          y="335"
          width="58"
          height="58"
          rx="10"
          fill={`url(#${nodeGradient})`}
        />

        <rect
          x="193"
          y="352"
          width="24"
          height="24"
          rx="3"
          fill={`url(#${pinkGradient})`}
        />
      </g>

      {/* =====================================================
          BOTTOM CENTER-RIGHT NODE
         ===================================================== */}

      <g>
        <rect
          x="269"
          y="328"
          width="72"
          height="72"
          rx="14"
          fill={`url(#${blueGradient})`}
        />

        <rect
          x="276"
          y="335"
          width="58"
          height="58"
          rx="10"
          fill={`url(#${nodeGradient})`}
        />

        <rect
          x="293"
          y="352"
          width="24"
          height="24"
          rx="3"
          fill={`url(#${pinkGradient})`}
        />
      </g>

      {/* =====================================================
          BOTTOM RIGHT NODE
         ===================================================== */}

      <g>
        <rect
          x="396"
          y="328"
          width="72"
          height="72"
          rx="14"
          fill={`url(#${blueGradient})`}
        />

        <rect
          x="403"
          y="335"
          width="58"
          height="58"
          rx="10"
          fill={`url(#${nodeGradient})`}
        />

        <rect
          x="420"
          y="352"
          width="24"
          height="24"
          rx="3"
          fill={`url(#${pinkGradient})`}
        />
      </g>
    </svg>
  );
};

export default SubDivision;