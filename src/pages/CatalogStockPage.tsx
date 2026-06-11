import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Package, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { MobileNav } from '../components/MobileNav';
import { toast } from 'sonner';

type CatalogItem = {
  id: string;
  name: string;
  aliases: string[];
  category: string | null;
  unit_price: number | null;
  stock_qty: number | null;
  reorder_point: number | null;
  track_stock: boolean;
  active: boolean;
  updated_at: string;
};

type StockMovement = {
  id: string;
  movement_type: 'sale' | 'refund' | 'restock' | 'adjustment';
  qty_delta: number;
  notes: string | null;
  created_at: string;
  business_catalog_items?: { name: string } | null;
};

function aliasArray(value: string) {
  return value.split(',').map(v => v.trim()).filter(Boolean);
}

function num(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function fmt(n: number | null | undefined) {
  if (n == null) return '';
  return `₦${Number(n).toLocaleString()}`;
}

export default function CatalogStockPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [filter, setFilter] = useState('');
  const [form, setForm] = useState({
    name: '',
    aliases: '',
    category: '',
    unit_price: '',
    stock_qty: '',
    reorder_point: '',
    track_stock: false,
  });

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [itemsRes, movementsRes] = await Promise.all([
      supabase
        .from('business_catalog_items')
        .select('*')
        .eq('user_id', user.id)
        .order('active', { ascending: false })
        .order('name'),
      supabase
        .from('business_stock_movements')
        .select('*, business_catalog_items(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);
    if (itemsRes.error || movementsRes.error) {
      toast.error('Could not load catalog');
    }
    setItems((itemsRes.data ?? []) as CatalogItem[]);
    setMovements((movementsRes.data ?? []) as StockMovement[]);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) { navigate('/'); return; }
    void load();
  }, [user, navigate]);

  const filteredItems = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item =>
      item.name.toLowerCase().includes(q)
      || item.category?.toLowerCase().includes(q)
      || item.aliases?.some(alias => alias.toLowerCase().includes(q))
    );
  }, [items, filter]);

  const lowStockCount = items.filter(item =>
    item.active
    && item.track_stock
    && item.stock_qty != null
    && item.reorder_point != null
    && Number(item.stock_qty) <= Number(item.reorder_point)
  ).length;

  const saveItem = async () => {
    if (!user || !form.name.trim()) return;
    const name = form.name.trim();
    setSaving(true);
    const { error } = await supabase.from('business_catalog_items').upsert({
      user_id: user.id,
      name,
      aliases: [name, ...aliasArray(form.aliases)],
      category: form.category.trim() || null,
      unit_price: num(form.unit_price),
      stock_qty: form.track_stock ? num(form.stock_qty) ?? 0 : null,
      reorder_point: form.track_stock ? num(form.reorder_point) : null,
      track_stock: form.track_stock,
      active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,name' });
    setSaving(false);
    if (error) return toast.error(error.message);
    setForm({ name: '', aliases: '', category: '', unit_price: '', stock_qty: '', reorder_point: '', track_stock: false });
    toast.success('Catalog item saved');
    void load();
  };

  const deactivate = async (id: string) => {
    const { error } = await supabase
      .from('business_catalog_items')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return toast.error(error.message);
    void load();
  };

  const restock = async (item: CatalogItem) => {
    if (!user) return;
    const raw = window.prompt(`Add stock quantity for ${item.name}`);
    const qty = raw ? Number(raw.replace(/,/g, '')) : NaN;
    if (!Number.isFinite(qty) || qty <= 0) return;
    const nextQty = Number(item.stock_qty || 0) + qty;
    const { error: itemError } = await supabase
      .from('business_catalog_items')
      .update({ stock_qty: nextQty, track_stock: true, updated_at: new Date().toISOString() })
      .eq('id', item.id);
    if (itemError) return toast.error(itemError.message);
    const { error: movementError } = await supabase.from('business_stock_movements').insert({
      user_id: user.id,
      catalog_item_id: item.id,
      movement_type: 'restock',
      qty_delta: qty,
      notes: 'Manual restock from Catalog & Stock',
    });
    if (movementError) return toast.error(movementError.message);
    toast.success('Stock updated');
    void load();
  };

  if (loading) {
    return <div className="min-h-screen bg-brand-light flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand-dark" /></div>;
  }

  return (
    <div className="min-h-screen bg-brand-light pb-24 text-brand-dark">
      <div className="sticky top-0 z-40 border-b border-brand-dark/10 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="rounded-lg p-1.5 hover:bg-slate-100">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </button>
            <div>
              <h1 className="text-base font-semibold">Catalog & Stock</h1>
              <p className="text-xs text-slate-500">Set item names, prices, and inventory for WhatsApp logs and reports.</p>
            </div>
          </div>
          <Link to="/operations" className="text-sm font-semibold text-slate-500 hover:text-brand-dark">Operations</Link>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6 space-y-5">
        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-brand-dark/10 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Active items</p>
            <p className="mt-2 text-2xl font-bold">{items.filter(i => i.active).length}</p>
          </div>
          <div className="rounded-xl border border-brand-dark/10 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Low stock</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">{lowStockCount}</p>
          </div>
          <div className="rounded-xl border border-brand-dark/10 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-400">Priced items</p>
            <p className="mt-2 text-2xl font-bold">{items.filter(i => i.active && i.unit_price != null).length}</p>
          </div>
        </section>

        <section className="rounded-2xl border border-brand-dark/10 bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold">Add item</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <input value={form.name} onChange={e => setForm(v => ({ ...v, name: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Item name, e.g. gowns" />
            <input value={form.unit_price} onChange={e => setForm(v => ({ ...v, unit_price: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Unit price" inputMode="decimal" />
            <input value={form.category} onChange={e => setForm(v => ({ ...v, category: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Category" />
            <input value={form.aliases} onChange={e => setForm(v => ({ ...v, aliases: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm" placeholder="Aliases, comma separated" />
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.track_stock} onChange={e => setForm(v => ({ ...v, track_stock: e.target.checked }))} />
              Track stock
            </label>
            <input value={form.stock_qty} onChange={e => setForm(v => ({ ...v, stock_qty: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50" placeholder="Current stock" inputMode="decimal" disabled={!form.track_stock} />
            <input value={form.reorder_point} onChange={e => setForm(v => ({ ...v, reorder_point: e.target.value }))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50" placeholder="Low stock point" inputMode="decimal" disabled={!form.track_stock} />
            <button onClick={saveItem} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-dark px-3 py-2 text-sm font-semibold text-white disabled:opacity-60">
              <Plus className="h-4 w-4" /> Save item
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-brand-dark/10 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <h2 className="font-semibold">Items</h2>
            <input value={filter} onChange={e => setFilter(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:w-72" placeholder="Search catalog" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Item</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Category</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-400">Price</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-400">Stock</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-400">Low at</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase text-slate-400">Aliases</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => {
                  const low = item.active && item.track_stock && item.stock_qty != null && item.reorder_point != null && Number(item.stock_qty) <= Number(item.reorder_point);
                  return (
                    <tr key={item.id} className={`border-b border-slate-50 last:border-0 ${index % 2 ? 'bg-slate-50/50' : ''} ${!item.active ? 'opacity-45' : ''}`}>
                      <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                      <td className="px-4 py-3 text-slate-500">{item.category || ''}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{fmt(item.unit_price)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${low ? 'text-amber-700' : 'text-slate-700'}`}>{item.track_stock ? Number(item.stock_qty || 0).toLocaleString() : ''}</td>
                      <td className="px-4 py-3 text-right text-slate-500">{item.track_stock && item.reorder_point != null ? Number(item.reorder_point).toLocaleString() : ''}</td>
                      <td className="px-4 py-3 text-slate-500">{item.aliases?.filter(alias => alias !== item.name).join(', ')}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {item.active && item.track_stock && (
                            <button onClick={() => restock(item)} className="p-1.5 text-slate-400 hover:text-emerald-600" title="Add stock">
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                          {item.active && (
                            <button onClick={() => deactivate(item.id)} className="p-1.5 text-slate-300 hover:text-red-500" title="Archive item">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!filteredItems.length && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-400">No catalog items yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {movements.length > 0 && (
          <section className="rounded-2xl border border-brand-dark/10 bg-white p-4">
            <h2 className="mb-3 font-semibold">Recent stock movements</h2>
            <div className="divide-y divide-slate-100">
              {movements.map(movement => (
                <div key={movement.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-800">{movement.business_catalog_items?.name || 'Catalog item'}</p>
                    <p className="text-xs text-slate-500">{movement.movement_type} · {movement.notes || new Date(movement.created_at).toLocaleString()}</p>
                  </div>
                  <p className={movement.qty_delta < 0 ? 'font-semibold text-red-600' : 'font-semibold text-emerald-700'}>
                    {movement.qty_delta > 0 ? '+' : ''}{Number(movement.qty_delta).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
      <MobileNav />
    </div>
  );
}
