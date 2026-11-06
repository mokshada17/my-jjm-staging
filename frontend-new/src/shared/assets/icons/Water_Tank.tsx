import { useId, type SVGProps } from "react";

export interface Water_TankProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const Water_Tank = ({
  width = 400,
  height = 500,
  ...props
}: Water_TankProps) => {
  const id = useId();

  const topGradient = `${id}-top`;
  const structureGradient = `${id}-structure`;
  const crescentGradient = `${id}-crescent`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 400 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Upper structure */}
        <linearGradient
          id={topGradient}
          x1="200"
          y1="18"
          x2="200"
          y2="280"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0864F8" />
          <stop offset="0.42" stopColor="#078DFC" />
          <stop offset="0.75" stopColor="#0CB8F4" />
          <stop offset="1" stopColor="#0DD4ED" />
        </linearGradient>

        {/* Platform + supporting structure */}
        <linearGradient
          id={structureGradient}
          x1="200"
          y1="270"
          x2="200"
          y2="475"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#11C6F4" />
          <stop offset="0.5" stopColor="#0DD1ED" />
          <stop offset="1" stopColor="#13D7E5" />
        </linearGradient>

        {/* Crescent inside drop */}
        <linearGradient
          id={crescentGradient}
          x1="170"
          y1="140"
          x2="205"
          y2="210"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#35D0FA" />
          <stop offset="1" stopColor="#13AEF6" />
        </linearGradient>
      </defs>

      {/* =====================================================
          UPPER HOUSE / WATER STRUCTURE
         ===================================================== */}
      <path
        d="
          M79 249
          V103

          L69 108

          C58 114 47 107 45 97
          C43 89 47 82 55 78

          L192 9

          C197 6 203 6 208 9

          L345 78

          C353 82 357 89 355 97
          C353 107 342 114 331 108

          L321 103
          V249

          Z

          M200 79

          C190 95 176 115 165 134
          C154 152 148 168 148 184

          C148 214 171 233 200 233
          C229 233 252 214 252 184

          C252 168 246 152 235 134
          C224 115 210 95 200 79

          Z
        "
        fill={`url(#${topGradient})`}
        fillRule="evenodd"
        clipRule="evenodd"
        stroke="#042E56"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* =====================================================
          CRESCENT INSIDE WATER DROP
         ===================================================== */}
      <path
        d="
          M180 135

          C166 146 158 162 158 180
          C158 199 169 216 185 224
          C194 228 203 227 210 223

          C195 214 188 202 186 188
          C183 171 187 153 194 140

          C196 136 193 132 189 134

          C186 135 183 137 180 135
          Z
        "
        fill={`url(#${crescentGradient})`}
        stroke="#04375C"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* =====================================================
          LARGE HORIZONTAL PLATFORM
         ===================================================== */}
      <rect
        x="43"
        y="248"
        width="314"
        height="35"
        rx="15"
        fill={`url(#${structureGradient})`}
        stroke="#053650"
        strokeWidth="2.5"
      />

      {/* =====================================================
          ORDER OF PAINTING (back to front):
          1. X Braces      ← behind everything
          2. Legs          ← in front of braces
          3. Center Post   ← in front of braces
         ===================================================== */}

      {/* =====================================================
          STEP 1 — X BRACES (rendered FIRST = behind legs)
         ===================================================== */}

      {/* Descending brace: upper-left -> lower-right */}
      <path
        d="
          M102 283
          L325 391
          L320 424
          L88 312
          L92 283
          Z
        "
        fill={`url(#${structureGradient})`}
        stroke="#04394F"
        strokeWidth="2.5"
        strokeLinejoin="miter"
      />

      {/* Ascending brace: lower-left -> upper-right */}
      <path
        d="
          M75 392
          L298 283
          H326
          L330 312
          L80 433
          Z
        "
        fill={`url(#${structureGradient})`}
        stroke="#04394F"
        strokeWidth="2.5"
        strokeLinejoin="miter"
      />

      {/* =====================================================
          STEP 2 — OUTER SUPPORT LEGS (rendered AFTER braces = in front)
         ===================================================== */}

      {/* Left leg */}
      <path
        d="
          M76 282
          H108

          L84 460

          C83 470 77 476 68 476
          C58 476 52 469 54 458

          Z
        "
        fill={`url(#${structureGradient})`}
        stroke="#04394F"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* Right leg */}
      <path
        d="
          M292 282
          H324

          L346 458

          C348 469 342 476 332 476
          C323 476 317 470 316 460

          Z
        "
        fill={`url(#${structureGradient})`}
        stroke="#04394F"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {/* =====================================================
          STEP 3 — CENTER SUPPORT (rendered last = frontmost)
         ===================================================== */}
      <path
        d="
          M186 283
          H214
          V398

          C214 409 208 416 200 416
          C192 416 186 409 186 398

          Z
        "
        fill={`url(#${structureGradient})`}
        stroke="#043B55"
        strokeWidth="2.5"
      />

    </svg>
  );
};

export default Water_Tank;