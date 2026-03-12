import styles from './Card.module.css';

import type { ReactNode, MouseEventHandler } from 'react';

interface CardProps {
  children: ReactNode;
  selected?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
  className?: string;
}

export function Card({ children, selected = false, onClick, className }: CardProps) {
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
      onClick={onClick}
      role={onClick !== undefined ? 'button' : undefined}
      tabIndex={onClick !== undefined ? 0 : undefined}
    >
      {children}
    </div>
  );
}
