import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Wallet, Calendar, PieChart as PieChartIcon, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  userName?: string;
}

type TimeRange = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export const Dashboard: React.FC<DashboardProps> = ({ transactions, userName }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('DAILY');

  const stats = useMemo(() => {
    const income = transactions
      .filter(t => t.type === 'CREDIT')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const expense = transactions
      .filter(t => t.type === 'DEBIT')
      .reduce((acc, curr) => acc + curr.amount, 0);
    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);

  const chartData = useMemo(() => {
    const sortedTx = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const dataMap: Record<string, { date: string; displayDate: string; income: number; expense: number; sortKey: number }> = {};

    sortedTx.forEach(t => {
      const txDate = new Date(t.date);
      let key = '';
      let displayDate = '';
      let sortKey = 0;

      if (timeRange === 'DAILY') {
        key = t.date;
        displayDate = new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        sortKey = txDate.getTime();
      } else if (timeRange === 'WEEKLY') {
        const d = new Date(t.date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const weekStart = new Date(d.setDate(diff));
        key = weekStart.toISOString().split('T')[0];
        displayDate = `Wk ${Math.ceil((d.getDate() - 1) / 7)} ${weekStart.toLocaleDateString('en-US', { month: 'short' })}`;
        sortKey = weekStart.getTime();
      } else if (timeRange === 'MONTHLY') {
        key = `${txDate.getFullYear()}-${txDate.getMonth()}`;
        displayDate = txDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        sortKey = new Date(txDate.getFullYear(), txDate.getMonth(), 1).getTime();
      }

      if (!dataMap[key]) {
        dataMap[key] = { date: key, displayDate, income: 0, expense: 0, sortKey };
      }
      
      if (t.type === 'CREDIT') {
        dataMap[key].income += t.amount;
      } else {
        dataMap[key].expense += t.amount;
      }
    });

    let result = Object.values(dataMap).sort((a, b) => a.sortKey - b.sortKey);

    if (timeRange === 'DAILY' && result.length > 14) {
      result = result.slice(-14);
    }

    return result;
  }, [transactions, timeRange]);

  const expensePieData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'DEBIT');
    const byCat: Record<string, number> = {};
    expenses.forEach(t => {
        byCat[t.category] = (byCat[t.category] || 0) + t.amount;
    });
    
    const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    
    return Object.entries(byCat)
        .map(([name, value], idx) => ({ name, value, color: COLORS[idx % COLORS.length] }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5); // Top 5
  }, [transactions]);

  const StatCard = ({ title, amount, icon: Icon, type }: { title: string, amount: number, icon: any, type: 'neutral' | 'positive' | 'negative' }) => (
    <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)] border border-slate-100 hover:-translate-y-1 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.1)] transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${
            type === 'neutral' ? 'bg-indigo-50 text-indigo-600' :
            type === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
        }`}>
           <Icon size={22} strokeWidth={2} />
        </div>
        {type !== 'neutral' && (
           <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
             type === 'positive' ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
           }`}>
             {type === 'positive' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
             <span>2.4%</span>
           </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-extrabold text-slate-800 tracking-tight mb-1">
          RM {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </h3>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-2">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">
                Good Morning, {userName ? userName.split(' ')[0] : 'Admin'}
            </h2>
            <p className="text-slate-500 font-medium">Here is your financial summary for {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric'})}.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Balance" amount={stats.balance} icon={Wallet} type="neutral" />
        <StatCard title="Total Income" amount={stats.income} icon={ArrowUpRight} type="positive" />
        <StatCard title="Total Expenses" amount={stats.expense} icon={ArrowDownRight} type="negative" />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cashflow Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)] border border-slate-100 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity size={18} className="text-indigo-500" />
                Cashflow Trend
              </h3>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['DAILY', 'WEEKLY', 'MONTHLY'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                    timeRange === range
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {range.charAt(0) + range.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} 
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{fontSize: 11, fill: '#94a3b8', fontWeight: 600}} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value/1000}k`}
                />
                <Tooltip 
                  cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '12px',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '12px'
                  }}
                  formatter={(value: number) => [`RM ${value.toLocaleString()}`, '']}
                />
                <Area 
                    type="monotone" 
                    dataKey="income" 
                    name="Income" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorIncome)" 
                />
                <Area 
                    type="monotone" 
                    dataKey="expense" 
                    name="Expense" 
                    stroke="#f43f5e" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorExpense)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Distribution Widget */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col min-w-0">
             <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <PieChartIcon size={18} className="text-indigo-500" />
                Top Spending
            </h3>
            <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
                 {expensePieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={expensePieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {expensePieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => `RM ${value.toLocaleString()}`}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="text-slate-400 text-sm">No expenses yet</div>
                 )}
                 {/* Center Text */}
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-xs text-slate-400 font-bold uppercase">Total</span>
                     <span className="text-lg font-bold text-slate-800">
                        RM {expensePieData.reduce((a, b) => a + b.value, 0).toLocaleString(undefined, { notation: 'compact' })}
                     </span>
                 </div>
            </div>
            <div className="mt-6 space-y-3">
                {expensePieData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                            <span className="text-slate-600 font-medium">{item.name}</span>
                        </div>
                        <span className="font-bold text-slate-800">RM {item.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)] border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Calendar size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Recent Transactions</h3>
          </div>
          <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">View All</button>
        </div>
        
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
            {transactions.slice().reverse().slice(0, 5).map((t) => (
                <div key={t.id} className="p-5 flex flex-col gap-2 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start">
                        <div className="flex-1 mr-4">
                            <p className="font-semibold text-slate-800 leading-tight">{t.description}</p>
                            <p className="text-xs text-slate-400 mt-1">{new Date(t.date).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right shrink-0">
                            <p className={`font-bold text-base ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                {t.type === 'CREDIT' ? '+' : '-'}RM {t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            {t.category}
                        </span>
                        {t.currency && t.currency !== 'RM' && (
                             <span className="text-xs text-slate-400">
                                {t.currency} {t.originalAmount.toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>
            ))}
             {transactions.length === 0 && (
                <div className="p-8 text-center text-slate-400">
                    No transactions recorded yet.
                </div>
            )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 font-semibold uppercase tracking-wider text-xs border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Transaction Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount (RM)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice().reverse().slice(0, 5).map((t) => (
                <tr key={t.id} className="group hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{t.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">ID: #{t.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-500">{new Date(t.date).toLocaleDateString()}</td>
                  <td className={`px-6 py-4 text-right`}>
                    <p className={`font-bold text-base ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {t.type === 'CREDIT' ? '+' : '-'}RM {t.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                    </p>
                    {t.currency && t.currency !== 'RM' && (
                        <p className="text-xs text-slate-400 mt-0.5">
                            {t.currency} {t.originalAmount.toFixed(2)}
                        </p>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    No transactions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};