import { useId, type SVGProps } from "react";

export interface Water_ConsumptionProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const Water_Consumption = ({
  width = 500,
  height = 400,
  ...props
}: Water_ConsumptionProps) => {
  const id = useId();

  const dropGradient = `${id}-drop`;
  const dropLowerGradient = `${id}-drop-lower`;
  const handGradient = `${id}-hand`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 500 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        {/* Cyan/blue water drop */}
        <linearGradient
          id={dropGradient}
          x1="250"
          y1="72"
          x2="250"
          y2="196"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#29D8F3" />
          <stop offset="0.55" stopColor="#19C9F1" />
          <stop offset="1" stopColor="#08ACEE" />
        </linearGradient>

        {/* Darker blue bottom of drop */}
        <linearGradient
          id={dropLowerGradient}
          x1="220"
          y1="160"
          x2="280"
          y2="210"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#08A8F4" />
          <stop offset="1" stopColor="#058FF0" />
        </linearGradient>

        {/* Off-white hand, visible on white backgrounds */}
        <linearGradient
          id={handGradient}
          x1="145"
          y1="205"
          x2="350"
          y2="315"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#F9FAFB" />
          <stop offset="0.5" stopColor="#F3F4F6" />
          <stop offset="1" stopColor="#E9ECEF" />
        </linearGradient>
      </defs>

      {/* No dark/navy background */}

      {/* =========================================
          WATER DROP
         ========================================= */}

      <path
        d="
          M250 70

          C242 86 220 112 213 130
          C208 143 207 154 210 164

          C215 183 230 195 250 195
          C270 195 285 183 290 164

          C293 153 292 143 287 130
          C280 112 258 86 250 70

          Z
        "
        fill={`url(#${dropGradient})`}
      />

      {/* Darker curved lower section */}
      <path
        d="
          M210 159

          C220 174 235 180 250 180
          C267 180 281 174 290 160

          C291 175 285 186 275 193
          C268 199 259 202 250 202

          C230 202 214 189 210 171

          C209 167 209 163 210 159

          Z
        "
        fill={`url(#${dropLowerGradient})`}
        opacity="0.92"
      />

      {/* Drop highlight */}
      <path
        d="
          M229 162
          C230 174 237 181 246 184
        "
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* =========================================
          HAND
         ========================================= */}

      <path
        d="
          M137 278

          L180 235

          C191 224 205 216 219 215

          C228 214 237 217 246 220

          C252 222 258 223 264 223

          H286

          C296 223 302 228 302 236

          C302 245 296 250 287 250

          H245

          C241 250 238 253 238 257

          C238 261 241 264 245 264

          H287

          C300 264 309 260 318 251

          L351 217

          C358 210 367 209 373 215

          C379 221 378 230 372 237

          L329 280

          C317 292 304 299 285 299

          H219

          C214 299 211 301 207 305

          L172 338

          Z
        "
        fill={`url(#${handGradient})`}
        stroke="#DDE1E5"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />

      {/* Subtle hand highlight */}
      <path
        d="
          M181 238
          C193 227 205 221 219 220
          C228 220 236 223 245 226
        "
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.65"
      />
    </svg>
  );
};

export default Water_Consumption;