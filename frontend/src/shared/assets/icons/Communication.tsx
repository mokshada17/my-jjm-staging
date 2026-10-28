import React from "react";

export interface CommunicationProps
  extends React.SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
  color?: string;
}

export default function Communication({
  width = 200,
  height = 200,
  color = "#0A1744",
  ...props
}: CommunicationProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 128 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/*
        LEFT SIDE
        Both waves are then mirrored for the right side.
      */}

      {/* Outer left wave */}
      <path
        d="
          M 38 38
          C 32 44, 29 51, 29 59
          C 29 67, 32 74, 38 80
        "
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Inner left wave */}
      <path
        d="
          M 49 44
          C 45 48, 43 53, 43 59
          C 43 65, 45 70, 49 74
        "
        stroke={color}
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/*
        RIGHT SIDE

        Mirrors the EXACT same left paths around x=64.
        128 - x gives the corresponding right position.
      */}

      <g transform="translate(128 0) scale(-1 1)">
        {/* Outer right wave */}
        <path
          d="
            M 38 38
            C 32 44, 29 51, 29 59
            C 29 67, 32 74, 38 80
          "
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />

        {/* Inner right wave */}
        <path
          d="
            M 49 44
            C 45 48, 43 53, 43 59
            C 43 65, 45 70, 49 74
          "
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
        />
      </g>

      {/* Antenna head */}
      <circle
        cx="64"
        cy="59"
        r="9"
        fill={color}
      />

      {/* Antenna stem */}
      <path
        d="M64 64 V99"
        stroke={color}
        strokeWidth="5.5"
        strokeLinecap="round"
      />
    </svg>
  );
}