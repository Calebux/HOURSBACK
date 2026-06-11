import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bot,
  ClipboardList,
  Database,
  FileText,
  Inbox,
  Radio,
  Shield,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { MobileNav } from '../components/MobileNav';
import { UserAvatar } from '../components/UserAvatar';

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
    title: 'Team and outlets',
    description: 'Authorize internal WhatsApp users and map staff, aliases, and outlets for cleaner logs.',
    href: '/team-outlets',
    icon: Shield,
    action: 'Manage access',
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
    <div className="min-h-screen bg-brand-light pb-24 text-brand-dark">
      <nav className="sticky top-0 z-50 border-b border-brand-dark/10 bg-brand-light/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link to="/home" className="flex items-center">
            <img src="/logo.svg" alt="Hoursback" className="h-[32px] w-auto" />
          </Link>
          <div className="hidden items-center gap-2 text-sm md:flex">
            <Link to="/capture" className="rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100">Capture</Link>
            <Link to="/operations" className="rounded-full bg-[#DA7756]/10 px-3 py-1.5 font-medium text-[#DA7756]">Operations</Link>
            <Link to="/reports" className="rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100">Reports</Link>
            <Link to="/workflows" className="rounded-full px-3 py-1.5 text-slate-600 hover:bg-slate-100">Automations</Link>
            <Link to="/account" title="Account" className="ml-1">
              <UserAvatar user={user} size="sm" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-5 py-8">
        <section className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#DA7756]">
            Operations
          </p>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Run the day-to-day work from one place.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
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
                className="rounded-2xl border border-brand-dark/10 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/30"
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold text-brand-dark">{area.title}</h2>
                <p className="mt-2 min-h-[72px] text-sm leading-6 text-slate-600">{area.description}</p>
                <span className="mt-5 inline-flex text-sm font-semibold text-emerald-700">
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
