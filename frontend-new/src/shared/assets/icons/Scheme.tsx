import { useId, type SVGProps } from "react";
export interface SchemeProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height" | "color" | "strokeWidth"> {
  width?: number | string;
  height?: number | string;
  /**
   * Line colour. Defaults to the blue gradient; pass a colour (or "currentColor")
   * where the gradient lacks contrast, e.g. on the dark breadcrumb tabs.
   */
  color?: string;
  /** Line width in viewBox units (500 wide). The default 9 draws hairlines at icon sizes. */
  strokeWidth?: number;
}

const Scheme = ({
  width = 500,
  height = 400,
  color,
  strokeWidth = 9,
  ...props
}: SchemeProps) => {
  const id = useId();
  const blueGradient = `${id}-network-blue`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 500 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <linearGradient
          id={blueGradient}
          x1="100"
          y1="30"
          x2="390"
          y2="370"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#1485F6" />
          <stop offset="0.5" stopColor="#1597FF" />
          <stop offset="1" stopColor="#1685F4" />
        </linearGradient>
      </defs>

      {/* No background rectangle - completely transparent */}

      <g
        stroke={color ?? `url(#${blueGradient})`}
        strokeWidth={strokeWidth}
        strokeLinecap="square"
        strokeLinejoin="round"
      >
        {/* =====================================
            TOP CIRCLE
           ===================================== */}

        <circle
          cx="250"
          cy="47"
          r="23"
        />

        {/* Circle -> decision diamond */}
        <path d="M250 70 V102" />

        {/* =====================================
            DECISION DIAMOND
           ===================================== */}

        <path
          d="
            M250 102
            L287 139
            L250 176
            L213 139
            Z
          "
        />

        {/* =====================================
            LEFT + RIGHT BRANCHES FROM DIAMOND
           ===================================== */}

        <path d="M213 139 H150 V168" />

        <path d="M287 139 H350 V168" />

        {/* =====================================
            LEFT SIDE BOXES
           ===================================== */}

        <rect
          x="113"
          y="168"
          width="74"
          height="38"
          rx="7"
        />

        {/* Connector between left boxes */}
        <path d="M150 206 V225" />

        <rect
          x="101"
          y="225"
          width="86"
          height="38"
          rx="7"
        />

        {/* =====================================
            RIGHT SIDE BOXES
           ===================================== */}

        <rect
          x="313"
          y="168"
          width="74"
          height="38"
          rx="7"
        />

        {/* Connector between right boxes */}
        <path d="M350 206 V225" />

        <rect
          x="313"
          y="225"
          width="86"
          height="38"
          rx="7"
        />

        {/* =====================================
            LOWER INTERNAL NETWORK
           ===================================== */}

        {/* Left box down */}
        <path d="M150 263 V286" />

        {/* Right box down */}
        <path d="M350 263 V286" />

        {/* Horizontal connection */}
        <path d="M150 286 H350" />

        {/* Center downward stub */}
        <path d="M250 286 V317" />

        {/* =====================================
            LARGE OUTER NETWORK FRAME

            The frame deliberately has gaps
            around the top-center connection
            just like the reference image.
           ===================================== */}

        {/* Left upper frame */}
        <path
          d="
            M230 94
            H92

            C82 94 77 99 77 109

            V303

            C77 312 82 317 91 317

            H217
          "
        />

        {/* Right upper frame */}
        <path
          d="
            M270 94
            H408

            C418 94 423 99 423 109

            V303

            C423 312 418 317 409 317

            H283
          "
        />

        {/* =====================================
            FRAME TO BOTTOM BOX
           ===================================== */}

        <path d="M217 317 V350" />
        <path d="M283 317 V350" />

        {/* Bottom box */}
        <rect
          x="180"
          y="350"
          width="140"
          height="28"
          rx="3"
        />
      </g>
    </svg>
  );
};

export default Scheme;