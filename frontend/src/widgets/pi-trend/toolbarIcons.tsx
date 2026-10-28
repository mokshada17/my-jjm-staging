/**
 * The popup trend toolbar glyphs, drawn after PI Vision's: small axis frames
 * holding the thing each button switches to.
 */
import type { SVGProps } from "react";

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 20 16"
      width="1.25rem"
      height="1rem"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      aria-hidden="true"
      {...props}
    />
  );
}

/** Stacked axes: one per trace. */
export const MultipleScalesIcon = () => (
  <Icon>
    <path d="M3 2v12h14M7 2v12M11 2v12M2 5h2M2 9h2M6 5h2M6 9h2M10 5h2M10 9h2" />
  </Icon>
);

export const SingleScaleIcon = () => (
  <Icon>
    <path d="M3 2v12h15" />
  </Icon>
);

export const AutorangeIcon = () => (
  <Icon>
    <path d="M2 2v12h16M4 12l4-9 4 9 2-3" />
  </Icon>
);

export const DatabaseScaleIcon = () => (
  <Icon>
    <path d="M2 2v12h16M4 10l3-3 3 2 3-2 4 1" />
  </Icon>
);

export const CustomScaleIcon = () => (
  <Icon>
    <path d="M2 2v12h16M4 11l3-6 3 5 2-2" />
    <path d="M13 14l1-3 4-5 1.5 1.2-4 5z" />
  </Icon>
);

export const LineIcon = () => (
  <Icon>
    <path d="M2 2v12h16" strokeDasharray="1.2 1.6" />
    <path d="M4 6l4 6 3-4 3 2 3-3" />
  </Icon>
);

export const LineMarkersIcon = () => (
  <Icon>
    <path d="M2 2v12h16" strokeDasharray="1.2 1.6" />
    <path d="M4 5l4 6 3-4 3 3 3-4" />
    <g fill="currentColor" stroke="none">
      <circle cx={4} cy={5} r={1.6} />
      <circle cx={8} cy={11} r={1.6} />
      <circle cx={11} cy={7} r={1.6} />
      <circle cx={14} cy={10} r={1.6} />
      <circle cx={17} cy={6} r={1.6} />
    </g>
  </Icon>
);

export const MarkersIcon = () => (
  <Icon>
    <path d="M2 2v12h16" strokeDasharray="1.2 1.6" />
    <g fill="currentColor" stroke="none">
      <circle cx={5} cy={5} r={1.6} />
      <circle cx={8} cy={11} r={1.6} />
      <circle cx={12} cy={8} r={1.6} />
      <circle cx={16} cy={6} r={1.6} />
    </g>
  </Icon>
);

/** |↔| */
export const ZoomIcon = () => (
  <Icon>
    <path d="M2 4v8M18 4v8M4 8h12M6 6l-2 2 2 2M14 6l2 2-2 2" />
  </Icon>
);
