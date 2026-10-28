import { useId, type SVGProps } from "react";

export interface Tokenizer_FlowProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const Tokenizer_Flow = ({
  width = 600,
  height = 400,
  ...props
}: Tokenizer_FlowProps) => {
  const id = useId();

  const gradientId = `${id}-gradient`;
  const glowId = `${id}-glow`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 600 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Left blue -> right cyan */}
        <linearGradient
          id={gradientId}
          x1="70"
          y1="200"
          x2="545"
          y2="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#084AFF" />
          <stop offset="0.32" stopColor="#075EFF" />
          <stop offset="0.58" stopColor="#079AFB" />
          <stop offset="0.8" stopColor="#08D2EF" />
          <stop offset="1" stopColor="#11E9E5" />
        </linearGradient>

        {/* Soft glow from source image */}
        <filter
          id={glowId}
          x="-25%"
          y="-35%"
          width="150%"
          height="170%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur
            stdDeviation="8"
            result="blur"
          />

          <feFlood
            floodColor="#087BFF"
            floodOpacity="0.45"
            result="color"
          />

          <feComposite
            in="color"
            in2="blur"
            operator="in"
            result="coloredBlur"
          />

          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* =====================================================
          COMPLETE ICON
          No background rectangle.
         ===================================================== */}

      <g filter={`url(#${glowId})`}>

        {/* ===================================================
            TOP LEFT BLOCK
           =================================================== */}

        <rect
          x="65"
          y="45"
          width="103"
          height="98"
          rx="22"
          fill={`url(#${gradientId})`}
        />

        {/* ===================================================
            MIDDLE LEFT BLOCK
           =================================================== */}

        <rect
          x="65"
          y="151"
          width="103"
          height="98"
          rx="22"
          fill={`url(#${gradientId})`}
        />

        {/* ===================================================
            BOTTOM LEFT BLOCK
           =================================================== */}

        <rect
          x="65"
          y="257"
          width="103"
          height="98"
          rx="22"
          fill={`url(#${gradientId})`}
        />

        {/* ===================================================
            TOP CHANNEL

            Starts flush with the first square and bends
            downward into the arrow.
           =================================================== */}

        <path
          d="
            M179 64

            H286

            C300 64 309 69 318 80

            L357 126

            C369 140 385 147 407 147

            H427

            V178

            H398

            C367 178 345 167 327 146

            L292 105

            C286 98 280 96 269 96

            H179

            Z
          "
          fill={`url(#${gradientId})`}
        />

        {/* ===================================================
            MIDDLE CHANNEL

            Straight horizontal channel.
           =================================================== */}

        <path
          d="
            M168 171

            H287

            C305 171 317 183 317 200

            C317 217 305 229 287 229

            H168

            Z
          "
          fill={`url(#${gradientId})`}
        />

        {/* ===================================================
            BOTTOM CHANNEL

            Mirrors the top channel.
           =================================================== */}

        <path
          d="
            M179 304

            H269

            C280 304 286 302 292 295

            L327 254

            C345 233 367 222 398 222

            H427

            V253

            H407

            C385 253 369 260 357 274

            L318 320

            C309 331 300 336 286 336

            H179

            Z
          "
          fill={`url(#${gradientId})`}
        />

        {/* ===================================================
            CENTRAL MERGING AREA

            This gives the source icon its wide central blue
            section before transitioning into cyan.
           =================================================== */}

        <rect
          x="168"
          y="172"
          width="263"
          height="56"
          fill={`url(#${gradientId})`}
        />

        {/* ===================================================
            RIGHT ARROW

            Rounded shoulders and rounded point like source.
           =================================================== */}

        <path
          d="
            M420 111

            C420 97 437 90 447 100

            L542 186

            C550 194 550 206 542 214

            L447 300

            C437 310 420 303 420 289

            V246

            C420 235 411 226 400 226

            H285

            C268 226 256 216 256 200

            C256 184 268 174 285 174

            H400

            C411 174 420 165 420 154

            Z
          "
          fill={`url(#${gradientId})`}
        />

        {/* Subtle cyan highlight toward arrow head */}
        <path
          d="
            M443 106

            L535 190

            C541 196 541 204 535 210

            L443 294

            C453 264 458 233 458 200

            C458 167 453 136 443 106
            Z
          "
          fill="#43FFFF"
          opacity="0.11"
        />
      </g>
    </svg>
  );
};

export default Tokenizer_Flow;