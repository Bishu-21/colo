import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "carbon" | "danger" | "ghost" | "toggle-active" | "toggle-inactive";
  size?: "sm" | "md" | "lg" | "full";
  rounded?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  rounded = true,
  className = "",
  children,
  ...props
}) => {
  const baseStyle = "font-label-bold text-label-bold uppercase transition-all tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none";
  
  const variants = {
    primary: "bg-primary text-on-primary hover:bg-carbon",
    secondary: "bg-muted-teal text-white hover:bg-carbon",
    outline: "border border-on-surface hover:bg-carbon hover:text-white text-on-surface",
    carbon: "bg-carbon text-surface-bright hover:bg-muted-teal",
    danger: "border border-error text-error hover:bg-error hover:text-white",
    ghost: "text-secondary border-b-2 border-transparent hover:text-on-surface hover:bg-surface-container-high",
    "toggle-active": "p-3 font-metadata text-[10px] bg-carbon text-white",
    "toggle-inactive": "p-3 font-metadata text-[10px] bg-white text-carbon hover:bg-surface-container-high",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2",
    lg: "py-5 px-6",
    full: "w-full py-4 px-6",
  };

  const roundedStyle = rounded ? "rounded-full" : "rounded-none";

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${roundedStyle} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
