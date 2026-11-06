import type { SVGProps } from 'react';

/**
 * The Household tile's mark: a white house on a blue disc. (It used to be
 * exported as DivisionIcon, which it is not - see Division.tsx for that mark.)
 */
export interface HouseholdCircleProps
  extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  width?: number | string;
  height?: number | string;
}

const HouseholdCircle = ({ width = 500, height = 500, ...props }: HouseholdCircleProps) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Blue circular background */}
      <circle cx="250" cy="250" r="225" fill="#1198F5" />

      {/* White home */}
      <path
        fill="#FFFFFF"
        d="
          M249.9 121
          C254.3 121 258.6 122.6 262 125.6
          L382.8 231
          C389.3 236.7 385.3 247.4 376.6 247.4
          H355.4
          V339
          C355.4 347.2 348.8 353.8 340.6 353.8
          H294.9
          C290.8 353.8 287.5 350.5 287.5 346.4
          V283
          C287.5 275.3 281.2 269 273.5 269
          H226.5
          C218.8 269 212.5 275.3 212.5 283
          V346.4
          C212.5 350.5 209.2 353.8 205.1 353.8
          H159.4
          C151.2 353.8 144.6 347.2 144.6 339
          V247.4
          H123.4
          C114.7 247.4 110.7 236.7 117.2 231
          L238 125.6
          C241.4 122.6 245.7 121 249.9 121
          Z
        "
      />
    </svg>
  );
};

export default HouseholdCircle;
