
import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="silverGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E2E8F0" />
        <stop offset="50%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </linearGradient>
      <linearGradient id="blueGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#22D3EE" />
        <stop offset="50%" stopColor="#0EA5E9" />
        <stop offset="100%" stopColor="#0F172A" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Crescent / Base Shape */}
    <path 
      d="M60 160 C 20 120, 20 60, 70 30 L 75 40 C 40 65, 40 110, 70 145 Z" 
      fill="url(#silverGradient)" 
      filter="url(#glow)"
    />
    
    {/* Blue Wave */}
    <path 
      d="M70 145 C 90 120, 140 120, 160 140 C 140 160, 100 160, 70 145 Z" 
      fill="url(#blueGradient)" 
    />
    
    {/* Towers */}
    {/* Tower 1 (Tallest, Middle) */}
    <path d="M110 30 L 110 120 L 125 115 L 125 30 L 117.5 20 Z" fill="url(#silverGradient)" />
    {/* Tower 2 (Left) */}
    <path d="M90 50 L 90 125 L 105 120 L 105 50 L 97.5 40 Z" fill="url(#silverGradient)" />
    {/* Tower 3 (Right) */}
    <path d="M130 60 L 130 115 L 145 110 L 145 60 L 137.5 50 Z" fill="url(#silverGradient)" />
    
    {/* Accents */}
    <circle cx="170" cy="140" r="3" fill="#22D3EE" />
  </svg>
);
