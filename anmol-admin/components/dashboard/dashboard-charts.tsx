'use client';

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
  Legend
} from 'recharts';
import { Card } from '@/components/ui';
import { ArrowRightLeft, RefreshCcw } from 'lucide-react';

const mockSalesData = [
  { name: 'Mon', sales: 4000 },
  { name: 'Tue', sales: 3000 },
  { name: 'Wed', sales: 5000 },
  { name: 'Thu', sales: 2780 },
  { name: 'Fri', sales: 6890 },
  { name: 'Sat', sales: 8390 },
  { name: 'Sun', sales: 7490 },
];

const mockCategoryData = [
  { name: 'Silk Sarees', value: 400 },
  { name: 'Cotton Sarees', value: 300 },
  { name: 'Banarasi', value: 300 },
  { name: 'Georgette', value: 200 },
];

const mockPaymentData = [
  { name: 'Online', value: 75 },
  { name: 'COD', value: 25 },
];

const mockReturnsData = [
  { reason: 'Size Issue', count: 12 },
  { reason: 'Defective/Damaged', count: 5 },
  { reason: 'Did not like product', count: 8 },
  { reason: 'Wrong item sent', count: 2 },
];

const mockReplacementsLog = [
  { id: '1', date: '2026-06-20', original: 'Red Banarasi Silk', replacement: 'Blue Banarasi Silk', user: 'Rounak Singh' },
  { id: '2', date: '2026-06-18', original: 'Cotton Saree - Yellow', replacement: 'Cotton Saree - Green', user: 'Priya Sharma' },
];

const COLORS = ['#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];
const PAYMENT_COLORS = ['#3b82f6', '#10b981'];

export function DashboardCharts() {
  return (
    <div className="mt-8 mb-12 flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Overview Chart */}
        <Card className="p-6 border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-md">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Sales Overview</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={mockSalesData}
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
          <h3 className="text-lg font-bold text-slate-800 mb-6">Payment Methods</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mockPaymentData}
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
                  {mockPaymentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                  formatter={(value: any) => [`${value}%`, 'Share']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Returns Analysis */}
        <Card className="p-6 border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-md">
          <div className="flex items-center gap-2 mb-6">
            <RefreshCcw className="h-5 w-5 text-rose-500" />
            <h3 className="text-lg font-bold text-slate-800">Returns Analysis</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={mockReturnsData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="reason" type="category" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} width={120} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Bar dataKey="count" fill="#fb7185" radius={[0, 4, 4, 0]} barSize={24} name="Returned Items" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Replacements Log */}
        <Card className="p-6 border-slate-200/60 shadow-sm bg-white/70 backdrop-blur-md overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <ArrowRightLeft className="h-5 w-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-800">Recent Replacements</h3>
          </div>
          <div className="flex-1 overflow-auto pr-2">
            <div className="space-y-4">
              {mockReplacementsLog.map((log) => (
                <div key={log.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{log.date}</span>
                    <span className="text-xs font-medium text-slate-600 bg-slate-200/50 px-2 py-1 rounded-md">{log.user}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 mb-1">Returned</p>
                      <p className="text-sm font-medium text-slate-700 truncate line-through decoration-rose-300">{log.original}</p>
                    </div>
                    <div className="hidden sm:flex text-slate-300">
                      <ArrowRightLeft className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 mb-1">Replaced With</p>
                      <p className="text-sm font-medium text-indigo-700 truncate">{log.replacement}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
