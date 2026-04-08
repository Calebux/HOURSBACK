import { useMemo, useState } from 'react';
import { useFlutterwave, closePaymentModal } from 'flutterwave-react-v3';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from '../lib/api';
import { toast } from 'sonner';
import { Crown } from 'lucide-react';

interface Props {
  className?: string;
  children?: React.ReactNode;
}

export function ProUpgradeButton({ className, children }: Props) {
  const { user, refreshPro } = useAuth();

  const [txRef] = useState(() => `hb_tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`);

  const config = useMemo(() => ({
    public_key: import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: txRef,
    amount: Math.floor(20 * 1500),
    currency: 'NGN',
    payment_options: 'card,mobilemoney,ussd',
    customer: {
      email: user?.email || '',
      phone_number: '',
      name: user?.user_metadata?.name || '',
    },
    meta: { user_id: user?.id || '' },
    customizations: {
      title: 'Hoursback Pro',
      description: 'Unlock all workflows — $20/month',
      logo: 'https://i.ibb.co/L5hY5M0/logo.png',
    },
  }), [user, txRef]);

  const handleFlutterPayment = useFlutterwave(config);

  const handleUpgrade = () => {
    if (!user) return;
    handleFlutterPayment({
      callback: async (response) => {
        if (response.status === 'successful' || response.status === 'completed') {
          closePaymentModal();
          localStorage.setItem('has_pro_access', 'true');
          try {
            await updateProfile(user.id, { subscription_status: 'pro' });
            await refreshPro();
          } catch (err) {
            console.error('Failed to update profile', err);
          }
          toast.success('Welcome to Pro! All workflows are now unlocked.');
        } else {
          toast.error('Payment failed or was incomplete. Please try again.');
          closePaymentModal();
        }
      },
      onClose: () => {},
    });
  };

  return (
    <button onClick={handleUpgrade} className={className}>
      {children ?? (
        <span className="flex items-center gap-2">
          <Crown className="w-4 h-4" /> Upgrade to Pro
        </span>
      )}
    </button>
  );
}
