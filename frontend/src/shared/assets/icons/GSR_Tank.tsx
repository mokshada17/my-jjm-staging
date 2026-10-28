import React from "react";

export interface GSR_TankProps
  extends Omit<React.SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const GSR_Tank: React.FC<GSR_TankProps> = ({
  width = 600,
  height = "auto",
  className,
  style,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="150 160 1100 760"
      width={width}
      height={height}
      fill="none"
      className={className}
      style={style}
      role="img"
      aria-label="Water storage tank"
      {...props}
    >
      <defs>
        {/* ==============================================
            TANK BODY
        ============================================== */}

        <linearGradient
          id="wt-body"
          x1="250"
          y1="340"
          x2="990"
          y2="820"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#65C6FF" />
          <stop offset="0.45" stopColor="#60BCF8" />
          <stop offset="1" stopColor="#69C9FF" />
        </linearGradient>

        <linearGradient
          id="wt-water"
          x1="250"
          y1="355"
          x2="990"
          y2="355"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#42A4FB" />
          <stop offset="0.5" stopColor="#78CCFF" />
          <stop offset="1" stopColor="#419AF1" />
        </linearGradient>

        {/* ==============================================
            BLUE TOP
        ============================================== */}

        <linearGradient
          id="wt-rim"
          x1="215"
          y1="230"
          x2="1015"
          y2="340"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#397CFA" />
          <stop offset="0.45" stopColor="#4B85FC" />
          <stop offset="0.75" stopColor="#4780F7" />
          <stop offset="1" stopColor="#3973EB" />
        </linearGradient>

        <linearGradient
          id="wt-rim-shadow"
          x1="210"
          y1="310"
          x2="1015"
          y2="350"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#2862C9" />
          <stop offset="0.5" stopColor="#367BE7" />
          <stop offset="1" stopColor="#2459BF" />
        </linearGradient>

        {/* ==============================================
            YELLOW
        ============================================== */}

        <linearGradient
          id="wt-yellow"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0" stopColor="#FFB817" />
          <stop offset="0.45" stopColor="#FFD34A" />
          <stop offset="1" stopColor="#FFB621" />
        </linearGradient>

        {/* ==============================================
            BASE
        ============================================== */}

        <linearGradient
          id="wt-base"
          x1="175"
          y1="875"
          x2="1215"
          y2="875"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#775642" />
          <stop offset="0.5" stopColor="#624437" />
          <stop offset="1" stopColor="#755440" />
        </linearGradient>

        {/* ==============================================
            CLIP PATH
        ============================================== */}

        <clipPath id="wt-tank-clip">
          <path
            d="
              M234 325
              C234 303 401 286 614 286
              C827 286 994 303 994 325
              V850
              H234
              Z
            "
          />
        </clipPath>

        {/* ==============================================
            SHADOWS
        ============================================== */}

        <filter
          id="wt-shadow"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
        >
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="4"
            floodColor="#07133A"
            floodOpacity="0.3"
          />
        </filter>
      </defs>

      {/* =================================================
          NO BACKGROUND RECTANGLE
          SVG BACKGROUND IS FULLY TRANSPARENT
      ================================================= */}

      {/* =================================================
          TANK BODY
      ================================================= */}

      <path
        d="
          M234 325
          C234 303 401 286 614 286
          C827 286 994 303 994 325
          V850
          H234
          Z
        "
        fill="url(#wt-body)"
      />

      {/* Water / upper blue reflection */}
      <path
        d="
          M234 353
          C389 320 810 317 994 354
          V389
          C814 350 408 348 234 390
          Z
        "
        fill="url(#wt-water)"
        opacity="0.68"
        clipPath="url(#wt-tank-clip)"
      />

      {/* Soft center highlight */}
      <ellipse
        cx="645"
        cy="555"
        rx="275"
        ry="230"
        fill="#8BD7FF"
        opacity="0.08"
        clipPath="url(#wt-tank-clip)"
      />

      {/* Left tank edge */}
      <path
        d="M234 331V850"
        stroke="#3B9FE1"
        strokeWidth="2"
        opacity="0.7"
      />

      {/* Right tank edge */}
      <path
        d="M994 331V850"
        stroke="#328ED4"
        strokeWidth="2"
        opacity="0.7"
      />

      {/* =================================================
          YELLOW TOP CAP
      ================================================= */}

      <path
        d="
          M501 211
          C501 198 548 194 614 194
          C680 194 725 198 725 211
          V239
          H501
          Z
        "
        fill="url(#wt-yellow)"
        stroke="#E5A617"
        strokeWidth="2"
        filter="url(#wt-shadow)"
      />

      {/* =================================================
          BLUE TOP RIM
      ================================================= */}

      <path
        d="
          M210 273
          C210 237 390 217 614 217
          C838 217 1018 238 1018 273
          V328

          C1018 338 1010 344 994 350

          V327

          C947 302 799 289 614 289
          C429 289 280 301 234 327

          V350

          C218 345 210 338 210 329

          Z
        "
        fill="url(#wt-rim)"
        stroke="#081842"
        strokeWidth="9"
        strokeLinejoin="round"
      />

      {/* Bottom edge of top rim */}
      <path
        d="
          M234 327
          C287 300 432 289 614 289
          C796 289 941 300 994 327
        "
        stroke="#07163E"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* Slight dark underside */}
      <path
        d="
          M216 327
          C219 335 225 340 234 344
          V328
          C285 301 433 290 614 290
          C795 290 943 301 994 328
          V344
          C1004 341 1010 336 1014 329
        "
        stroke="url(#wt-rim-shadow)"
        strokeWidth="4"
        opacity="0.85"
      />

      {/* =================================================
          CORRECTED LADDER

          Built as one structural shape so there are only
          two actual rails, matching the reference.
      ================================================= */}

      {/* Main ladder silhouette */}
      <path
        d="
          M356 309
          H394
          V394

          H519
          V301

          H532
          V354

          C548 354 558 365 558 380

          V850

          H519
          V841

          H394
          V850

          H356
          Z


          M394 405
          V496
          H519
          V405
          Z


          M394 507
          V598
          H519
          V507
          Z


          M394 609
          V700
          H519
          V609
          Z


          M394 711
          V802
          H519
          V711
          Z


          M394 813
          V840
          H519
          V813
          Z
        "
        fill="#07163F"
        fillRule="evenodd"
        clipRule="evenodd"
      />

      {/* Ladder left-side blue highlight */}
      <path
        d="
          M365 318
          V841
        "
        stroke="#123A6A"
        strokeWidth="3"
        opacity="0.65"
      />

      {/* Ladder right rail highlight */}
      <path
        d="
          M527 310
          V362
          H536
          C544 362 550 370 550 380
          V841
        "
        fill="none"
        stroke="#123A6A"
        strokeWidth="3"
        opacity="0.55"
      />

      {/* Rung highlights */}
      <g
        stroke="#174A79"
        strokeWidth="3"
        opacity="0.65"
      >
        <path d="M395 402H518" />
        <path d="M395 504H518" />
        <path d="M395 606H518" />
        <path d="M395 708H518" />
        <path d="M395 810H518" />
      </g>

      {/* =================================================
          YELLOW OUTLET
      ================================================= */}

      {/* Small connector */}
      <rect
        x="1002"
        y="574"
        width="22"
        height="89"
        rx="8"
        fill="url(#wt-yellow)"
        stroke="#E2A315"
        strokeWidth="2"
      />

      {/* =================================================
          EXTERNAL PIPE
      ================================================= */}

      <path
        d="
          M1035 589
          H1090

          C1135 589 1169 624 1169 668

          V825

          H1110

          V678

          C1110 660 1097 647 1079 647

          H1035

          Z
        "
        fill="url(#wt-yellow)"
        stroke="#E1A116"
        strokeWidth="2"
        filter="url(#wt-shadow)"
      />

      {/* Pipe inner shading */}
      <path
        d="
          M1037 641
          H1081

          C1106 641 1120 658 1120 680

          V824
        "
        fill="none"
        stroke="#CE921A"
        strokeWidth="7"
        opacity="0.48"
      />

      {/* Pipe right highlight */}
      <path
        d="
          M1158 667
          V818
        "
        stroke="#FFDA55"
        strokeWidth="3"
        opacity="0.45"
      />

      {/* Pipe foot */}
      <rect
        x="1091"
        y="835"
        width="95"
        height="21"
        rx="6"
        fill="url(#wt-yellow)"
        stroke="#E1A116"
        strokeWidth="2"
      />

      {/* =================================================
          BOTTOM PLATFORM
      ================================================= */}

      <rect
        x="174"
        y="855"
        width="1045"
        height="48"
        rx="9"
        fill="url(#wt-base)"
      />

      {/* Base top highlight */}
      <path
        d="M184 858H1209"
        stroke="#88634D"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.6"
      />
    </svg>
  );
};

export default GSR_Tank;