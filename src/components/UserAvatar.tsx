import type { User } from '@supabase/supabase-js';

interface Props {
  user: User | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
};

export function UserAvatar({ user, size = 'sm', className = '' }: Props) {
  const googleAvatar = user?.user_metadata?.avatar_url as string | undefined;
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'U';
  const initial = name[0].toUpperCase();

  // Use Google photo if available, otherwise generate one from the initial
  const src = googleAvatar
    ? googleAvatar
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(initial)}&background=202124&color=ffffff&bold=true&size=128`;

  return (
    <img
      src={src}
      alt={initial}
      referrerPolicy="no-referrer"
      className={`${sizeMap[size]} rounded-full object-cover shrink-0 ${className}`}
    />
  );
}
