import type { User } from '@supabase/supabase-js';

interface Props {
  user: User | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
};

export function UserAvatar({ user, size = 'sm', className = '' }: Props) {
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initial = (user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'U')[0].toUpperCase();
  const base = `${sizeMap[size]} rounded-full shrink-0 ${className}`;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={initial}
        referrerPolicy="no-referrer"
        className={`${base} object-cover`}
      />
    );
  }

  return (
    <div className={`${base} bg-brand-dark flex items-center justify-center text-white font-bold border border-slate-200`}>
      {initial}
    </div>
  );
}
