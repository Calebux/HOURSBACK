import { Link } from 'react-router-dom';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-light text-brand-dark">
      <nav className="border-b border-brand-dark/10 bg-brand-light/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><img src="/logo.svg" alt="Hoursback" className="h-[36px] w-auto" /></Link>
          <Link to="/" className="text-sm text-brand-dark/60 hover:text-brand-dark transition-colors">← Back to Home</Link>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-16 max-w-3xl">
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-brand-dark/50 mb-12">Last updated: March 2026</p>

        <div className="space-y-8 text-brand-dark/80 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account or using Hoursback, you agree to these Terms of Service. If you do not agree, please do not use the platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">2. Description of Service</h2>
            <p>Hoursback provides AI-powered workflow automation tools that monitor data sources and deliver insights to your email inbox. We use third-party AI providers (Anthropic Claude) to process your data and generate reports.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">3. Your Account</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You must provide a valid email address to create an account.</li>
              <li>You are responsible for maintaining the security of your account credentials.</li>
              <li>You may not share your account with others or use it for any unlawful purpose.</li>
              <li>You must be at least 18 years old to use this service.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">4. Acceptable Use</h2>
            <p>You agree not to use Hoursback to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Monitor or scrape websites in violation of their terms of service.</li>
              <li>Process or collect personal data without appropriate consent.</li>
              <li>Attempt to reverse-engineer, hack, or disrupt the platform.</li>
              <li>Use the service for any illegal activity.</li>
              <li>Resell or redistribute the service without written permission.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">5. Subscriptions and Billing</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>The Free plan is available at no cost with access to selected workflows.</li>
              <li>The Pro plan is billed monthly. Prices are shown in USD and charged in NGN via Flutterwave.</li>
              <li>Payments are non-refundable except where required by law.</li>
              <li>We reserve the right to change pricing with 30 days notice.</li>
              <li>Your Pro access continues until your subscription period ends.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">6. AI-Generated Content</h2>
            <p>Hoursback uses AI to generate workflow reports and insights. These outputs are provided for informational purposes only. We do not guarantee the accuracy, completeness, or fitness for any particular purpose of AI-generated content. You should not rely solely on our reports for financial, legal, or business-critical decisions.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">7. Intellectual Property</h2>
            <p>You retain ownership of any data you provide to the platform. Hoursback retains ownership of the platform, its design, and its underlying technology. AI-generated reports delivered to you may be used freely for your own business purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">8. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Hoursback shall not be liable for any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability to you shall not exceed the amount you paid us in the 3 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">9. Termination</h2>
            <p>We reserve the right to suspend or terminate your account if you violate these terms. You may cancel your account at any time by contacting us. Upon termination, your data will be deleted within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">10. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of the platform after changes constitutes acceptance of the new terms. We will notify you of material changes by email.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-brand-dark mb-3">11. Contact</h2>
            <p>For any questions about these terms, contact us at <a href="mailto:petersoncaleb275@gmail.com" className="text-[#4285F4] hover:underline">petersoncaleb275@gmail.com</a>.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
