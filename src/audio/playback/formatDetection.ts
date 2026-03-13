/**
 * Detect the best supported audio sample format for the current browser.
 *
 * Currently returns 'wav' unconditionally because TapBeats uses synthetic
 * WAV files generated at runtime. When real recorded/compressed samples are
 * introduced, this can be extended to probe for OGG Vorbis and MP3 support
 * via AudioElement.canPlayType() and return the most efficient codec.
 */
export function detectAudioFormat(): 'wav' {
  // TODO: Add OGG/MP3 detection when real samples are used.
  // Example future check:
  //   const audio = new Audio();
  //   if (audio.canPlayType('audio/ogg; codecs=vorbis')) return 'ogg';
  //   if (audio.canPlayType('audio/mpeg'))               return 'mp3';
  return 'wav';
}
