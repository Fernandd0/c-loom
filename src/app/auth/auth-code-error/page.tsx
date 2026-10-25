import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-(--page) px-4 text-center">
      <h1 className="text-2xl font-semibold text-(--fg-2)">
        We couldn&apos;t sign you in
      </h1>
      <p className="max-w-sm text-(--fg-3)">
        The sign-in link expired or was already used. Try signing in again.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Back to c-loom
      </Link>
    </main>
  )
}
