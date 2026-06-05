import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, MessageCircle, RefreshCw, XCircle } from 'lucide-react';
import { toast } from 'sonner';
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
  payment_status?: string | null;
  payment_claimed_amount?: number | string | null;
  delivery_fee_amount?: number | string | null;
  expected_total_amount?: number | string | null;
  owner_adjusted_total_amount?: number | string | null;
  owner_notes?: string | null;
  fulfillment_status?: string | null;
  fulfilled_at?: string | null;
  paid_at?: string | null;
  receipt_received_at?: string | null;
  receipt_url?: string | null;
  receipt_storage_path?: string | null;
  receipt_filename?: string | null;
  receipt_content_type?: string | null;
  receipt_storage_status?: string | null;
  receipt_storage_error?: string | null;
  order_code?: string | null;
  payment_verified_at?: string | null;
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

function paymentStatusClass(status?: string | null) {
  if (status === 'verified') return 'bg-emerald-50 text-emerald-700';
  if (status === 'receipt_sent') return 'bg-blue-50 text-blue-700';
  return 'bg-amber-50 text-amber-700';
}

function itemSummary(items: Order['items']) {
  if (!items?.length) return 'No items parsed';
  return items.map((item) => `${item.qty ? `${item.qty} x ` : ''}${item.name}`).join(', ');
}

function orderTotal(items: Order['items']) {
  const total = items.reduce((sum, item) => {
    const qty = Number(item.qty || 1);
    const price = Number(item.unit_price || 0);
    return price > 0 ? sum + qty * price : sum;
  }, 0);
  return total > 0 ? total : null;
}

function money(amount: number | string | null | undefined) {
  const value = Number(amount || 0);
  return value > 0 ? `₦${value.toLocaleString('en-NG')}` : null;
}

export default function OrdersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [verifyingOrderId, setVerifyingOrderId] = useState<string | null>(null);
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [savingReviewId, setSavingReviewId] = useState<string | null>(null);
  const [fulfillmentOrderId, setFulfillmentOrderId] = useState<string | null>(null);
  const [openingReceiptId, setOpeningReceiptId] = useState<string | null>(null);

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

  const verifyPayment = async (orderId: string, form?: HTMLFormElement) => {
    const formData = form ? new FormData(form) : null;
    setVerifyingOrderId(orderId);
    const { error } = await supabase.functions.invoke('kapso-setup', {
      body: {
        action: 'verify_order_payment',
        order_id: orderId,
        delivery_note: String(formData?.get('delivery_note') || ''),
      },
    });
    setVerifyingOrderId(null);

    if (error) {
      toast.error(error.message || 'Could not confirm payment');
      return;
    }

    toast.success('Payment confirmed and customer notified');
    await loadOrders();
  };

  const rejectPayment = async (orderId: string) => {
    setRejectingOrderId(orderId);
    const { error } = await supabase.functions.invoke('kapso-setup', {
      body: {
        action: 'reject_order_payment',
        order_id: orderId,
      },
    });
    setRejectingOrderId(null);

    if (error) {
      toast.error(error.message || 'Could not reject receipt');
      return;
    }

    toast.success('Customer asked to resend payment proof');
    await loadOrders();
  };

  const saveReview = async (order: Order, form: HTMLFormElement) => {
    const formData = new FormData(form);
    setSavingReviewId(order.id);
    const { error } = await supabase.functions.invoke('kapso-setup', {
      body: {
        action: 'update_order_review',
        order_id: order.id,
        delivery_fee_amount: String(formData.get('delivery_fee_amount') || ''),
        expected_total_amount: String(formData.get('expected_total_amount') || ''),
        owner_adjusted_total_amount: String(formData.get('owner_adjusted_total_amount') || ''),
        owner_notes: String(formData.get('owner_notes') || ''),
      },
    });
    setSavingReviewId(null);

    if (error) {
      toast.error(error.message || 'Could not save order review');
      return;
    }

    toast.success('Request review saved');
    await loadOrders();
  };

  const updateFulfillment = async (orderId: string, fulfillmentStatus: string) => {
    setFulfillmentOrderId(orderId);
    const { error } = await supabase.functions.invoke('kapso-setup', {
      body: {
        action: 'update_order_fulfillment',
        order_id: orderId,
        fulfillment_status: fulfillmentStatus,
      },
    });
    setFulfillmentOrderId(null);

    if (error) {
      toast.error(error.message || 'Could not update fulfillment');
      return;
    }

    toast.success('Customer notified');
    await loadOrders();
  };

  const openReceipt = async (order: Order) => {
    setOpeningReceiptId(order.id);
    const receiptWindow = window.open('about:blank', '_blank');
    if (receiptWindow) receiptWindow.opener = null;
    try {
      if (order.receipt_storage_path) {
        const { data, error } = await supabase.storage
          .from('kapso-receipts')
          .createSignedUrl(order.receipt_storage_path, 60 * 10);
        if (error) throw error;
        if (data?.signedUrl) {
          if (receiptWindow) {
            receiptWindow.location.href = data.signedUrl;
          } else {
            window.location.href = data.signedUrl;
          }
          return;
        }
      }

      receiptWindow?.close();
      toast.error(order.receipt_received_at ? 'Ask the customer to resend the receipt so Hoursback can save it.' : 'No receipt is available for this order');
    } catch (err) {
      receiptWindow?.close();
      toast.error(err instanceof Error ? err.message : 'Could not open receipt');
    } finally {
      setOpeningReceiptId(null);
    }
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

  const requestType = (order: Order) => {
    const text = `${itemSummary(order.items)} ${order.delivery_address || ''} ${order.notes || ''} ${order.raw_text || ''}`.toLowerCase();
    if (/\b(book|booking|appointment|schedule|slot|friday|monday|tuesday|wednesday|thursday|saturday|sunday)\b/.test(text)) return 'Booking';
    if (/\b(repair|fix|installation|install|service|consultation|fitting|alteration|styling)\b/.test(text)) return 'Service';
    return 'Order';
  };

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
              <h1 className="text-base font-semibold text-brand-dark">WhatsApp Requests</h1>
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
            Product orders, bookings, repairs, service requests, receipts, and payment checks from your customer number are captured here.
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
              {status ? status.replace(/_/g, ' ') : 'all requests'}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-dark/10 p-10 text-center">
            <p className="font-semibold text-brand-dark">No customer requests yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Ask a customer to message your customer-facing WhatsApp number.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((order) => (
              <article key={order.id} className="bg-white rounded-2xl border border-brand-dark/10 p-4">
                {(() => {
                  const itemTotal = orderTotal(order.items);
                  const expectedTotal = Number(order.expected_total_amount || 0) || itemTotal;
                  const reviewedTotal = Number(order.owner_adjusted_total_amount || 0) || expectedTotal;
                  const claimedAmount = money(order.payment_claimed_amount);
                  return (
                    <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">{itemSummary(order.items)}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {order.customer_name || order.customer_phone || 'Customer'} · {fmtDate(order.created_at)}
                      {order.order_code ? ` · ${order.order_code}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass(order.status)}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">
                      {requestType(order)}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${paymentStatusClass(order.payment_status)}`}>
                      {order.payment_status || 'unpaid'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      {order.fulfillment_status || 'new'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid sm:grid-cols-2 gap-2 text-xs text-slate-500">
                  <p><span className="font-semibold text-slate-600">Fulfillment details:</span> {order.delivery_address || 'missing'}</p>
                  <p><span className="font-semibold text-slate-600">Payment:</span> {order.payment_method || 'not specified'}</p>
                  {itemTotal && <p><span className="font-semibold text-slate-600">Items:</span> {money(itemTotal)}</p>}
                  {money(order.delivery_fee_amount) && <p><span className="font-semibold text-slate-600">Delivery/service fee:</span> {money(order.delivery_fee_amount)}</p>}
                  {expectedTotal && <p><span className="font-semibold text-slate-600">Expected:</span> {money(expectedTotal)}</p>}
                  {reviewedTotal && reviewedTotal !== expectedTotal && <p><span className="font-semibold text-slate-600">Reviewed total:</span> {money(reviewedTotal)}</p>}
                  {claimedAmount && <p><span className="font-semibold text-slate-600">Customer paid:</span> {claimedAmount}</p>}
                  <p>
                    <span className="font-semibold text-slate-600">Receipt:</span>{' '}
                    {order.receipt_storage_path ? (
                      <button
                        onClick={() => openReceipt(order)}
                        disabled={openingReceiptId === order.id}
                        className="text-emerald-700 underline disabled:opacity-60"
                      >
                        {openingReceiptId === order.id ? 'opening...' : 'open receipt'}
                      </button>
                    ) : order.receipt_received_at ? 'needs resend' : 'not sent'}
                  </p>
                  {order.receipt_storage_status === 'failed' && (
                    <p className="text-amber-700">
                      <span className="font-semibold">Receipt issue:</span> customer should resend with reference {order.order_code || 'shown above'}
                    </p>
                  )}
                  {order.receipt_received_at && <p><span className="font-semibold text-slate-600">Receipt sent:</span> {fmtDate(order.receipt_received_at)}</p>}
                  {order.paid_at && <p><span className="font-semibold text-slate-600">Paid:</span> {fmtDate(order.paid_at)}</p>}
                  {order.payment_verified_at && <p><span className="font-semibold text-slate-600">Verified:</span> {fmtDate(order.payment_verified_at)}</p>}
                  {order.fulfilled_at && <p><span className="font-semibold text-slate-600">Fulfilled:</span> {fmtDate(order.fulfilled_at)}</p>}
                </div>
                <form
                  className="mt-3 grid gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveReview(order, event.currentTarget);
                  }}
                >
                  <label className="text-xs font-medium text-slate-500">
                    Delivery/service fee
                    <input
                      name="delivery_fee_amount"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={String(order.delivery_fee_amount || '')}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-emerald-400"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-500">
                    Expected total
                    <input
                      name="expected_total_amount"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={String(order.expected_total_amount || expectedTotal || '')}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-emerald-400"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-500">
                    Reviewed total
                    <input
                      name="owner_adjusted_total_amount"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={String(order.owner_adjusted_total_amount || '')}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-emerald-400"
                    />
                  </label>
                  <label className="text-xs font-medium text-slate-500 sm:col-span-3">
                    Owner notes
                    <textarea
                      name="owner_notes"
                      rows={2}
                      defaultValue={order.owner_notes || ''}
                      className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-emerald-400"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={savingReviewId === order.id}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-60 sm:col-span-3 sm:w-fit"
                  >
                    {savingReviewId === order.id ? 'Saving...' : 'Save review'}
                  </button>
                </form>
                {order.payment_status === 'receipt_sent' && (
                  <form
                    className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void verifyPayment(order.id, event.currentTarget);
                    }}
                  >
                    <label className="block text-xs font-medium text-emerald-800">
                      Customer update after payment confirmation
                      <input
                        name="delivery_note"
                        className="mt-1 w-full rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-emerald-500"
                        placeholder="e.g. Your item is ready for pickup, or your technician will arrive by 2pm."
                      />
                    </label>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={verifyingOrderId === order.id || !order.receipt_storage_path}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        title={!order.receipt_storage_path ? 'Ask the customer to resend the receipt before confirming payment' : undefined}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {verifyingOrderId === order.id ? 'Confirming...' : order.receipt_storage_path ? 'Confirm payment' : 'Waiting for saved receipt'}
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectPayment(order.id)}
                        disabled={rejectingOrderId === order.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {rejectingOrderId === order.id ? 'Rejecting...' : 'Reject receipt'}
                      </button>
                    </div>
                  </form>
                )}
                {order.payment_status === 'verified' && order.status !== 'fulfilled' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      ['preparing', 'Preparing'],
                      ['ready_for_pickup', 'Ready for pickup'],
                      ['out_for_delivery', 'Out for delivery'],
                      ['completed', 'Completed'],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => updateFulfillment(order.id, value)}
                        disabled={fulfillmentOrderId === order.id}
                        className="rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        {fulfillmentOrderId === order.id ? 'Updating...' : label}
                      </button>
                    ))}
                  </div>
                )}
                {order.owner_notes && <p className="mt-2 text-xs text-slate-600"><span className="font-semibold">Owner notes:</span> {order.owner_notes}</p>}
                {order.notes && <p className="mt-2 text-xs text-slate-500">{order.notes}</p>}
                {order.raw_text && <p className="mt-3 text-xs text-slate-400 border-t border-slate-100 pt-3">{order.raw_text}</p>}
                    </>
                  );
                })()}
              </article>
            ))}
          </div>
        )}
      </main>

      <MobileNav />
    </div>
  );
}
