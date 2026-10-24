import { useParams } from 'react-router-dom'

export function VideoPage() {
  const { id } = useParams<{ id: string }>()
  return <h1 className="text-2xl font-bold">Video {id ?? '1'}</h1>
}
