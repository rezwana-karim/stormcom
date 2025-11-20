"use client";

// src/components/dashboard-page-client.tsx
// Client wrapper for dashboard with store selector

import { useState } from 'react';
import { StoreSelector } from '@/components/store-selector';
import { AnalyticsDashboard } from '@/components/analytics-dashboard';
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { Card, CardContent } from '@/components/ui/card';

import data from "@/app/dashboard/data.json";

export function DashboardPageClient() {
  const [storeId, setStoreId] = useState<string>('');

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Store Selector */}
      <div className="flex items-center gap-4 px-4 lg:px-6">
        <label className="text-sm font-medium">Store:</label>
        <StoreSelector onStoreChange={setStoreId} />
      </div>

      {storeId ? (
        <>
          {/* Analytics Cards */}
          <AnalyticsDashboard storeId={storeId} />
          
          {/* Chart */}
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          
          {/* Data Table */}
          <DataTable data={data} />
        </>
      ) : (
        <div className="px-4 lg:px-6">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Select a store to view dashboard analytics
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
