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
        <p className="text-brand-dark/50 mb-12">Last updated: June 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-brand-dark/80 leading-relaxed">

          <p>Hoursback is a product of CALBRIDGE DIGITAL LABS LTD ("we", "us", "our"). This policy explains how we handle your information when you use Hoursback.</p>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">1. Information We Collect</h2>
            <p>We collect the following information when you use Hoursback:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Account data:</strong> Your email address and name when you sign up.</li>
              <li><strong>Workflow data:</strong> URLs, keywords, and data sources you configure for your workflows.</li>
              <li><strong>WhatsApp and customer request data:</strong> Messages, phone numbers, customer names, order or service request details, payment status, delivery or appointment details, and related operational notes received through connected WhatsApp channels.</li>
              <li><strong>Receipt and media data:</strong> Payment proof, receipt screenshots, documents, and related metadata that you or your customers send for review.</li>
              <li><strong>Usage data:</strong> How you interact with the platform, which workflows you deploy, and how often they run.</li>
              <li><strong>Payment data:</strong> Payment is processed by Flutterwave. We do not store your card details.</li>
              <li><strong>Uploaded files:</strong> Excel or CSV files you upload as data sources are stored securely in Supabase Storage.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">2. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>To run your AI workflows and deliver results to your inbox.</li>
              <li>To process WhatsApp messages, customer requests, receipts, sales logs, and owner/staff operational updates.</li>
              <li>To generate AI-assisted replies, summaries, reports, and structured business records based on the information you configure.</li>
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
              <li><strong>Kapso</strong> — WhatsApp messaging, webhook delivery, and connected phone-number infrastructure</li>
              <li><strong>Anthropic (Claude)</strong> — AI processing of your workflow data</li>
              <li><strong>Resend</strong> — email delivery</li>
              <li><strong>Flutterwave</strong> — payment processing</li>
              <li><strong>PostHog</strong> — product analytics, onboarding milestones, and usage event tracking</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">4. Data Retention</h2>
            <p>We retain your account, workflow, WhatsApp, sales log, customer request, and receipt data for as long as your account is active or as needed to provide the service. Workflow run results are retained for up to 90 days unless needed for your account history. Uploaded files, receipt screenshots, and media are retained until you delete the related record, delete your account, or request removal. You may request deletion of your data at any time by following our <Link to="/data-deletion" className="text-[#4285F4] hover:underline">data deletion instructions</Link>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">5. Security</h2>
            <p>We use industry-standard security measures including encrypted connections (TLS), row-level security in our database, signed receipt links, webhook signature verification, and secure environment variable management. We do not store raw payment credentials. Receipt images and customer messages may contain personal data, so you should only connect WhatsApp numbers and upload data you are authorised to process.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">6. Your Rights</h2>
            <p>You have the right to access, export, correct, or delete your personal data. You can download an account export from the Account page. To request deletion, follow the instructions at <Link to="/data-deletion" className="text-[#4285F4] hover:underline">hoursback.xyz/data-deletion</Link> or contact us at <a href="mailto:support@hoursback.xyz" className="text-[#4285F4] hover:underline">support@hoursback.xyz</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">7. Cookies</h2>
            <p>We use essential cookies to maintain your session. We use PostHog analytics cookies to understand how users interact with the platform. You can opt out of analytics tracking by using a browser extension like uBlock Origin.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">8. Customer Notice</h2>
            <p>If you use Hoursback with a customer-facing WhatsApp number, you should tell your customers that messages, order or service details, and payment proof sent to that number may be processed by Hoursback and its providers to respond, record requests, store receipts, and help your team fulfil the request.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">9. Changes to This Policy</h2>
            <p>We may update this policy from time to time. We will notify you of significant changes by email or by displaying a notice in the app.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">10. Contact</h2>
            <p>For any privacy-related questions, contact us at <a href="mailto:support@hoursback.xyz" className="text-[#4285F4] hover:underline">support@hoursback.xyz</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
