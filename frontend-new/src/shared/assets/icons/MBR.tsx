import { useId, type SVGProps } from "react";

export interface MBRProps
  extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

const MBR = ({
  width = 500,
  height = 500,
  ...props
}: MBRProps) => {
  const uid = useId();

  const badgeId = `${uid}-badge`;
  const greenLidId = `${uid}-green-lid`;
  const greenRimId = `${uid}-green-rim`;
  const bowlId = `${uid}-bowl`;
  const towerId = `${uid}-tower`;
  const bushesId = `${uid}-bushes`;

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
        {/* White circular badge */}
        <linearGradient
          id={badgeId}
          x1="250"
          y1="55"
          x2="250"
          y2="440"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#F6F7F8" />
        </linearGradient>

        {/* Green top */}
        <linearGradient
          id={greenLidId}
          x1="250"
          y1="100"
          x2="250"
          y2="172"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D0EAA0" />
          <stop offset="0.55" stopColor="#BDD987" />
          <stop offset="1" stopColor="#A6CD68" />
        </linearGradient>

        {/* Green lower lip */}
        <linearGradient
          id={greenRimId}
          x1="250"
          y1="145"
          x2="250"
          y2="180"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#91C14B" />
          <stop offset="1" stopColor="#75A92E" />
        </linearGradient>

        {/* Gray funnel/bowl */}
        <linearGradient
          id={bowlId}
          x1="152"
          y1="170"
          x2="348"
          y2="212"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9EA5A3" />
          <stop offset="0.25" stopColor="#BEC4C2" />
          <stop offset="0.52" stopColor="#B0B6B4" />
          <stop offset="0.78" stopColor="#C6CBC9" />
          <stop offset="1" stopColor="#929A97" />
        </linearGradient>

        {/* Tower */}
        <linearGradient
          id={towerId}
          x1="178"
          y1="200"
          x2="322"
          y2="414"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#A8AFAC" />
          <stop offset="0.2" stopColor="#C3C8C6" />
          <stop offset="0.45" stopColor="#AEB4B2" />
          <stop offset="0.66" stopColor="#C7CCCA" />
          <stop offset="0.82" stopColor="#ADB3B1" />
          <stop offset="1" stopColor="#929A97" />
        </linearGradient>

        <linearGradient
          id={bushesId}
          x1="170"
          y1="365"
          x2="335"
          y2="448"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#D0EF1E" />
          <stop offset="0.48" stopColor="#AFDC00" />
          <stop offset="1" stopColor="#76B600" />
        </linearGradient>
      </defs>

      {/* =====================================================
          WHITE BADGE
          Navy rectangular background removed
         ===================================================== */}

      <path
        d="
          M250 55
          C175 55 110 105 82 172

          H89
          C104 172 115 183 115 198
          C115 213 104 224 89 224
          H67

          C65 233 65 242 65 250

          C65 352 148 435 250 435
          C352 435 435 352 435 250

          C435 241 434 232 433 224

          H390
          C375 224 364 213 364 198
          C364 183 375 172 390 172
          H418

          C390 105 325 55 250 55
          Z
        "
        fill={`url(#${badgeId})`}
        stroke="#E5E7EA"
        strokeWidth="1.5"
      />

      {/* =====================================================
          VERTICAL TOWER
          This goes BEHIND the large funnel.
         ===================================================== */}

      <path
        d="
          M178 201
          C196 194 221 191 250 191
          C279 191 304 194 322 201

          V401

          C307 408 282 412 250 412
          C218 412 193 408 178 401

          Z
        "
        fill={`url(#${towerId})`}
      />

      {/* Tower left shade */}
      <path
        d="
          M178 203
          C184 201 191 199 199 198
          V403
          C190 402 184 400 178 397
          Z
        "
        fill="#7F8784"
        opacity="0.17"
      />

      {/* Tower light stripe */}
      <path
        d="M202 197 H220 V407 H202Z"
        fill="#FFFFFF"
        opacity="0.12"
      />

      {/* Center-right highlight */}
      <path
        d="M264 194 H279 V408 H264Z"
        fill="#FFFFFF"
        opacity="0.18"
      />

      {/* Right shade */}
      <path
        d="M295 197 H310 V404 H295Z"
        fill="#7D8582"
        opacity="0.13"
      />

      {/* =====================================================
          LARGE GRAY FUNNEL / BOWL

          This is the key shape from the reference.
          The TOP is almost as wide as the green lid.
          The BOTTOM narrows into the tower.
         ===================================================== */}

      <path
        d="
          M151 168

          C151 160 161 154 177 150

          C196 145 221 142 250 142
          C279 142 304 145 323 150

          C339 154 349 160 349 168

          C349 175 342 182 333 191

          L316 208

          C300 200 277 196 250 196
          C223 196 200 200 184 208

          L167 191

          C158 182 151 175 151 168

          Z
        "
        fill={`url(#${bowlId})`}
      />

      {/* Left triangular funnel shadow */}
      <path
        d="
          M151 168
          C151 162 159 156 173 152

          L210 198

          C199 200 190 203 184 208

          L167 191

          C158 182 151 175 151 168
          Z
        "
        fill="#7C8582"
        opacity="0.28"
      />

      {/* Right triangular highlight */}
      <path
        d="
          M349 168
          C349 162 341 156 327 152

          L290 198

          C301 200 310 203 316 208

          L333 191

          C342 182 349 175 349 168
          Z
        "
        fill="#FFFFFF"
        opacity="0.14"
      />

      {/* Bottom neck/rim where funnel joins tower */}
      <path
        d="
          M184 207
          C201 198 224 194 250 194
          C276 194 299 198 316 207
        "
        stroke="#8E9693"
        strokeWidth="9"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* =====================================================
          GREEN TOP / FUNNEL MOUTH

          This is NOT a separate cylinder anymore.

          It consists of:
          1. large green elliptical top
          2. thin curved green lower lip
          3. gray funnel immediately below it
         ===================================================== */}

      {/* Thin green lower rim */}
      <path
        d="
          M144 139

          C144 129 154 121 170 115
          C189 107 217 103 250 103
          C283 103 311 107 330 115
          C346 121 356 129 356 139

          V166

          C356 175 346 181 331 185
          C311 191 283 194 250 194
          C217 194 189 191 169 185
          C154 181 144 175 144 166

          Z
        "
        fill={`url(#${greenRimId})`}
      />

      {/* Gray funnel overlays the majority of the lower green
          section so only the thin green rim remains visible */}
      <path
        d="
          M151 169
          C155 178 162 185 169 191
          L184 208

          C200 200 223 196 250 196
          C277 196 300 200 316 208

          L331 191
          C338 185 345 178 349 169

          C329 157 293 151 250 151
          C207 151 171 157 151 169

          Z
        "
        fill={`url(#${bowlId})`}
      />

      {/* Re-apply funnel shadows on visible section */}
      <path
        d="
          M151 169
          C157 181 165 188 184 208
          C192 204 200 201 210 199
          L173 160
          C163 163 156 166 151 169
          Z
        "
        fill="#7E8784"
        opacity="0.27"
      />

      <path
        d="
          M349 169
          C343 181 335 188 316 208
          C308 204 300 201 290 199
          L327 160
          C337 163 344 166 349 169
          Z
        "
        fill="#FFFFFF"
        opacity="0.13"
      />

      {/* Green top ellipse LAST so its front edge is clean */}
      <ellipse
        cx="250"
        cy="139"
        rx="106"
        ry="43"
        fill={`url(#${greenLidId})`}
      />

      {/* Subtle top highlight */}
      <ellipse
        cx="238"
        cy="128"
        rx="76"
        ry="27"
        fill="#E4F3BB"
        opacity="0.15"
      />

      {/* Green front lip visible underneath top ellipse */}
      <path
        d="
          M144 139

          C151 153 193 163 250 163
          C307 163 349 153 356 139

          V166

          C347 151 306 143 250 143
          C194 143 153 151 144 166

          Z
        "
        fill="#80B539"
        opacity="0.72"
      />

      {/* =====================================================
          LADDER
         ===================================================== */}

      <g
        stroke="#3F4140"
        strokeWidth="6"
        strokeLinecap="round"
      >
        <path d="M213 185 V409" />
        <path d="M246 185 V409" />

        <path d="M214 205 H245" />
        <path d="M214 226 H245" />
        <path d="M214 247 H245" />
        <path d="M214 268 H245" />
        <path d="M214 289 H245" />
        <path d="M214 310 H245" />
        <path d="M214 331 H245" />
        <path d="M214 352 H245" />
        <path d="M214 373 H245" />
        <path d="M214 394 H245" />
      </g>

      {/* =====================================================
          BUSHES
         ===================================================== */}

      <circle cx="301" cy="363" r="25" fill="#B9E416" />
      <circle cx="326" cy="385" r="23" fill="#B1DF0D" />
      <circle cx="343" cy="406" r="23" fill="#A5D608" />

      <circle cx="277" cy="389" r="28" fill="#82BE00" />

      <circle cx="191" cy="407" r="25" fill="#C9EC18" />
      <circle cx="219" cy="415" r="29" fill="#BEE610" />
      <circle cx="251" cy="402" r="29" fill="#B4E00B" />

      <path
        d="
          M145 421

          C151 409 164 402 177 403
          C177 387 189 378 202 382
          C210 367 228 368 238 380
          C247 366 270 366 280 382
          C292 373 310 378 315 393
          C330 390 344 400 345 414
          C354 414 359 420 362 427

          C327 441 290 448 250 448
          C210 448 174 438 145 421

          Z
        "
        fill={`url(#${bushesId})`}
      />
    </svg>
  );
};

export default MBR;