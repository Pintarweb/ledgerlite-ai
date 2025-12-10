
import React, { useMemo, useState } from 'react';
import { UserCredential, Transaction, Claim, UserRole } from '../types';
import { X, User, Mail, Phone, Shield, Power, History, FileText, Ban, CheckCircle } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface UserDetailProps {
  user: UserCredential;
  currentUser: UserCredential; // The logged-in admin or manager
  transactions: Transaction[];
  claims: Claim[];
  onClose: () => void;
  onUpdateRole: (username: string, role: UserRole) => void;
  onToggleStatus: (username: string) => void;
}

export const UserDetail: React.FC<UserDetailProps> = ({ 
  user, 
  currentUser,
  transactions, 
  claims, 
  onClose, 
  onUpdateRole, 
  onToggleStatus 
}) => {
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // Combine and sort history
  const history = useMemo(() => {
    const userTx = transactions
      .filter(t => t.createdBy === user.name)
      .map(t => ({ ...t, itemType: 'TRANSACTION' as const }));
      
    const userClaims = claims
      .filter(c => c.employeeName === user.name)
      .map(c => ({ ...c, itemType: 'CLAIM' as const }));

    return [...userTx, ...userClaims].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [user.name, transactions, claims]);

  const isSelf = currentUser.username === user.username;
  const isAdmin = currentUser.role === 'ADMIN';

  const handleToggleStatusClick = () => {
    if (user.isActive !== false) {
      // If currently active, show confirmation to deactivate
      setShowDeactivateConfirm(true);
    } else {
      // If currently inactive, just activate
      onToggleStatus(user.username);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-end z-50 backdrop-blur-sm transition-all" onClick={onClose}>
      <ConfirmDialog
        isOpen={showDeactivateConfirm}
        title="Deactivate Account?"
        message={`Are you sure you want to deactivate ${user.name}? They will lose access to the platform immediately.`}
        confirmText="Deactivate"
        onConfirm={() => {
          onToggleStatus(user.username);
          setShowDeactivateConfirm(false);
        }}
        onCancel={() => setShowDeactivateConfirm(false)}
      />

      <div 
        className="h-full w-full max-w-2xl bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
          <div className="flex gap-6">
            <div className="relative">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-slate-300 text-2xl font-bold">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : user.name.charAt(0)}
                </div>
                <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-white ${user.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            </div>
            <div className="pt-2">
                <h2 className="text-2xl font-bold text-slate-800">{user.name}</h2>
                <p className="text-slate-500 font-medium">@{user.username}</p>
                <div className="flex gap-2 mt-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide border ${
                        user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                        user.role === 'MANAGER' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                        {user.role}
                    </span>
                    {user.isActive === false && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100">
                            INACTIVE
                        </span>
                    )}
                </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
            {/* Contact & Bio */}
            <div className="p-8 border-b border-slate-100 grid grid-cols-2 gap-6">
                <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Contact Info</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-600">
                            <Mail size={18} className="text-slate-400" />
                            <span>{user.email || 'No email provided'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-600">
                            <Phone size={18} className="text-slate-400" />
                            <span>{user.phone || 'No phone provided'}</span>
                        </div>
                    </div>
                </div>
                <div>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">About</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">
                        {user.bio || 'No bio available for this user.'}
                    </p>
                </div>
            </div>

            {/* Admin Controls - Hidden for Managers or Self */}
            {isAdmin && !isSelf && (
                <div className="p-8 bg-slate-50 border-b border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Account Actions</h3>
                    <div className="flex flex-col gap-4">
                        
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-slate-700">Assign Role</span>
                            <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                                <button
                                    onClick={() => onUpdateRole(user.username, 'STAFF')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${user.role === 'STAFF' ? 'bg-slate-100 text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Staff
                                </button>
                                <button
                                    onClick={() => onUpdateRole(user.username, 'MANAGER')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${user.role === 'MANAGER' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Manager
                                </button>
                                <button
                                    onClick={() => onUpdateRole(user.username, 'ADMIN')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${user.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Admin
                                </button>
                            </div>
                        </div>
                        
                        <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
                            <div>
                                <p className="text-sm font-bold text-slate-800">Employment Status</p>
                                <p className="text-xs text-slate-500">Deactivating will revoke login access immediately.</p>
                            </div>
                            <button
                                onClick={handleToggleStatusClick}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border transition-colors ${
                                    user.isActive !== false 
                                    ? 'border-rose-200 text-rose-600 hover:bg-rose-50' 
                                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 bg-white'
                                }`}
                            >
                                {user.isActive !== false ? <Ban size={16} /> : <CheckCircle size={16} />}
                                {user.isActive !== false ? 'Deactivate Account' : 'Activate Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* History */}
            <div className="p-8">
                <div className="flex items-center gap-2 mb-6">
                    <History size={20} className="text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-800">Recent Activity</h3>
                </div>

                <div className="space-y-4">
                    {history.length > 0 ? (
                        history.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:shadow-sm transition-all bg-white group">
                                <div className="flex items-center gap-4">
                                    <div className={`p-2.5 rounded-lg ${item.itemType === 'CLAIM' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>
                                        {item.itemType === 'CLAIM' ? <User size={20} /> : <FileText size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                            {item.description}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <span>{item.date}</span>
                                            <span>•</span>
                                            <span className="capitalize">{item.category}</span>
                                            <span>•</span>
                                            <span className="font-medium bg-slate-50 px-1.5 py-0.5 rounded text-slate-500">
                                                {item.itemType === 'CLAIM' ? 'Claim Request' : 'Journal Entry'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${
                                        item.itemType === 'TRANSACTION' 
                                            ? ((item as Transaction).type === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600')
                                            : 'text-slate-800'
                                    }`}>
                                        {item.itemType === 'TRANSACTION' && (item as Transaction).type === 'CREDIT' ? '+' : '-'}${item.amount.toFixed(2)}
                                    </p>
                                    {item.itemType === 'CLAIM' && (
                                        <span className={`text-xs font-bold uppercase ${(item as Claim).status === 'APPROVED' ? 'text-emerald-500' : (item as Claim).status === 'REJECTED' ? 'text-rose-500' : 'text-amber-500'}`}>
                                            {(item as Claim).status}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                            <p className="text-slate-400">No activity recorded for this user.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
