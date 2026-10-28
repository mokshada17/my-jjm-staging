import React, { useId } from "react";

export type ProcessStatus = "ok" | "warning" | "error" | "offline";

export interface ESR_FlowProps
  extends Omit<React.SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;

  tankValue?: string | number;
  tankUnit?: string;

  flowValue?: string | number;
  flowUnit?: string;

  pressureValue?: string | number;
  pressureUnit?: string;

  rcaValue?: string | number;
  rcaUnit?: string;

  pressureLabel?: string;
  flowLabel?: string;
  rcaLabel?: string;

  bottomStatus?: string;

  pressureStatus?: ProcessStatus;
  flowStatus?: ProcessStatus;
  rcaStatus?: ProcessStatus;

  pipeColor?: string;

  /**
   * Fill for the text drawn on the background (FM / PS / RCA, the bottom status
   * and house labels). The default suits a dark canvas; pass "currentColor" to
   * follow the surrounding text colour, e.g. in a light theme.
   */
  labelColor?: string;

  topHouseLabel?: string;
  middleHouseLabel?: string;
  bottomHouseLabel?: string;
}

const STATUS_COLORS: Record<ProcessStatus, string> = {
  ok: "#20b85a",
  warning: "#f5b82e",
  error: "#ef4444",
  offline: "#7b8794",
};

/* =========================================================
   STATUS INDICATOR
========================================================= */

function StatusDot({
  x,
  y,
  status = "ok",
}: {
  x: number;
  y: number;
  status?: ProcessStatus;
}) {
  return (
    <circle
      cx={x}
      cy={y}
      r={8}
      fill={STATUS_COLORS[status]}
      stroke="#0c5338"
      strokeWidth={1.5}
    />
  );
}

/* =========================================================
   VALUE DISPLAY
========================================================= */

function ReadingBox({
  x,
  y,
  width = 112,
  value,
  unit,
  color = "#59c76b",
}: {
  x: number;
  y: number;
  width?: number;
  value: string | number;
  unit?: string;
  color?: string;
}) {
  const text = unit ? `${value} ${unit}` : `${value}`;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={38}
        rx={3}
        fill="#d7d7d7"
        stroke="#777777"
        strokeWidth={2}
      />

      <rect
        x={x + 6}
        y={y + 5}
        width={width - 12}
        height={28}
        rx={1}
        fill="#f5f5f5"
        stroke="#b3b3b3"
      />

      <text
        x={x + width / 2}
        y={y + 25}
        textAnchor="middle"
        dominantBaseline="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize={14}
        fontWeight={600}
        fill={color}
      >
        {text}
      </text>
    </g>
  );
}

/* =========================================================
   HOUSE
========================================================= */

function House({
  x,
  y,
  label,
  labelColor,
}: {
  x: number;
  y: number;
  label?: string;
  labelColor: string;
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* House */}
      <path
        d="
          M8 26
          L38 3
          L70 26
          V62
          H8
          Z
        "
        fill="#f4eee1"
        stroke="#b87b34"
        strokeWidth={2}
      />

      {/* Roof */}
      <path
        d="
          M2 27
          L38 0
          L76 27
          H65
          L38 9
          L13 27
          Z
        "
        fill="#8c4c13"
      />

      {/* Chimney */}
      <rect
        x={25}
        y={-8}
        width={10}
        height={17}
        fill="#c8c8c8"
      />

      {/* Door */}
      <rect
        x={34}
        y={39}
        width={10}
        height={23}
        fill="#f6f0e6"
        stroke="#9c8067"
      />

      {/* Left window */}
      <rect
        x={14}
        y={36}
        width={9}
        height={14}
        fill="#fafafa"
        stroke="#9c8067"
      />

      <line
        x1={18.5}
        y1={36}
        x2={18.5}
        y2={50}
        stroke="#9c8067"
      />

      {/* Right window */}
      <rect
        x={53}
        y={36}
        width={9}
        height={14}
        fill="#fafafa"
        stroke="#9c8067"
      />

      <line
        x1={57.5}
        y1={36}
        x2={57.5}
        y2={50}
        stroke="#9c8067"
      />

      {label && (
        <text
          x={38}
          y={79}
          textAnchor="middle"
          fontSize={11}
          fontFamily="Arial, Helvetica, sans-serif"
          fill={labelColor}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/* =========================================================
   FLOW METER
========================================================= */

function FlowMeter({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* Meter pipe */}
      <rect
        x={-22}
        y={-10}
        width={44}
        height={20}
        rx={6}
        fill="#176cc7"
        stroke="#1254a3"
        strokeWidth={3}
      />

      {/* Flanges */}
      <rect
        x={-28}
        y={-15}
        width={8}
        height={30}
        rx={2}
        fill="#2381db"
      />

      <rect
        x={20}
        y={-15}
        width={8}
        height={30}
        rx={2}
        fill="#2381db"
      />

      {/* Stem */}
      <rect
        x={-4}
        y={-27}
        width={8}
        height={18}
        fill="#d5dce1"
      />

      {/* Meter head */}
      <ellipse
        cx={0}
        cy={-34}
        rx={17}
        ry={8}
        fill="#eceff1"
        stroke="#747d8a"
        strokeWidth={3}
      />

      <ellipse
        cx={0}
        cy={-34}
        rx={8}
        ry={3}
        fill="#374b5a"
      />
    </g>
  );
}

/* =========================================================
   PRESSURE GAUGE
========================================================= */

function PressureGauge({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {/* Pipe connector */}
      <rect
        x={-5}
        y={13}
        width={10}
        height={14}
        fill="#d8d8d8"
      />

      {/* Gauge frame */}
      <circle
        cx={0}
        cy={0}
        r={18}
        fill="#efefef"
        stroke="#c8c8c8"
        strokeWidth={4}
      />

      {/* Gauge face */}
      <circle
        cx={0}
        cy={0}
        r={13}
        fill="#ffffff"
      />

      {/* Needle */}
      <line
        x1={0}
        y1={0}
        x2={-7}
        y2={-8}
        stroke="#d33737"
        strokeWidth={2}
      />

      <circle
        cx={0}
        cy={0}
        r={2.5}
        fill="#555555"
      />

      {/* Top */}
      <rect
        x={-10}
        y={-28}
        width={20}
        height={5}
        fill="#e9e9e9"
      />
    </g>
  );
}

/* =========================================================
   RCA ANALYZER
========================================================= */

function Analyzer({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect
        x={-17}
        y={-22}
        width={34}
        height={43}
        rx={2}
        fill="#dedede"
        stroke="#808080"
        strokeWidth={3}
      />

      <rect
        x={-11}
        y={-15}
        width={22}
        height={22}
        fill="#f3f3ee"
      />

      <rect
        x={-7}
        y={9}
        width={4}
        height={4}
        fill="#759578"
      />

      <rect
        x={0}
        y={9}
        width={4}
        height={4}
        fill="#759578"
      />

      <rect
        x={7}
        y={9}
        width={4}
        height={4}
        fill="#759578"
      />
    </g>
  );
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function ESR_Flow({
  width = 720,
  height = "auto",

  tankValue = "3.73",
  tankUnit = "LL",

  flowValue = "61.09",
  flowUnit = "m³/h",

  pressureValue = "2.41",
  pressureUnit = "bar",

  rcaValue = "0.00",
  rcaUnit = "mg/l",

  pressureLabel = "PS",
  flowLabel = "FM",
  rcaLabel = "RCA",

  bottomStatus = "ESR 3.73 LL - 1",

  pressureStatus = "ok",
  flowStatus = "ok",
  rcaStatus = "ok",

  pipeColor = "#00eeee",

  labelColor = "#eeeeee",

  topHouseLabel,
  middleHouseLabel,
  bottomHouseLabel,

  ...svgProps
}: ESR_FlowProps) {
  const uid = useId().replace(/:/g, "");

  const tankGradient = `${uid}-tank`;
  const tankTopGradient = `${uid}-tank-top`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 720 345"
      width={width}
      height={height}
      role="img"
      aria-label="Water distribution process diagram"
      {...svgProps}
    >
      <defs>
        {/* Tank gradient */}
        <linearGradient
          id={tankGradient}
          x1="90"
          y1="0"
          x2="205"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          <stop
            offset="0"
            stopColor="#408b89"
          />

          <stop
            offset=".45"
            stopColor="#83c7c3"
          />

          <stop
            offset="1"
            stopColor="#326d70"
          />
        </linearGradient>

        {/* Tank top gradient */}
        <linearGradient
          id={tankTopGradient}
          x1="95"
          y1="25"
          x2="190"
          y2="65"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#78bbb7" />

          <stop
            offset=".5"
            stopColor="#4a9491"
          />

          <stop
            offset="1"
            stopColor="#286568"
          />
        </linearGradient>
      </defs>

      {/*
        No background rectangle.
        The SVG itself remains transparent.
      */}

      {/* =================================================
          LEFT INLET PIPE
      ================================================= */}

      <path
        d="
          M8 215
          H18
          C24 215 27 211 27 204
          V48
          C27 41 31 38 38 38
          H94
        "
        fill="none"
        stroke="#d2d2d2"
        strokeWidth={9}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Pipe highlight */}
      <path
        d="
          M8 215
          H18
          C24 215 27 211 27 204
          V48
          C27 41 31 38 38 38
          H94
        "
        fill="none"
        stroke="#eeeeee"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.7}
      />

      {/* =================================================
          TANK
      ================================================= */}

      <g>
        {/* Tank body */}
        <path
          d="
            M94 42
            C94 30 115 24 143 24
            C171 24 193 30 193 42
            V145
            C193 157 171 163 143 163
            C115 163 94 157 94 145
            Z
          "
          fill={`url(#${tankGradient})`}
        />

        {/* Tank top */}
        <ellipse
          cx={143}
          cy={42}
          rx={49}
          ry={18}
          fill={`url(#${tankTopGradient})`}
        />

        {/* Top opening */}
        <ellipse
          cx={143}
          cy={39}
          rx={19}
          ry={7}
          fill="#326e70"
        />

        {/* Small top pipe */}
        <rect
          x={139}
          y={12}
          width={9}
          height={13}
          fill="#75b7b2"
        />

        {/* Tank reading */}
        <rect
          x={101}
          y={85}
          width={79}
          height={39}
          fill="none"
          stroke="#a6d0cd"
          strokeWidth={1.5}
        />

        <text
          x={140.5}
          y={105}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize={13}
          fontWeight={600}
          fill="#e8eeee"
        >
          {tankValue} {tankUnit}
        </text>

        {/* ===============================================
            TANK LOWER SUPPORT
        =============================================== */}

        <g
          stroke="#3f7d80"
          strokeWidth={4}
        >
          <line
            x1={95}
            y1={145}
            x2={95}
            y2={202}
          />

          <line
            x1={111}
            y1={151}
            x2={111}
            y2={203}
          />

          <line
            x1={127}
            y1={156}
            x2={127}
            y2={198}
          />

          <line
            x1={159}
            y1={156}
            x2={159}
            y2={198}
          />

          <line
            x1={176}
            y1={152}
            x2={176}
            y2={200}
          />

          <line
            x1={191}
            y1={145}
            x2={191}
            y2={199}
          />
        </g>

        {/* Bottom tank support ring */}
        <path
          d="
            M96 187
            C120 195 165 195 192 186
          "
          fill="none"
          stroke="#477f81"
          strokeWidth={4}
        />

        {/* Tank cyan outlet */}
        <path
          d="
            M134 148
            V200
            Q134 210 145 210
            H242
          "
          fill="none"
          stroke={pipeColor}
          strokeWidth={10}
        />

        {/* =================================================
            CORRECTED TANK LADDER
        ================================================= */}

        <g
          fill="none"
          stroke="#7e8e91"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/*
            Left rail begins on the tank wall and moves
            outward toward the vertical ladder section.
          */}
          <path
            d="
              M181 49
              L196 85
              L196 194
            "
          />

          {/*
            Right rail follows the same slope and then
            continues vertically.
          */}
          <path
            d="
              M190 43
              L210 83
              L210 194
            "
          />

          {/* Slanted upper rung */}
          <path d="M187 65 L201 65" />

          {/* Main ladder rungs */}
          <path d="M195 89 H210" />
          <path d="M196 108 H210" />
          <path d="M196 127 H210" />
          <path d="M196 146 H210" />
          <path d="M196 165 H210" />
          <path d="M196 184 H210" />

          {/* Ladder feet */}
          <path d="M196 194 V203" />
          <path d="M210 194 V203" />
        </g>

        {/* Tank feet */}
        <line
          x1={100}
          y1={190}
          x2={100}
          y2={207}
          stroke="#477f81"
          strokeWidth={3}
        />

        <line
          x1={190}
          y1={190}
          x2={190}
          y2={207}
          stroke="#477f81"
          strokeWidth={3}
        />
      </g>

      {/* =================================================
          DISTRIBUTION PIPE NETWORK
      ================================================= */}

      {/* Flow meter to junction */}
      <path
        d="M293 210 H354"
        stroke={pipeColor}
        strokeWidth={10}
        fill="none"
      />

      {/* Top branch */}
      <path
        d="
          M354 210
          V74
          Q354 63 365 63
          H634
        "
        stroke={pipeColor}
        strokeWidth={11}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Middle branch */}
      <path
        d="M354 210 H634"
        stroke={pipeColor}
        strokeWidth={10}
        fill="none"
      />

      {/* Bottom branch */}
      <path
        d="
          M354 210
          V288
          Q354 299 365 299
          H634
        "
        stroke={pipeColor}
        strokeWidth={11}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* =================================================
          FLOW METER
      ================================================= */}

      <FlowMeter
        x={268}
        y={210}
      />

      <StatusDot
        x={244}
        y={160}
        status={flowStatus}
      />

      <text
        x={258}
        y={164}
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize={14}
        fontWeight={700}
        fill={labelColor}
      >
        {flowLabel}
      </text>

      <ReadingBox
        x={211}
        y={230}
        width={113}
        value={flowValue}
        unit={flowUnit}
      />

      {/* =================================================
          PRESSURE SENSOR
      ================================================= */}

      <StatusDot
        x={390}
        y={36}
        status={pressureStatus}
      />

      <text
        x={407}
        y={41}
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize={14}
        fontWeight={700}
        fill={labelColor}
      >
        {pressureLabel}
      </text>

      <PressureGauge
        x={482}
        y={29}
      />

      <ReadingBox
        x={428}
        y={81}
        width={110}
        value={pressureValue}
        unit={pressureUnit}
      />

      {/* =================================================
          RCA ANALYZER
      ================================================= */}

      <StatusDot
        x={451}
        y={159}
        status={rcaStatus}
      />

      <text
        x={466}
        y={164}
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize={14}
        fontWeight={700}
        fill={labelColor}
      >
        {rcaLabel}
      </text>

      <Analyzer
        x={482}
        y={198}
      />

      <ReadingBox
        x={426}
        y={225}
        width={110}
        value={rcaValue}
        unit={rcaUnit}
      />

      {/* =================================================
          HOUSES
      ================================================= */}

      <House
        x={626}
        y={24}
        label={topHouseLabel}
        labelColor={labelColor}
      />

      <House
        x={626}
        y={171}
        label={middleHouseLabel}
        labelColor={labelColor}
      />

      <House
        x={626}
        y={258}
        label={bottomHouseLabel}
        labelColor={labelColor}
      />

      {/* =================================================
          BOTTOM STATUS
      ================================================= */}

      <text
        x={360}
        y={338}
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize={12}
        fontWeight={700}
        fill={labelColor}
      >
        {bottomStatus}
      </text>
    </svg>
  );
}