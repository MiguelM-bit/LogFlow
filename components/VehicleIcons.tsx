import React from 'react';

export function TractorIcon({ className, color = "currentColor" }: { className?: string, color?: string }) {
  return (
    <svg viewBox="0 0 100 60" className={className} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M20 20 h30 v30 h-30 z M50 30 h20 l10 10 v10 h-30 z" opacity="0.8"/>
      <circle cx="30" cy="50" r="8" fill="#333" />
      <circle cx="70" cy="50" r="8" fill="#333" />
    </svg>
  );
}

export function TrailerIcon({ className, color = "currentColor" }: { className?: string, color?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M10 20 h100 v30 h-100 z" opacity="0.8"/>
      <circle cx="30" cy="50" r="8" fill="#333" />
      <circle cx="90" cy="50" r="8" fill="#333" />
      <rect x="110" y="40" width="10" height="5" fill="#555" />
    </svg>
  );
}

export function RigidTruckIcon({ className, color = "currentColor" }: { className?: string, color?: string }) {
  return (
    <svg viewBox="0 0 140 60" className={className} fill={color} xmlns="http://www.w3.org/2000/svg">
      <path d="M10 20 h80 v30 h-80 z" opacity="0.8"/>
      <path d="M90 30 h30 l10 10 v10 h-40 z" opacity="0.8"/>
      <circle cx="30" cy="50" r="8" fill="#333" />
      <circle cx="70" cy="50" r="8" fill="#333" />
      <circle cx="110" cy="50" r="8" fill="#333" />
    </svg>
  );
}
