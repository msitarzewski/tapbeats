import styles from './Card.module.css';

import type { CSSProperties, ReactNode, MouseEventHandler } from 'react';

interface CardProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export function Card({ children, selected = false, onClick, className, style }: CardProps) {
  const classNames = [
    styles.card,
    selected ? styles.selected : undefined,
    onClick !== undefined ? styles.interactive : undefined,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classNames}
      style={style}
      onClick={onClick}
      role={onClick !== undefined ? 'button' : undefined}
      tabIndex={onClick !== undefined ? 0 : undefined}
    >
      {children}
    </div>
  );
}
