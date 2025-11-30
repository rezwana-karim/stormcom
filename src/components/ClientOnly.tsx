"use client"

import { PropsWithChildren, useSyncExternalStore } from 'react'

// Subscribe function that never changes (for SSR, we're always not mounted)
const subscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function ClientOnly({ children }: PropsWithChildren) {
  // Using useSyncExternalStore to track client-side mounting
  // This avoids the setState-in-effect pattern that React Compiler warns about
  const mounted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  if (!mounted) return null
  return <>{children}</>
}
