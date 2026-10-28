import * as React from "react";

type BarsProps = React.SVGProps<SVGSVGElement> & {
  /** Convenience prop: sets both width & height unless those are provided */
  size?: number | string;
  /** Single color for all bars (defaults to currentColor) */
  color?: string;
  /** Optional per-bar colors: [left, middle, right] */
  colors?: [string, string, string];
  /** Optional accessible title */
  title?: string;
};

const Bars: React.FC<BarsProps> = ({
  size = 24,
  color = "currentColor",
  colors,
  title,
  width,
  height,
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;

  const [c1, c2, c3] = colors ?? [color, color, color];

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}

      {/* Background removed: only the bars */}
      <rect x="4" y="12" width="4" height="8" rx="1.2" fill={c1} />
      <rect x="10" y="8" width="4" height="12" rx="1.2" fill={c2} />
      <rect x="16" y="4" width="4" height="16" rx="1.2" fill={c3} />
    </svg>
  );
};

export default Bars;