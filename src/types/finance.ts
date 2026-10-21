export type TransactionType = 'expense' | 'income' | 'transfer';

export type PaymentMethod = 'pix' | 'credit' | 'debit' | 'boleto' | 'cash' | 'transfer';

export type TransactionStatus = 'completed' | 'pending';

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  color: string;
  icon: string;
  monthlyBudget?: number;
}

export interface Account {
  id: string;
  name: string;
  type: 'checking' | 'cash' | 'credit' | 'savings' | 'investment';
  initialBalance: number;
  currentBalance: number;
  color: string;
  institution: string;
}

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: TransactionType;
  categoryId: string;
  accountId: string;
  toAccountId?: string; // only for transfers
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  installments?: {
    current: number;
    total: number;
    installmentGroupId?: string;
  };
  barcodeOrQrCode?: string;
  codeType?: 'danfe_nfce' | 'boleto' | 'pix' | 'ean13' | 'other';
  notes?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BudgetGoal {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  month: string; // YYYY-MM
}

export interface CloudBackupSnapshot {
  id: string;
  timestamp: string;
  device: string;
  transactionCount: number;
  accountCount: number;
  categoryCount: number;
  budgetCount: number;
  totalNetWorth: number;
  dataHash: string;
  cloudSyncKey?: string;
  payload: {
    transactions: Transaction[];
    accounts: Account[];
    categories: Category[];
    budgets: BudgetGoal[];
    version: string;
  };
}

export type CodeScannerType = 'danfe_nfce' | 'boleto' | 'pix' | 'ean13' | 'text';

export interface ParsedCodeResult {
  raw: string;
  format: string;
  codeType: CodeScannerType;
  extractedTitle: string;
  suggestedAmount: number | null;
  suggestedCategory: string | null;
  suggestedDate: string | null;
  suggestedPaymentMethod: PaymentMethod;
  suggestedType: TransactionType;
  extraDetails: Record<string, string>;
}
