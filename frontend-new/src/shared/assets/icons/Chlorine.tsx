import { useId, type SVGProps } from "react";

export interface ChlorineProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const Chlorine = ({
  width = 500,
  height = 500,
  ...props
}: ChlorineProps) => {
  const id = useId();

  const circleGradient = `${id}-circle`;
  const letterGradient = `${id}-letters`;

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
        {/* Blue -> cyan circular background */}
        <linearGradient
          id={circleGradient}
          x1="250"
          y1="70"
          x2="250"
          y2="430"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#0875FF" />
          <stop offset="0.42" stopColor="#079FF9" />
          <stop offset="0.72" stopColor="#08CEF1" />
          <stop offset="1" stopColor="#0DE9DF" />
        </linearGradient>

        {/* Dark navy CL */}
        <linearGradient
          id={letterGradient}
          x1="250"
          y1="166"
          x2="250"
          y2="333"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#050E2A" />
          <stop offset="1" stopColor="#071337" />
        </linearGradient>
      </defs>

      {/* Outer background intentionally transparent */}

      {/* =========================================
          BLUE / CYAN CIRCLE
         ========================================= */}

      <circle
        cx="250"
        cy="250"
        r="180"
        fill={`url(#${circleGradient})`}
      />

      {/* =========================================
          LETTER C
          Top = 166
          Bottom = 333
         ========================================= */}

      <path
        d="
          M205 166

          C168 166 150 187 150 220

          V279

          C150 314 168 333 205 333

          C238 333 254 316 254 282

          V273

          C254 268 251 266 247 266

          H231

          C225 266 222 269 222 275

          V279

          C222 297 216 306 204 306

          C191 306 184 297 184 279

          V220

          C184 202 191 193 204 193

          C216 193 222 202 222 219

          V223

          C222 229 225 232 231 232

          H247

          C251 232 254 229 254 224

          V217

          C254 183 239 166 205 166

          Z
        "
        fill={`url(#${letterGradient})`}
      />

      {/* =========================================
          LETTER L

          Same height as C:
          Top    = 166
          Bottom = 333

          Wider bottom horizontal base.
         ========================================= */}

     {/* LETTER L */}
<path
  d="
    M276 174

    C276 170 279 168 284 168

    H296

    C301 168 304 171 304 175

    V303

    H349

    C354 303 357 306 357 311

    V323

    C357 328 354 331 349 331

    H284

    C279 331 276 328 276 323

    Z
  "
  fill={`url(#${letterGradient})`}
/>
    </svg>
  );
};

export default Chlorine;