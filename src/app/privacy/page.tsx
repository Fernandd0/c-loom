import type { Metadata } from 'next'
import { CONTACT_URL, LegalPage } from '@/components/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy · C-LOOM',
  description: 'What C-LOOM stores, why, and how to have it removed.',
}

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <section>
        <p>
          C-LOOM is a visual task board. This page explains what it stores about
          you and why. In short: only what it needs to show you your tasks, and
          nothing is sold or shared for advertising.
        </p>
      </section>

      <section>
        <h2>Without an account</h2>
        <p>
          If you use C-LOOM without signing in, your galaxies (workspaces),
          categories and tasks are saved only in your browser&apos;s local
          storage on that device. They are never sent to our servers, and
          clearing your browser data removes them.
        </p>
      </section>

      <section>
        <h2>With a Google account</h2>
        <p>When you sign in with Google, we receive and store:</p>
        <ul>
          <li>
            your email address, name and profile picture, to identify your
            account and show it in the app;
          </li>
          <li>
            the galaxies, categories and tasks you create, including titles,
            details, due dates, priority and position on the board, so they sync
            across your devices;
          </li>
          <li>
            a history of the tasks you complete (title, category, due date, who
            completed it and when), shown in each galaxy&apos;s Completed list.
          </li>
        </ul>
        <p>
          We only ask Google for your basic profile and email. C-LOOM does not
          access your Gmail, Drive, Calendar, contacts or any other Google data.
        </p>
      </section>

      <section>
        <h2>Shared galaxies</h2>
        <p>
          You can share a galaxy by sending its invite link. Anyone who opens
          the link while signed in joins that galaxy. Its members see its tasks,
          categories and history, each member&apos;s name and profile picture,
          and who completed each task. While you have a shared galaxy open, the
          others can see that you are there. Members never see your email
          address or your other galaxies.
        </p>
        <p>
          The owner can turn the link off or reset it at any time, and remove
          members; members can leave. Leaving or being removed ends your access,
          but tasks you added and your name in the history stay in that galaxy.
        </p>
      </section>

      <section>
        <h2>How it is stored</h2>
        <p>
          Account data is stored with{' '}
          <a
            href="https://supabase.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Supabase
          </a>
          , which provides our database, sign-in and live updates. Access rules
          in the database ensure each account can only read and change its own
          galaxies and the ones shared with it. The app is hosted on{' '}
          <a
            href="https://vercel.com/legal/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vercel
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Analytics</h2>
        <p>
          We use Vercel Web Analytics to count page views. It does not use
          cookies and does not identify you personally.
        </p>
      </section>

      <section>
        <h2>Sharing</h2>
        <p>
          We do not sell your data or share it with third parties, other than
          the service providers above that run the app for us and the members of
          galaxies you choose to share.
        </p>
      </section>

      <section>
        <h2>Deleting your data</h2>
        <p>
          Deleted tasks are removed from the database right away. Completed
          tasks leave the board and are kept only in that galaxy&apos;s history,
          which is deleted with the galaxy. To delete your account and
          everything in it,{' '}
          <a href={CONTACT_URL} target="_blank" rel="noopener noreferrer">
            contact us
          </a>{' '}
          and we will remove it. You can also revoke C-LOOM&apos;s access at any
          time from your{' '}
          <a
            href="https://myaccount.google.com/connections"
            target="_blank"
            rel="noopener noreferrer"
          >
            Google account settings
          </a>
          .
        </p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>
          If this policy changes, the date at the top of this page will be
          updated.
        </p>
      </section>
    </LegalPage>
  )
}
