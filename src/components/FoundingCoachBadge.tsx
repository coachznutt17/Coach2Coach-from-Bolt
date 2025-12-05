import { Award } from 'lucide-react';

interface FoundingCoachBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function FoundingCoachBadge({ size = 'md', showLabel = true }: FoundingCoachBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-full ${sizeClasses[size]} shadow-sm`}>
      <Award className={iconSizes[size]} />
      {showLabel && 'Founding Coach'}
    </span>
  );
}
