import * as React from 'react';

type LocationPinProps = React.SVGProps<SVGSVGElement> & {
  /** Convenience prop: sets both width & height unless those are provided */
  size?: number | string;
  /** Fill color for the pin */
  color?: string;
  /** Optional accessible title */
  title?: string;
};

export const LocationPin: React.FC<LocationPinProps> = ({
  size = 24,
  color = "currentColor",
  title,
  width,
  height,
  ...props
}) => {
  const w = width ?? size;
  const h = height ?? size;

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

      {/* Single path using even-odd fill so the center circle is a transparent hole */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill={color}
        d="M12 2C8.13401 2 5 5.13401 5 9C5 13.968 12 22 12 22C12 22 19 13.968 19 9C19 5.13401 15.866 2 12 2ZM12 6.5C13.3807 6.5 14.5 7.61929 14.5 9C14.5 10.3807 13.3807 11.5 12 11.5C10.6193 11.5 9.5 10.3807 9.5 9C9.5 7.61929 10.6193 6.5 12 6.5Z"
      />
    </svg>
  );
};

export default LocationPin;