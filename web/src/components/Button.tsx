import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "tertiary";
type ButtonSize = "small" | "medium" | "large";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

const sizeStyles: Record<ButtonSize, string> = {
  small: "h-8 px-3 text-sm gap-1",
  medium: "h-10 px-4 text-base gap-2",
  large: "h-14 px-6 text-base gap-2",
};

const variantStyles: Record<ButtonVariant, { base: string; hover: string; pressed: string; disabled: string }> = {
  primary: {
    base: "bg-brand-primary text-neutral-white",
    hover: "hover:bg-brand-primary-dark",
    pressed: "active:bg-brand-primary-darkest active:text-brand-primary-light",
    disabled: "disabled:bg-neutral-lightest disabled:text-neutral-light",
  },
  secondary: {
    base: "bg-transparent text-brand-primary border border-brand-primary",
    hover: "hover:bg-brand-primary-lightest",
    pressed: "active:bg-brand-primary-lightest active:border-brand-primary-dark active:text-brand-primary-dark",
    disabled: "disabled:border-neutral-light disabled:text-neutral-light",
  },
  tertiary: {
    base: "bg-transparent text-brand-primary",
    hover: "hover:bg-brand-primary-lightest",
    pressed: "active:text-brand-primary-dark",
    disabled: "disabled:text-neutral-light",
  },
};

export default function Button({
  variant = "primary",
  size = "large",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const v = variantStyles[variant];

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg font-bold leading-[18.75px] cursor-pointer transition-colors ${sizeStyles[size]} ${v.base} ${v.hover} ${v.pressed} ${v.disabled} disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  );
}
