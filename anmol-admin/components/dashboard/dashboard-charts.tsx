'use client';

import { useMemo} from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts';
import { Card } from '@/components/ui';
import { ArrowRightLeft, RefreshCcw, Users, TrendingUp, PackageSearch } from 'lucide-react';
import { format, subDays, isSameDay } from 'date-fns';

const COLORS = ['#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#ef4444', '#3b82f6'];
const PAYMENT_COLORS = ['#3b82f6', '#10b981'];

interface DashboardChartsProps {
  orders?: any[];
  payments?: any[];
  categoryInventory?: any[];
}

export function DashboardCharts({ orders = [], payments = [], categoryInventory = [] }: DashboardChartsProps) {
  
  // 1. Sales Data (Last 7 days)
  const salesData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      return { date: d, name: format(d, 'EEE'), sales: 0 };
    });

    orders.forEach(order => {
      if (order.status !== 'CANCELLED') {
        const orderDate = new Date(order.createdAt);
        const dayData = last7Days.find(d => isSameDay(d.date, orderDate));
        if (dayData) {
          dayData.sales += Number(order.totalAmount || 0);
        }
      }
    });
    return last7Days;
  }, [orders]);

  // 2. Payment Methods Data
  const paymentData = useMemo(() => {
    let onlineValue = 0;
    let codValue = 0;

    payments.forEach(p => {
      if (p.paymentMethod === 'COD') codValue += Number(p.amount);
      else onlineValue += Number(p.amount);
    });

    return [
      { name: 'Online', value: onlineValue },
      { name: 'COD', value: codValue },
    ].filter(d => d.value > 0);
  }, [payments]);

  // 3. Order Status Distribution (Replacing Returns Analysis)
  const orderStatusData = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    orders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    return Object.entries(statusCounts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [orders]);

  // 4. Customer & Orders Graph Data
  const customerStats = useMemo(() => {
    const stats = new Map();
    orders.forEach(order => {
      if (order.status !== 'CANCELLED') {
        const userStr = order.user?.name || order.user?.phone || 'Guest';
        if (!stats.has(userStr)) {
          stats.set(userStr, { name: userStr, totalSpent: 0, orderCount: 0 });
        }
        const s = stats.get(userStr);
        s.totalSpent += Number(order.totalAmount || 0);
        s.orderCount += 1;
      }
    });
    return Array.from(stats.values())
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10); // top 10 customers
  }, [orders]);

  // 5. Category Inventory Data is now passed directly from backend
  const categoryInventoryData = categoryInventory;

  return (
    <div className="mt-8 mb-12 flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Overview Chart */}
        <Card className="p-6 border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-md">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Sales Overview (Last 7 Days)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height={288}>
              <AreaChart
                data={salesData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                  formatter={(value: any) => [`₹${value}`, 'Sales']}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Payment Methods Chart */}
        <Card className="p-6 border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-md">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Payment Methods Received</h3>
          <div className="h-72 w-full">
            {paymentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={288}>
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    label={({ name, percent = 0 }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                    formatter={(value: any) => [`₹${value}`, 'Amount']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400">No payment data available</div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer vs Orders Insights (Interactive Report) */}
        <Card className="p-6 border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-800">Top Customers & Orders</h3>
          </div>
          <div className="h-64 w-full">
             {customerStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={256}>
                  <ScatterChart margin={{ top: 10, right: 30, bottom: 20, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis type="number" dataKey="orderCount" name="Orders" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis type="number" dataKey="totalSpent" name="Spent" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                    <ZAxis type="category" dataKey="name" name="Customer" />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any, name: any) => {
                         if (name === 'Spent') return [`₹${value}`, name];
                         return [value, name];
                      }}
                    />
                    <Scatter name="Customers" data={customerStats} fill="#ec4899">
                      {customerStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-400">No customer data available</div>
             )}
          </div>
        </Card>

        {/* Order Status Distribution */}
        <Card className="p-6 border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-slate-800">Order Status Distribution</h3>
          </div>
          <div className="h-64 w-full">
             {orderStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={256}>
                  <BarChart
                    data={orderStatusData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="status" type="category" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} width={120} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f1f5f9' }}
                    />
                    <Bar dataKey="count" fill="#14b8a6" radius={[0, 4, 4, 0]} barSize={24} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-400">No orders data available</div>
             )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
        {/* Category Inventory Breakdown */}
        <Card className="p-6 border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-6">
            <PackageSearch className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-bold text-slate-800">Category Inventory Breakdown</h3>
          </div>
          <div className="h-72 w-full">
             {categoryInventoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height={288}>
                  <BarChart
                    data={categoryInventoryData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f1f5f9' }}
                      formatter={(value: any) => [value, 'Available Stock']}
                    />
                    <Bar dataKey="stock" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40} name="Stock">
                      {categoryInventoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="h-full flex items-center justify-center text-slate-400">No inventory data available</div>
             )}
          </div>
        </Card>
      </div>
    </div>
  );
}
