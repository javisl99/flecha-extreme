'use client';

interface AddProductButtonProps {
  onAddProduct: () => void;
}

export default function AddProductButton({ onAddProduct }: AddProductButtonProps) {
  return (
    <button
      onClick={onAddProduct}
      className="group relative inline-flex h-12 w-12 items-center justify-center rounded-full primary-gradient text-white shadow-lg shadow-primary/30 transition duration-200 ease-fluid hover:-translate-y-0.5 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 focus:ring-offset-surface"
      title="Añadir nuevo producto"
      aria-label="Añadir nuevo producto"
    >
      <svg
        className="h-5 w-5 transition-transform duration-200 group-hover:rotate-90"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M12 6v12m6-6H6"
        />
      </svg>

      <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full border border-outline-variant/40 bg-surface-container-lowest px-3 py-1 text-xs font-semibold text-on-surface opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        Añadir producto
      </span>
    </button>
  );
}
