import { cn } from '../../utils/cn';

interface AvatarProps {
  src: string | null;
  alt: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, alt, size = 32, className }: AvatarProps) {
  const initials = alt.slice(0, 2).toUpperCase();

  if (!src) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-600',
          className,
        )}
        style={{ width: size, height: size }}
        aria-label={alt}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full bg-slate-100 object-cover', className)}
      loading="lazy"
    />
  );
}
