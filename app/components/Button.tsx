const baseStyles = 'px-6 py-2 rounded-full text-sm font-semibold transition whitespace-nowrap';

const buttonVariantClasses = {
  primary: 'bg-coral text-white hover:bg-coral/90',
  secondary: 'bg-sand text-foreground hover:bg-sand/80',
  dark: 'bg-primary text-white hover:bg-primary/90',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
};

export function buttonVariants({ variant = 'primary' }: { variant?: 'primary' | 'secondary' | 'dark' | 'outline' } = {}) {
  return `${baseStyles} ${buttonVariantClasses[variant]}`;
}

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: 'primary' | 'secondary' | 'dark' | 'outline';
  className?: string;
}

export default function Button({ children, onClick, href, variant = 'primary', className = '' }: ButtonProps) {
  const combinedStyles = `${buttonVariants({ variant })} ${className}`;

  if (href) {
    return (
      <a href={href} className={combinedStyles}>
        {children}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={combinedStyles}>
      {children}
    </button>
  );
}
