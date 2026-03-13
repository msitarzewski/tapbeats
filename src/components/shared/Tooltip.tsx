import { useState } from 'react';

import styles from './Tooltip.module.css';

import type { ReactNode } from 'react';

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: 'top' | 'bottom';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  const positionClass = position === 'bottom' ? (styles.bottom ?? '') : (styles.top ?? '');

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={() => {
        setVisible(true);
      }}
      onMouseLeave={() => {
        setVisible(false);
      }}
      onFocus={() => {
        setVisible(true);
      }}
      onBlur={() => {
        setVisible(false);
      }}
    >
      {children}
      {visible && (
        <div className={`${styles.tooltip ?? ''} ${positionClass}`} role="tooltip">
          {content}
        </div>
      )}
    </div>
  );
}
