'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, Select } from '@/components/ui';
import { Bell, Package, ShoppingCart, Users, Truck, Clock, ExternalLink, Filter } from 'lucide-react';
import Link from 'next/link';

function getIcon(type: string) {
  switch (type) {
    case 'STOCK': return <Package className="h-5 w-5 text-rose-500" />;
    case 'ORDER': return <ShoppingCart className="h-5 w-5 text-emerald-500" />;
    case 'USER': return <Users className="h-5 w-5 text-blue-500" />;
    case 'STAFF': return <Truck className="h-5 w-5 text-amber-500" />;
    default: return <Bell className="h-5 w-5 text-slate-500" />;
  }
}

export default function UpdatesPage() {
  const [filter, setFilter] = useState<'LAST_WEEK' | 'TODAY' | 'YESTERDAY' | 'ALL_TIME'>('LAST_WEEK');

  const { data: updates, isLoading } = trpc.dashboard.getUpdates.useQuery({ filter }, {
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Updates & Notifications"
        description="View recent activities across your store"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">Recent Activity</CardTitle>
          <div className="relative w-40">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <Filter size={14} className="text-slate-400" />
            </div>
            <Select
              className="pl-9 py-1.5 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
            >
              <option value="TODAY">Today</option>
              <option value="YESTERDAY">Yesterday</option>
              <option value="LAST_WEEK">Last 7 Days</option>
              <option value="ALL_TIME">All Time</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent"></div>
            </div>
          ) : !updates || updates.length === 0 ? (
            <div className="flex h-40 flex-col items-center justify-center text-slate-500">
              <Bell className="h-10 w-10 mb-2 opacity-20" />
              <p>No new updates found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {updates.map((update) => (
                <div 
                  key={update.id} 
                  className="flex items-start gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md"
                >
                  <div className={`rounded-full p-2.5 ${
                    update.type === 'STOCK' ? 'bg-rose-50' : 
                    update.type === 'ORDER' ? 'bg-emerald-50' : 
                    update.type === 'USER' ? 'bg-blue-50' : 'bg-amber-50'
                  }`}>
                    {getIcon(update.type)}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-slate-900">{update.title}</h4>
                      <div className="flex items-center text-xs text-slate-500">
                        <Clock className="mr-1 h-3 w-3" />
                        {new Date(update.date).toLocaleString()}
                      </div>
                    </div>
                    <p className="text-sm text-slate-600">{update.message}</p>
                  </div>
                  
                  <Link 
                    href={update.link}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
