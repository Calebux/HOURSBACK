import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-brand-light text-brand-dark">
      <nav className="border-b border-brand-dark/10 bg-brand-light/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><img src="/logo.svg" alt="Hoursback" className="h-[36px] w-auto" /></Link>
          <Link to="/" className="text-sm text-brand-dark/60 hover:text-brand-dark transition-colors">← Back to Home</Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-brand-dark/50 mb-12">Last updated: March 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-brand-dark/80 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">1. Information We Collect</h2>
            <p>We collect the following information when you use Hoursback:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Account data:</strong> Your email address and name when you sign up.</li>
              <li><strong>Workflow data:</strong> URLs, keywords, and data sources you configure for your workflows.</li>
              <li><strong>Usage data:</strong> How you interact with the platform, which workflows you deploy, and how often they run.</li>
              <li><strong>Payment data:</strong> Payment is processed by Flutterwave. We do not store your card details.</li>
              <li><strong>Uploaded files:</strong> Excel or CSV files you upload as data sources are stored securely in Supabase Storage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To run your AI workflows and deliver results to your inbox.</li>
              <li>To send you workflow reports and product notifications via email.</li>
              <li>To improve our AI outputs based on your feedback.</li>
              <li>To manage your subscription and process payments.</li>
              <li>To analyse aggregate usage patterns and improve the product.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">3. Data Sharing</h2>
            <p>We do not sell your personal data. We share data only with the following service providers who help us operate the platform:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Supabase</strong> — database and file storage</li>
              <li><strong>Anthropic (Claude)</strong> — AI processing of your workflow data</li>
              <li><strong>Resend</strong> — email delivery</li>
              <li><strong>Flutterwave</strong> — payment processing</li>
              <li><strong>PostHog</strong> — product analytics (anonymised usage data)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">4. Data Retention</h2>
            <p>We retain your account and workflow data for as long as your account is active. Workflow run results are retained for up to 90 days. Uploaded files are retained until you delete your account or remove the workflow. You may request deletion of your data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">5. Security</h2>
            <p>We use industry-standard security measures including encrypted connections (TLS), row-level security in our database, and secure environment variable management. We do not store raw payment credentials.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">6. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. To exercise any of these rights, contact us at <a href="mailto:petersoncaleb275@gmail.com" className="text-[#4285F4] hover:underline">petersoncaleb275@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">7. Cookies</h2>
            <p>We use essential cookies to maintain your session. We use PostHog analytics cookies to understand how users interact with the platform. You can opt out of analytics tracking by using a browser extension like uBlock Origin.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">8. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify you of significant changes by email or by displaying a notice in the app.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">9. Contact</h2>
            <p>For any privacy-related questions, contact us at <a href="mailto:petersoncaleb275@gmail.com" className="text-[#4285F4] hover:underline">petersoncaleb275@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
