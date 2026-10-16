'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface PasswordInputProps {
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  withIcon?: boolean;
}

export default function PasswordInput({
  id,
  name,
  placeholder = 'Enter password',
  value,
  onChange,
  onBlur,
  disabled = false,
  required = false,
  autoComplete = 'current-password',
  className = '',
  withIcon = true,
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const baseClasses = `w-full ${withIcon ? 'pl-12' : 'pl-4'} pr-12 rounded-lg border text-ink placeholder:text-ink/40 focus:outline-none transition disabled:cursor-not-allowed`;
  
  const defaultClasses = `${baseClasses} py-3 border-ink/20 bg-white focus:border-ocean focus:ring-2 focus:ring-ocean/20 disabled:bg-ink/5`;
  
  const inputClasses = className ? `${baseClasses} ${className}` : defaultClasses;

  return (
    <div className="relative">
      {withIcon && <Lock className="absolute left-4 top-3 w-5 h-5 text-ink/40" />}
      <input
        id={id}
        name={name}
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        className={inputClasses}
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        disabled={disabled}
        className="absolute right-3 top-3 text-ink/50 hover:text-ink/70 disabled:cursor-not-allowed transition"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
}
