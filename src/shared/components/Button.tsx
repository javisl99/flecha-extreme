import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  icon,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary disabled:hover:bg-primary',
    secondary: 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500 disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-700',
    outline: 'border border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 focus:ring-gray-500 disabled:hover:bg-transparent',
    accent: 'bg-accent text-primary-dark hover:bg-accent-light focus:ring-accent disabled:hover:bg-accent',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button 
      className={classes} 
      disabled={loading || disabled} 
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : icon ? (
        <span className="mr-2">{icon}</span>
      ) : null}
      {children}
    </button>
  );
} 