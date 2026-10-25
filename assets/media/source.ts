import mp4 from './portal-reel.mp4?url'
import webm from './portal-reel.webm?url'

/** Open-source Chromium builds may omit H.264; keep a VP9 alternative. */
export function exampleVideoSource() {
  if (typeof document === 'undefined') return mp4
  return document.createElement('video').canPlayType('video/mp4; codecs="avc1.4D401F"')
    ? mp4
    : webm
}
