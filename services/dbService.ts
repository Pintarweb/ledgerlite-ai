
import { supabase } from '../lib/supabaseClient';
import { Transaction, Claim, UserCredential, UserRole, AdvanceRequest } from '../types';

// --- TRANSACTIONS ---
export const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data.map((t: any) => ({
    ...t,
    originalAmount: t.original_amount,
    exchangeRate: t.exchange_rate,
    createdBy: t.created_by,
    receiptUrl: t.receipt_url
  })) as Transaction[];
};

export const createTransaction = async (transaction: Omit<Transaction, 'id'>) => {
  const { data, error } = await supabase.from('transactions').insert([{
    date: transaction.date,
    description: transaction.description,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    created_by: transaction.createdBy,
    currency: transaction.currency,
    original_amount: transaction.originalAmount,
    exchange_rate: transaction.exchangeRate,
    receipt_url: transaction.receiptUrl
  }]).select().single();
  
  if (error) throw error;
  return data;
};

// --- CLAIMS ---
export const fetchClaims = async (): Promise<Claim[]> => {
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .order('date', { ascending: false });

  if (error) throw error;
  return data.map((c: any) => ({
    ...c,
    employeeName: c.employee_name,
    originalAmount: c.original_amount,
    exchangeRate: c.exchange_rate,
    receiptUrl: c.receipt_url
  })) as Claim[];
};

export const createClaim = async (claim: Omit<Claim, 'id' | 'status'>) => {
  const { data, error } = await supabase.from('claims').insert([{
    date: claim.date,
    employee_name: claim.employeeName,
    description: claim.description,
    amount: claim.amount,
    category: claim.category,
    status: 'PENDING',
    currency: claim.currency,
    original_amount: claim.originalAmount,
    exchange_rate: claim.exchangeRate,
    receipt_url: claim.receiptUrl
  }]).select().single();

  if (error) throw error;
  return data;
};

export const updateClaimStatus = async (id: string, status: string) => {
  const { error } = await supabase.from('claims').update({ status }).eq('id', id);
  if (error) throw error;
};

// --- PROFILES / USERS ---
export const fetchProfiles = async (): Promise<UserCredential[]> => {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) throw error;
  
  return data.map((p: any) => ({
    username: p.username || p.email.split('@')[0],
    name: p.full_name || 'User',
    role: p.role as UserRole,
    email: p.email,
    isActive: p.is_active,
    avatarUrl: p.avatar_url,
    bio: p.bio,
    phone: p.phone
  }));
};

// --- AUTH HELPERS ---
export const getCurrentProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  if (profile) {
     return {
        username: profile.username,
        name: profile.full_name,
        role: profile.role,
        email: profile.email,
        isActive: profile.is_active,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        phone: profile.phone
     } as UserCredential;
  }
  return null;
};
