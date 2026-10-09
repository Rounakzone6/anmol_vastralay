'use client';

import { PageHeader } from '@/components/page-header';
import { Card, Spinner } from '@/components/ui';
import { trpc } from '@/lib/trpc';
import { Sparkles, TrendingUp, TrendingDown, Minus, PackageCheck, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function ForecastPage() {
  const { data: forecasts, isLoading, error } = trpc.dashboard.generateDemandForecast.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return (
    <div className="pb-12 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
        <PageHeader 
          title="AI Demand Forecast" 
          description="Smart inventory predictions based on your recent sales data." 
        />
        <div className="px-4 py-2 bg-gradient-to-r from-fuchsia-100 to-pink-100 text-fuchsia-800 rounded-xl font-bold flex items-center gap-2 border border-fuchsia-200">
          <Sparkles size={18} className="text-fuchsia-600" />
          Powered by Gemini AI
        </div>
      </div>

      {isLoading ? (
        <Card className="p-16 flex flex-col items-center justify-center border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-md">
          <Spinner size={40} className="mb-4 text-fuchsia-600" />
          <h3 className="text-xl font-bold text-slate-800">Analyzing Sales Data...</h3>
          <p className="text-slate-500 max-w-sm text-center mt-2">
            Our AI is crunching the numbers from the past 90 days to predict future demand and generate restocking recommendations.
          </p>
        </Card>
      ) : error ? (
        <Card className="p-12 flex flex-col items-center justify-center border-red-200 shadow-sm bg-red-50/50">
          <AlertCircle size={40} className="mb-4 text-red-500" />
          <h3 className="text-xl font-bold text-red-700">Analysis Failed</h3>
          <p className="text-red-500/80 max-w-sm text-center mt-2">
            We couldn't generate the forecast right now. Please try again later. {error.message}
          </p>
        </Card>
      ) : forecasts && forecasts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forecasts.map((forecast: any, idx: number) => (
            <Card key={idx} className="overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-all bg-white/80 backdrop-blur-md flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">{forecast.categoryName}</h3>
                
                {/* Trend Badge */}
                {forecast.trend === 'UP' ? (
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg">
                    <TrendingUp size={14} /> Trending Up
                  </span>
                ) : forecast.trend === 'DOWN' ? (
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-rose-100 text-rose-700 rounded-lg">
                    <TrendingDown size={14} /> Trending Down
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 bg-slate-200 text-slate-700 rounded-lg">
                    <Minus size={14} /> Stable
                  </span>
                )}
              </div>
              
              <div className="p-6 flex-1 flex flex-col gap-4">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">Expected Demand</span>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-xl text-slate-800">{forecast.demandLevel}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          forecast.demandLevel === 'HIGH' ? 'w-full bg-emerald-500' :
                          forecast.demandLevel === 'MEDIUM' ? 'w-2/3 bg-amber-500' :
                          'w-1/3 bg-rose-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-violet-50/50 rounded-2xl border border-violet-100">
                  <span className="text-xs font-semibold text-violet-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <PackageCheck size={14} /> Recommendation
                  </span>
                  <p className="font-medium text-violet-900 text-sm">{forecast.recommendation}</p>
                </div>
                
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">AI Reasoning</span>
                  <p className="text-sm text-slate-600 leading-relaxed">{forecast.reasoning}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
         <Card className="p-16 flex flex-col items-center justify-center border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-md">
          <h3 className="text-xl font-bold text-slate-800">Not Enough Data</h3>
          <p className="text-slate-500 max-w-sm text-center mt-2">
            There isn't enough recent sales data to generate a reliable demand forecast yet.
          </p>
        </Card>
      )}
    </div>
  );
}
