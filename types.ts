
export type TransactionType = 'CREDIT' | 'DEBIT';
export type ClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SETTLED';
export type UserRole = 'ADMIN' | 'STAFF' | 'MANAGER';

export const CURRENCIES = ['RM', 'USD', 'SGD', 'EUR', 'GBP', 'AUD', 'JPY', 'CNY', 'IDR', 'THB'];

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number; // This is always the Base Currency (RM) value
  type: TransactionType;
  category: string;
  receiptUrl?: string;
  createdBy: string;
  // Multi-currency support
  currency: string;
  originalAmount: number;
  exchangeRate: number;
}

export interface Claim {
  id: string;
  employeeName: string;
  date: string;
  description: string;
  amount: number; // Base Currency (RM)
  category: string;
  status: ClaimStatus;
  receiptUrl?: string;
  justification?: string;
  // Multi-currency support
  currency: string;
  originalAmount: number;
  exchangeRate: number;
}

export interface AdvanceRequest {
  id: string;
  employeeName: string;
  requestDate: string;
  amount: number;
  purpose: string;
  expectedSettlementDate: string;
  status: ClaimStatus;
  // Multi-currency support
  currency: string;
  originalAmount: number;
  exchangeRate: number;
}

export interface ReceiptData {
  merchant?: string;
  date?: string;
  amount?: number;
  category?: string;
  items?: string[];
  currency?: string;
}

export interface UserCredential {
  username: string;
  password?: string;
  name: string;
  role: UserRole;
  isActive?: boolean;
  email?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
}

export interface UserRequest {
  id: string;
  username: string;
  password?: string;
  name: string;
  date: string;
}

export interface Contact {
  id: string;
  name: string;
  type: 'VENDOR' | 'CLIENT';
  email?: string;
  phone?: string;
  currency?: string;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  frequency: 'MONTHLY' | 'WEEKLY';
  nextDueDate: string;
  active: boolean;
  category: string;
  currency: string;
  originalAmount: number;
  exchangeRate: number;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  performedBy: string;
  details: string;
}

export const CATEGORIES = [
  'Sales', 'Services', 'Rent', 'Utilities', 'Salaries', 'Supplies', 'Travel', 'Meals', 'Software', 'Advance', 'Other'
];
