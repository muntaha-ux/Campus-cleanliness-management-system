import React from 'react';

export interface BaustCardProps {
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'default' | 'accent' | 'military' | 'gold';
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export function BaustCard({
  title,
  subtitle,
  badge,
  actions,
  variant = 'default',
  children,
  className = '',
  headerClassName = '',
}: BaustCardProps) {
  const variantBorderClass = {
    default: 'border-slate-200/90',
    accent: 'border-slate-200/90 border-t-4 border-t-baust-primary-700',
    military: 'border-slate-200/90 border-l-4 border-l-baust-primary-800',
    gold: 'border-slate-200/90 border-t-4 border-t-baust-gold-500',
  }[variant];

  return (
    <div
      className={`bg-white rounded-xl border ${variantBorderClass} shadow-disciplined overflow-hidden transition-all duration-200 ${className}`}
    >
      {(title || subtitle || badge || actions) && (
        <div
          className={`px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 ${headerClassName}`}
        >
          <div className="space-y-0.5 min-w-[200px]">
            <div className="flex items-center gap-2.5">
              {title && (
                <h3 className="font-semibold text-slate-900 tracking-tight text-base sm:text-lg">
                  {title}
                </h3>
              )}
              {badge && <div>{badge}</div>}
            </div>
            {subtitle && <p className="text-xs sm:text-sm text-slate-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

