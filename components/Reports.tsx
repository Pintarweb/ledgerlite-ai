
import React, { useState, useMemo } from 'react';
import { Transaction } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Printer, Calendar } from 'lucide-react';
import { Logo } from './Logo';

interface ReportsProps {
  transactions: Transaction[];
}

type ReportType = 'PL' | 'BALANCE_SHEET';

export const Reports: React.FC<ReportsProps> = ({ transactions }) => {
  const [reportType, setReportType] = useState<ReportType>('PL');
  const [year, setYear] = useState(new Date().getFullYear());

  // Get available years from transactions
  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(transactions.map(t => new Date(t.date).getFullYear())));
    if (!uniqueYears.includes(new Date().getFullYear())) uniqueYears.push(new Date().getFullYear());
    return uniqueYears.sort((a: number, b: number) => b - a);
  }, [transactions]);

  // Calculations for P&L
  const plData = useMemo(() => {
    const filtered = transactions.filter(t => new Date(t.date).getFullYear() === year);
    
    // Group Income
    const incomeTx = filtered.filter(t => t.type === 'CREDIT');
    const incomeByCategory: Record<string, number> = {};
    let totalIncome = 0;
    incomeTx.forEach(t => {
      incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
      totalIncome += t.amount;
    });

    // Group Expenses
    const expenseTx = filtered.filter(t => t.type === 'DEBIT');
    const expenseByCategory: Record<string, number> = {};
    let totalExpense = 0;
    expenseTx.forEach(t => {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
      totalExpense += t.amount;
    });

    return {
      incomeByCategory,
      totalIncome,
      expenseByCategory,
      totalExpense,
      netIncome: totalIncome - totalExpense
    };
  }, [transactions, year]);

  // Calculations for Balance Sheet
  const bsData = useMemo(() => {
    const filtered = transactions.filter(t => new Date(t.date).getFullYear() <= year);
    
    const totalAssets = filtered.reduce((acc, t) => acc + (t.type === 'CREDIT' ? t.amount : -t.amount), 0);
    
    return {
        assets: totalAssets,
        liabilities: 0,
        equity: totalAssets
    };
  }, [transactions, year]);

  const pieData = useMemo(() => {
    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];
    return Object.entries(plData.expenseByCategory)
        .map(([name, value], index) => ({ name, value: value as number, color: COLORS[index % COLORS.length] }))
        .sort((a, b) => b.value - a.value);
  }, [plData]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 print:hidden">
        <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1 rounded-xl w-full md:w-auto">
            <button
                onClick={() => setReportType('PL')}
                className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all ${reportType === 'PL' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Profit & Loss
            </button>
            <button
                onClick={() => setReportType('BALANCE_SHEET')}
                className={`flex-1 md:flex-none px-4 py-2 text-sm font-bold rounded-lg transition-all ${reportType === 'BALANCE_SHEET' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                Balance Sheet
            </button>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
                <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <select 
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    className="w-full md:w-auto pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                    {years.map(y => <option key={y} value={y}>Fiscal Year {y}</option>)}
                </select>
            </div>
            <button 
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
            >
                <Printer size={16} /> Print
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* The Paper Document */}
        <div className="lg:col-span-2 bg-white rounded-none sm:rounded-sm shadow-md border border-slate-200 min-h-[800px] p-6 md:p-12 print:shadow-none print:border-none print:w-full print:p-0">
            {/* Document Header */}
            <div className="text-center mb-12 border-b border-slate-800 pb-8 flex flex-col items-center">
                <div className="w-16 h-16 mb-4">
                  <Logo className="w-full h-full" />
                </div>
                <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">ArkAlliance</h1>
                <h2 className="text-xl font-medium text-slate-600 uppercase tracking-widest mb-1">
                    {reportType === 'PL' ? 'Profit & Loss Statement' : 'Balance Sheet'}
                </h2>
                <p className="text-sm text-slate-500 font-serif italic">
                    For the fiscal year ending December 31, {year}
                </p>
            </div>

            {reportType === 'PL' ? (
                <div className="max-w-xl mx-auto space-y-8 font-serif overflow-x-auto">
                    {/* Income Section */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-1">Revenues</h3>
                        <table className="w-full text-sm">
                            <tbody>
                                {Object.entries(plData.incomeByCategory).map(([cat, amount]: [string, number]) => (
                                    <tr key={cat}>
                                        <td className="py-2 text-slate-700">{cat}</td>
                                        <td className="py-2 text-right text-slate-900">RM {amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    </tr>
                                ))}
                                {Object.keys(plData.incomeByCategory).length === 0 && (
                                    <tr><td className="py-2 text-slate-400 italic">No revenue recorded</td><td className="text-right">0.00</td></tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td className="pt-4 font-bold text-slate-800">Total Revenue</td>
                                    <td className="pt-4 text-right font-bold text-slate-800">RM {plData.totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Expense Section */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-1">Operating Expenses</h3>
                        <table className="w-full text-sm">
                            <tbody>
                                {Object.entries(plData.expenseByCategory).map(([cat, amount]: [string, number]) => (
                                    <tr key={cat}>
                                        <td className="py-2 text-slate-700">{cat}</td>
                                        <td className="py-2 text-right text-slate-900">RM {amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    </tr>
                                ))}
                                {Object.keys(plData.expenseByCategory).length === 0 && (
                                    <tr><td className="py-2 text-slate-400 italic">No expenses recorded</td><td className="text-right">0.00</td></tr>
                                )}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td className="pt-4 font-bold text-slate-800">Total Expenses</td>
                                    <td className="pt-4 text-right font-bold text-slate-800 border-t border-slate-800">
                                        (RM {plData.totalExpense.toLocaleString(undefined, {minimumFractionDigits: 2})})
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Net Income */}
                    <div className="pt-8 mt-8 border-t-2 border-slate-900">
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-bold text-slate-900">Net Income</span>
                            <span className={`font-bold border-b-4 border-double ${plData.netIncome >= 0 ? 'text-slate-900 border-slate-900' : 'text-rose-600 border-rose-600'}`}>
                                RM {plData.netIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="max-w-xl mx-auto space-y-8 font-serif overflow-x-auto">
                     {/* Assets */}
                     <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-1">Assets</h3>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="py-2 text-slate-700">Cash on Hand / Bank</td>
                                    <td className="py-2 text-right text-slate-900">RM {bsData.assets.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td className="pt-4 font-bold text-slate-800">Total Assets</td>
                                    <td className="pt-4 text-right font-bold text-slate-800 border-t border-slate-800">RM {bsData.assets.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Liabilities */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-1">Liabilities</h3>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="py-2 text-slate-700">Accounts Payable</td>
                                    <td className="py-2 text-right text-slate-900">RM 0.00</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td className="pt-4 font-bold text-slate-800">Total Liabilities</td>
                                    <td className="pt-4 text-right font-bold text-slate-800 border-t border-slate-800">RM 0.00</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Equity */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-200 pb-1">Equity</h3>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr>
                                    <td className="py-2 text-slate-700">Retained Earnings</td>
                                    <td className="py-2 text-right text-slate-900">RM {bsData.equity.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td className="pt-4 font-bold text-slate-800">Total Equity</td>
                                    <td className="pt-4 text-right font-bold text-slate-800 border-t border-slate-800">RM {bsData.equity.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                    
                    <div className="pt-8 mt-8 border-t-2 border-slate-900">
                        <div className="flex justify-between items-center text-lg">
                            <span className="font-bold text-slate-900">Total Liabilities & Equity</span>
                            <span className="font-bold border-b-4 border-double text-slate-900 border-slate-900">
                                RM {(bsData.liabilities + bsData.equity).toLocaleString(undefined, {minimumFractionDigits: 2})}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-20 pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-400 font-sans print:flex hidden">
                <span>Generated by ArkAlliance Financial Suite</span>
                <span>{new Date().toLocaleDateString()}</span>
            </div>
        </div>

        {/* Side Panel: Analysis (Hidden in Print) */}
        <div className="print:hidden space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="font-bold text-slate-800 mb-4">Expense Analysis</h3>
                <div className="h-[300px] w-full min-w-0">
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number) => `RM ${value.toLocaleString()}`}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                            No data to display
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-indigo-900 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200">
                <h3 className="font-bold text-lg mb-2">Net Profit Margin</h3>
                <div className="text-4xl font-bold mb-1">
                    {plData.totalIncome > 0 
                        ? ((plData.netIncome / plData.totalIncome) * 100).toFixed(1) 
                        : '0.0'}%
                </div>
                <p className="text-indigo-300 text-sm">
                    {plData.netIncome >= 0 ? 'Positive' : 'Negative'} margin for {year}.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
