import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Plus, Shield, Store, Trash2, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MobileNav } from '../components/MobileNav';
import { toast } from 'sonner';

type Staff = { id: string; name: string; aliases: string[]; default_shop: string | null; active: boolean };
type Shop = { id: string; name: string; aliases: string[]; active: boolean };
type Contact = {
  id: string;
  name: string;
  phone_number: string;
  role: 'owner' | 'manager' | 'staff';
  can_log_sales: boolean;
  can_query_reports: boolean;
  can_closeout: boolean;
  can_manage_setup: boolean;
  active: boolean;
};

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.startsWith('0')) return `234${digits.slice(1)}`;
  return digits;
}

function aliasArray(value: string) {
  return value.split(',').map(v => v.trim()).filter(Boolean);
}

export default function TeamOutletsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [staffForm, setStaffForm] = useState({ name: '', aliases: '', default_shop: '' });
  const [shopForm, setShopForm] = useState({ name: '', aliases: '' });
  const [contactForm, setContactForm] = useState({
    name: '',
    phone_number: '',
    role: 'staff' as Contact['role'],
    can_log_sales: true,
    can_query_reports: false,
    can_closeout: false,
    can_manage_setup: false,
  });

  const load = async () => {
    if (!user) return;
    const [staffRes, shopRes, contactRes] = await Promise.all([
      supabase.from('business_staff').select('*').eq('user_id', user.id).order('name'),
      supabase.from('business_shops').select('*').eq('user_id', user.id).order('name'),
      supabase.from('business_internal_contacts').select('*').eq('user_id', user.id).order('name'),
    ]);
    if (staffRes.error || shopRes.error || contactRes.error) {
      toast.error('Could not load team setup');
    }
    setStaff((staffRes.data ?? []) as Staff[]);
    setShops((shopRes.data ?? []) as Shop[]);
    setContacts((contactRes.data ?? []) as Contact[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    void load();
  }, [user, navigate]);

  const addShop = async () => {
    if (!user || !shopForm.name.trim()) return;
    setSaving(true);
    const name = shopForm.name.trim();
    const { error } = await supabase.from('business_shops').upsert({
      user_id: user.id,
      name,
      aliases: [name, ...aliasArray(shopForm.aliases)],
      active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,name' });
    setSaving(false);
    if (error) return toast.error(error.message);
    setShopForm({ name: '', aliases: '' });
    toast.success('Outlet saved');
    void load();
  };

  const addStaff = async () => {
    if (!user || !staffForm.name.trim()) return;
    setSaving(true);
    const name = staffForm.name.trim();
    const { error } = await supabase.from('business_staff').upsert({
      user_id: user.id,
      name,
      aliases: [name, ...aliasArray(staffForm.aliases)],
      default_shop: staffForm.default_shop || null,
      active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,name' });
    setSaving(false);
    if (error) return toast.error(error.message);
    setStaffForm({ name: '', aliases: '', default_shop: '' });
    toast.success('Staff saved');
    void load();
  };

  const addContact = async () => {
    if (!user || !contactForm.name.trim() || !contactForm.phone_number.trim()) return;
    const phone = normalizePhone(contactForm.phone_number);
    if (phone.length < 8) return toast.error('Enter a valid WhatsApp number');
    setSaving(true);
    const roleDefaults = contactForm.role === 'owner' || contactForm.role === 'manager';
    const { error } = await supabase.from('business_internal_contacts').upsert({
      user_id: user.id,
      name: contactForm.name.trim(),
      phone_number: phone,
      role: contactForm.role,
      can_log_sales: contactForm.can_log_sales,
      can_query_reports: roleDefaults || contactForm.can_query_reports,
      can_closeout: roleDefaults || contactForm.can_closeout,
      can_manage_setup: roleDefaults || contactForm.can_manage_setup,
      active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,phone_number' });
    setSaving(false);
    if (error) return toast.error(error.message);
    setContactForm({
      name: '',
      phone_number: '',
      role: 'staff',
      can_log_sales: true,
      can_query_reports: false,
      can_closeout: false,
      can_manage_setup: false,
    });
    toast.success('Authorized contact saved');
    void load();
  };

  const deactivate = async (table: string, id: string) => {
    const { error } = await supabase.from(table).update({ active: false, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return toast.error(error.message);
    void load();
  };

  if (loading) {
    return <div className="min-h-screen bg-brand-light flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-dark" /></div>;
  }

  return (
    <div className="min-h-screen bg-brand-light pb-24 text-brand-dark">
      <div className="sticky top-0 z-40 border-b border-brand-dark/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 hover:bg-slate-100">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-base font-semibold">Team & Outlets</h1>
              <p className="text-xs text-slate-500">Control who can use internal WhatsApp and how rows are tagged.</p>
            </div>
          </div>
          <Link to="/operations" className="text-sm font-semibold text-slate-500 hover:text-brand-dark">Operations</Link>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 space-y-5">
        <section className="rounded-2xl border border-red-100 bg-red-50 p-4">
          <div className="flex items-start gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-semibold text-red-950">Internal WhatsApp is locked to authorized contacts.</p>
              <p className="mt-1 text-xs leading-5 text-red-800">
                Add owner, manager, and staff phone numbers here. Unknown numbers cannot query sales, run closeout, or log internal records.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-brand-dark/10 bg-white p-4 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold">Authorized WhatsApp contacts</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input value={contactForm.name} onChange={e => setContactForm(v => ({ ...v, name: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Name, e.g. Ada" />
              <input value={contactForm.phone_number} onChange={e => setContactForm(v => ({ ...v, phone_number: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="WhatsApp number, e.g. 080..." />
              <select value={contactForm.role} onChange={e => setContactForm(v => ({ ...v, role: e.target.value as Contact['role'] }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
                <option value="staff">Staff</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
              <button onClick={addContact} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-dark px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
                <Plus className="h-4 w-4" /> Add contact
              </button>
            </div>
            <div className="mt-4 divide-y divide-slate-100">
              {contacts.map(contact => (
                <div key={contact.id} className={`flex items-center justify-between gap-3 py-3 ${!contact.active ? 'opacity-45' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold">{contact.name} <span className="font-normal text-slate-400">({contact.role})</span></p>
                    <p className="text-xs text-slate-500">+{contact.phone_number} · {[
                      contact.can_log_sales ? 'log' : null,
                      contact.can_query_reports ? 'reports' : null,
                      contact.can_closeout ? 'closeout' : null,
                      contact.can_manage_setup ? 'setup' : null,
                    ].filter(Boolean).join(', ')}</p>
                  </div>
                  {contact.active && <button onClick={() => deactivate('business_internal_contacts', contact.id)} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}
                </div>
              ))}
              {!contacts.length && <p className="py-4 text-sm text-slate-400">No contacts yet.</p>}
            </div>
          </div>

          <div className="rounded-2xl border border-brand-dark/10 bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-600" />
              <h2 className="font-semibold">Outlets</h2>
            </div>
            <input value={shopForm.name} onChange={e => setShopForm(v => ({ ...v, name: e.target.value }))} className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Outlet name" />
            <input value={shopForm.aliases} onChange={e => setShopForm(v => ({ ...v, aliases: e.target.value }))} className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Aliases, comma separated" />
            <button onClick={addShop} disabled={saving} className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-dark px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
              <Plus className="h-4 w-4" /> Add outlet
            </button>
            <div className="divide-y divide-slate-100">
              {shops.map(shop => (
                <div key={shop.id} className={`flex items-center justify-between py-2 ${!shop.active ? 'opacity-45' : ''}`}>
                  <div>
                    <p className="text-sm font-semibold">{shop.name}</p>
                    <p className="text-xs text-slate-400">{shop.aliases?.join(', ')}</p>
                  </div>
                  {shop.active && <button onClick={() => deactivate('business_shops', shop.id)} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-brand-dark/10 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold">Staff names and aliases</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_180px_auto]">
            <input value={staffForm.name} onChange={e => setStaffForm(v => ({ ...v, name: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Staff name" />
            <input value={staffForm.aliases} onChange={e => setStaffForm(v => ({ ...v, aliases: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Aliases, comma separated" />
            <select value={staffForm.default_shop} onChange={e => setStaffForm(v => ({ ...v, default_shop: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
              <option value="">No default outlet</option>
              {shops.filter(s => s.active).map(shop => <option key={shop.id} value={shop.name}>{shop.name}</option>)}
            </select>
            <button onClick={addStaff} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-dark px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
              <Plus className="h-4 w-4" /> Add staff
            </button>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {staff.map(person => (
              <div key={person.id} className={`flex items-center justify-between gap-3 py-3 ${!person.active ? 'opacity-45' : ''}`}>
                <div>
                  <p className="text-sm font-semibold">{person.name}</p>
                  <p className="text-xs text-slate-500">{person.default_shop ? `Default: ${person.default_shop}` : 'No default outlet'} · {person.aliases?.join(', ')}</p>
                </div>
                {person.active && <button onClick={() => deactivate('business_staff', person.id)} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>}
              </div>
            ))}
            {!staff.length && <p className="py-4 text-sm text-slate-400">No staff yet.</p>}
          </div>
        </section>
      </main>
      <MobileNav />
    </div>
  );
}
