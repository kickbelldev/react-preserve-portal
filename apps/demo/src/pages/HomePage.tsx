import { Link } from 'react-router-dom'

import { VIDEO_META, VIDEO_POSTER } from '@/shared/constants/VIDEO_META'
import { MiniIcon, PlayIcon } from '@/shared/ui/icons'

export function HomePage() {
  return (
    <div className="space-y-10">
      <section className="max-w-2xl space-y-4">
        <p className="font-mono text-xs tracking-[0.16em] text-teal-300">
          REACT PRESERVE PORTAL
        </p>
        <h1 className="text-3xl font-bold tracking-tight break-keep sm:text-4xl">
          영상을 틀고, 다른 페이지로 이동해 보세요
        </h1>
        <p className="leading-relaxed text-zinc-400 break-keep">
          재생 중인 영상이 미니플레이어로 자리를 옮깁니다. 같은 video 요소를
          그대로 옮기기 때문에 다시 로드하지 않고 재생 위치도 이어집니다.
        </p>
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <MiniIcon className="h-4 w-4 text-teal-300" />
          영상 페이지에서 Home이나 About으로 이동하면 오른쪽 아래에
          미니플레이어가 나타납니다.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {Object.entries(VIDEO_META).map(([id, video]) => (
          <Link
            key={id}
            to={`/video/${id}`}
            aria-label={`${video.title} 보기`}
            className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-colors hover:border-teal-300/60"
          >
            <div className="relative aspect-video overflow-hidden bg-black">
              <img
                src={VIDEO_POSTER}
                alt=""
                className="h-full w-full object-cover opacity-80 transition duration-300 group-hover:scale-[1.02] group-hover:opacity-100"
              />
              <span className="absolute inset-0 grid place-items-center">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition group-hover:bg-teal-300 group-hover:text-zinc-950">
                  <PlayIcon className="h-5 w-5 translate-x-px" />
                </span>
              </span>
              <span className="absolute right-3 bottom-3 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[11px] text-white/90">
                {video.start}부터
              </span>
            </div>
            <div className="space-y-1 p-4">
              <h2 className="font-semibold">{video.title}</h2>
              <p className="text-sm text-zinc-400 break-keep">
                {video.description}
              </p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
