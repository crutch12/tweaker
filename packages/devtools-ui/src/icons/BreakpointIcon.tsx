import { IconProps, IconSizes } from "./props";

export function BreakpointIcon(iconProps: IconProps) {
  const { className, fill, size, inline, ...html } = iconProps;
  const iconSize = size ? IconSizes[size] : undefined;

  return (
    <svg
      aria-hidden
      focusable="false"
      viewBox="0 0 20 20"
      className={className}
      width={iconSize}
      height={iconSize}
      fill={fill || "currentColor"}
      {...html}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.5 6h10.319a1.5 1.5 0 0 1 1.13.512L18 10l-3.051 3.488a1.5 1.5 0 0 1-1.13.512H3.5A1.5 1.5 0 0 1 2 12.5v-5A1.5 1.5 0 0 1 3.5 6Z"
        // fill="#000"
      />
    </svg>
  );
}
