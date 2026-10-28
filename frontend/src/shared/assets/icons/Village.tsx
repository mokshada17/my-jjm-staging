import { useId, type SVGProps } from "react";

export interface VillageProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const Village = ({
  width = 500,
  height = 400,
  ...props
}: VillageProps) => {
  const id = useId();

  const fieldId = `${id}-field`;
  const backFieldId = `${id}-back-field`;
  const houseId = `${id}-house`;
  const roofId = `${id}-roof`;
  const doorId = `${id}-door`;
  const sunId = `${id}-sun`;
  const bushId = `${id}-bush`;

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
        {/* Main foreground field */}
        <linearGradient
          id={fieldId}
          x1="80"
          y1="320"
          x2="430"
          y2="350"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#12CF62" />
          <stop offset="0.38" stopColor="#65DD36" />
          <stop offset="0.72" stopColor="#D3EC13" />
          <stop offset="1" stopColor="#FFF000" />
        </linearGradient>

        {/* Rear field */}
        <linearGradient
          id={backFieldId}
          x1="260"
          y1="260"
          x2="440"
          y2="280"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#8DE522" />
          <stop offset="0.55" stopColor="#DAEC0A" />
          <stop offset="1" stopColor="#FFF000" />
        </linearGradient>

        {/* House wall */}
        <linearGradient
          id={houseId}
          x1="180"
          y1="150"
          x2="330"
          y2="285"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#9AB9DC" />
          <stop offset="0.52" stopColor="#87A8CE" />
          <stop offset="1" stopColor="#7598C0" />
        </linearGradient>

        {/* Blue roof */}
        <linearGradient
          id={roofId}
          x1="160"
          y1="130"
          x2="370"
          y2="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#3F70AA" />
          <stop offset="0.5" stopColor="#36669E" />
          <stop offset="1" stopColor="#2D5788" />
        </linearGradient>

        {/* Doors */}
        <linearGradient
          id={doorId}
          x1="200"
          y1="215"
          x2="370"
          y2="290"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#304F70" />
          <stop offset="1" stopColor="#1B344E" />
        </linearGradient>

        {/* Sun */}
        <radialGradient
          id={sunId}
          cx="0"
          cy="0"
          r="1"
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(166 69) rotate(48) scale(64)"
        >
          <stop offset="0" stopColor="#FFD235" />
          <stop offset="1" stopColor="#FFBB00" />
        </radialGradient>

        {/* Bush */}
        <linearGradient
          id={bushId}
          x1="78"
          y1="240"
          x2="125"
          y2="285"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#12D85B" />
          <stop offset="1" stopColor="#13BD50" />
        </linearGradient>
      </defs>

      {/* No dark/navy background */}

      {/* =====================================================
          SUN
         ===================================================== */}

      <circle
        cx="165"
        cy="70"
        r="34"
        fill={`url(#${sunId})`}
      />

      {/* =====================================================
          RIGHT / REAR HOUSE
         ===================================================== */}

      {/* House wall */}
      <path
        d="
          M296 145
          L361 101
          L425 145
          V235
          L296 246
          Z
        "
        fill={`url(#${houseId})`}
      />

      {/* Roof */}
      <path
        d="
          M280 148
          L361 91

          C364 89 367 89 370 91

          L447 145

          C451 148 452 154 449 158
          C446 161 442 161 438 159

          L361 107
          L287 158

          C283 161 278 160 276 156
          C274 153 276 150 280 148
          Z
        "
        fill={`url(#${roofId})`}
      />

      {/* Right house door */}
      <path
        d="
          M338 237
          V191

          C338 172 351 160 361 160
          C374 160 386 173 386 191

          V233
          Z
        "
        fill={`url(#${doorId})`}
      />

      {/* Door dark arch/border */}
      <path
        d="
          M335 238
          V190

          C335 171 346 157 361 157
          C376 157 389 172 389 190

          V233
        "
        fill="none"
        stroke="#091534"
        strokeWidth="6"
      />

      {/* =====================================================
          LEFT / FRONT HOUSE
         ===================================================== */}

      <path
        d="
          M135 198
          L199 155
          L263 198
          V278

          C220 273 177 274 135 282

          Z
        "
        fill={`url(#${houseId})`}
      />

      {/* Left roof */}
      <path
        d="
          M119 201
          L197 145

          C200 143 202 143 205 145

          L279 198

          C283 201 284 206 281 209
          C278 212 275 212 271 209

          L199 159
          L126 210

          C122 213 118 212 116 208
          C114 205 116 202 119 201
          Z
        "
        fill={`url(#${roofId})`}
      />

      {/* Left door */}
      <path
        d="
          M176 276
          V238

          C176 220 187 208 199 208
          C212 208 223 220 223 238

          V275
          Z
        "
        fill={`url(#${doorId})`}
      />

      {/* Door arch */}
      <path
        d="
          M173 277
          V237

          C173 218 184 205 199 205
          C214 205 226 219 226 237

          V276
        "
        fill="none"
        stroke="#091534"
        strokeWidth="6"
      />

      {/* =====================================================
          GREEN BUSH
         ===================================================== */}

      <path
        d="
          M82 285
          V274

          C82 262 90 253 101 253

          C96 235 108 223 121 223
          C127 223 132 225 137 229

          V277
          Z
        "
        fill={`url(#${bushId})`}
      />

      {/* =====================================================
          REAR FIELD
         ===================================================== */}

      <path
        d="
          M271 249

          C330 239 388 234 451 234

          V307

          C393 286 333 273 271 269

          Z
        "
        fill={`url(#${backFieldId})`}
      />

      {/* =====================================================
          MAIN FOREGROUND FIELD
         ===================================================== */}

      <path
        d="
          M82 294

          C205 267 333 273 451 317

          V367

          C451 370 449 371 446 371

          H85

          C83 371 82 370 82 367

          Z
        "
        fill={`url(#${fieldId})`}
      />
    </svg>
  );
};

export default Village;