import React from 'react';
import { cn } from "@/lib/utils";

interface SummarySectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ title, children, className }) => {
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-lg font-semibold border-b border-border pb-2">{title}</h3>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {children}
      </div>
    </div>
  );
};