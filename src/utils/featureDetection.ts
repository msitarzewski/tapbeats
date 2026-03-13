export interface FeatureSupport {
  audioContext: boolean;
  audioWorklet: boolean;
  mediaDevices: boolean;
  indexedDB: boolean;
  serviceWorker: boolean;
}

export function detectFeatures(): FeatureSupport {
  return {
    audioContext: typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined',
    audioWorklet: typeof AudioContext !== 'undefined' && typeof AudioWorkletNode !== 'undefined',
    mediaDevices:
      typeof navigator !== 'undefined' &&
      typeof navigator.mediaDevices !== 'undefined' &&
      typeof navigator.mediaDevices.getUserMedia === 'function',
    indexedDB: typeof indexedDB !== 'undefined',
    serviceWorker: 'serviceWorker' in navigator,
  };
}

declare const webkitAudioContext: typeof AudioContext | undefined;

export function isBrowserSupported(): boolean {
  const features = detectFeatures();
  // Core requirements: AudioContext + mediaDevices + indexedDB
  return features.audioContext && features.mediaDevices && features.indexedDB;
}

export function getMissingFeatures(): string[] {
  const features = detectFeatures();
  const missing: string[] = [];

  if (!features.audioContext) missing.push('Web Audio API');
  if (!features.mediaDevices) missing.push('Microphone access');
  if (!features.indexedDB) missing.push('IndexedDB storage');
  if (!features.audioWorklet) missing.push('AudioWorklet (needed for real-time processing)');

  return missing;
}
