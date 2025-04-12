import React, { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

export default function Card({ title, children, className = '', icon }: CardProps) {
  return (
    <div className={`bg-card-bg dark:bg-card-bg border border-card-border dark:border-card-border rounded-lg shadow-md overflow-hidden ${className}`}>
      {(title || icon) && (
        <div className="bg-primary text-white p-4 flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {title && <h3 className="font-medium">{title}</h3>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
} 