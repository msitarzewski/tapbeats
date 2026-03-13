import { useCallback, useState } from 'react';

import { Button } from '@/components/shared/Button';
import { useSettingsStore } from '@/state/settingsStore';

import styles from './OnboardingOverlay.module.css';
import { OnboardingStep } from './OnboardingStep';

const STEPS = [
  {
    title: 'Welcome to TapBeats',
    description:
      'Turn finger taps into structured beats. Tap on any surface — your desk, a table, or even your laptop — and we will capture and transform it into music.',
  },
  {
    title: 'Record Your Taps',
    description:
      'Hit the big record button to start. Tap different surfaces for different sounds — TapBeats will automatically detect and separate them.',
  },
  {
    title: 'Review & Assign',
    description:
      'After recording, review your detected sounds and assign drum instruments to each one. Split or merge groups until they sound right.',
  },
  {
    title: 'Edit & Export',
    description:
      'Fine-tune your beat on the timeline — adjust timing, add or remove hits, then export as a WAV file to share your creation.',
  },
];

export function OnboardingOverlay() {
  const [currentStep, setCurrentStep] = useState(0);
  const setHasSeenOnboarding = useSettingsStore((s) => s.setHasSeenOnboarding);

  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      setHasSeenOnboarding(true);
    } else {
      setCurrentStep((s) => s + 1);
    }
  }, [isLast, setHasSeenOnboarding]);

  const handleSkip = useCallback(() => {
    setHasSeenOnboarding(true);
  }, [setHasSeenOnboarding]);

  if (step === undefined) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <OnboardingStep
          key={currentStep}
          title={step.title}
          description={step.description}
          stepNumber={currentStep + 1}
          totalSteps={STEPS.length}
        />

        <div className={styles.dots}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`${styles.dot ?? ''} ${i === currentStep ? (styles.dotActive ?? '') : ''}`}
            />
          ))}
        </div>

        <div className={styles.actions}>
          <Button variant="ghost" size="sm" onClick={handleSkip}>
            Skip
          </Button>
          <Button variant="primary" onClick={handleNext}>
            {isLast ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
