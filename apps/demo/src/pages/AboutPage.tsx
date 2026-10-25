const STEPS = [
  {
    title: 'Host는 앱 최상단에 한 번',
    body: '영상(VideoElement)은 라우트 바깥의 VideoPortal.Host 안에서 렌더링합니다. 라우트가 바뀌어도 Host가 언마운트되지 않으므로 video 요소도 그대로입니다.',
    code: '<VideoPortal.Host mountWhen="connected">',
  },
  {
    title: 'Slot은 표시할 자리마다',
    body: '메인 플레이어와 미니플레이어 안에 비어 있는 Slot을 둡니다. 두 Slot 모두 공통 레이아웃에 남겨 두고 CSS로 숨겨서, 이동할 때 연결된 노드끼리 옮겨지게 합니다.',
    code: '<VideoPortal.Slot slotKey="mini" />',
  },
  {
    title: '라우트가 바뀌면 slotKey만 변경',
    body: '영상 페이지에서는 main, 다른 페이지로 나가면 mini를 선택합니다. returnPath에 영상 경로를 저장해 두었다가 미니플레이어의 돌아가기 링크에 씁니다.',
    code: "setSlotKey(src ? 'main' : 'mini')",
  },
]

export function AboutPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <section className="space-y-3">
        <p className="font-mono text-xs tracking-[0.16em] text-zinc-500">
          ABOUT THIS DEMO
        </p>
        <h1 className="text-3xl font-bold tracking-tight break-keep">
          이 데모가 동작하는 방식
        </h1>
        <p className="leading-relaxed text-zinc-400 break-keep">
          @charley-kim/react-preserve-portal로 만든 미니플레이어 예제입니다.
          지금 영상을 보던 중이었다면 오른쪽 아래 미니플레이어에서 그대로
          재생되고 있을 거예요.
        </p>
      </section>

      <ol className="space-y-4">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 font-mono text-xs text-zinc-300">
              {index + 1}
            </span>
            <div className="min-w-0 space-y-2">
              <h2 className="font-semibold">{step.title}</h2>
              <p className="text-sm leading-relaxed text-zinc-400 break-keep">
                {step.body}
              </p>
              <code className="block overflow-x-auto rounded-lg bg-black/40 px-3 py-2 font-mono text-xs text-zinc-300">
                {step.code}
              </code>
            </div>
          </li>
        ))}
      </ol>

      <p className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <a
          className="text-zinc-200 underline underline-offset-4 decoration-zinc-600 hover:decoration-zinc-200"
          href="https://kickbelldev.github.io/react-preserve-portal/guide/video-player.html"
          target="_blank"
          rel="noreferrer"
        >
          미니플레이어 가이드 →
        </a>
        <a
          className="text-zinc-200 underline underline-offset-4 decoration-zinc-600 hover:decoration-zinc-200"
          href="https://github.com/kickbelldev/react-preserve-portal/tree/main/apps/demo"
          target="_blank"
          rel="noreferrer"
        >
          데모 소스 코드 →
        </a>
      </p>
    </div>
  )
}
