import React from "react";

export const FilterSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="bg-surface-container-low rounded-xl border border-surface-container-high p-md">
    <h3 className="font-serif text-label-md uppercase tracking-wider text-primary font-bold mb-md">
      {title}
    </h3>
    {children}
  </div>
);

export const FilterPill: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    className={`text-label-sm text-left px-3 py-2 rounded-lg transition-all border ${
      active
        ? "bg-primary text-on-primary border-primary font-bold"
        : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
    }`}
  >
    {children}
  </button>
);
