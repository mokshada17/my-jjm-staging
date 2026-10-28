import React, { useId } from 'react';

export interface SmartPipeSensorProps extends React.SVGProps<SVGSVGElement> {
  /** Width of the SVG element. Default: 355 */
  width?: number | string;
  /** Height of the SVG element. Default: 203 */
  height?: number | string;
  /** Primary accent color used for borders, highlights, and wireless waves. Default: '#38bdf8' */
  color?: string;
  /** Pipe cylinder base color. Default: '#e0f2fe' */
  pipeColor?: string;
  /** Border / stroke color for pipe and components. Overrides `color` if provided. */
  strokeColor?: string;
  /** Base fill color for the digital LCD display screen. Default: '#7dd3fc' */
  screenColor?: string;
  /** Accent / shaded gradient color for the digital LCD display. Default: '#0284c7' */
  screenAccentColor?: string;
  /** Base fill color for the transmitter meter casing. Default: '#ffffff' */
  casingColor?: string;
  /** Color for the wireless telemetry waves. Overrides `color` if provided. */
  signalColor?: string;
  /** Stroke width for the component borders. Default: 2.5 */
  strokeWidth?: number | string;
  /** Whether to show the wireless telemetry waves above the meter. Default: true */
  showSignals?: boolean;
  /** Accessible title for screen readers. Default: 'Smart Pipeline Sensor' */
  title?: string;
}

/**
 * SmartPipeSensorIcon
 *
 * Vector illustration of an IoT-enabled smart pipeline sensor / water flow meter
 * with digital display unit, mounting stem, bolted pipe flanges, hex coupling fittings,
 * and wireless telemetry broadcast waves.
 *
 * Background is completely transparent and colors are dynamically customizable.
 */
export const SmartPipeSensorIcon: React.FC<SmartPipeSensorProps> = ({
  width = 355,
  height = 203,
  color = '#38bdf8',
  pipeColor = '#e0f2fe',
  strokeColor,
  screenColor = '#7dd3fc',
  screenAccentColor = '#0284c7',
  casingColor = '#ffffff',
  signalColor,
  strokeWidth = 2.5,
  showSignals = true,
  title = 'Smart Pipeline Sensor',
  className,
  style,
  ...props
}) => {
  const rawId = useId();
  const id = rawId.replace(/[^a-zA-Z0-9-_]/g, '');

  const resolvedStroke = strokeColor || color;
  const resolvedSignal = signalColor || color;

  const pipeGradId = `pipe-grad-${id}`;
  const flangeGradId = `flange-grad-${id}`;
  const casingGradId = `casing-grad-${id}`;
  const screenGradId = `screen-grad-${id}`;
  const stemGradId = `stem-grad-${id}`;
  const nutTopGradId = `nut-top-${id}`;
  const nutMidGradId = `nut-mid-${id}`;
  const nutBotGradId = `nut-bot-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 355 203"
      width={width}
      height={height}
      fill="none"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      aria-label={title}
      role="img"
      {...props}
    >
      {title && <title>{title}</title>}

      <defs>
        {/* Pipe Cylindrical Lighting Gradient */}
        <linearGradient id={pipeGradId} x1="0" y1="144" x2="0" y2="174" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="20%" stopColor={pipeColor} />
          <stop offset="65%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor={resolvedStroke} stopOpacity="0.75" />
        </linearGradient>

        {/* Flange Cylindrical Gradient */}
        <linearGradient id={flangeGradId} x1="0" y1="128" x2="0" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="20%" stopColor={pipeColor} />
          <stop offset="60%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor={resolvedStroke} stopOpacity="0.8" />
        </linearGradient>

        {/* Coupling Nut Facet Gradients */}
        <linearGradient id={nutTopGradId} x1="0" y1="136" x2="0" y2="150" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={pipeColor} />
        </linearGradient>
        <linearGradient id={nutMidGradId} x1="0" y1="150" x2="0" y2="164" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={pipeColor} />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
        <linearGradient id={nutBotGradId} x1="0" y1="164" x2="0" y2="182" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="100%" stopColor={resolvedStroke} stopOpacity="0.75" />
        </linearGradient>

        {/* Meter Casing Gradient */}
        <linearGradient id={casingGradId} x1="160" y1="58" x2="230" y2="124" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={casingColor} />
          <stop offset="40%" stopColor="#f0f9ff" />
          <stop offset="100%" stopColor="#dbeafe" />
        </linearGradient>

        {/* Inner Digital Display Screen Gradient */}
        <linearGradient id={screenGradId} x1="168" y1="66" x2="222" y2="116" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={screenColor} />
          <stop offset="50%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor={screenAccentColor} />
        </linearGradient>

        {/* Vertical Stem Gradient */}
        <linearGradient id={stemGradId} x1="186" y1="128" x2="204" y2="128" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={pipeColor} />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#bae6fd" />
        </linearGradient>
      </defs>

      {/* 1. Wireless Telemetry Waves (Wi-Fi) */}
      {showSignals && (
        <g id="wireless-signals" stroke={resolvedSignal} strokeLinecap="round" fill="none">
          {/* Top Signal Arc (Full, smoothly rounded curve with ample clearance) */}
          <path d="M 166 27 A 36 36 0 0 1 224 27" strokeWidth={6} />
          {/* Middle Signal Arc */}
          <path d="M 177 35 A 23 23 0 0 1 213 35" strokeWidth={5.5} />
          {/* Center Dot / Small Arc */}
          <path d="M 188 42 A 10 10 0 0 1 202 42" strokeWidth={5} />
        </g>
      )}

      {/* 2. Left End Coupling Nut (Hex Fitting) */}
      <g id="left-coupling-nut">
        <path d="M 50 136 L 74 136 L 74 150 L 45 150 L 45 142 Z" fill={`url(#${nutTopGradId})`} />
        <path d="M 45 150 L 74 150 L 74 164 L 45 164 Z" fill={`url(#${nutMidGradId})`} />
        <path d="M 45 164 L 74 164 L 74 182 L 50 182 L 45 176 Z" fill={`url(#${nutBotGradId})`} />
        <path
          d="M 50 136 L 74 136 L 74 182 L 50 182 L 45 176 L 45 142 Z"
          stroke={resolvedStroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <line x1="45" y1="150" x2="74" y2="150" stroke="#7dd3fc" strokeWidth="1.5" />
        <line x1="45" y1="164" x2="74" y2="164" stroke="#7dd3fc" strokeWidth="1.5" />
      </g>

      {/* 3. Left Pipe Flange (Bolted Collar) */}
      <g id="left-flange">
        <rect
          x="74"
          y="128"
          width="20"
          height="62"
          rx="6"
          fill={`url(#${flangeGradId})`}
          stroke={resolvedStroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <line x1="84" y1="129" x2="84" y2="189" stroke="#7dd3fc" strokeWidth="1.5" />
        <ellipse cx="84" cy="133" rx="6" ry="2" fill="#ffffff" opacity={0.85} />
      </g>

      {/* 4. Horizontal Pipe & Center T-Joint Stem */}
      <g id="pipe-assembly">
        <path
          d="M 94 144 L 180 144 Q 186 144 186 138 L 186 128 L 204 128 L 204 138 Q 204 144 210 144 L 278 144 L 278 174 L 94 174 Z"
          fill={`url(#${pipeGradId})`}
          stroke={resolvedStroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <line x1="95" y1="148" x2="180" y2="148" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity={0.9} />
        <line x1="210" y1="148" x2="277" y2="148" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity={0.9} />
        <rect x="186" y="128" width="18" height="15" fill={`url(#${stemGradId})`} />
      </g>

      {/* 5. Right Pipe Flange (Bolted Collar) */}
      <g id="right-flange">
        <rect
          x="278"
          y="128"
          width="20"
          height="62"
          rx="6"
          fill={`url(#${flangeGradId})`}
          stroke={resolvedStroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <line x1="288" y1="129" x2="288" y2="189" stroke="#7dd3fc" strokeWidth="1.5" />
        <ellipse cx="288" cy="133" rx="6" ry="2" fill="#ffffff" opacity={0.85} />
      </g>

      {/* 6. Right End Coupling Nut (Hex Fitting) */}
      <g id="right-coupling-nut">
        <path d="M 297 136 L 321 136 L 326 142 L 326 150 L 297 150 Z" fill={`url(#${nutTopGradId})`} />
        <path d="M 297 150 L 326 150 L 326 164 L 297 164 Z" fill={`url(#${nutMidGradId})`} />
        <path d="M 297 164 L 326 164 L 326 176 L 321 182 L 297 182 Z" fill={`url(#${nutBotGradId})`} />
        <path
          d="M 297 136 L 321 136 L 326 142 L 326 176 L 321 182 L 297 182 Z"
          stroke={resolvedStroke}
          strokeWidth={strokeWidth}
          strokeLinejoin="round"
        />
        <line x1="297" y1="150" x2="326" y2="150" stroke="#7dd3fc" strokeWidth="1.5" />
        <line x1="297" y1="164" x2="326" y2="164" stroke="#7dd3fc" strokeWidth="1.5" />
      </g>

      {/* 7. Mounting Collar & Foot Bracket */}
      <g id="meter-mount">
        <rect
          x="180"
          y="123"
          width="30"
          height="6"
          rx="2"
          fill="#bae6fd"
          stroke={resolvedStroke}
          strokeWidth={1.8}
        />
        <rect
          x="170"
          y="122"
          width="7"
          height="5"
          rx="1.5"
          fill="#bae6fd"
          stroke={resolvedStroke}
          strokeWidth={1.5}
        />
        <rect
          x="213"
          y="122"
          width="7"
          height="5"
          rx="1.5"
          fill="#bae6fd"
          stroke={resolvedStroke}
          strokeWidth={1.5}
        />
      </g>

      {/* 8. Smart Meter / IoT Transmitter Housing */}
      <g id="meter-housing">
        {/* Right Sensor/Cable Port or Button */}
        <rect
          x="230"
          y="88"
          width="4"
          height="10"
          rx="2"
          fill={resolvedStroke}
          stroke={screenAccentColor}
          strokeWidth={1.2}
        />
        {/* Outer Rounded Casing */}
        <rect
          x="160"
          y="58"
          width="70"
          height="66"
          rx="14"
          fill={`url(#${casingGradId})`}
          stroke={resolvedStroke}
          strokeWidth={3}
          strokeLinejoin="round"
        />
        {/* Inner Digital Display Screen */}
        <rect
          x="168"
          y="66"
          width="54"
          height="50"
          rx="8"
          fill={`url(#${screenGradId})`}
          stroke={screenAccentColor}
          strokeWidth={1.8}
        />
        {/* Screen Glass Corner Specular Reflection */}
        <path
          d="M 214 70 L 218 70 Q 220 70 220 72 L 220 78"
          stroke="#ffffff"
          strokeWidth={2.2}
          strokeLinecap="round"
          fill="none"
          opacity={0.9}
        />
      </g>
    </svg>
  );
};

export default SmartPipeSensorIcon;
