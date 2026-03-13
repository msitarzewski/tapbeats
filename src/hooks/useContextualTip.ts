import { useCallback } from 'react';

import { useSettingsStore } from '@/state/settingsStore';

export function useContextualTip(tipId: string) {
  const dismissedTips = useSettingsStore((s) => s.dismissedTips);
  const dismissTip = useSettingsStore((s) => s.dismissTip);

  const isDismissed = dismissedTips.includes(tipId);

  const dismiss = useCallback(() => {
    dismissTip(tipId);
  }, [dismissTip, tipId]);

  return {
    isVisible: !isDismissed,
    dismiss,
  };
}
