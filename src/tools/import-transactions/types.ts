/**
 * Type definitions for import-transactions tool
 */

export interface ImportTransactionInput {
  date: string;
  amount: number;
  payee_name?: string;
  imported_payee?: string;
  notes?: string;
  imported_id?: string;
  cleared?: boolean;
  category?: string;
}

export interface ImportTransactionsResult {
  added: string[];
  updated: string[];
  errors?: Array<{ message: string }>;
}
