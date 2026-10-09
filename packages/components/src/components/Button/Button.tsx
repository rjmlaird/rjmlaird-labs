import type { ButtonHTMLAttributes } from "react";
import "./button.css";

export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual weight. Use one primary action per view. */
  variant?: ButtonVariant;
}

/** Actions use buttons; navigation uses links. Minimum target 44px. */
export function Button({ variant = "primary", type = "button", className, ...rest }: ButtonProps) {
  const classes = ["btn", variant !== "primary" && `btn--${variant}`, className].filter(Boolean).join(" ");
  return <button type={type} className={classes} {...rest} />;
}
