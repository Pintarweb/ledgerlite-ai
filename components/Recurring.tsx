
import React, { useState } from 'react';
import { RecurringTransaction, TransactionType, CATEGORIES, CURRENCIES } from '../types';
import { CalendarClock, Plus, Trash2, Play, Pause, PlayCircle, CheckCircle, AlertCircle, X, Repeat, Eye } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface RecurringProps {
  rules: RecurringTransaction[];
  onAddRule: (rule: Omit<RecurringTransaction, 'id'>) => void;
  onDeleteRule: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onRunNow: (id: string) => void;
  readOnly?: boolean;
}

export const Recurring: React.FC<RecurringProps> = ({ rules, onAddRule, onDeleteRule, onToggleStatus, onRunNow, readOnly = false }) => {
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form State
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('DEBIT');
  const [frequency, setFrequency] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');
  const [nextDueDate, setNextDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(CATEGORIES[2]); // Default Rent
  const [currency, setCurrency] = useState('RM');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRule({
      description,
      amount: parseFloat(amount), // Assuming RM for simplicity in this form, or can calculate
      type,
      frequency,
      nextDueDate,
      active: true,
      category,
      currency,
      originalAmount: parseFloat(amount),
      exchangeRate: 1.0 // Simplification: Recurring usually fixed amount.
    });
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setNextDueDate(new Date().toISOString().split('T')[0]);
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDeleteRule(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ConfirmDialog 
        isOpen={!!deleteId}
        title="Delete Recurring Rule?"
        message="This will stop all future automated transactions for this rule. This action cannot be undone."
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
        confirmText="Delete Rule"
      />

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
           <div className="flex items-center gap-3 mb-1">
             <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                <Repeat size={24} />
             </div>
             <h2 className="text-xl font-bold text-slate-800">Recurring Transactions</h2>
           </div>
           <p className="text-slate-500 text-sm">Automate rent, salaries, and subscriptions.</p>
        </div>
        {!readOnly && (
            <button 
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all w-full md:w-auto justify-center"
            >
                <Plus size={20} /> Add Rule
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules.map((rule) => (
            <div key={rule.id} className={`relative bg-white p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${rule.active ? 'border-slate-100' : 'border-slate-100 bg-slate-50 opacity-75'}`}>
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-2 rounded-lg ${rule.type === 'CREDIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        <CalendarClock size={20} />
                    </div>
                    {!readOnly ? (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => onRunNow(rule.id)}
                                title="Run Once Now"
                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                            >
                                <PlayCircle size={20} />
                            </button>
                            <button 
                                onClick={() => setDeleteId(rule.id)}
                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ) : (
                        <div className="p-2 text-slate-400 bg-slate-50 rounded-full" title="Read Only">
                            <Eye size={18} />
                        </div>
                    )}
                </div>

                <h3 className="text-lg font-bold text-slate-800 mb-1">{rule.description}</h3>
                <div className="flex items-center gap-2 mb-4">
                     <span className="text-2xl font-bold text-slate-900">
                        {rule.currency} {rule.originalAmount.toLocaleString()}
                     </span>
                     <span className="text-xs font-bold text-slate-400 uppercase tracking-wide px-2 py-1 bg-slate-100 rounded-md">
                        {rule.frequency}
                     </span>
                </div>

                <div className="space-y-3 border-t border-slate-100 pt-4">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Next Due:</span>
                        <span className={`font-bold ${new Date(rule.nextDueDate) <= new Date() && rule.active ? 'text-amber-600' : 'text-slate-700'}`}>
                            {new Date(rule.nextDueDate).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Category:</span>
                        <span className="font-medium text-slate-700">{rule.category}</span>
                    </div>
                    
                    {!readOnly ? (
                        <button 
                            onClick={() => onToggleStatus(rule.id)}
                            className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${rule.active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                        >
                            {rule.active ? <><Pause size={14} /> Active</> : <><Play size={14} /> Paused</>}
                        </button>
                    ) : (
                        <div className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 cursor-default ${rule.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                             {rule.active ? <><CheckCircle size={14} /> Active</> : <><Pause size={14} /> Paused</>}
                        </div>
                    )}
                </div>
            </div>
        ))}
        {rules.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50">
                <Repeat size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-500">No recurring rules</h3>
                <p className="text-slate-400 text-sm mt-1">{!readOnly ? 'Set up automated payments to save time.' : 'No active rules configured.'}</p>
            </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800">New Recurring Rule</h3>
                    <button onClick={() => setShowModal(false)}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
                        <input required type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium" placeholder="e.g. Office Rent" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Amount</label>
                             <input required type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium" placeholder="0.00" />
                        </div>
                        <div>
                             <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Currency</label>
                             <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white text-sm font-medium">
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Frequency</label>
                            <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white text-sm font-medium">
                                <option value="MONTHLY">Monthly</option>
                                <option value="WEEKLY">Weekly</option>
                            </select>
                         </div>
                         <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Start Date</label>
                            <input required type="date" value={nextDueDate} onChange={e => setNextDueDate(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium text-slate-600" />
                         </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Type</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg">
                                <button type="button" onClick={() => setType('CREDIT')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${type === 'CREDIT' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}>Credit</button>
                                <button type="button" onClick={() => setType('DEBIT')} className={`flex-1 py-1.5 text-xs font-bold rounded-md ${type === 'DEBIT' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}>Debit</button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Category</label>
                            <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white text-sm font-medium">
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 mt-2">Save Rule</button>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};
