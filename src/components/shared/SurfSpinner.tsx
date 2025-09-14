'use client';

import React from 'react';

interface SurfSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  text?: string;
}

const SurfSpinner: React.FC<SurfSpinnerProps> = ({ 
  size = 'md', 
  className = '', 
  showText = false,
  text = 'Cargando...'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} relative`}>
        <svg 
          className="w-full h-full animate-windsurf-sail" 
          viewBox="0 0 512 512" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base del windsurf - azul oscuro */}
          <path 
            style={{fill: 'var(--primary-dark)'}} 
            d="M17.809,503.652c0,4.61-3.738,8.348-8.348,8.348H8.348C3.738,512,0,508.262,0,503.652
            s3.738-8.348,8.348-8.348h1.113C14.071,495.304,17.809,499.042,17.809,503.652z M503.652,495.304h-1.113
            c-4.61,0-8.348,3.738-8.348,8.348s3.738,8.348,8.348,8.348h1.113c4.61,0,8.348-3.738,8.348-8.348S508.262,495.304,503.652,495.304z
            M470.261,495.304H36.174c-4.61,0-8.348,3.738-8.348,8.348S31.564,512,36.174,512h434.087c4.61,0,8.348-3.738,8.348-8.348
            S474.871,495.304,470.261,495.304z"
          />
          
          {/* Vela principal - amarillo vibrante */}
          <path 
            style={{fill: 'var(--accent)'}} 
            d="M141.295,332.758l60.956-325.1C203.084,3.218,206.96,0,211.478,0l0,0
            c86.061,0,155.826,69.766,155.826,155.826v269.463c0,3.621-3.403,6.278-6.915,5.399l-186.133-46.533
            C151.401,378.441,136.953,355.912,141.295,332.758z"
            className="animate-sail-wind"
          />
          
          {/* Mastil - azul medio */}
          <path 
            style={{fill: 'var(--primary)'}} 
            d="M361.739,411.826v77.913c0,4.61-3.738,8.348-8.348,8.348s-8.348-3.738-8.348-8.348v-77.913
            c0-4.61,3.738-8.348,8.348-8.348S361.739,407.216,361.739,411.826z"
            className="animate-mast-sway"
          />
          
          {/* Tabla - azul oscuro con gradiente */}
          <path 
            style={{fill: 'var(--primary-dark)'}} 
            d="M456.348,478.609L456.348,478.609c0,18.442-14.949,33.391-33.391,33.391H77.913
            c-18.442,0-33.391-14.949-33.391-33.391l0,0c0-6.147,4.983-11.13,11.13-11.13h389.565
            C451.365,467.478,456.348,472.461,456.348,478.609z"
            className="animate-board-float"
          />
          
          <path 
            style={{fill: 'var(--primary)'}} 
            d="M456.348,478.609c0,18.442-14.949,33.391-33.391,33.391H77.913c-15.068,0-27.802-9.984-31.957-23.696
            c3.069,0.929,6.323,1.435,9.696,1.435h345.043c14.537,0,26.899-9.293,31.484-22.261h13.038
            C451.365,467.478,456.348,472.461,456.348,478.609z"
          />
          
          {/* Detalles de la vela - amarillo claro */}
          <path 
            style={{fill: 'var(--accent-light)'}} 
            d="M157.774,244.87l29.217-155.826h165.308c9.617,20.242,15.005,42.882,15.005,66.783v89.043H157.774z"
            className="animate-sail-detail-1"
          />
          
          <path 
            style={{fill: 'var(--accent)'}} 
            d="M153.6,267.13l18.783-100.174h194.922V267.13H153.6z"
            className="animate-sail-detail-2"
          />
          
          <path 
            style={{fill: 'var(--accent-light)'}} 
            d="M140.72,345.043c-0.368-4.014-0.203-8.139,0.574-12.286l16.48-87.888h209.53v100.174H140.72z"
            className="animate-sail-detail-3"
          />
          
          <path 
            style={{fill: 'var(--primary-light)'}} 
            d="M367.304,322.783v102.507c0,3.621-3.403,6.278-6.915,5.399l-186.133-46.533
            c-22.855-5.713-37.303-28.242-32.961-51.397l1.87-9.975h224.139V322.783z"
            className="animate-sail-detail-4"
          />
          
          {/* Líneas de la vela - azul claro */}
          <path 
            style={{fill: 'var(--primary-light)'}} 
            d="M308.87,322.783c0,4.61-3.738,8.348-8.348,8.348H141.913c-4.61,0-8.348-3.738-8.348-8.348
            s3.738-8.348,8.348-8.348h158.609C305.132,314.435,308.87,318.172,308.87,322.783z M333.913,314.435H332.8
            c-4.61,0-8.348,3.738-8.348,8.348s3.738,8.348,8.348,8.348h1.113c4.61,0,8.348-3.738,8.348-8.348S338.523,314.435,333.913,314.435z
            M300.522,236.522H155.826c-4.61,0-8.348,3.738-8.348,8.348s3.738,8.348,8.348,8.348h144.696c4.61,0,8.348-3.738,8.348-8.348
            S305.132,236.522,300.522,236.522z M333.913,236.522H332.8c-4.61,0-8.348,3.738-8.348,8.348s3.738,8.348,8.348,8.348h1.113
            c4.61,0,8.348-3.738,8.348-8.348S338.523,236.522,333.913,236.522z M300.522,158.609H171.409c-4.61,0-8.348,3.738-8.348,8.348
            s3.738,8.348,8.348,8.348h129.113c4.61,0,8.348-3.738,8.348-8.348S305.132,158.609,300.522,158.609z M332.8,175.304h1.113
            c4.61,0,8.348-3.738,8.348-8.348s-3.738-8.348-8.348-8.348H332.8c-4.61,0-8.348,3.738-8.348,8.348S328.19,175.304,332.8,175.304z
            M186.435,97.391h91.826c4.61,0,8.348-3.738,8.348-8.348c0-4.61-3.738-8.348-8.348-8.348h-91.826c-4.61,0-8.348,3.738-8.348,8.348
            C178.087,93.654,181.825,97.391,186.435,97.391z M311.652,80.696h-1.113c-4.61,0-8.348,3.738-8.348,8.348
            c0,4.61,3.738,8.348,8.348,8.348h1.113c4.61,0,8.348-3.738,8.348-8.348C320,84.433,316.262,80.696,311.652,80.696z"
            className="animate-sail-lines"
          />
        </svg>
        
        {/* Efecto de ondas del agua alrededor del spinner */}
        <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-water-wave-1"></div>
        <div className="absolute inset-0 rounded-full border border-primary/30 animate-water-wave-2"></div>
        <div className="absolute inset-0 rounded-full border border-accent/10 animate-water-wave-3"></div>
      </div>
      
      {showText && (
        <p className={`mt-3 text-foreground font-medium ${textSizeClasses[size]} animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );
};

export default SurfSpinner;
