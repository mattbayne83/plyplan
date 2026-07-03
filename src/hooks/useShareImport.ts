import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'
import { decodeShareState } from '../utils/share'

/**
 * Import a plan from a share link (#s=...) on load, then strip the hash so
 * refreshes don't stomp the user's subsequent edits. Runs after persist
 * rehydration; an explicit link wins over whatever the session held.
 */
export function useShareImport() {
  const importSharedState = useAppStore((s) => s.importSharedState)

  useEffect(() => {
    const match = window.location.hash.match(/^#s=(.+)$/)
    if (!match) return
    const shared = decodeShareState(match[1])
    if (shared) importSharedState(shared)
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }, [importSharedState])
}
