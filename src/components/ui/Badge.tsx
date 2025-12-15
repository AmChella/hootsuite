import React from 'react';
import './Badge.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  dot?: boolean;
  pulse?: boolean;
}

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  icon,
  dot = false,
  pulse = false,
}: BadgeProps) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${pulse ? 'badge-pulse' : ''}`}>
      {dot && <span className="badge-dot" />}
      {icon && <span className="badge-icon">{icon}</span>}
      <span className="badge-text">{children}</span>
    </span>
  );
}
