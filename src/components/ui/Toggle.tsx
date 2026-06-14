import React from "react";

export interface ToggleProps {
  id: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  className = "",
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`flex items-center justify-between border border-carbon p-4 bg-white ${className}`}>
      <div className="flex flex-col pr-4">
        <label id={`${id}-label`} className="font-label-bold text-label-bold uppercase text-carbon">
          {label}
        </label>
        {description && (
          <span className="font-body-md text-secondary text-xs mt-1">
            {description}
          </span>
        )}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`w-16 h-8 border border-carbon relative flex items-center px-1 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          checked ? "bg-muted-teal" : "bg-surface-container"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <div 
          className={`w-6 h-6 bg-carbon transition-transform ${
            checked ? "translate-x-8" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
};
