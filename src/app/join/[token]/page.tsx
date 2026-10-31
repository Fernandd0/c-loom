import type { Metadata } from 'next'
import { JoinGalaxy } from '@/features/sharing/components/JoinGalaxy'

export const metadata: Metadata = {
  title: 'Join a galaxy',
  // Invite links are private.
  robots: { index: false, follow: false },
}

export default async function JoinPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  return <JoinGalaxy token={token} />
}
