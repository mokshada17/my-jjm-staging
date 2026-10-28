import * as React from "react";

type Notification_BellProps = React.SVGProps<SVGSVGElement> & {
  size?: number | string;
  color?: string;
  title?: string;
};

const Notification_Bell: React.FC<Notification_BellProps> = ({
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

      {/* Bell body */}
      <path
        fill={color}
        d="M19 18v-1l-2-2v-4.5C17 7.46 14.76 5 12 5S7 7.46 7 10.5V15l-2 2v1h14Z"
      />

      {/* Clapper moved up to reduce the gap */}
      <path
        fill={color}
        d="M12 20.4c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Z"
      />
    </svg>
  );
};

export default Notification_Bell;