// lazy singleton container
let target: HTMLDivElement | null = null

export const getTarget = () => {
  if (!target) {
    target = document.createElement('div')
    target.style.width = '100%'
    target.style.height = '100%'
  }
  return target
}
