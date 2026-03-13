import { Button } from '@/components/shared/Button';
import { Icon } from '@/components/shared/Icon';

import styles from './ActionBar.module.css';

type ActionBarMode = 'default' | 'split' | 'merge';

interface ActionBarProps {
  mode: ActionBarMode;
  canSplit: boolean;
  canMerge: boolean;
  canContinue: boolean;
  selectedCount: number;
  onSplit: () => void;
  onMerge: () => void;
  onContinue: () => void;
  onCancel: () => void;
}

export function ActionBar({
  mode,
  canSplit,
  canMerge,
  canContinue,
  selectedCount,
  onSplit,
  onMerge,
  onContinue,
  onCancel,
}: ActionBarProps) {
  if (mode === 'split') {
    return (
      <div className={styles.bar}>
        <span className={styles.modeText}>Tap a cluster to split</span>
        <div className={styles.right}>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (mode === 'merge') {
    return (
      <div className={styles.bar}>
        <span className={styles.modeText}>Select 2 clusters to merge ({selectedCount}/2)</span>
        <div className={styles.right}>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <Button variant="ghost" size="sm" disabled={!canSplit} onClick={onSplit}>
          Split
        </Button>
        <Button variant="ghost" size="sm" disabled={!canMerge} onClick={onMerge}>
          Merge
        </Button>
      </div>
      <div className={styles.right}>
        <Button variant="primary" size="md" disabled={!canContinue} onClick={onContinue}>
          Continue
          <Icon name="chevron-right" size={16} />
        </Button>
      </div>
    </div>
  );
}
