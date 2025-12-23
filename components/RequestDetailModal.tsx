
import React, { useState } from 'react';
import { Claim, AdvanceRequest } from '../types';
import { X, Check, XCircle, FileText, Calendar, DollarSign, User, Clock, FileDigit, ImageOff } from 'lucide-react';

interface RequestDetailModalProps {
  request: Claim | AdvanceRequest;
  type: 'CLAIM' | 'ADVANCE';
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export const RequestDetailModal: React.FC<RequestDetailModalProps> = ({ request, type, onClose, onApprove, onReject }) => {
  const isClaim = type === 'CLAIM';
  const claim = isClaim ? (request as Claim) : null;
  const advance = !isClaim ? (request as AdvanceRequest) : null;
  const [imageError, setImageError] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Review {isClaim ? 'Expense Claim' : 'Cash Advance'}</h2>
            <p className="text-sm text-slate-500">
               ID: #{request.id.slice(0, 8)} • Submitted by <span className="font-semibold text-slate-700">{isClaim ? claim?.employeeName : advance?.employeeName}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Details Column */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Description / Purpose</h3>
                        <p className="text-lg font-medium text-slate-800 leading-relaxed">
                            {isClaim ? claim?.description : advance?.purpose}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                             <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Amount (RM)</span>
                             <span className="text-xl font-bold text-slate-900">
                                {request.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                             </span>
                        </div>
                        {(request.currency !== 'RM') && (
                             <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Original ({request.currency})</span>
                                <span className="text-xl font-bold text-slate-600">
                                   {request.originalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-[10px] text-slate-400 block mt-1">Rate: {request.exchangeRate}</span>
                             </div>
                        )}
                    </div>

                    <div className="space-y-3">
                         <div className="flex items-center gap-3 text-sm text-slate-600">
                            <Calendar size={18} className="text-slate-400" />
                            <span className="font-medium">Date: {isClaim ? claim?.date : advance?.requestDate}</span>
                         </div>
                         {isClaim && (
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <FileDigit size={18} className="text-slate-400" />
                                <span className="font-medium">Category: {claim?.category}</span>
                            </div>
                         )}
                         {!isClaim && (
                            <div className="flex items-center gap-3 text-sm text-slate-600">
                                <Clock size={18} className="text-slate-400" />
                                <span className="font-medium">Expected Settlement: {advance?.expectedSettlementDate || 'N/A'}</span>
                            </div>
                         )}
                    </div>
                </div>

                {/* Proof / Image Column */}
                <div className="flex flex-col">
                     <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        {isClaim ? 'Receipt Evidence' : 'Supporting Documents'}
                     </h3>
                     <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden flex items-center justify-center min-h-[250px] relative">
                        {isClaim && claim?.receiptUrl && !imageError ? (
                            <div className="w-full h-full flex items-center justify-center bg-slate-100/50">
                                <img 
                                    src={claim.receiptUrl} 
                                    alt="Receipt" 
                                    className="max-w-full max-h-full object-contain p-2" 
                                    onError={() => setImageError(true)}
                                />
                            </div>
                        ) : (
                            <div className="text-center p-6 flex flex-col items-center">
                                {isClaim && claim?.receiptUrl && imageError ? (
                                    <>
                                        <ImageOff size={48} className="text-rose-200 mb-2" />
                                        <p className="text-rose-400 text-sm font-medium">Image Unavailable</p>
                                        <p className="text-xs text-rose-300 mt-1">File data is invalid or expired</p>
                                    </>
                                ) : (
                                    <>
                                        <FileText size={48} className="text-slate-200 mb-2" />
                                        <p className="text-slate-400 text-sm font-medium">No image attached</p>
                                    </>
                                )}
                            </div>
                        )}
                     </div>
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button 
                onClick={() => onReject(request.id)}
                className="px-6 py-2.5 rounded-xl border border-rose-200 text-rose-700 font-bold hover:bg-rose-50 transition-colors flex items-center gap-2"
            >
                <XCircle size={18} /> Reject
            </button>
            <button 
                onClick={() => onApprove(request.id)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-colors flex items-center gap-2"
            >
                <Check size={18} /> Approve Request
            </button>
        </div>
      </div>
    </div>
  );
};
