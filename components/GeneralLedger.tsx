
import React, { useState, useMemo } from 'react';
import { Transaction, CATEGORIES } from '../types';
import { ArrowUpRight, ArrowDownRight, ChevronRight, X, Search, Filter, Calendar, ListFilter, RotateCcw } from 'lucide-react';

interface GeneralLedgerProps {
  transactions: Transaction[];
}

interface AccountSummary {
  category: string;
  totalCredit: number;
  totalDebit: number;
  balance: number;
  count: number;
  lastActivity: string | null;
}

export const GeneralLedger: React.FC<GeneralLedgerProps> = ({ transactions }) => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT'>('ALL');

  // Filter Transactions First
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Date Filter
      if (startDate && t.date < startDate) return false;
      if (endDate && t.date > endDate) return false;
      
      // Type Filter
      if (typeFilter !== 'ALL' && t.type !== typeFilter) return false;

      return true;
    });
  }, [transactions, startDate, endDate, typeFilter]);

  // Aggregate data by category based on filtered transactions
  const accounts = useMemo(() => {
    const accMap: Record<string, AccountSummary> = {};
    
    // Initialize standard categories
    CATEGORIES.forEach(cat => {
      accMap[cat] = { category: cat, totalCredit: 0, totalDebit: 0, balance: 0, count: 0, lastActivity: null };
    });

    // Process filtered transactions
    filteredTransactions.forEach(t => {
      if (!accMap[t.category]) {
        accMap[t.category] = { category: t.category, totalCredit: 0, totalDebit: 0, balance: 0, count: 0, lastActivity: null };
      }
      
      const acc = accMap[t.category];
      acc.count++;
      
      if (t.type === 'CREDIT') {
        acc.totalCredit += t.amount;
        acc.balance += t.amount;
      } else {
        acc.totalDebit += t.amount;
        acc.balance -= t.amount;
      }

      // Update last activity if this transaction is newer
      if (!acc.lastActivity || new Date(t.date) > new Date(acc.lastActivity)) {
        acc.lastActivity = t.date;
      }
    });

    return Object.values(accMap).sort((a, b) => a.category.localeCompare(b.category));
  }, [filteredTransactions]);

  const displayAccounts = accounts.filter(a => 
    a.category.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (a.count > 0 || (searchTerm === '' && !startDate && !endDate && typeFilter === 'ALL')) 
    // If filters are active, hide empty accounts. If no filters, show all standard categories even if empty.
  );

  const selectedAccountTransactions = useMemo(() => {
    if (!selectedAccount) return [];
    return filteredTransactions
      .filter(t => t.category === selectedAccount)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedAccount, filteredTransactions]);

  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setTypeFilter('ALL');
    setSearchTerm('');
  };

  const hasFilters = startDate || endDate || typeFilter !== 'ALL' || searchTerm;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Controls */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
              <Filter size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">General Ledger</h3>
              <p className="text-xs text-slate-500">
                {filteredTransactions.length} entries found
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none w-full md:w-auto">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search accounts..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 min-w-0 md:min-w-[240px]"
              />
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="px-4 py-3 bg-slate-50/50 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date:</span>
                </div>
                <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="text-slate-400 text-sm hidden sm:inline">to</span>
                <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
            </div>

            <div className="w-full h-px bg-slate-200 sm:w-px sm:h-6 sm:bg-slate-200"></div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
                <ListFilter size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Type:</span>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                    <option value="ALL">All Transactions</option>
                    <option value="CREDIT">Credit (Income) Only</option>
                    <option value="DEBIT">Debit (Expense) Only</option>
                </select>
            </div>

            {hasFilters && (
                <button 
                    onClick={clearFilters}
                    className="ml-auto sm:ml-0 flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors w-full sm:w-auto justify-center sm:justify-start"
                >
                    <RotateCcw size={14} /> Clear Filters
                </button>
            )}
        </div>
      </div>

      {/* Grid of Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayAccounts.map((acc) => (
          <div 
            key={acc.category}
            onClick={() => setSelectedAccount(acc.category)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-lg">{acc.category}</h4>
                <p className="text-xs text-slate-400 font-medium">
                  {acc.count} entries {startDate || endDate ? 'in period' : ''}
                </p>
              </div>
              <div className={`p-2 rounded-full ${acc.balance >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                {acc.balance >= 0 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Credits</span>
                <span className="font-semibold text-emerald-600">RM {acc.totalCredit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Debits</span>
                <span className="font-semibold text-rose-600">RM {acc.totalDebit.toLocaleString()}</span>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-50 flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Balance</span>
                <span className={`font-bold text-lg ${acc.balance >= 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                  RM {Math.abs(acc.balance).toLocaleString()}
                </span>
              </div>
            </div>
            
            <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="text-indigo-400" />
            </div>
          </div>
        ))}
        {displayAccounts.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <p>No accounts match your filters.</p>
                <button onClick={clearFilters} className="text-indigo-600 font-bold mt-2 hover:underline">Clear Filters</button>
            </div>
        )}
      </div>

      {/* Account Details Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-end backdrop-blur-sm" onClick={() => setSelectedAccount(null)}>
          <div 
            className="w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">{selectedAccount}</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="font-medium">Ledger History</span>
                    {(startDate || endDate) && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md text-xs font-bold">
                            Filtered: {startDate || 'Start'} to {endDate || 'Now'}
                        </span>
                    )}
                </div>
              </div>
              <button 
                onClick={() => setSelectedAccount(null)}
                className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="bg-white rounded-xl border border-slate-100 overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 min-w-[500px]">
                  <thead className="bg-slate-50 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Debit</th>
                      <th className="px-4 py-3 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedAccountTransactions.length === 0 ? (
                       <tr>
                           <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No transactions found for this period.</td>
                       </tr>
                    ) : (
                        selectedAccountTransactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-500">{t.date}</td>
                            <td className="px-4 py-3 text-slate-800">{t.description}</td>
                            <td className="px-4 py-3 text-right text-rose-600 font-medium">
                            {t.type === 'DEBIT' ? `RM ${t.amount.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                            {t.type === 'CREDIT' ? `RM ${t.amount.toFixed(2)}` : '-'}
                            </td>
                        </tr>
                        ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold text-slate-700">
                     <tr>
                         <td colSpan={2} className="px-4 py-3 text-right uppercase text-xs tracking-wider text-slate-500">Period Totals</td>
                         <td className="px-4 py-3 text-right text-rose-700">
                             RM {selectedAccountTransactions.filter(t => t.type === 'DEBIT').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                         </td>
                         <td className="px-4 py-3 text-right text-emerald-700">
                             RM {selectedAccountTransactions.filter(t => t.type === 'CREDIT').reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                         </td>
                     </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
