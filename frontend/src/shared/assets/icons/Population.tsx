import { useId, type SVGProps } from "react";

export interface PopulationProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const Population = ({
  width = 500,
  height = 500,
  ...props
}: PopulationProps) => {
  const id = useId();

  const leftGradient = `${id}-left`;
  const centerGradient = `${id}-center`;
  const rightGradient = `${id}-right`;
  const centerHeadGradient = `${id}-center-head`;

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
        {/* Left person: cyan -> blue */}
        <linearGradient
          id={leftGradient}
          x1="70"
          y1="160"
          x2="170"
          y2="370"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#20C2F3" />
          <stop offset="0.45" stopColor="#299EF6" />
          <stop offset="1" stopColor="#416CFF" />
        </linearGradient>

        {/* Center person: blue -> purple */}
        <linearGradient
          id={centerGradient}
          x1="170"
          y1="195"
          x2="330"
          y2="370"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#3E8EFF" />
          <stop offset="0.5" stopColor="#5767FF" />
          <stop offset="1" stopColor="#8C32F3" />
        </linearGradient>

        {/* Center head */}
        <linearGradient
          id={centerHeadGradient}
          x1="215"
          y1="100"
          x2="290"
          y2="195"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#3988FF" />
          <stop offset="0.48" stopColor="#466FFF" />
          <stop offset="1" stopColor="#6260FC" />
        </linearGradient>

        {/* Right person: violet -> purple */}
        <linearGradient
          id={rightGradient}
          x1="320"
          y1="160"
          x2="415"
          y2="370"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#6552F6" />
          <stop offset="0.45" stopColor="#813AF1" />
          <stop offset="1" stopColor="#A323EE" />
        </linearGradient>
      </defs>

      {/* =====================================================
          LEFT PERSON
         ===================================================== */}

      {/* Left head */}
      <circle
        cx="137"
        cy="190"
        r="36"
        fill={`url(#${leftGradient})`}
      />

      {/* Left body */}
      <path
        d="
          M91 239
          C91 233 96 228 102 228

          H151
          C159 228 166 235 166 243

          V358
          C166 365 161 370 154 370

          H92
          C85 370 81 365 81 358

          V273
          C81 254 87 244 91 239

          Z
        "
        fill={`url(#${leftGradient})`}
      />

      {/* =====================================================
          CENTER PERSON
         ===================================================== */}

      {/* Center head */}
      <circle
        cx="250"
        cy="149"
        r="45"
        fill={`url(#${centerHeadGradient})`}
      />

      {/* Center body */}
      <path
        d="
          M207 209

          H275

          C300 209 320 229 320 254

          V358

          C320 365 315 370 308 370

          H191

          C184 370 179 365 179 358

          V254

          C179 229 191 216 207 209

          Z
        "
        fill={`url(#${centerGradient})`}
      />

      {/* =====================================================
          RIGHT PERSON
         ===================================================== */}

      {/* Right head */}
      <circle
        cx="362"
        cy="190"
        r="36"
        fill={`url(#${rightGradient})`}
      />

      {/* Right body */}
      <path
        d="
          M348 228

          H386

          C405 228 418 244 418 273

          V358

          C418 365 414 370 407 370

          H346

          C339 370 334 365 334 358

          V243

          C334 235 340 228 348 228

          Z
        "
        fill={`url(#${rightGradient})`}
      />
    </svg>
  );
};

export default Population;