import { useId, type SVGProps } from "react";

export interface VillagesProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const Villages = ({
  width = 500,
  height = 370,
  ...props
}: VillagesProps) => {
  const id = useId();

  const wall = `${id}-wall`;
  const brown = `${id}-brown`;
  const orange = `${id}-orange`;
  const red = `${id}-red`;
  const blue = `${id}-blue`;
  const green = `${id}-green`;
  const lime = `${id}-lime`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 500 370"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Slight gray wall for visibility on white backgrounds */}
        <linearGradient
          id={wall}
          x1="180"
          y1="110"
          x2="300"
          y2="300"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#F8F9FA" />
          <stop offset="0.45" stopColor="#F0F2F4" />
          <stop offset="1" stopColor="#E3E6E9" />
        </linearGradient>

        <linearGradient
          id={brown}
          x1="190"
          y1="100"
          x2="320"
          y2="310"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9A5700" />
          <stop offset="0.5" stopColor="#7A4000" />
          <stop offset="1" stopColor="#92510A" />
        </linearGradient>

        <linearGradient
          id={orange}
          x1="250"
          y1="70"
          x2="250"
          y2="135"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFB51C" />
          <stop offset="1" stopColor="#FF9700" />
        </linearGradient>

        <linearGradient
          id={red}
          x1="110"
          y1="150"
          x2="230"
          y2="220"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF2136" />
          <stop offset="1" stopColor="#EE0C2E" />
        </linearGradient>

        <linearGradient
          id={blue}
          x1="270"
          y1="170"
          x2="380"
          y2="225"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#087CFF" />
          <stop offset="1" stopColor="#0065F6" />
        </linearGradient>

        <linearGradient
          id={green}
          x1="120"
          y1="230"
          x2="390"
          y2="300"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#26C500" />
          <stop offset="0.55" stopColor="#15B222" />
          <stop offset="1" stopColor="#35C800" />
        </linearGradient>

        <linearGradient
          id={lime}
          x1="95"
          y1="300"
          x2="405"
          y2="320"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#A5E000" />
          <stop offset="0.5" stopColor="#98DB00" />
          <stop offset="1" stopColor="#A7DE00" />
        </linearGradient>
      </defs>

      {/* BACK HOUSE */}

      <path
        d="
          M214 127
          L262 87
          L310 127
          V235
          H214
          Z
        "
        fill={`url(#${wall})`}
        stroke="#D5DADE"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Brown roof trim */}
      <path
        d="M207 130 L262 83 L317 130"
        fill="none"
        stroke={`url(#${brown})`}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Orange roof */}
      <path
        d="
          M201 121
          L255 75
          C259 71 264 71 269 75
          L323 121
          C328 125 328 130 324 134
          C320 137 316 137 312 133
          L262 91
          L212 133
          C208 137 203 137 199 133
          C195 129 196 125 201 121
          Z
        "
        fill={`url(#${orange})`}
      />

      {/* Back window */}
      <g fill={`url(#${brown})`}>
        <rect x="247" y="116" width="11" height="11" rx="2" />
        <rect x="264" y="116" width="11" height="11" rx="2" />
        <rect x="247" y="133" width="11" height="11" rx="2" />
        <rect x="264" y="133" width="11" height="11" rx="2" />
      </g>

      {/* Back door */}
      <path
        d="
          M244 230
          V180
          C244 166 252 157 262 157
          C272 157 280 166 280 180
          V230
          Z
        "
        fill={`url(#${brown})`}
      />

      {/* BACK VEGETATION */}

      <g fill={`url(#${green})`}>
        <circle cx="126" cy="270" r="16" />
        <circle cx="140" cy="257" r="18" />
        <circle cx="157" cy="271" r="17" />
        <circle cx="118" cy="281" r="14" />
        <circle cx="145" cy="281" r="19" />

        <circle cx="246" cy="229" r="18" />
        <circle cx="264" cy="220" r="19" />
        <circle cx="282" cy="232" r="20" />
        <circle cx="252" cy="248" r="24" />
        <circle cx="278" cy="253" r="22" />

        <circle cx="355" cy="266" r="17" />
        <circle cx="371" cy="256" r="20" />
        <circle cx="390" cy="270" r="17" />
        <circle cx="362" cy="282" r="21" />
        <circle cx="389" cy="282" r="20" />
      </g>

      {/* LEFT HOUSE */}

      <path
        d="
          M135 206
          L186 163
          L237 206
          V300
          H135
          Z
        "
        fill={`url(#${wall})`}
        stroke="#D5DADE"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Brown roof trim */}
      <path
        d="M128 209 L186 159 L244 209"
        fill="none"
        stroke={`url(#${brown})`}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Red roof */}
      <path
        d="
          M120 199
          L178 149
          C183 145 188 145 193 149
          L251 199
          C256 203 256 208 252 212
          C248 216 243 216 238 212
          L186 167
          L133 212
          C128 216 123 216 119 212
          C115 208 115 203 120 199
          Z
        "
        fill={`url(#${red})`}
      />

      {/* Left window */}
      <g fill={`url(#${brown})`}>
        <rect x="173" y="199" width="11" height="11" rx="2" />
        <rect x="190" y="199" width="11" height="11" rx="2" />
        <rect x="173" y="216" width="11" height="11" rx="2" />
        <rect x="190" y="216" width="11" height="11" rx="2" />
      </g>

      {/* Left door */}
      <path
        d="
          M168 300
          V267
          C168 253 176 244 186 244
          C196 244 204 253 204 267
          V300
          Z
        "
        fill={`url(#${brown})`}
      />

      <circle cx="196" cy="279" r="2.7" fill="#FFFFFF" />

      {/* RIGHT HOUSE */}

      <path
        d="
          M270 220
          L316 181
          L362 220
          V300
          H270
          Z
        "
        fill={`url(#${wall})`}
        stroke="#D5DADE"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Brown roof trim */}
      <path
        d="M263 223 L316 177 L369 223"
        fill="none"
        stroke={`url(#${brown})`}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Blue roof */}
      <path
        d="
          M255 212
          L308 167
          C313 163 318 163 323 167
          L376 212
          C381 216 381 222 377 226
          C373 230 368 230 363 226
          L316 185
          L269 226
          C264 230 259 230 255 226
          C251 222 251 216 255 212
          Z
        "
        fill={`url(#${blue})`}
      />

      {/* Right window */}
      <g fill={`url(#${brown})`}>
        <rect x="303" y="213" width="11" height="11" rx="2" />
        <rect x="320" y="213" width="11" height="11" rx="2" />
        <rect x="303" y="230" width="11" height="11" rx="2" />
        <rect x="320" y="230" width="11" height="11" rx="2" />
      </g>

      {/* Right door */}
      <path
        d="
          M298 300
          V272
          C298 257 306 248 316 248
          C326 248 334 257 334 272
          V300
          Z
        "
        fill={`url(#${brown})`}
      />

      <circle cx="325" cy="281" r="2.7" fill="#FFFFFF" />

      {/* FRONT VEGETATION */}

      <g fill={`url(#${green})`}>
        <circle cx="122" cy="284" r="18" />
        <circle cx="137" cy="280" r="20" />
        <circle cx="153" cy="287" r="16" />

        <circle cx="365" cy="281" r="18" />
        <circle cx="383" cy="284" r="20" />
      </g>

      {/* Center lime bushes */}
      <g fill={`url(#${lime})`}>
        <circle cx="239" cy="285" r="17" />
        <circle cx="253" cy="275" r="20" />
        <circle cx="268" cy="287" r="18" />
      </g>

      {/* GRASS BASE */}

      <rect
        x="105"
        y="296"
        width="290"
        height="19"
        rx="9.5"
        fill={`url(#${lime})`}
      />
    </svg>
  );
};

export default Villages;