import type { SVGProps } from 'react';

export interface WaterSupplyProps
  extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  width?: number | string;
  height?: number | string;
}

const WaterSupply = ({
  width = 500,
  height = 500,
  ...props
}: WaterSupplyProps) => {
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
          id="waterSupplyBlue"
          x1="250"
          y1="40"
          x2="250"
          y2="365"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#15B8F5" />
          <stop offset="1" stopColor="#0795EE" />
        </linearGradient>

        <linearGradient
          id="waterSupplyHighlight"
          x1="164"
          y1="105"
          x2="226"
          y2="215"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#70D5FC" />
          <stop offset="1" stopColor="#36BEF5" />
        </linearGradient>
      </defs>

      {/* Main water drop */}
      <path
        d="
          M250 35
          C238 75 209 111 181 147
          C142 196 109 237 109 292
          C109 370 172 414 250 414
          C328 414 391 370 391 292
          C391 237 358 196 319 147
          C291 111 262 75 250 35
          Z
        "
        fill="url(#waterSupplyBlue)"
      />

      {/* Water-drop highlight */}
      <path
        d="
          M230 91
          C212 119 191 145 173 169
          C150 199 133 228 129 260
          C144 232 162 209 180 186
          C202 157 220 128 230 91
          Z
        "
        fill="url(#waterSupplyHighlight)"
        opacity="0.9"
      />

      {/* Faucet horizontal pipe */}
      <path
        d="
          M109 275
          H292
          C312 275 328 291 328 311
          V345
          H300
          V312
          C300 305 294 299 287 299
          H109
          Z
        "
        fill="white"
      />

      {/* Faucet outlet */}
      <rect x="297" y="340" width="34" height="11" rx="5.5" fill="white" />

      {/* Faucet body */}
      <path
        d="
          M224 274
          V258
          C224 254 227 251 231 251
          H269
          C273 251 276 254 276 258
          V274
          Z
        "
        fill="white"
      />

      {/* Faucet stem */}
      <rect x="242" y="205" width="16" height="51" rx="5" fill="white" />

      {/* Faucet handle */}
      <rect x="200" y="198" width="100" height="20" rx="10" fill="white" />

      {/* Handle center */}
      <rect x="241" y="193" width="18" height="18" rx="9" fill="white" />

      {/* Small falling water drop */}
      <path
        d="
          M315 355
          C312 365 304 373 304 380
          C304 387 309 392 315 392
          C321 392 326 387 326 380
          C326 373 318 365 315 355
          Z
        "
        fill="white"
      />
    </svg>
  );
};

export default WaterSupply;
