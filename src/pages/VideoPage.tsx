import { useParams } from 'react-router-dom'

import { MainPlayer } from '@/features/player'

import { VIDEO_SOURCES } from '@/constants/VIDEO_SOURCES'

export function VideoPage() {
  const { id } = useParams<{ id: string }>()
  const videoId = id ?? '1'
  const src = VIDEO_SOURCES[videoId] ?? VIDEO_SOURCES['1']

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Video {videoId}</h1>
      <MainPlayer src={src} />
    </div>
  )
}
