import type { Metadata } from 'next'
import Link from 'next/link'
import { CONTACT_URL, LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms for using c-loom.',
}

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <section>
        <p>
          By using c-loom you agree to these terms. If you do not agree, please
          do not use the app.
        </p>
      </section>

      <section>
        <h2>The service</h2>
        <p>
          c-loom is a visual task board, currently offered free of charge as
          early access. Features may change, and the service may be paused or
          discontinued. We will try to give notice before removing synced data.
        </p>
      </section>

      <section>
        <h2>Your account and content</h2>
        <p>
          You are responsible for your account and for what you write in your
          tasks. Your content stays yours; we only store and display it to
          provide the service, as described in the{' '}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2>Acceptable use</h2>
        <ul>
          <li>Do not use c-loom for anything unlawful.</li>
          <li>
            Do not try to access other people&apos;s data or disrupt the
            service.
          </li>
          <li>
            Do not use automated means to create accounts or overload the app.
          </li>
        </ul>
        <p>We may suspend accounts that break these rules.</p>
      </section>

      <section>
        <h2>No warranty</h2>
        <p>
          c-loom is provided &quot;as is&quot;, without warranties of any kind.
          Keep your own copy of anything important. To the extent permitted by
          law, we are not liable for lost data or for any indirect damages
          arising from using the app.
        </p>
      </section>

      <section>
        <h2>Changes and contact</h2>
        <p>
          We may update these terms; the date at the top will change when we do.
          Questions?{' '}
          <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
            Contact us
          </a>
          .
        </p>
      </section>
    </LegalPage>
  )
}
