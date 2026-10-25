import { useParams } from 'react-router-dom'

import { VIDEO_META } from '@/shared/constants/VIDEO_META'

export function VideoPage() {
  const { id = '1' } = useParams<{ id: string }>()
  const video = VIDEO_META[id] ?? VIDEO_META['1']
  return (
    <section className="mt-5 max-w-3xl space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">{video.title}</h1>
      <p className="text-sm leading-relaxed text-zinc-400 break-keep">
        {video.description} 재생 중에 Home이나 About으로 이동해 보세요.
      </p>
    </section>
  )
}
