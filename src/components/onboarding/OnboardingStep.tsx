import styles from './OnboardingStep.module.css';

interface OnboardingStepProps {
  title: string;
  description: string;
  stepNumber: number;
  totalSteps: number;
}

export function OnboardingStep({
  title,
  description,
  stepNumber,
  totalSteps,
}: OnboardingStepProps) {
  return (
    <div className={styles.step}>
      <div className={styles.indicator}>
        <span className={styles.stepNumber}>{String(stepNumber)}</span>
        <span className={styles.stepTotal}>of {String(totalSteps)}</span>
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.description}>{description}</p>
    </div>
  );
}
