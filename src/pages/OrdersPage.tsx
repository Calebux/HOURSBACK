import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, MessageCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { MobileNav } from '../components/MobileNav';

interface Order {
  id: string;
  customer_phone: string | null;
  customer_name: string | null;
  status: string;
  items: Array<{ name: string; qty?: number | null; unit_price?: number | null }>;
  delivery_address: string | null;
  payment_method: string | null;
  notes: string | null;
  raw_text: string | null;
  created_at: string;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusClass(status: string) {
  switch (status) {
    case 'confirmed': return 'bg-emerald-50 text-emerald-700';
    case 'fulfilled': return 'bg-blue-50 text-blue-700';
    case 'cancelled': return 'bg-slate-100 text-slate-500';
    default: return 'bg-amber-50 text-amber-700';
  }
}

function itemSummary(items: Order['items']) {
  if (!items?.length) return 'No items parsed';
  return items.map((item) => `${item.qty ? `${item.qty} x ` : ''}${item.name}`).join(', ');
}

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  const loadOrders = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('kapso_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200);
    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const filtered = useMemo(() =>
    filter ? orders.filter((order) => order.status === filter) : orders,
    [orders, filter]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light pb-24">
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/whatsapp" className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-500" />
            </Link>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <h1 className="text-base font-semibold text-brand-dark">WhatsApp Orders</h1>
            </div>
          </div>
          <button
            onClick={loadOrders}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-dark border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        <section className="bg-white rounded-2xl border border-brand-dark/10 p-4">
          <p className="text-sm font-semibold text-brand-dark">Customer-facing WhatsApp</p>
          <p className="mt-1 text-xs text-slate-500">
            Orders sent to your customer number are captured here. Confirmed orders include items and delivery details.
          </p>
        </section>

        <div className="flex flex-wrap gap-2">
          {['', 'needs_details', 'confirmed', 'fulfilled', 'cancelled'].map((status) => (
            <button
              key={status || 'all'}
              onClick={() => setFilter(status)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === status ? 'bg-brand-dark text-white' : 'bg-white border border-slate-200 text-slate-500 hover:text-brand-dark'
              }`}
            >
              {status ? status.replace(/_/g, ' ') : 'all'}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-10 text-center">
            <p className="font-semibold text-brand-dark">No orders yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Ask a customer to message your customer-facing WhatsApp number.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <article key={order.id} className="bg-white rounded-2xl border border-brand-dark/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">{itemSummary(order.items)}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {order.customer_name || order.customer_phone || 'Customer'} · {fmtDate(order.created_at)}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(order.status)}`}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs text-slate-500">
                  <p><span className="font-semibold text-slate-600">Delivery:</span> {order.delivery_address || 'missing'}</p>
                  <p><span className="font-semibold text-slate-600">Payment:</span> {order.payment_method || 'not specified'}</p>
                </div>
                {order.notes && <p className="mt-2 text-xs text-slate-500">{order.notes}</p>}
                {order.raw_text && <p className="mt-3 text-xs text-slate-400 border-t border-slate-100 pt-3">{order.raw_text}</p>}
              </article>
            ))}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
