import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-20 h-20" }) => {
  return (
    <svg 
      viewBox="0 0 200 120" 
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Circular pattern of X's, O's and arrows */}
      <g className="fill-white text-white">
        {/* Top */}
        <text x="100" y="15" textAnchor="middle" fontSize="12" fontWeight="bold">X</text>
        <text x="115" y="20" textAnchor="middle" fontSize="10">↘</text>
        <text x="130" y="30" textAnchor="middle" fontSize="12" fontWeight="bold">O</text>
        <text x="140" y="45" textAnchor="middle" fontSize="10">↓</text>
        
        {/* Right */}
        <text x="145" y="60" textAnchor="middle" fontSize="12" fontWeight="bold">X</text>
        <text x="140" y="75" textAnchor="middle" fontSize="10">↙</text>
        <text x="130" y="90" textAnchor="middle" fontSize="12" fontWeight="bold">O</text>
        <text x="115" y="100" textAnchor="middle" fontSize="10">←</text>
        
        {/* Bottom */}
        <text x="100" y="105" textAnchor="middle" fontSize="12" fontWeight="bold">X</text>
        <text x="85" y="100" textAnchor="middle" fontSize="10">↖</text>
        <text x="70" y="90" textAnchor="middle" fontSize="12" fontWeight="bold">O</text>
        <text x="60" y="75" textAnchor="middle" fontSize="10">↑</text>
        
        {/* Left */}
        <text x="55" y="60" textAnchor="middle" fontSize="12" fontWeight="bold">X</text>
        <text x="60" y="45" textAnchor="middle" fontSize="10">↗</text>
        <text x="70" y="30" textAnchor="middle" fontSize="12" fontWeight="bold">O</text>
        <text x="85" y="20" textAnchor="middle" fontSize="10">→</text>
        
        {/* "2Coach" in emerald green */}
        <text x="100" y="70" textAnchor="middle" fontSize="18" fontWeight="bold" className="fill-emerald-500">
          2Coach
        </text>
      </g>
      
      {/* Tagline */}
      <text x="100" y="115" textAnchor="middle" fontSize="8" className="fill-gray-300">
        Where coaches get paid
      </text>
    </svg>
  );
};

export default Logo;