import React from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  id: string;
  label?: string;
  options: SelectOption[];
}

export const Select: React.FC<SelectProps> = ({
  id,
  label,
  options,
  value,
  onChange,
  disabled = false,
  className = "",
  ...props
}) => {
  const containerClasses = "flex flex-col gap-2 w-full";
  const labelClasses = "font-metadata text-[10px] min-[360px]:text-metadata text-secondary uppercase flex justify-between gap-1 flex-wrap";
  const selectClasses = "bg-white border border-carbon rounded-none font-body-md py-3.5 px-3 focus:outline-none focus:border-primary w-full disabled:opacity-60 transition-colors cursor-pointer min-h-[44px]";

  return (
    <div className={`${containerClasses} ${className}`}>
      {label && (
        <label htmlFor={id} className={labelClasses}>
          {label}
        </label>
      )}
      <select
        id={id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={selectClasses}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};
