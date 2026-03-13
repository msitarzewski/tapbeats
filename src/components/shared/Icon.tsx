import type { SVGAttributes } from 'react';

type IconName =
  | 'mic'
  | 'mic-off'
  | 'arrow-left'
  | 'square'
  | 'help-circle'
  | 'record'
  | 'play'
  | 'pause'
  | 'skip-back'
  | 'skip-forward'
  | 'repeat'
  | 'chevron-right'
  | 'chevron-down'
  | 'volume-x'
  | 'check';

interface IconProps extends SVGAttributes<SVGElement> {
  readonly name: IconName;
  readonly size?: number;
}

const PATHS: Record<IconName, string> = {
  mic: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8',
  'mic-off':
    'M1 1l22 22M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6M17 16.95A7 7 0 0 1 5 12v-2m14 0v2c0 .76-.12 1.5-.35 2.18M12 19v4M8 23h8',
  'arrow-left': 'M19 12H5M12 19l-7-7 7-7',
  square: 'M3 3h18v18H3z',
  'help-circle':
    'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01',
  record: '',
  play: 'M5 3l14 9-14 9V3z',
  pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
  'skip-back': 'M19 20L9 12l10-8v16zM5 19V5',
  'skip-forward': 'M5 4l10 8-10 8V4zM19 5v14',
  repeat: 'M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3',
  'chevron-right': 'M9 18l6-6-6-6',
  'chevron-down': 'M6 9l6 6 6-6',
  'volume-x': 'M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6',
  check: 'M20 6L9 17l-5-5',
};

export function Icon({ name, size = 24, className, ...rest }: IconProps) {
  if (name === 'record') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        className={className}
        aria-hidden="true"
        {...rest}
      >
        <circle cx="12" cy="12" r="8" />
      </svg>
    );
  }

  if (name === 'pause' || name === 'play') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
        className={className}
        aria-hidden="true"
        {...rest}
      >
        <path d={PATHS[name]} />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
