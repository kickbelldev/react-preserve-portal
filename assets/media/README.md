# Example media

`portal-reel.mp4` is the 16-second timecode animation authored for this repository's
playground; `portal-reel.webp` is its poster. `portal-reel.webm` is a VP9
transcode for browsers without H.264 support, selected with `canPlayType`. These repository assets use the
project's MIT license. No external sample-video service is required.

Both applications import the clip through Vite so their built asset URLs work
with their configured base paths. The second demo route uses a media fragment
starting at four seconds to exercise a distinct video source.
