import { useEffect, useInsertionEffect, version } from 'react'

// React 18 skips insertion cleanup when deleting an already hidden Suspense
// tree. Its passive effects stay mounted while suspended and clean up on delete.
// React 19 Activity disconnects passive effects on hide, but insertion cleanup
// correctly follows final deletion. Neither branch publishes React updates.
export const useCommittedEffect =
  Number.parseInt(version, 10) >= 19 ? useInsertionEffect : useEffect
