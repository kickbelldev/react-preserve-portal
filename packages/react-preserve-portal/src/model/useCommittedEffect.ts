import * as React from 'react'

const { useEffect, useInsertionEffect } = React

// React 18 and 19.0/19.1 skip insertion cleanup when deleting a hidden Suspense
// tree. Their passive effects remain mounted while suspended and clean up on
// delete. Activity-capable React (19.2+) disconnects passive effects on hide,
// but correctly runs insertion cleanup on final deletion. Detect the public
// capability rather than parsing version strings (including canary builds).
export const useCommittedEffect =
  'Activity' in React ? useInsertionEffect : useEffect
