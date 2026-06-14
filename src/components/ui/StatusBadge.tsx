import React from "react";

export interface StatusBadgeProps {
  variant?: "primary" | "success" | "warning" | "error" | "carbon" | "neutral" | "pill-success";
  text: string;
  animate?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = "primary",
  text,
  animate = false,
  className = "",
}) => {
  const baseClasses = "font-metadata text-[10px] uppercase inline-flex items-center gap-2 select-none";
  
  const variants = {
    primary: "bg-primary text-on-primary px-3 py-1",
    success: "bg-muted-teal text-white px-3 py-1",
    warning: "bg-primary-container text-on-primary-container px-2 py-0.5 font-bold",
    error: "bg-error text-white px-2 py-0.5 font-bold",
    carbon: "bg-carbon text-white px-3 py-1",
    neutral: "bg-surface-container-high border border-carbon px-3 py-1",
    "pill-success": "text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold",
  };

  const dotColor = {
    primary: "bg-white",
    success: "bg-white",
    warning: "bg-on-primary-container",
    error: "bg-white",
    carbon: "bg-muted-teal",
    neutral: "bg-carbon",
    "pill-success": "bg-primary",
  };

  return (
    <div className={`${baseClasses} ${variants[variant]} ${className}`}>
      {animate && (
        <span className={`w-2 h-2 rounded-full ${dotColor[variant === "pill-success" ? "pill-success" : variant]} animate-pulse`} />
      )}
      <span>{text}</span>
    </div>
  );
};
