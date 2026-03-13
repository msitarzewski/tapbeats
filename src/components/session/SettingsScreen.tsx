import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/shared/Button';
import { Icon } from '@/components/shared/Icon';
import { Modal } from '@/components/shared/Modal';
import { clearAllData } from '@/state/persistence/db';
import { useSessionStore } from '@/state/sessionStore';
import { useSettingsStore } from '@/state/settingsStore';
import type { SensitivityLevel } from '@/types/audio';
import type { GridResolution } from '@/types/quantization';
import type { ThemeMode } from '@/types/settings';

import styles from './SettingsScreen.module.css';

const GRID_OPTIONS: GridResolution[] = ['1/4', '1/8', '1/16', '1/4T', '1/8T', '1/16T'];
const SENSITIVITY_OPTIONS: SensitivityLevel[] = ['low', 'medium', 'high'];
const THEME_OPTIONS: ThemeMode[] = ['dark', 'light', 'auto'];

export function SettingsScreen() {
  const navigate = useNavigate();
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const theme = useSettingsStore((s) => s.theme);
  const defaultBpm = useSettingsStore((s) => s.defaultBpm);
  const defaultGridResolution = useSettingsStore((s) => s.defaultGridResolution);
  const defaultSensitivity = useSettingsStore((s) => s.defaultSensitivity);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const setDefaultBpm = useSettingsStore((s) => s.setDefaultBpm);
  const setDefaultGridResolution = useSettingsStore((s) => s.setDefaultGridResolution);
  const setDefaultSensitivity = useSettingsStore((s) => s.setDefaultSensitivity);

  const storageUsed = useSessionStore((s) => s.storageUsed);
  const storageQuota = useSessionStore((s) => s.storageQuota);

  const storagePercent =
    storageQuota > 0 ? Math.min(100, Math.round((storageUsed / storageQuota) * 100)) : 0;

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${String(bytes)} B`;
    if (bytes < 1024 * 1024) return `${String(Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleClearAll = () => {
    void clearAllData().then(() => {
      useSessionStore.getState().setSessions([]);
      useSessionStore.getState().setCurrentSession(null, 'Untitled Beat');
      setShowClearConfirm(false);
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button
          className={styles.backBtn}
          onClick={() => {
            navigate('/');
          }}
          aria-label="Back to home"
        >
          <Icon name="arrow-left" size={20} />
        </button>
        <h1 className={styles.title}>Settings</h1>
      </div>

      {/* Audio Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Audio</h2>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Default BPM</span>
          <div className={styles.fieldValue}>
            <input
              type="number"
              className={styles.bpmInput}
              value={defaultBpm}
              min={40}
              max={240}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) setDefaultBpm(val);
              }}
            />
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Default Grid</span>
          <div className={styles.pills}>
            {GRID_OPTIONS.map((g) => (
              <button
                key={g}
                className={[styles.pill, g === defaultGridResolution ? styles.pillActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  setDefaultGridResolution(g);
                }}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Default Sensitivity</span>
          <div className={styles.pills}>
            {SENSITIVITY_OPTIONS.map((s) => (
              <button
                key={s}
                className={[styles.pill, s === defaultSensitivity ? styles.pillActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  setDefaultSensitivity(s);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Appearance</h2>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Theme</span>
          <div className={styles.pills}>
            {THEME_OPTIONS.map((t) => (
              <button
                key={t}
                className={[styles.pill, t === theme ? styles.pillActive : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  setTheme(t);
                }}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Storage Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Storage</h2>

        <div className={styles.field}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div className={styles.storageBar}>
              <div className={styles.storageUsed} style={{ width: `${String(storagePercent)}%` }} />
            </div>
            <span className={styles.storageText}>
              {formatBytes(storageUsed)} of {formatBytes(storageQuota)} used
            </span>
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Clear All Sessions</span>
          <button
            className={styles.dangerBtn}
            onClick={() => {
              setShowClearConfirm(true);
            }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Help</h2>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Show Tutorial</span>
          <button
            className={styles.dangerBtn}
            style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)' }}
            onClick={() => {
              useSettingsStore.getState().setHasSeenOnboarding(false);
              navigate('/');
            }}
          >
            Replay
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className={styles.version}>TapBeats v0.9.0</div>

      {/* Clear confirmation modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => {
          setShowClearConfirm(false);
        }}
        title="Clear All Sessions?"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
          This will permanently delete all saved sessions and audio data. This action cannot be
          undone.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            onClick={() => {
              setShowClearConfirm(false);
            }}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleClearAll}>
            Clear All
          </Button>
        </div>
      </Modal>
    </div>
  );
}
