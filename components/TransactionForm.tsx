
import React, { useState, useRef, useEffect } from 'react';
import { Transaction, TransactionType, CATEGORIES, CURRENCIES } from '../types';
import { analyzeReceipt } from '../services/geminiService';
import { getExchangeRate } from '../services/currencyService';
import { Loader2, Check, X, Wand2, Globe, Calculator, Calendar, Tag, AlignLeft } from 'lucide-react';

interface TransactionFormProps {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onAddTransaction, onClose }) => {
  const [type, setType] = useState<TransactionType>('DEBIT');
  const [description, setDescription] = useState('');
  
  // Currency State
  const [currency, setCurrency] = useState('RM');
  const [originalAmount, setOriginalAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('1.00');
  const [calculatedRMAmount, setCalculatedRMAmount] = useState(0);
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update calculated RM amount whenever inputs change
  useEffect(() => {
    const amt = parseFloat(originalAmount) || 0;
    const rate = parseFloat(exchangeRate) || 1;
    setCalculatedRMAmount(amt * rate);
  }, [originalAmount, exchangeRate, currency]);

  // Handle Currency Change & Fetch Rate
  useEffect(() => {
    if (currency === 'RM') {
      setExchangeRate('1.00');
      return;
    }

    const fetchRate = async () => {
      setIsFetchingRate(true);
      try {
        const rate = await getExchangeRate(currency, 'RM');
        if (rate > 0) {
          setExchangeRate(rate.toFixed(4));
        }
      } catch (err) {
        console.error("Could not fetch rate automatically");
      } finally {
        setIsFetchingRate(false);
      }
    };

    fetchRate();
  }, [currency]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      
      setIsAnalyzing(true);
      try {
        const data = await analyzeReceipt(file);
        if (data.merchant) setDescription(data.merchant);
        if (data.amount) {
            setOriginalAmount(data.amount.toString());
        }
        if (data.date) setDate(data.date);
        if (data.category && CATEGORIES.includes(data.category)) {
          setCategory(data.category);
        } else if (data.category) {
             setCategory('Other');
        }
        // If Gemini detects currency logic could be added here in future
      } catch (error) {
        console.error("Analysis failed", error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTransaction({
      date,
      description,
      amount: calculatedRMAmount, // This is the Base RM amount
      type,
      category,
      currency,
      originalAmount: parseFloat(originalAmount),
      exchangeRate: parseFloat(exchangeRate),
      receiptUrl: receiptFile ? URL.createObjectURL(receiptFile) : undefined,
      createdBy: 'Admin',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
          <div>
              <h2 className="text-xl font-bold text-slate-800">New Transaction</h2>
              <p className="text-sm text-slate-500">Record income or expense</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          {/* AI Scanner Trigger */}
          <div className="mb-6">
            <div 
              className={`group relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer overflow-hidden ${isAnalyzing ? 'bg-indigo-50 border-indigo-200' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center text-indigo-600 py-2">
                  <Loader2 className="animate-spin mb-3" size={28} />
                  <span className="text-sm font-bold">Extracting Data...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-1">
                  {receiptFile ? (
                    <>
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                        <Check size={24} />
                      </div>
                      <span className="text-sm text-emerald-700 font-bold">Analysis Complete</span>
                      <span className="text-xs text-slate-500 mt-1">{receiptFile.name}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                         <Wand2 size={24} />
                      </div>
                      <span className="text-sm font-bold text-slate-700">Auto-Fill with AI</span>
                      <span className="text-xs text-slate-400 mt-1 max-w-[200px]">Upload a receipt to automatically extract details.</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-slate-100 p-1.5 rounded-xl flex">
                  <button
                    type="button"
                    onClick={() => setType('CREDIT')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'CREDIT' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Income (Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('DEBIT')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${type === 'DEBIT' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Expense (Debit)
                  </button>
            </div>

            {/* Currency Section */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex gap-4">
                    <div className="w-1/3">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Currency</label>
                        <div className="relative">
                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Globe size={16} />
                            </div>
                            <select 
                                value={currency} 
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full pl-9 pr-2 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-bold text-slate-700 appearance-none"
                            >
                                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                            {currency === 'RM' ? 'Amount (RM)' : `Amount (${currency})`}
                        </label>
                        <div className="relative group">
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={originalAmount}
                                onChange={(e) => setOriginalAmount(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-bold text-slate-800 placeholder:text-slate-300"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                {currency !== 'RM' && (
                    <div className="flex gap-4 items-center animate-in fade-in slide-in-from-top-2">
                        <div className="w-1/2">
                             <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">
                               Exchange Rate
                               {isFetchingRate && <span className="ml-2 text-indigo-500 animate-pulse text-[10px] lowercase">updating...</span>}
                             </label>
                             <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                    {isFetchingRate ? <Loader2 size={16} className="animate-spin text-indigo-500" /> : <Calculator size={16} />}
                                </div>
                                <input
                                    type="number"
                                    step="0.0001"
                                    required
                                    value={exchangeRate}
                                    onChange={(e) => setExchangeRate(e.target.value)}
                                    className={`w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-slate-800 ${isFetchingRate ? 'text-slate-400' : ''}`}
                                />
                             </div>
                        </div>
                        <div className="flex-1 text-right">
                            <p className="text-xs text-slate-400 font-medium mb-1">Converted Total</p>
                            <p className="text-lg font-bold text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-lg border border-indigo-100">
                                RM {calculatedRMAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </p>
                        </div>
                    </div>
                )}
            </div>
              
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Date</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <Calendar size={16} />
                    </div>
                    <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                    />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Category</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <Tag size={16} />
                    </div>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium appearance-none"
                    >
                        {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Description</label>
              <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        <AlignLeft size={16} />
                    </div>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-medium placeholder:text-slate-300"
                    placeholder="e.g. Office Supplies from Staples"
                  />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-slate-700 font-bold hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[2] px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all"
              >
                Save Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
