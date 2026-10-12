import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  badge?: string;
  badgeType?: 'positive' | 'negative' | 'neutral' | 'accent';
  icon: LucideIcon;
  iconBg?: string;
  tooltip?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  badgeType = 'neutral',
  icon: Icon,
  iconBg = 'bg-blue-50 text-blue-600',
  tooltip,
  onClick,
}) => {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'positive':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'negative':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'accent':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div
      onClick={onClick}
      title={tooltip}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-200 relative overflow-hidden ${
        onClick ? 'cursor-pointer hover:border-teal-400' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums font-mono">
              {value}
            </span>
            {badge && (
              <span
                className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${getBadgeStyle()}`}
              >
                {badge}
              </span>
            )}
          </div>
        </div>
        <div className={`p-2.5 rounded-lg ${iconBg} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {subtitle && (
        <p className="mt-3 text-xs text-slate-700 flex items-center gap-1.5 truncate">
          {subtitle}
        </p>
      )}
    </div>
  );
};
