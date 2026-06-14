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
  return (
    <main className={`pt-16 pb-[80px] min-h-screen flex flex-col md:flex-row ${className}`}>
      {/* Left Config Panel */}
      <aside className={`${sidebarWidthClass} border-r border-carbon bg-surface-container-low/80 backdrop-blur-sm p-8 flex flex-col gap-8 custom-scrollbar overflow-y-auto`}>
        {sidebar}
      </aside>

      {/* Right View Panel */}
      <section className={`${contentWidthClass} flex flex-col`}>
        {children}
      </section>
    </main>
  );
};
