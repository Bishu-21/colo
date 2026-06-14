import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label?: string;
  labelSuffix?: string;
  textCenter?: boolean;
  variant?: "white" | "highest";
}

export const Input: React.FC<InputProps> = ({
  id,
  label,
  labelSuffix,
  textCenter = false,
  variant = "white",
  disabled = false,
  className = "",
  type = "text",
  ...props
}) => {
  const containerClasses = "flex flex-col gap-2 w-full";
  const labelClasses = "font-metadata text-[10px] min-[360px]:text-metadata text-secondary uppercase flex justify-between gap-1 flex-wrap";
  
  const bgClasses = variant === "highest" 
    ? "bg-surface-container-highest border-outline-variant" 
    : "bg-white border-carbon";

  const alignClasses = textCenter ? "text-center" : "text-left";
  
  const inputClasses = `w-full border font-body-md py-3.5 px-3 focus:outline-none focus:border-primary rounded-none disabled:opacity-60 transition-colors min-h-[44px] ${bgClasses} ${alignClasses}`;

  return (
    <div className={`${containerClasses} ${className}`}>
      {label && (
        <label htmlFor={id} className={labelClasses}>
          {label} {labelSuffix && <span>{labelSuffix}</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        disabled={disabled}
        className={inputClasses}
        {...props}
      />
    </div>
  );
};
