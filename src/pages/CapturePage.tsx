import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Camera,
  ChevronLeft,
  ClipboardList,
  Database,
  FileSpreadsheet,
  Link2,
  MessageCircle,
  PenLine,
  Radio,
  Upload,
  Webhook,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MobileNav } from '../components/MobileNav';
import { useEffect } from 'react';

const captureChannels = [
  {
    title: 'Manual business entry',
    body: 'Add sales, expenses, notes, and corrections directly when the work does not happen in chat.',
    icon: PenLine,
    to: '/data-log',
    action: 'Open Sales Log',
    status: 'Available now',
  },
  {
    title: 'Photo or book scan',
    body: 'Upload a page, receipt, or sales book photo and turn it into structured business entries.',
    icon: Camera,
    to: '/data-log',
    action: 'Upload photo',
    status: 'Available now',
  },
  {
    title: 'WhatsApp capture',
    body: 'Connect internal or customer numbers for sales logs, closeout, requests, bookings, receipts, and owner summaries.',
    icon: MessageCircle,
    to: '/whatsapp',
    action: 'Configure WhatsApp',
    status: 'Available now',
  },
  {
    title: 'Spreadsheets and documents',
    body: 'Register Google Sheets, CSV-style sources, SOPs, rosters, inventory sheets, and operating records once.',
    icon: Database,
    to: '/data-sources',
    action: 'Manage sources',
    status: 'Available now',
  },
  {
    title: 'Workflow form input',
    body: 'Paste links, upload data, or answer prompts while creating a scheduled workflow or one-off report.',
    icon: FileSpreadsheet,
    to: '/workflows/new',
    action: 'Browse automations',
    status: 'Available now',
  },
  {
    title: 'Webhook and API events',
    body: 'Receive structured activity from forms, stores, CRMs, or internal tools through webhook endpoints.',
    icon: Webhook,
    to: '/settings',
    action: 'Configure webhooks',
    status: 'Available now',
  },
];

export default function CapturePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-brand-light pb-24">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/home" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-emerald-600" />
              <h1 className="text-base font-semibold text-brand-dark">Capture</h1>
            </div>
          </div>
          <Link to="/home" className="hidden sm:inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Command center
          </Link>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        <section className="rounded-3xl border border-brand-dark/10 bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">Business input layer</p>
          <h2 className="mt-2 text-3xl font-bold text-brand-dark">Capture business activity from any channel.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            WhatsApp is one channel, not the whole product. Hoursback can also take manual entries, scans, spreadsheets, webhooks, and workflow prompts, then turn them into operations and reports.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {captureChannels.map(({ title, body, icon: Icon, to, action, status }) => (
            <Link key={title} to={to} className="group rounded-3xl border border-brand-dark/10 bg-white p-5 hover:border-emerald-200 hover:bg-emerald-50/30">
              <div className="flex items-start justify-between gap-4">
                <div className="rounded-2xl bg-slate-100 p-3 text-slate-700 group-hover:bg-white group-hover:text-emerald-700">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{status}</span>
              </div>
              <p className="mt-4 text-base font-semibold text-brand-dark">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-500">{body}</p>
              <p className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                {action}
                <ArrowRight className="w-4 h-4" />
              </p>
            </Link>
          ))}
        </section>

        <section className="rounded-3xl border border-brand-dark/10 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: Upload, title: 'Capture', body: 'Bring raw activity into Hoursback.' },
              { icon: Radio, title: 'Structure', body: 'Normalize it into records, requests, payments, and logs.' },
              { icon: Link2, title: 'Use', body: 'Feed reports, workflows, closeout, and decisions.' },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl bg-slate-50 p-4">
                <Icon className="w-5 h-5 text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-brand-dark">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <MobileNav />
    </div>
  );
}
