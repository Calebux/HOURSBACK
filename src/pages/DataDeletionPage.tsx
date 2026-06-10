import { Link } from 'react-router-dom';

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-brand-light text-brand-dark">
      <nav className="border-b border-brand-dark/10 bg-brand-light/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><img src="/logo.svg" alt="Hoursback" className="h-[36px] w-auto" /></Link>
          <Link to="/" className="text-sm text-brand-dark/60 hover:text-brand-dark transition-colors">Back to Home</Link>
        </div>
      </nav>

      <main className="container mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-bold mb-3">Data Deletion Instructions</h1>
        <p className="text-brand-dark/60 mb-10">
          You can request deletion of your Hoursback account data, including data received through WhatsApp and Meta-connected channels.
        </p>

        <div className="space-y-8 rounded-2xl border border-brand-dark/10 bg-white p-6 shadow-sm">
          <section>
            <h2 className="text-xl font-semibold mb-3">How to Request Deletion</h2>
            <ol className="list-decimal pl-6 space-y-2 text-brand-dark/75 leading-relaxed">
              <li>Email <a href="mailto:support@hoursback.xyz" className="text-[#4285F4] hover:underline">support@hoursback.xyz</a> from the email address used for your Hoursback account.</li>
              <li>Use the subject line: <strong>Delete my Hoursback data</strong>.</li>
              <li>Include your business name and any connected WhatsApp phone number you want removed.</li>
              <li>We will confirm the request and delete eligible account data within 30 days.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">What We Delete</h2>
            <ul className="list-disc pl-6 space-y-2 text-brand-dark/75 leading-relaxed">
              <li>Account profile data and business profile information.</li>
              <li>Workflows, workflow runs, reports, and connected data sources.</li>
              <li>Sales log entries, customer requests, WhatsApp messages, receipt metadata, and uploaded receipt files associated with your account.</li>
              <li>WhatsApp connection records used to route messages to your Hoursback account.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">What May Be Retained Temporarily</h2>
            <p className="text-brand-dark/75 leading-relaxed">
              Some billing, security, abuse-prevention, or legal records may be retained only as required by law, payment processors, or platform security needs. Backup copies may take up to 30 days to expire.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">Disconnecting WhatsApp Access</h2>
            <p className="text-brand-dark/75 leading-relaxed">
              You can also remove Hoursback access from your Meta or WhatsApp Business settings. This stops future WhatsApp data from being sent to Hoursback, but you should still email us if you want previously stored Hoursback data deleted.
            </p>
          </section>
        </div>

        <p className="mt-8 text-sm text-brand-dark/50">
          For more details, read our <Link to="/privacy" className="text-[#4285F4] hover:underline">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}
