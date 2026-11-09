import React from 'react';

export interface StatKpiCardProps {
  title: string;
  count: number | string;
  color: 'emerald' | 'amber' | 'blue' | 'crimson' | 'gold';
  icon?: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
  className?: string;
}

export function StatKpiCard({
  title,
  count,
  color,
  icon,
  subtitle,
  trend,
  onClick,
  className = '',
}: StatKpiCardProps) {
  const colorMap = {
    emerald: {
      border: 'border-l-emerald-600',
      bg: 'bg-emerald-50 text-emerald-700',
      countText: 'text-emerald-950',
    },
    amber: {
      border: 'border-l-amber-500',
      bg: 'bg-amber-50 text-amber-700',
      countText: 'text-amber-950',
    },
    blue: {
      border: 'border-l-sky-600',
      bg: 'bg-sky-50 text-sky-700',
      countText: 'text-sky-950',
    },
    crimson: {
      border: 'border-l-red-600',
      bg: 'bg-red-50 text-red-700',
      countText: 'text-red-950',
    },
    gold: {
      border: 'border-l-baust-gold-500',
      bg: 'bg-amber-50 text-baust-gold-700',
      countText: 'text-slate-900',
    },
  }[color];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/90 border-l-4 ${colorMap.border} p-4 sm:p-5 shadow-disciplined transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-slate-300' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${colorMap.countText}`}>
              {count}
            </span>
            {trend && (
              <span
                className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                  trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 pt-0.5">{subtitle}</p>}
        </div>
        {icon && (
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorMap.bg}`}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
