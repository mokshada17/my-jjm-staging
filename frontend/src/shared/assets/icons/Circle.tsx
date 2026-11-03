import { useId, type SVGProps } from "react";

export interface CircleProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const Circle = ({
  width = 500,
  height = 430,
  ...props
}: CircleProps) => {
  const id = useId();
  const blueGradient = `${id}-blue`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 500 430"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Bright cyan-blue from the source */}
        <linearGradient
          id={blueGradient}
          x1="110"
          y1="70"
          x2="400"
          y2="365"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#20B9F5" />
          <stop offset="0.45" stopColor="#149FF3" />
          <stop offset="1" stopColor="#078CED" />
        </linearGradient>
      </defs>

      {/* No navy background */}

      {/* Top small circle */}
      <circle
        cx="218"
        cy="101"
        r="57"
        fill={`url(#${blueGradient})`}
      />

      {/* Right medium circle */}
      <circle
        cx="358"
        cy="178"
        r="78"
        fill={`url(#${blueGradient})`}
      />

      {/* Bottom-left large circle */}
      <circle
        cx="172"
        cy="270"
        r="103"
        fill={`url(#${blueGradient})`}
      />

      {/* Bottom-right small circle */}
      <circle
        cx="327"
        cy="305"
        r="34"
        fill={`url(#${blueGradient})`}
      />
    </svg>
  );
};

export default Circle;