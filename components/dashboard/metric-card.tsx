'use client';

import React from "react"

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend = 'neutral',
  className,
}: MetricCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1.5">
                {trend === 'up' && (
                  <TrendingUp className="size-4 text-success" />
                )}
                {trend === 'down' && (
                  <TrendingDown className="size-4 text-destructive" />
                )}
                {trend === 'neutral' && (
                  <Minus className="size-4 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend === 'up' && 'text-success',
                    trend === 'down' && 'text-destructive',
                    trend === 'neutral' && 'text-muted-foreground'
                  )}
                >
                  {change > 0 ? '+' : ''}{change}%
                </span>
                {changeLabel && (
                  <span className="text-sm text-muted-foreground">{changeLabel}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
