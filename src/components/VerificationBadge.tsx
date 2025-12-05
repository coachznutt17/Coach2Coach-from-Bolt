import React from 'react';
import { CheckCircle, Award, Shield } from 'lucide-react';

interface VerificationBadgeProps {
  isVerified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  isVerified,
  size = 'md',
  showTooltip = true,
  className = ''
}) => {
  if (!isVerified) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const iconSize = sizeClasses[size];

  return (
    <div 
      className={`inline-flex items-center ${className}`}
      title={showTooltip ? 'Verified Coach - Credentials confirmed by Coach2Coach' : undefined}
    >
      <div className="relative">
        <CheckCircle className={`${iconSize} text-blue-600 fill-current`} />
        <div className="absolute inset-0 bg-white rounded-full scale-50"></div>
        <Shield className={`${iconSize} text-blue-600 absolute inset-0 scale-75`} />
      </div>
      {size === 'lg' && (
        <span className="ml-2 text-sm font-medium text-blue-600">Verified Coach</span>
      )}
    </div>
  );
};

export default VerificationBadge;