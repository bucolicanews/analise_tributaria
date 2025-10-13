import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: number | string;
  description?: string;
  valueClassName?: string;
  currency?: boolean;
  percentage?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatPercent = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
};

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  description,
  valueClassName,
  currency = true,
  percentage = false,
}) => {
  let formattedValue: string;
  if (typeof value === 'number') {
    if (currency) {
      formattedValue = formatCurrency(value);
    } else if (percentage) {
      formattedValue = formatPercent(value);
    } else {
      formattedValue = value.toLocaleString('pt-BR');
    }
  } else {
    formattedValue = value;
  }

  return (
    <Card className="shadow-card">
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className={cn("text-xl font-bold", valueClassName)}>{formattedValue}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};