const warned = new Set<string>()

/**
 * Print a development warning once. Call sites guard with
 * `process.env.NODE_ENV !== 'production'` so bundlers strip the messages.
 */
export function warnOnce(message: string) {
  if (warned.has(message)) return
  warned.add(message)
  console.warn(`[react-preserve-portal] ${message}`)
}
