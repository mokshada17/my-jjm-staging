import { useId, type SVGProps } from "react";

export interface DivisionProps extends Omit<SVGProps<SVGSVGElement>, "width" | "height"> {
  width?: number | string;
  height?: number | string;
}

/**
 * The Figma Division mark (ribbon 2:352 / 2:10): a blue ring with one slice cut
 * out and pulled clear at the upper right, like a split donut chart - a division
 * of the whole. Drawn from the ribbon's exported raster (80x80): ring centred at
 * (40, 40), radii 39.5 / 16, the slice spanning 300-355 degrees.
 *
 * The viewBox pads the 80x80 mark to 110x110 so it fills ~73% of its box, the
 * same as the other round tier marks (Circle, Block, Scheme). The slice runs
 * past the raster's edge and is clipped there, as in the export.
 */
const Division = ({ width = 110, height = 110, ...props }: DivisionProps) => {
  const clip = `${useId()}-clip`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="-15 -15 110 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <clipPath id={clip}>
          <rect width="80" height="80" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`}>
        {/* The ring, from just below 3 o'clock round to the cut at the top */}
        <path
          d="M79.48 41.38 A39.5 39.5 0 1 1 56.07 3.92 L46.51 25.38 A16 16 0 1 0 55.99 40.56 Z"
          fill="#2795D4"
        />
        {/* The slice, offset outward along its middle */}
        <path
          d="M63.75 2.79 A39.5 39.5 0 0 1 83.35 33.56 L59.94 35.6 A16 16 0 0 0 52 23.14 Z"
          fill="#2795D4"
        />
      </g>
    </svg>
  );
};

export default Division;
