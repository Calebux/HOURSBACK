import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  ClipboardList,
  Database,
  FileText,
  Inbox,
  Radio,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MobileNav } from '../components/MobileNav';

const operationAreas = [
  {
    title: 'Sales and expenses',
    description: 'Review entries captured from WhatsApp, manual logging, scans, imports, and forms.',
    href: '/data-log',
    icon: ClipboardList,
    action: 'Open log',
  },
  {
    title: 'Customer requests',
    description: 'Track orders, bookings, payment receipts, pickup, delivery, and staff follow-up.',
    href: '/orders',
    icon: Inbox,
    action: 'Open queue',
  },
  {
    title: 'Capture channels',
    description: 'Connect or manage the places your business receives work and records activity.',
    href: '/capture',
    icon: Radio,
    action: 'Manage channels',
  },
  {
    title: 'Data sources',
    description: 'Keep business records connected to spreadsheets, uploads, forms, and integrations.',
    href: '/data-sources',
    icon: Database,
    action: 'View sources',
  },
  {
    title: 'Reports',
    description: 'Check revenue, profit, request activity, receipts, and operating summaries.',
    href: '/reports',
    icon: FileText,
    action: 'Open reports',
  },
  {
    title: 'Automations',
    description: 'Schedule WhatsApp, email, and report workflows for recurring business updates.',
    href: '/workflows',
    icon: Bot,
    action: 'Open workflows',
  },
];

export default function OperationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 pb-24 text-white">
      <div className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <Link
            to="/reports"
            className="hidden rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-emerald-300/50 hover:text-white sm:inline-flex"
          >
            Reports
          </Link>
        </div>

        <section className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.28em] text-emerald-300">
            Operations
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Run the day-to-day work from one place.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Sales, expenses, customer requests, receipts, reports, and connected business records stay grouped here,
            regardless of whether the work came from WhatsApp, manual entry, spreadsheets, or another channel.
          </p>
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {operationAreas.map((area) => {
            const Icon = area.icon;
            return (
              <Link
                key={area.title}
                to={area.href}
                className="rounded-lg border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-0.5 hover:border-emerald-300/50 hover:bg-white/[0.07]"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-400/12 text-emerald-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-white">{area.title}</h2>
                <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-300">{area.description}</p>
                <span className="mt-5 inline-flex text-sm font-semibold text-emerald-300">
                  {area.action}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
