import { useId, type SVGProps } from "react";

export interface PressureProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const Pressure = ({
  width = 500,
  height = 500,
  ...props
}: PressureProps) => {
  const id = useId();

  const pinGradient = `${id}-pin`;
  const panelGradient = `${id}-panel`;
  const gearGradient = `${id}-gear`;

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
        {/* Location pin */}
        <linearGradient
          id={pinGradient}
          x1="145"
          y1="65"
          x2="355"
          y2="425"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#7199FB" />
          <stop offset="0.5" stopColor="#75A5FF" />
          <stop offset="1" stopColor="#6795F4" />
        </linearGradient>

        {/* Inner blue panel */}
        <radialGradient
          id={panelGradient}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(230 175) rotate(56) scale(190)"
        >
          <stop stopColor="#ACC9FC" />
          <stop offset="0.55" stopColor="#96B9F8" />
          <stop offset="1" stopColor="#83AAF5" />
        </radialGradient>

        {/* Slight gray gear */}
        <linearGradient
          id={gearGradient}
          x1="195"
          y1="120"
          x2="300"
          y2="285"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F5F6F8" />
          <stop offset="0.5" stopColor="#E9EDF2" />
          <stop offset="1" stopColor="#DDE3EA" />
        </linearGradient>
      </defs>

      {/* =========================================
          LOCATION PIN
         ========================================= */}

      <path
        d="
          M250 61

          C171 61 107 125 107 204
          C107 265 145 311 194 335

          C207 341 217 351 223 364

          L239 398
          L248 418

          C253 429 266 429 272 418

          L288 383
          L302 354

          C308 344 316 336 327 330

          C367 305 393 259 393 204
          C393 125 329 61 250 61

          Z
        "
        fill={`url(#${pinGradient})`}
      />

      {/* =========================================
          INNER CIRCLE
         ========================================= */}

      <circle
        cx="250"
        cy="202"
        r="110"
        fill={`url(#${panelGradient})`}
      />

      {/* =========================================
          GEAR

          Gear is light gray.

          Bottom-right tooth is intentionally
          removed because the search handle
          occupies that area.
         ========================================= */}

      <g
        transform="translate(250 202)"
        fill={`url(#${gearGradient})`}
      >
        {/* Top tooth */}
        <rect
          x="-15"
          y="-88"
          width="30"
          height="40"
          rx="5"
        />

        {/* Bottom tooth */}
        <rect
          x="-15"
          y="48"
          width="30"
          height="40"
          rx="5"
        />

        {/* Left tooth */}
        <rect
          x="-88"
          y="-15"
          width="40"
          height="30"
          rx="5"
        />

        {/* Right tooth */}
        <rect
          x="48"
          y="-15"
          width="40"
          height="30"
          rx="5"
        />

        {/* Top-left tooth */}
        <rect
          x="-69"
          y="-69"
          width="30"
          height="42"
          rx="5"
          transform="rotate(-45 -54 -48)"
        />

        {/* Top-right tooth */}
        <rect
          x="39"
          y="-69"
          width="30"
          height="42"
          rx="5"
          transform="rotate(45 54 -48)"
        />

        {/* Bottom-left tooth */}
        <rect
          x="-69"
          y="27"
          width="30"
          height="42"
          rx="5"
          transform="rotate(45 -54 48)"
        />

        {/*
          No bottom-right tooth here.

          It was intentionally removed so it
          doesn't appear behind the search handle.
        */}

        {/* Main gear body */}
        <circle
          cx="0"
          cy="0"
          r="67"
        />
      </g>

      {/* =========================================
          GEAR CENTER HOLE
         ========================================= */}

      <circle
        cx="250"
        cy="202"
        r="46"
        fill={`url(#${panelGradient})`}
      />

      {/* =========================================
          SEARCH ICON

          Search is PURE WHITE and rendered over
          the gear.
         ========================================= */}

      <g
        fill="none"
        stroke="#FFFFFF"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Search ring */}
        <circle
          cx="250"
          cy="203"
          r="35"
          strokeWidth="11"
        />

        {/* Search handle */}
        <path
          d="M280 235 L315 270"
          strokeWidth="15"
        />
      </g>
    </svg>
  );
};

export default Pressure;