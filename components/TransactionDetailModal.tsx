import React, { useState } from 'react';
import { Transaction } from '../types';
import { supabase } from '../lib/supabaseClient';
import { X, Calendar, DollarSign, FileText, FileDigit, ImageOff, ZoomIn, Download, User, Globe, ExternalLink } from 'lucide-react';

interface TransactionDetailModalProps {
    transaction: Transaction;
    onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({ transaction, onClose }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isZoomed, setIsZoomed] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [debugError, setDebugError] = useState<string | null>(null);

    React.useEffect(() => {
        if (transaction.receiptUrl) {
            const lowerUrl = transaction.receiptUrl.toLowerCase();
            // If it looks like a URL (http/https/data), use it directly. 
            // Otherwise assume it is a private storage path.
            if (lowerUrl.startsWith('http') || lowerUrl.startsWith('data:')) {
                setImageUrl(transaction.receiptUrl);
            } else {
                // Fetch signed URL
                const fetchSignedUrl = async () => {
                    try {
                        // Fetch signed URL
                        const { data, error } = await supabase.storage.from('receipts').createSignedUrl(transaction.receiptUrl!, 3600);

                        if (error) {
                            console.error('Sign URL error:', error);
                            setDebugError(error.message);
                            setImageError(true); // Set imageError if there's an error fetching the signed URL
                        }

                        if (data) {
                            setImageUrl(data.signedUrl);
                        }
                    } catch (error: any) {
                        console.error('Error signing url:', error);
                        setDebugError(error?.message || 'Unknown error');
                        setImageError(true); // Set imageError for any other exceptions
                    }
                };
                fetchSignedUrl();
            }
        }
    }, [transaction]);

    // Full Screen Zoom View
    if (isZoomed && imageUrl) {
        const isPdf = imageUrl.toLowerCase().includes('.pdf') || (transaction.receiptUrl?.toLowerCase().endsWith('.pdf'));
        const isImage = !isPdf && (imageUrl.toLowerCase().includes('.jpg') || imageUrl.toLowerCase().includes('.jpeg') || imageUrl.toLowerCase().includes('.png') || imageUrl.toLowerCase().includes('.gif') || imageUrl.toLowerCase().includes('.webp'));

        return (
            <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col animate-in fade-in duration-200">
                <div className="flex justify-between items-center p-4 text-white shrink-0">
                    <div>
                        <h3 className="font-bold text-lg">Transaction Receipt</h3>
                        <p className="text-sm text-slate-400">{transaction.description} • {transaction.date}</p>
                    </div>
                    <button onClick={() => setIsZoomed(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-hidden p-4 flex items-center justify-center">
                    {(() => {
                        if (isPdf) {
                            return (
                                <iframe
                                    src={imageUrl}
                                    className="w-full h-full bg-white rounded-lg border-0 shadow-2xl"
                                    title="Receipt PDF"
                                />
                            );
                        } else if (isImage) {
                            return (
                                <img
                                    src={imageUrl}
                                    alt="Receipt Zoom"
                                    className="max-w-full max-h-full object-contain shadow-2xl"
                                />
                            );
                        } else {
                            return (
                                <div className="flex flex-col items-center justify-center text-slate-400 p-4">
                                    <FileText size={64} className="mb-4 text-slate-600" />
                                    <p className="font-bold text-lg mb-2">Preview Unavailable</p>
                                    <a
                                        href={imageUrl}
                                        download
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-4 flex items-center gap-2 px-6 py-3 bg-white text-slate-900 rounded-xl hover:bg-slate-200 transition-colors font-bold"
                                    >
                                        <Download size={20} /> Download File
                                    </a>
                                </div>
                            );
                        }
                    })()}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Transaction Details</h2>
                        <div className="text-sm text-slate-500 flex gap-2">
                            <span>ID: #{transaction.id.slice(0, 8)}-{transaction.id.slice(-4)}</span>
                            <span>•</span>
                            <span>Recorded by <span className="font-semibold text-slate-700">{transaction.createdBy || 'Unknown'}</span></span>
                            <span className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-400 self-center">v0.1.12</span>
                        </div>
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
                                    {transaction.description}
                                </p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                <div>
                                    <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Total Amount</span>
                                    <div className={`text-2xl font-bold ${transaction.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                        {transaction.type === 'CREDIT' ? '+' : '-'}RM {transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </div>
                                </div>
                                {transaction.currency && transaction.currency !== 'RM' && (
                                    <div className="text-right">
                                        <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Original ({transaction.currency})</span>
                                        <div className="text-lg font-bold text-slate-600">
                                            {transaction.originalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-[10px] text-slate-400 mt-1">Rate: {transaction.exchangeRate}</div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <Calendar size={18} className="text-indigo-400" />
                                    <span className="font-medium">Date: <span className="text-slate-800">{transaction.date}</span></span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <FileDigit size={18} className="text-indigo-400" />
                                    <span className="font-medium">Category: <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs uppercase tracking-wide font-bold">{transaction.category}</span></span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-slate-600">
                                    <User size={18} className="text-indigo-400" />
                                    <span className="font-medium">Type: <span className={transaction.type === 'CREDIT' ? 'text-emerald-600 font-bold' : 'text-slate-800 font-bold'}>{transaction.type}</span></span>
                                </div>
                            </div>
                        </div>

                        {/* Proof / Image Column */}
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Receipt Evidence
                                </h3>
                                {transaction.receiptUrl && (
                                    <a
                                        href={imageUrl || transaction.receiptUrl!}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md transition-colors"
                                    >
                                        Open in New Tab <ExternalLink size={10} />
                                    </a>
                                )}
                            </div>
                            <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl overflow-hidden flex items-center justify-center min-h-[250px] relative">
                                {imageUrl ? (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-100/50">
                                        {(() => {
                                            const lowerUrl = imageUrl?.toLowerCase() || '';
                                            const lowerPath = transaction.receiptUrl?.toLowerCase() || '';
                                            const isPdf = lowerUrl.includes('.pdf') || lowerPath.endsWith('.pdf') || lowerUrl.includes('application/pdf');

                                            if (isPdf) {
                                                return (
                                                    <div className="w-full h-full relative group">
                                                        {/* Overlay div to capture click on iframe for zoom */}
                                                        <div
                                                            className="absolute inset-0 z-20 cursor-zoom-in group-hover:bg-slate-900/5 transition-colors"
                                                            onClick={() => setIsZoomed(true)}
                                                            title="Click to Zoom PDF"
                                                        />
                                                        <iframe
                                                            src={`${imageUrl}#toolbar=0`}
                                                            className="w-full h-full border-0"
                                                            title="Receipt PDF"
                                                        />
                                                    </div>
                                                );
                                            }

                                            // Default to Image View for everything else
                                            if (imageError) {
                                                return (
                                                    <div className="flex flex-col items-center justify-center text-slate-500 p-4">
                                                        <FileText size={48} className="mb-2 text-slate-400" />
                                                        <p className="font-bold text-sm">Preview Unavailable</p>
                                                        <p className="text-xs text-slate-400 mb-3">Format not supported or file missing</p>
                                                        <a
                                                            href={imageUrl}
                                                            download
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors font-bold text-sm"
                                                        >
                                                            <Download size={16} /> Download File
                                                        </a>
                                                    </div>
                                                );
                                            }

                                            return (
                                                <div
                                                    className="w-full h-full flex items-center justify-center cursor-zoom-in relative group transition-all hover:bg-slate-100"
                                                    onClick={() => setIsZoomed(true)}
                                                    title="Click to Zoom Image"
                                                >
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-slate-900/10 transition-colors flex items-center justify-center z-10 pointer-events-none">
                                                        <ZoomIn className="text-slate-800 opacity-0 group-hover:opacity-100 drop-shadow-md transition-opacity duration-200" size={32} />
                                                    </div>
                                                    <img
                                                        src={imageUrl}
                                                        alt="Receipt"
                                                        className="max-w-full max-h-full object-contain p-2"
                                                        onError={() => setImageError(true)}
                                                    />
                                                </div>
                                            );
                                        })()}
                                    </div>
                                ) : (
                                    <div className="text-center p-6 flex flex-col items-center">
                                        {transaction.receiptUrl && imageError ? (
                                            <>
                                                <ImageOff size={48} className="text-rose-200 mb-2" />
                                                <p className="text-rose-400 text-sm font-medium">Image Unavailable</p>
                                                <p className="text-xs text-rose-300 mt-1">File data is invalid or expired</p>
                                            </>
                                        ) : (
                                            <>
                                                <FileText size={48} className="text-slate-200 mb-2" />
                                                <p className="text-slate-400 text-sm font-medium">No Receipt Attached</p>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Debug Info */}
                        <div className="mt-4 p-2 bg-slate-100 rounded text-[10px] text-slate-500 font-mono break-all">
                            <p>DEBUG PATH: {transaction.receiptUrl || 'No URL'}</p>
                            {debugError && <p className="text-red-500 mt-1">ERROR: {debugError}</p>}
                            <p className="mt-1 text-slate-400">
                                ENV: URL_HOST={(() => { try { return new URL(import.meta.env.VITE_SUPABASE_URL).hostname } catch (e) { return 'INVALID' } })()},
                                KeySet={!!import.meta.env.VITE_SUPABASE_ANON_KEY}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
