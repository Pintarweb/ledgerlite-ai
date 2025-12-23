
import React, { useState, useRef, useEffect } from 'react';
import { Claim, AdvanceRequest, ClaimStatus, CATEGORIES, CURRENCIES } from '../types';
import { analyzeReceipt, fileToDataUri } from '../services/geminiService';
import { getExchangeRate } from '../services/currencyService';
import { FileText, Clock, CheckCircle, XCircle, Plus, Loader2, Wand2, Globe, Calculator, Banknote, Calendar, History, Camera, Upload, Image as ImageIcon } from 'lucide-react';

interface StaffPortalProps {
  claims: Claim[];
  advances: AdvanceRequest[];
  currentUser: string;
  onAddClaim: (claim: Omit<Claim, 'id' | 'status'>) => void;
  onAddAdvance: (advance: Omit<AdvanceRequest, 'id' | 'status'>) => void;
}

type Tab = 'CLAIMS' | 'ADVANCE' | 'HISTORY';

export const StaffPortal: React.FC<StaffPortalProps> = ({ claims, advances, currentUser, onAddClaim, onAddAdvance }) => {
  const [activeTab, setActiveTab] = useState<Tab>('CLAIMS');
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  
  // Claim Form State
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('RM');
  const [originalAmount, setOriginalAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('1.00');
  const [isFetchingRate, setIsFetchingRate] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState(CATEGORIES[6]); // Default to Travel
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Advance Form State
  const [advPurpose, setAdvPurpose] = useState('');
  const [advDate, setAdvDate] = useState(new Date().toISOString().split('T')[0]);
  const [advSettleDate, setAdvSettleDate] = useState('');
  const [advAmount, setAdvAmount] = useState('');
  const [advCurrency, setAdvCurrency] = useState('RM');
  const [advExchangeRate, setAdvExchangeRate] = useState('1.00');

  // Handle Currency Change & Fetch Rate for Claims
  useEffect(() => {
    if (currency === 'RM') {
      setExchangeRate('1.00');
      return;
    }
    const fetchRate = async () => {
      setIsFetchingRate(true);
      try {
        const rate = await getExchangeRate(currency, 'RM');
        if (rate > 0) setExchangeRate(rate.toFixed(4));
      } catch (err) { console.error(err); } 
      finally { setIsFetchingRate(false); }
    };
    fetchRate();
  }, [currency]);

  // Handle Currency for Advance
  useEffect(() => {
    if (advCurrency === 'RM') {
      setAdvExchangeRate('1.00');
      return;
    }
    const fetchRate = async () => {
      try {
        const rate = await getExchangeRate(advCurrency, 'RM');
        if (rate > 0) setAdvExchangeRate(rate.toFixed(4));
      } catch (err) { console.error(err); }
    };
    fetchRate();
  }, [advCurrency]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFile(file);
      setIsAnalyzing(true);
      try {
        const data = await analyzeReceipt(file);
        if (data.merchant) setDescription(data.merchant);
        if (data.amount) setOriginalAmount(data.amount.toString());
        if (data.date) setDate(data.date);
        if (data.category && CATEGORIES.includes(data.category)) {
          setCategory(data.category);
        }
      } catch (error) { console.error("Analysis error", error); } 
      finally { setIsAnalyzing(false); }
    }
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    const origAmt = parseFloat(originalAmount) || 0;
    const rate = parseFloat(exchangeRate) || 1;
    const baseAmt = origAmt * rate;

    let receiptDataUri = undefined;
    if (receiptFile) {
        try {
            receiptDataUri = await fileToDataUri(receiptFile);
        } catch (error) {
            console.error("Failed to convert file", error);
        }
    }

    onAddClaim({
      employeeName: currentUser,
      date,
      description,
      amount: baseAmt,
      category,
      receiptUrl: receiptDataUri,
      currency,
      originalAmount: origAmt,
      exchangeRate: rate
    });
    setShowClaimForm(false);
    resetClaimForm();
  };

  const handleSubmitAdvance = (e: React.FormEvent) => {
    e.preventDefault();
    const origAmt = parseFloat(advAmount) || 0;
    const rate = parseFloat(advExchangeRate) || 1;
    
    onAddAdvance({
        employeeName: currentUser,
        requestDate: advDate,
        amount: origAmt * rate,
        purpose: advPurpose,
        expectedSettlementDate: advSettleDate,
        currency: advCurrency,
        originalAmount: origAmt,
        exchangeRate: rate
    });
    setShowAdvanceForm(false);
    resetAdvanceForm();
  };

  const resetClaimForm = () => {
    setDescription('');
    setOriginalAmount('');
    setCurrency('RM');
    setReceiptFile(null);
  };

  const resetAdvanceForm = () => {
      setAdvPurpose('');
      setAdvAmount('');
      setAdvSettleDate('');
      setAdvCurrency('RM');
  };

  const getStatusColor = (status: ClaimStatus) => {
    switch (status) {
      case 'APPROVED': return 'text-emerald-600 bg-emerald-100';
      case 'REJECTED': return 'text-rose-600 bg-rose-100';
      case 'SETTLED': return 'text-slate-600 bg-slate-100';
      default: return 'text-amber-600 bg-amber-100';
    }
  };

  const activeClaims = claims.filter(c => c.status === 'PENDING' || c.status === 'APPROVED');
  const activeAdvances = advances.filter(a => a.status === 'PENDING' || a.status === 'APPROVED');
  
  const historyItems = [
    ...claims.map(c => ({...c, type: 'CLAIM'})), 
    ...advances.map(a => ({...a, date: a.requestDate, description: a.purpose, type: 'ADVANCE'}))
  ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Input styles helper for consistency and larger touch targets
  const inputClassName = "w-full px-4 py-3 border border-slate-300 rounded-xl outline-none text-base bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-700";

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">Staff Portal</h2>
           <p className="text-slate-500">Manage your claims and cash advances</p>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex bg-white p-1.5 rounded-xl shadow-sm border border-slate-100 overflow-x-auto w-full md:w-auto shrink-0">
            <button
                onClick={() => setActiveTab('CLAIMS')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 md:py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'CLAIMS' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <FileText size={18} /> Claims
            </button>
            <button
                onClick={() => setActiveTab('ADVANCE')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 md:py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'ADVANCE' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Banknote size={18} /> Advance
            </button>
            <button
                onClick={() => setActiveTab('HISTORY')}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 md:py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${activeTab === 'HISTORY' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <History size={18} /> History
            </button>
        </div>
      </div>

      {activeTab === 'CLAIMS' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-indigo-900 text-white p-6 rounded-2xl shadow-lg shadow-indigo-200">
                <div>
                    <h3 className="text-lg font-bold">Expense Claims</h3>
                    <p className="text-indigo-200 text-sm">Submit receipts for reimbursement.</p>
                </div>
                <button 
                    onClick={() => setShowClaimForm(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg active:scale-95"
                >
                    <Plus size={20} /> New Claim
                </button>
             </div>

             <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                 <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Pending</span>
                    <p className="text-2xl font-bold text-slate-800 mt-1">RM {claims.filter(c => c.status === 'PENDING').reduce((acc, c) => acc + c.amount, 0).toFixed(2)}</p>
                 </div>
                 <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Approved</span>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">RM {claims.filter(c => c.status === 'APPROVED').reduce((acc, c) => acc + c.amount, 0).toFixed(2)}</p>
                 </div>
             </div>

             {/* Mobile Card View */}
             <div className="md:hidden space-y-4">
                {activeClaims.map((claim) => (
                    <div key={claim.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 mr-4">
                                <p className="font-bold text-slate-800 text-lg leading-snug">{claim.description}</p>
                                <p className="text-sm text-slate-400 mt-1 font-medium">{claim.date}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xl font-bold text-slate-800">RM {claim.amount.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-50 pt-3 mt-1">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
                                {claim.receiptUrl && <FileText size={14} className="text-indigo-500" />}
                                {claim.category}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(claim.status)}`}>{claim.status}</span>
                        </div>
                    </div>
                ))}
                {activeClaims.length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <FileText size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="font-medium">No active claims found.</p>
                        <p className="text-xs mt-1">Tap 'New Claim' to start.</p>
                    </div>
                )}
             </div>

             {/* Desktop Table View */}
             <div className="hidden md:block bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-medium text-xs uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {activeClaims.map((claim) => (
                        <tr key={claim.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">{claim.date}</td>
                        <td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-2">
                             {claim.receiptUrl && <FileText size={16} className="text-slate-400" />}
                             {claim.description}
                        </td>
                        <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>{claim.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">RM {claim.amount.toFixed(2)}</td>
                        </tr>
                    ))}
                    {activeClaims.length === 0 && (
                         <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-400">No active claims.</td></tr>
                    )}
                    </tbody>
                </table>
             </div>
        </div>
      )}

      {activeTab === 'ADVANCE' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-emerald-900 text-white p-6 rounded-2xl shadow-lg shadow-emerald-200">
                <div>
                    <h3 className="text-lg font-bold">Cash Advances</h3>
                    <p className="text-emerald-200 text-sm">Request funds for upcoming expenses.</p>
                </div>
                <button 
                    onClick={() => setShowAdvanceForm(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-white text-emerald-900 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-lg active:scale-95"
                >
                    <Plus size={20} /> Request Advance
                </button>
             </div>

             {/* Mobile Card View */}
             <div className="md:hidden space-y-4">
                {activeAdvances.map((adv) => (
                    <div key={adv.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                         <div className="flex justify-between items-start">
                            <div className="flex-1 mr-4">
                                <p className="font-bold text-slate-800 text-lg leading-snug">{adv.purpose}</p>
                                <div className="flex flex-col gap-1 mt-1.5">
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Calendar size={14} />
                                        <span>Req: {adv.requestDate}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-slate-500">
                                        <Clock size={14} />
                                        <span>Settle: {adv.expectedSettlementDate || 'TBD'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-xl font-bold text-slate-800">RM {adv.amount.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-t border-slate-50 pt-3 mt-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Status</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(adv.status)}`}>{adv.status}</span>
                        </div>
                    </div>
                ))}
                 {activeAdvances.length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                         <Banknote size={48} className="mx-auto text-slate-300 mb-3" />
                         <p className="font-medium">No active advances.</p>
                    </div>
                )}
             </div>

             {/* Desktop Table View */}
             <div className="hidden md:block bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-medium text-xs uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Date Requested</th>
                        <th className="px-6 py-4">Purpose</th>
                        <th className="px-6 py-4">Settlement Expected</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {activeAdvances.map((adv) => (
                        <tr key={adv.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">{adv.requestDate}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{adv.purpose}</td>
                        <td className="px-6 py-4">{adv.expectedSettlementDate || '-'}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(adv.status)}`}>{adv.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">RM {adv.amount.toFixed(2)}</td>
                        </tr>
                    ))}
                    {activeAdvances.length === 0 && (
                         <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">No active advances.</td></tr>
                    )}
                    </tbody>
                </table>
             </div>
        </div>
      )}

      {activeTab === 'HISTORY' && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                <h3 className="font-bold text-slate-700 px-1 mb-2">All Past Records</h3>
                {historyItems.map((item, idx) => (
                     <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-3">
                         <div className="flex justify-between items-center mb-1">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${item.type === 'CLAIM' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {item.type}
                            </span>
                            <span className="text-sm text-slate-500 font-medium">{item.date}</span>
                         </div>
                         <div className="flex justify-between items-start">
                            <p className="font-bold text-slate-800 text-lg leading-snug flex-1 mr-4">{item.description}</p>
                            <p className="text-xl font-bold text-slate-800 whitespace-nowrap">RM {item.amount.toFixed(2)}</p>
                         </div>
                         <div className="flex justify-between items-center border-t border-slate-50 pt-3 mt-1">
                            <span className="text-xs text-slate-400 font-medium">Status</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(item.status)}`}>{item.status}</span>
                        </div>
                     </div>
                ))}
                 {historyItems.length === 0 && (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <History size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="font-medium">No history available.</p>
                    </div>
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <h3 className="font-bold text-slate-700">All Past Records</h3>
                </div>
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {historyItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${item.type === 'CLAIM' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                {item.type}
                            </span>
                        </td>
                        <td className="px-6 py-4">{item.date}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{item.description}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>{item.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-800">RM {item.amount.toFixed(2)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* Claim Modal */}
      {showClaimForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="text-lg font-bold text-slate-800">Submit New Claim</h3>
                    <button onClick={() => setShowClaimForm(false)} className="text-slate-400 hover:text-slate-600 p-2 -mr-2"><XCircle size={28} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="mb-6">
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                         <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
                         
                         {isAnalyzing ? (
                             <div className="border-2 border-dashed border-indigo-300 bg-indigo-50 rounded-xl p-8 flex flex-col items-center justify-center">
                                <Loader2 className="animate-spin text-indigo-600 mb-3" size={32} />
                                <span className="text-sm font-medium text-indigo-600">Analyzing Receipt...</span>
                             </div>
                         ) : receiptFile ? (
                             <div className="border-2 border-dashed border-emerald-200 bg-emerald-50 rounded-xl p-6 flex flex-col items-center justify-center relative group">
                                <div className="bg-emerald-100 p-3 rounded-full mb-3 text-emerald-600">
                                    <CheckCircle size={24}/>
                                </div>
                                <span className="text-sm font-bold text-emerald-800 mb-1">Receipt Analyzed</span>
                                <span className="text-xs text-emerald-600 truncate max-w-[200px]">{receiptFile.name}</span>
                                <button 
                                    onClick={() => {setReceiptFile(null); setDescription(''); setOriginalAmount('');}}
                                    className="mt-3 text-xs text-rose-500 font-bold hover:text-rose-700 hover:underline px-3 py-1.5 rounded bg-rose-50 border border-rose-100"
                                >
                                    Remove & Retake
                                </button>
                             </div>
                         ) : (
                             <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 hover:border-indigo-300 hover:bg-slate-50 transition-colors">
                                <div className="text-center mb-4">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 mb-3">
                                        <Wand2 size={24} />
                                    </div>
                                    <h4 className="text-slate-800 font-bold text-sm">Scan Receipt with AI</h4>
                                    <p className="text-slate-400 text-xs mt-1">Automatically extract details from photo</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => cameraInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center gap-2 py-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md transition-all group active:bg-slate-50"
                                    >
                                        <Camera size={24} className="text-slate-400 group-hover:text-indigo-500" />
                                        <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600">Snap Photo</span>
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center gap-2 py-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:text-indigo-600 hover:shadow-md transition-all group active:bg-slate-50"
                                    >
                                        <ImageIcon size={24} className="text-slate-400 group-hover:text-indigo-500" />
                                        <span className="text-sm font-bold text-slate-600 group-hover:text-indigo-600">Upload File</span>
                                    </button>
                                </div>
                             </div>
                         )}
                    </div>

                    <form onSubmit={handleSubmitClaim} className="space-y-5">
                        <div className="flex flex-col sm:flex-row gap-4">
                             <div className="w-full sm:w-1/3">
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Currency</label>
                                 <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClassName}>
                                     {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                 </select>
                             </div>
                             <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Amount</label>
                                <input type="number" step="0.01" required value={originalAmount} onChange={e => setOriginalAmount(e.target.value)} className={inputClassName} placeholder="0.00" />
                             </div>
                        </div>

                        {currency !== 'RM' && (
                             <div className="bg-slate-50 p-3 rounded-xl text-sm flex justify-between items-center border border-slate-200">
                                <span className="text-slate-500 font-medium">Ex. Rate:</span>
                                <input type="number" step="0.0001" value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} className="w-24 px-2 py-1 border border-slate-300 rounded text-right bg-white font-bold" />
                                <span className="font-bold text-indigo-600 ml-2">= RM {((parseFloat(originalAmount)||0)*(parseFloat(exchangeRate)||1)).toFixed(2)}</span>
                             </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Date</label>
                                <input type="date" required value={date} onChange={e => setDate(e.target.value)} className={inputClassName} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Category</label>
                                <select value={category} onChange={e => setCategory(e.target.value)} className={inputClassName}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Description</label>
                            <input type="text" required value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Client Lunch" className={inputClassName} />
                        </div>
                        <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 mt-2 text-lg active:scale-[0.98]">Submit Claim</button>
                    </form>
                </div>
            </div>
        </div>
      )}

      {/* Advance Modal */}
      {showAdvanceForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
             <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <h3 className="text-lg font-bold text-slate-800">Request Cash Advance</h3>
                    <button onClick={() => setShowAdvanceForm(false)} className="text-slate-400 hover:text-slate-600 p-2 -mr-2"><XCircle size={28} /></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form onSubmit={handleSubmitAdvance} className="space-y-5">
                        <div className="flex flex-col sm:flex-row gap-4">
                             <div className="w-full sm:w-1/3">
                                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Currency</label>
                                 <select value={advCurrency} onChange={(e) => setAdvCurrency(e.target.value)} className={inputClassName}>
                                     {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                                 </select>
                             </div>
                             <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Amount Needed</label>
                                <input type="number" step="0.01" required value={advAmount} onChange={e => setAdvAmount(e.target.value)} className={inputClassName} placeholder="0.00" />
                             </div>
                        </div>

                        {advCurrency !== 'RM' && (
                             <div className="bg-slate-50 p-3 rounded-xl text-sm flex justify-between items-center border border-slate-200">
                                <span className="text-slate-500 font-medium">Ex. Rate:</span>
                                <input type="number" step="0.0001" value={advExchangeRate} onChange={e => setAdvExchangeRate(e.target.value)} className="w-24 px-2 py-1 border border-slate-300 rounded text-right bg-white font-bold" />
                                <span className="font-bold text-emerald-600 ml-2">= RM {((parseFloat(advAmount)||0)*(parseFloat(advExchangeRate)||1)).toFixed(2)}</span>
                             </div>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Date Needed</label>
                            <input type="date" required value={advDate} onChange={e => setAdvDate(e.target.value)} className={inputClassName} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Expected Settlement Date</label>
                            <input type="date" required value={advSettleDate} onChange={e => setAdvSettleDate(e.target.value)} className={inputClassName} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Purpose / Reason</label>
                            <textarea required value={advPurpose} onChange={e => setAdvPurpose(e.target.value)} rows={3} placeholder="Briefly explain why you need this advance..." className={`${inputClassName} resize-none`} />
                        </div>
                        
                        <div className="bg-amber-50 p-4 rounded-xl flex gap-3 text-sm text-amber-800 border border-amber-100">
                            <Clock size={20} className="shrink-0 text-amber-600" />
                            <p>Advance requests must be approved by admin. Funds will be recorded as a debit once approved.</p>
                        </div>

                        <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200 mt-2 text-lg active:scale-[0.98]">Submit Request</button>
                    </form>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
