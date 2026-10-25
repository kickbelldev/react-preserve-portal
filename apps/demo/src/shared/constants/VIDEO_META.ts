import poster from '../../../../../assets/media/portal-reel.webp?url'

export const VIDEO_POSTER = poster

export const VIDEO_META: Record<
  string,
  { title: string; description: string; start: string }
> = {
  '1': {
    title: 'Portal Reel',
    description: '타임코드가 흐르는 16초 루프 영상입니다. 처음부터 재생합니다.',
    start: '0:00',
  },
  '2': {
    title: 'Portal Reel · 4초부터',
    description:
      '같은 영상을 4초 지점부터 재생합니다. 소스를 바꿔도 같은 video 요소를 씁니다.',
    start: '0:04',
  },
}
