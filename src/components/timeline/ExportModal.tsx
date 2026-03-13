import { Button } from '@/components/shared/Button';
import { Icon } from '@/components/shared/Icon';
import { Modal } from '@/components/shared/Modal';
import { useExportWav } from '@/hooks/useExportWav';

import styles from './ExportModal.module.css';

interface ExportModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const { isExporting, progress, error, startExport } = useExportWav();

  const isComplete = progress?.phase === 'complete';
  const percent = progress?.percent ?? 0;

  const phaseLabel =
    progress?.phase === 'rendering'
      ? 'Rendering audio...'
      : progress?.phase === 'encoding'
        ? 'Encoding WAV...'
        : progress?.phase === 'complete'
          ? 'Export complete!'
          : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export WAV">
      <div className={styles.content}>
        {!isExporting && !isComplete && error === null && (
          <>
            <p className={styles.description}>
              Export your beat as a stereo WAV file (16-bit PCM, 44.1kHz). Muted tracks will be
              excluded from the export.
            </p>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" onClick={startExport}>
                <Icon name="download" size={16} />
                Export
              </Button>
            </div>
          </>
        )}

        {isExporting && (
          <div className={styles.progressWrap}>
            <div
              className={styles.progressBar}
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className={styles.progressFill} style={{ width: `${String(percent)}%` }} />
            </div>
            <span className={styles.progressText}>{phaseLabel}</span>
          </div>
        )}

        {isComplete && (
          <>
            <div className={styles.successIcon}>
              <Icon name="check" size={48} />
            </div>
            <p className={styles.progressText}>Your WAV file has been downloaded.</p>
            <div className={styles.actions}>
              <Button variant="primary" onClick={onClose}>
                Done
              </Button>
            </div>
          </>
        )}

        {error !== null && (
          <>
            <p className={styles.errorMsg}>{error}</p>
            <div className={styles.actions}>
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
              <Button variant="primary" onClick={startExport}>
                Retry
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
