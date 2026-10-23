<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useData } from 'vitepress'

const { lang } = useData()
const container = ref<HTMLElement>()
const failed = ref(false)
let dispose: (() => void) | undefined
let disposed = false

onMounted(async () => {
  try {
    const { mountPlayground } = await import('./playground')
    if (!disposed && container.value) {
      dispose = mountPlayground(container.value, lang.value.startsWith('ko'))
    }
  } catch {
    failed.value = true
  }
})
onBeforeUnmount(() => {
  disposed = true
  dispose?.()
})
</script>

<template>
  <div class="portal-playground" ref="container">
    <p role="status">
      {{
        failed
          ? lang.startsWith('ko')
            ? '예제를 불러오지 못했습니다. 페이지를 새로 고쳐 주세요.'
            : 'Could not load the example. Please reload the page.'
          : lang.startsWith('ko')
            ? '인터랙티브 예제를 불러오는 중…'
            : 'Loading the interactive example…'
      }}
    </p>
  </div>
</template>
