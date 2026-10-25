import reel from '../../../../../assets/media/portal-reel.mp4?url'

// Both routes use the repository's own clip. A media fragment gives the second
// route a distinct source so switching videos still exercises source replacement.
export const VIDEO_SOURCES: Record<string, string> = {
  '1': reel,
  '2': `${reel}#t=4`,
}
