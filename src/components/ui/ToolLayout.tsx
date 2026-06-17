import React from "react";

export interface ToolLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  sidebarWidthClass?: string;
  contentWidthClass?: string;
  className?: string;
}

export const ToolLayout: React.FC<ToolLayoutProps> = ({
  sidebar,
  children,
  sidebarWidthClass = "w-full md:w-[41.66%]",
  contentWidthClass = "w-full md:w-[58.34%]",
  className = "",
}) => {
  const hasHeightClass = className.includes("md:h-") || className.includes("h-") || className.includes("min-h-") || className.includes("md:min-h-");
  const heightClass = hasHeightClass ? "" : "md:min-h-[calc(100vh-106px)]";

  return (
    <main className={`flex flex-col md:flex-row ${heightClass} ${className}`}>
      {/* Left Config Panel */}
      <aside className={`${sidebarWidthClass} border-r border-carbon bg-surface-container-low/80 backdrop-blur-sm p-8 flex flex-col gap-8 custom-scrollbar overflow-y-auto md:h-full`}>
        {sidebar}
      </aside>

      {/* Right View Panel */}
      <section className={`${contentWidthClass} flex flex-col md:h-full md:overflow-hidden`}>
        {children}
      </section>
    </main>
  );
};

