import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
};

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const variantClass =
    variant === 'secondary'
      ? 'btn btn--secondary'
      : variant === 'ghost'
        ? 'btn btn--ghost'
        : 'btn btn--primary';

  return <button className={`${variantClass} ${className}`.trim()} {...props} />;
}
