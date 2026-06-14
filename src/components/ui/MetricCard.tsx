import React from "react";
import { StatusBadge } from "./StatusBadge";

export interface MetricCardProps {
  label: string;
  value: string;
  compliant?: boolean;
  compliantText?: string;
  borderRight?: boolean;
  borderBottom?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  compliant = false,
  compliantText = "[COMPLIANT]",
  borderRight = false,
  borderBottom = false,
  className = "",
}) => {
  const rBorder = borderRight ? "md:border-r border-carbon" : "";
  const bBorder = borderBottom ? "border-b md:border-b-0" : "";
  
  return (
    <div className={`flex-grow flex-1 p-4 flex flex-col justify-center ${rBorder} ${bBorder} ${className}`}>
      <span className="font-metadata text-[10px] text-secondary mb-1 uppercase tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-label-bold text-headline-sm">{value}</span>
        {compliant && (
          <StatusBadge variant="pill-success" text={compliantText} />
        )}
      </div>
    </div>
  );
};
