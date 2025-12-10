
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, BookOpen, UserCircle, LogOut, PlusCircle, Users, Check, X, Shield, Settings, ChevronRight, Download, Search, Bell, Book, PieChart, Banknote, FileText, CalendarClock } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TransactionForm } from './components/TransactionForm';
import { StaffPortal } from './components/StaffPortal';
import { Login } from './components/Login';
import { SignUp } from './components/SignUp';
import { ProfileSettings } from './components/ProfileSettings';
import { UserDetail } from './components/UserDetail';
import { GeneralLedger } from './components/GeneralLedger';
import { Reports } from './components/Reports';
import { Recurring } from './components/Recurring';
import { Toast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Transaction, Claim, AdvanceRequest, UserRole, UserRequest, UserCredential, RecurringTransaction } from './types';
import { supabase } from './lib/supabaseClient';
import { fetchTransactions, createTransaction, fetchClaims, createClaim, updateClaimStatus, fetchProfiles, getCurrentProfile } from './services/dbService';

interface Notification {
  message: string;
  type: 'success' | 'info';
}

const App: React.FC = () => {
  const [user, setUser] = useState<UserCredential | null>(null);
  const [view, setView] = useState<'DASHBOARD' | 'TRANSACTIONS' | 'LEDGER' | 'REPORTS' | 'RECURRING' | 'REQUESTS' | 'TEAM' | 'STAFF_PORTAL'>('DASHBOARD');
  const [adminRequestTab, setAdminRequestTab] = useState<'CLAIMS' | 'ADVANCE'>('CLAIMS');
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserCredential | null>(null);
  const [requestToReject, setRequestToReject] = useState<string | null>(null);

  // Data State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [advances, setAdvances] = useState<AdvanceRequest[]>([]);
  const [users, setUsers] = useState<UserCredential[]>([]);
  const [pendingRequests, setPendingRequests] = useState<UserRequest[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);

  const showToast = (message: string, type: 'success' | 'info' = 'info') => {
    setNotification({ message, type });
  };

  // --- SUPABASE INITIALIZATION ---
  useEffect(() => {
    const initSession = async () => {
      const profile = await getCurrentProfile();
      if (profile) {
        if (!profile.isActive) {
           showToast("Account is deactivated. Contact administrator.", 'info');
           await supabase.auth.signOut();
           return;
        }
        setUser(profile);
        if (profile.role === 'ADMIN' || profile.role === 'MANAGER') {
            setView('DASHBOARD');
        } else {
            setView('STAFF_PORTAL');
        }
      }
    };
    initSession();
  }, []);

  // Fetch Data when User logs in
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [txs, cls, profiles] = await Promise.all([
        fetchTransactions(),
        fetchClaims(),
        fetchProfiles()
      ]);
      setTransactions(txs);
      setClaims(cls);
      setUsers(profiles);
      // setAdvances() - Implement similar fetch logic for advances/recurring
    } catch (error) {
      console.error("Error loading data:", error);
      showToast("Failed to load latest data", "info");
    }
  };

  const handleLogin = async (email: string, password?: string): Promise<string | void> => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password || ''
    });

    if (error) return error.message;

    const profile = await getCurrentProfile();
    if (profile) {
        if (profile.isActive === false) {
             await supabase.auth.signOut();
             return "Account pending approval or deactivated.";
        }
        setUser(profile);
        if (profile.role === 'ADMIN' || profile.role === 'MANAGER') setView('DASHBOARD');
        else setView('STAFF_PORTAL');
        showToast(`Welcome back, ${profile.name}!`, 'success');
    } else {
        return "Profile not found.";
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setView('DASHBOARD');
    setIsSignUpMode(false);
    setShowProfileSettings(false);
    setSelectedUser(null);
  };

  const addTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    try {
        const created = await createTransaction({
            ...newTx,
            createdBy: user?.name || 'Unknown'
        });
        if (created) {
            await loadData(); // Refresh list
            showToast('Transaction recorded successfully', 'success');
        }
    } catch (e) {
        console.error(e);
        showToast('Failed to save transaction', 'info');
    }
  };

  const addClaim = async (newClaim: Omit<Claim, 'id' | 'status'>) => {
    try {
        await createClaim(newClaim);
        await loadData();
        showToast('Claim submitted for approval', 'success');
    } catch(e) { showToast('Error submitting claim', 'info'); }
  };
  
  // Placeholder implementations for UI compatibility
  const approveClaim = async (id: string) => {
      await updateClaimStatus(id, 'APPROVED');
      await loadData();
      showToast('Claim approved', 'success');
  };
  const rejectClaim = async (id: string) => {
      await updateClaimStatus(id, 'REJECTED');
      await loadData();
      showToast('Claim rejected', 'info');
  };

  // Functions below would need DB implementation similar to transactions/claims
  const addAdvance = (val: any) => { setAdvances(p => [...p, {...val, id: Date.now().toString(), status: 'PENDING'}]); showToast('Added (Local Only)', 'success'); };
  const approveAdvance = (id: string) => { setAdvances(p => p.map(a => a.id === id ? {...a, status: 'APPROVED'} : a)); };
  const rejectAdvance = (id: string) => { setAdvances(p => p.map(a => a.id === id ? {...a, status: 'REJECTED'} : a)); };
  
  const handleSignUp = (data: any) => { /* Handled in SignUp component */ };
  
  const approveUser = (id: string) => {}; // Implement update profile
  const rejectUser = (id: string) => {}; // Implement delete profile
  const toggleUserStatus = (username: string) => {}; // Implement update profile
  const updateUserRole = (username: string, role: UserRole) => {}; // Implement update profile
  const handleUpdateProfile = (u: UserCredential) => { setUser(u); };

  const addRecurringRule = (r: any) => setRecurringTransactions(p => [...p, {...r, id: Date.now().toString()}]);
  const deleteRecurringRule = (id: string) => setRecurringTransactions(p => p.filter(r => r.id !== id));
  const toggleRecurringStatus = (id: string) => setRecurringTransactions(p => p.map(r => r.id === id ? {...r, active: !r.active} : r));
  const runRecurringNow = (id: string) => {};
  
  const exportToCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['ID', 'Date', 'Description', 'Type', 'Category', 'Amount (RM)', 'Currency', 'Orig. Amount', 'Ex. Rate', 'Created By'];
    const csvContent = [headers.join(','), ...transactions.map(t => [t.id, t.date, `"${t.description.replace(/"/g, '""')}"`, t.type, t.category, t.amount, t.currency || 'RM', t.originalAmount || t.amount, t.exchangeRate || 1.0, `"${t.createdBy}"`].join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `arkalliance_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const NavItem = ({ label, icon: Icon, active, onClick }: { label: string, icon: any, active: boolean, onClick: () => void }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <Icon size={20} className={active ? 'text-indigo-200' : ''} />
      {label}
    </button>
  );

  return (
    <>
      {notification && <Toast message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      <ConfirmDialog 
        isOpen={!!requestToReject}
        title="Reject Request?"
        message="Are you sure you want to reject this access request? The user will need to sign up again."
        confirmText="Reject"
        onConfirm={() => {
            if (requestToReject) {
                rejectUser(requestToReject);
                setRequestToReject(null);
            }
        }}
        onCancel={() => setRequestToReject(null)}
      />

      {!user ? (
        isSignUpMode ? <SignUp onSignUp={handleSignUp} onBack={() => setIsSignUpMode(false)} /> : <Login onLogin={handleLogin} onSignUpClick={() => setIsSignUpMode(true)} />
      ) : (
        <div className="flex h-screen bg-slate-50 font-sans">
          <aside className="w-72 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col relative z-20 shadow-xl">
            <div className="p-8 pb-4">
              <div className="flex items-center gap-3 text-white mb-2">
                <div className="bg-gradient-to-tr from-indigo-500 to-violet-500 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-500/30">
                  <Shield size={24} fill="currentColor" className="text-white/90" />
                </div>
                <div><span className="text-xl font-bold tracking-tight block leading-tight">ArkAlliance</span><span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Financial Suite</span></div>
              </div>
            </div>
            <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {/* ADMIN & MANAGER - Shared Main Menu */}
              {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                <>
                  <div className="px-4 pb-2"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Main Menu</p></div>
                  <NavItem label="Overview" icon={LayoutDashboard} active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} />
                  <NavItem label="Transactions" icon={Receipt} active={view === 'TRANSACTIONS'} onClick={() => setView('TRANSACTIONS')} />
                  <NavItem label="Recurring" icon={CalendarClock} active={view === 'RECURRING'} onClick={() => setView('RECURRING')} />
                  <NavItem label="General Ledger" icon={Book} active={view === 'LEDGER'} onClick={() => setView('LEDGER')} />
                  <NavItem label="Reports" icon={PieChart} active={view === 'REPORTS'} onClick={() => setView('REPORTS')} />
                </>
              )}

              {/* ADMIN ONLY - Management */}
              {user.role === 'ADMIN' && (
                <>
                  <div className="px-4 pb-2 pt-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Management</p></div>
                  <NavItem label="Staff Requests" icon={UserCircle} active={view === 'REQUESTS'} onClick={() => setView('REQUESTS')} />
                  <NavItem label="Team Access" icon={Users} active={view === 'TEAM'} onClick={() => setView('TEAM')} />
                </>
              )}
               {/* MANAGER - Read Only Access to Team */}
               {user.role === 'MANAGER' && (
                  <>
                    <div className="px-4 pb-2 pt-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Management</p></div>
                    <NavItem label="Team Overview" icon={Users} active={view === 'TEAM'} onClick={() => setView('TEAM')} />
                  </>
               )}

              {/* STAFF & MANAGER - Personal Portal */}
              {(user.role === 'STAFF' || user.role === 'MANAGER') && (
                 <>
                  {(user.role === 'MANAGER' || user.role === 'ADMIN') && <div className="px-4 pb-2 pt-4"><p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Personal</p></div>}
                  <NavItem label="My Staff Portal" icon={UserCircle} active={view === 'STAFF_PORTAL'} onClick={() => setView('STAFF_PORTAL')} />
                 </>
              )}
            </div>
            <div className="p-4 bg-slate-950/30 border-t border-slate-800">
              <div className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-800 rounded-xl transition-colors group mb-2" onClick={() => setShowProfileSettings(true)}>
                 <div className="h-9 w-9 rounded-full bg-slate-700 border-2 border-slate-600 flex items-center justify-center text-slate-300 overflow-hidden shrink-0">
                     {user.avatarUrl ? <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" /> : <span className="font-bold uppercase text-xs">{user.name.charAt(0)}</span>}
                 </div>
                 <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-slate-200 truncate">{user.name}</p><p className="text-xs text-slate-500 truncate capitalize">{user.role.toLowerCase()}</p></div>
                 <Settings size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <button onClick={handleLogout} className="flex items-center justify-center gap-2 text-rose-400/80 hover:text-rose-400 hover:bg-rose-950/20 px-2 text-xs font-bold uppercase tracking-wide w-full py-2.5 rounded-lg transition-all"><LogOut size={14} /> Sign Out</button>
            </div>
          </aside>

          <main className="flex-1 overflow-y-auto flex flex-col relative">
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
              <div className="flex items-center gap-4">
                  <h1 className="text-xl font-bold text-slate-800 tracking-tight">
                    {view === 'DASHBOARD' ? 'Company Overview' : 
                     view === 'TRANSACTIONS' ? 'Journal Entries' : 
                     view === 'RECURRING' ? 'Recurring Transactions' : 
                     view === 'LEDGER' ? 'General Ledger' : 
                     view === 'REPORTS' ? 'Financial Reports' : 
                     view === 'TEAM' ? 'Team Management' : 
                     view === 'REQUESTS' ? 'Staff Requests' : 'Staff Portal'}
                  </h1>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                  {(user.role === 'ADMIN' || user.role === 'MANAGER') && view !== 'TEAM' && view !== 'REPORTS' && view !== 'STAFF_PORTAL' && (
                      <button onClick={exportToCSV} className="hidden sm:flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-semibold transition-colors px-3 py-2 hover:bg-slate-50 rounded-lg"><Download size={18} /> Export CSV</button>
                  )}
                  <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors">
                      <Bell size={20} />
                      {user.role === 'ADMIN' && (claims.some(c => c.status === 'PENDING') || advances.some(a => a.status === 'PENDING')) && <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>}
                  </button>

                  <button 
                    onClick={handleLogout} 
                    className="md:hidden p-2 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-rose-50"
                    title="Sign Out"
                  >
                    <LogOut size={20} />
                  </button>

                  {/* New Entry Button - Only for Admin */}
                  {user.role === 'ADMIN' && view !== 'REQUESTS' && view !== 'TEAM' && view !== 'REPORTS' && view !== 'RECURRING' && view !== 'STAFF_PORTAL' && (
                    <button onClick={() => setShowTransactionForm(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 md:px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-0.5 transition-all">
                        <PlusCircle size={18} />
                        <span className="hidden sm:inline">New Entry</span>
                    </button>
                  )}
              </div>
            </header>

            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
              {/* Shared Admin/Manager Views */}
              {['ADMIN', 'MANAGER'].includes(user.role) && view === 'DASHBOARD' && <Dashboard transactions={transactions} userName={user.name} />}
              {['ADMIN', 'MANAGER'].includes(user.role) && view === 'LEDGER' && <GeneralLedger transactions={transactions} />}
              {['ADMIN', 'MANAGER'].includes(user.role) && view === 'REPORTS' && <Reports transactions={transactions} />}
              {['ADMIN', 'MANAGER'].includes(user.role) && view === 'RECURRING' && (
                  <Recurring 
                    rules={recurringTransactions} 
                    onAddRule={addRecurringRule} 
                    onDeleteRule={deleteRecurringRule} 
                    onToggleStatus={toggleRecurringStatus}
                    onRunNow={runRecurringNow}
                    readOnly={user.role === 'MANAGER'}
                  />
              )}
              {['ADMIN', 'MANAGER'].includes(user.role) && view === 'TRANSACTIONS' && (
                 <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex gap-4">
                        <div className="relative flex-1"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><input type="text" placeholder="Search transactions..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" /></div>
                    </div>
                    
                    <div className="md:hidden divide-y divide-slate-100">
                        {transactions.slice().reverse().map(t => (
                            <div key={t.id} className="p-5 flex flex-col gap-2 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-slate-800 leading-tight">{t.description}</p>
                                        <p className="text-xs text-slate-500 mt-1 font-medium">{t.date} • {t.createdBy}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className={`font-bold ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                            {t.type === 'CREDIT' ? '+' : '-'}RM {t.amount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-600">{t.category}</span>
                                    {t.currency && t.currency !== 'RM' && (
                                        <span className="text-xs text-slate-400">{t.currency} {t.originalAmount.toFixed(2)}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600">
                            <thead className="bg-slate-50/75 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Date</th><th className="px-6 py-4">Description</th><th className="px-6 py-4">Category</th><th className="px-6 py-4">Recorded By</th><th className="px-6 py-4 text-right">Amount (RM)</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                            {transactions.slice().reverse().map(t => (
                                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4 font-medium text-slate-500">{t.date}</td><td className="px-6 py-4 font-semibold text-slate-800">{t.description}</td><td className="px-6 py-4"><span className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-md text-xs font-medium text-slate-600">{t.category}</span></td><td className="px-6 py-4 text-slate-400 text-xs">{t.createdBy}</td>
                                    <td className={`px-6 py-4 text-right`}><div className={`font-bold ${t.type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-800'}`}>{t.type === 'CREDIT' ? '+' : '-'}RM {t.amount.toFixed(2)}</div></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                 </div>
              )}
              
              {(user.role === 'ADMIN' || user.role === 'MANAGER') && view === 'TEAM' && (
                  <div className="space-y-8">
                      {user.role === 'ADMIN' && (
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">Access Requests {pendingRequests.length > 0 && <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full">{pendingRequests.length}</span>}</h3>
                            {pendingRequests.length === 0 ? <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center"><p className="text-slate-400 text-sm font-medium">No pending account requests.</p></div> : (
                                <div className="grid gap-4">{pendingRequests.map(req => (<div key={req.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg">?</div><div><p className="font-bold text-slate-800">{req.name}</p><p className="text-sm text-slate-500 font-medium">@{req.username} • Requested {req.date}</p></div></div><div className="flex gap-3 w-full md:w-auto"><button onClick={() => approveUser(req.id)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-sm font-bold transition-colors"><Check size={18} /> Approve</button><button onClick={() => setRequestToReject(req.id)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-sm font-bold transition-colors"><X size={18} /> Reject</button></div></div>))}</div>
                            )}
                        </div>
                      )}

                      <div>
                          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Active Members</h3>
                          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                              <div className="md:hidden divide-y divide-slate-100">
                                {users.map((u, idx) => (
                                    <div key={idx} onClick={() => user.role === 'ADMIN' && setSelectedUser(u)} className={`p-5 flex items-center justify-between transition-colors ${user.role === 'ADMIN' ? 'hover:bg-slate-50 cursor-pointer active:bg-slate-100' : ''}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold overflow-hidden shadow-sm shrink-0">
                                                {u.avatarUrl ? <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 leading-tight">{u.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-500 font-medium">@{u.username}</span>
                                                    <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wide ${u.role === 'ADMIN' ? 'text-indigo-600' : 'text-slate-500'}`}>{u.role}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                            {user.role === 'ADMIN' && <ChevronRight size={18} className="text-slate-300" />}
                                        </div>
                                    </div>
                                ))}
                              </div>

                              <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-sm text-slate-600">
                                    <thead className="bg-slate-50/75 text-slate-500 font-semibold text-xs uppercase tracking-wider"><tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Username</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Action</th></tr></thead>
                                    <tbody className="divide-y divide-slate-100">{users.map((u, idx) => (<tr key={idx} onClick={() => user.role === 'ADMIN' && setSelectedUser(u)} className={`transition-colors ${user.role === 'ADMIN' ? 'hover:bg-slate-50 cursor-pointer group' : ''}`}><td className="px-6 py-4 font-medium text-slate-800 flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 text-xs font-bold overflow-hidden shadow-sm">{u.avatarUrl ? <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}</div><div><p className="font-bold">{u.name}</p></div></td><td className="px-6 py-4 text-slate-500">@{u.username}</td><td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : u.role === 'MANAGER' ? 'bg-purple-50 text-purple-700 border-purple-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{u.role}</span></td><td className="px-6 py-4"><span className={`flex items-center gap-1.5 text-xs font-bold ${u.isActive !== false ? 'text-emerald-600' : 'text-rose-600'}`}><div className={`w-1.5 h-1.5 rounded-full ${u.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>{u.isActive !== false ? 'Active' : 'Inactive'}</span></td><td className="px-6 py-4 text-slate-400">{user.role === 'ADMIN' && <ChevronRight size={18} className="group-hover:text-indigo-600 transition-colors" />}</td></tr>))}</tbody>
                                </table>
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {user.role === 'ADMIN' && view === 'REQUESTS' && (
                 <div className="space-y-6">
                     <div className="flex gap-2 border-b border-slate-200 pb-2">
                        <button onClick={() => setAdminRequestTab('CLAIMS')} className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${adminRequestTab === 'CLAIMS' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}>Expense Claims</button>
                        <button onClick={() => setAdminRequestTab('ADVANCE')} className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${adminRequestTab === 'ADVANCE' ? 'bg-emerald-50 text-emerald-600' : 'text-slate-500 hover:bg-slate-50'}`}>Cash Advances</button>
                     </div>

                     {adminRequestTab === 'CLAIMS' ? (
                        <>
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Pending Approvals</h3>
                                {claims.filter(c => c.status === 'PENDING').length === 0 ? <div className="p-12 text-center bg-white rounded-2xl border border-slate-100 text-slate-400"><div className="inline-flex p-4 bg-slate-50 rounded-full mb-3 text-slate-300"><Check size={32} /></div><p className="font-medium">No pending claims.</p></div> : (
                                    <div className="grid gap-4">{claims.filter(c => c.status === 'PENDING').map(claim => (<div key={claim.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between group hover:shadow-md transition-all gap-4"><div className="flex items-center gap-4"><div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">{claim.employeeName.charAt(0)}</div><div><p className="font-bold text-slate-800 text-lg">{claim.description}</p><div className="flex items-center gap-2 text-sm text-slate-500 font-medium mt-1"><span>{claim.employeeName}</span><span className="w-1 h-1 bg-slate-300 rounded-full"></span><span>{claim.date}</span><span className="w-1 h-1 bg-slate-300 rounded-full"></span><span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{claim.category}</span></div></div></div><div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto"><div className="text-right"><span className="text-xl font-bold text-slate-800 block">RM {claim.amount.toFixed(2)}</span></div><div className="flex gap-2"><button onClick={() => approveClaim(claim.id)} className="px-4 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl text-sm font-bold transition-colors">Approve</button><button onClick={() => rejectClaim(claim.id)} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-sm font-bold transition-colors">Reject</button></div></div></div>))}</div>
                                )}
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-8 mb-4">History</h3>
                                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="md:hidden divide-y divide-slate-100">
                                        {claims.filter(c => c.status !== 'PENDING').map(c => (
                                            <div key={c.id} className="p-5 flex flex-col gap-2">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{c.description}</p>
                                                        <p className="text-xs text-slate-500 font-medium mt-0.5">{c.date} • {c.employeeName}</p>
                                                    </div>
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${c.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{c.status}</span>
                                                </div>
                                                <p className="text-right font-bold text-slate-700">RM {c.amount.toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left text-sm text-slate-600"><thead className="bg-slate-50/75 text-slate-500 font-semibold text-xs uppercase tracking-wider"><tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Employee</th><th className="px-6 py-4">Description</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Amount (RM)</th></tr></thead><tbody className="divide-y divide-slate-100">{claims.filter(c => c.status !== 'PENDING').map(c => (<tr key={c.id}><td className="px-6 py-4 font-medium text-slate-500">{c.date}</td><td className="px-6 py-4 font-semibold text-slate-800">{c.employeeName}</td><td className="px-6 py-4">{c.description}</td><td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-md text-xs font-bold ${c.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>{c.status}</span></td><td className="px-6 py-4 text-right"><div className="font-bold text-slate-700">RM {c.amount.toFixed(2)}</div></td></tr>))}</tbody></table>
                                    </div>
                                </div>
                            </div>
                        </>
                     ) : (
                        <div>
                             <p className="text-center text-slate-400 py-8">Advance Requests integration pending DB setup...</p>
                        </div>
                     )}
                 </div>
              )}

              {/* Shared Staff Portal for Staff and Managers */}
              {(user.role === 'STAFF' || (user.role === 'MANAGER' && view === 'STAFF_PORTAL')) && (
                  <StaffPortal 
                    claims={claims.filter(c => c.employeeName === user.name)} 
                    advances={advances.filter(a => a.employeeName === user.name)}
                    currentUser={user.name} 
                    onAddClaim={addClaim} 
                    onAddAdvance={addAdvance}
                  />
              )}
            </div>

            {showTransactionForm && <TransactionForm onAddTransaction={addTransaction} onClose={() => setShowTransactionForm(false)} />}
            {showProfileSettings && <ProfileSettings user={user} onSave={handleUpdateProfile} onClose={() => setShowProfileSettings(false)} />}
            {selectedUser && <UserDetail user={selectedUser} currentUser={user} transactions={transactions} claims={claims} onClose={() => setSelectedUser(null)} onUpdateRole={updateUserRole} onToggleStatus={toggleUserStatus} />}
          </main>
        </div>
      )}
    </>
  );
};

export default App;
