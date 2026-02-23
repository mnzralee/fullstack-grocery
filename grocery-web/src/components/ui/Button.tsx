'use client';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'success' | 'danger' | 'outline';
  loading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  success: 'bg-green-600 text-white hover:bg-green-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
};

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
