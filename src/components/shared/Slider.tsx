import styles from './Slider.module.css';

import type { ChangeEvent } from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  label?: string;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  disabled = false,
  className,
  label,
}: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value));
  };

  const classNames = [styles.container, className].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      {label !== undefined && <label className={styles.label}>{label}</label>}
      <input
        type="range"
        className={styles.slider}
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        style={{ '--fill-percent': `${String(percent)}%` } as React.CSSProperties}
      />
    </div>
  );
}
