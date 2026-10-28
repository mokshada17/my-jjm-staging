import { useId, type SVGProps } from "react";

export interface HouseholdProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const Household = ({ width = 500, height = 500, ...props }: HouseholdProps) => {
  const id = useId();
  const roofGradient = `${id}-roof`;
  const bodyGradient = `${id}-body`;

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
        <linearGradient
          id={roofGradient}
          x1="60"
          y1="90"
          x2="440"
          y2="230"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#20C2F3" />
          <stop offset="1" stopColor="#416CFF" />
        </linearGradient>
        <linearGradient
          id={bodyGradient}
          x1="110"
          y1="220"
          x2="390"
          y2="410"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#3E8EFF" />
          <stop offset="1" stopColor="#6260FC" />
        </linearGradient>
      </defs>

      {/* Roof */}
      <path
        d="M250 78 L462 236 C470 242 470 254 462 260 C456 266 446 266 440 261 L250 138 L60 261 C54 266 44 266 38 260 C30 254 30 242 38 236 Z"
        fill={`url(#${roofGradient})`}
      />

      {/* Walls */}
      <path
        d="M110 232 L250 162 L390 232 V392 C390 404 380 414 368 414 H132 C120 414 110 404 110 392 Z"
        fill={`url(#${bodyGradient})`}
      />

      {/* Door */}
      <path
        d="M212 414 V318 C212 304 229 292 250 292 C271 292 288 304 288 318 V414 Z"
        fill="#FFFFFF"
        fillOpacity="0.92"
      />
    </svg>
  );
};

export default Household;
