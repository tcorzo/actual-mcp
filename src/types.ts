// Type definitions for Actual Budget API
export type { Account, Transaction, Category, CategoryGroup, Payee } from './core/types/domain.js';
import { z } from 'zod';
import { ToolSchema } from '@modelcontextprotocol/sdk/types.js';

const _ToolInputSchema = ToolSchema.shape.inputSchema;
export type ToolInput = z.infer<typeof _ToolInputSchema>;

export interface BudgetFile {
  id?: string;
  cloudFileId?: string;
  name: string;
}

// Type definitions for tool arguments
export const GetTransactionsArgsSchema = z.object({
  accountId: z.string(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.number().optional(),
  maxAmount: z.number().optional(),
  categoryName: z.string().optional(),
  payeeName: z.string().optional(),
  limit: z.number().optional(),
});

export type GetTransactionsArgs = z.infer<typeof GetTransactionsArgsSchema>;

export const SpendingByCategoryArgsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  accountId: z.string().optional(),
  includeIncome: z.boolean().optional(),
});

export type SpendingByCategoryArgs = z.infer<typeof SpendingByCategoryArgsSchema>;

export const MonthlySummaryArgsSchema = z.object({
  months: z.number().optional().default(3),
  accountId: z.string().optional(),
});

export type MonthlySummaryArgs = z.infer<typeof MonthlySummaryArgsSchema>;

export const BalanceHistoryArgsSchema = z.object({
  accountId: z.string(),
  includeOffBudget: z.boolean().optional().default(false),
  months: z.number().optional().default(3),
});

export type BalanceHistoryArgs = z.infer<typeof BalanceHistoryArgsSchema>;

export const FinancialInsightsArgsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type FinancialInsightsArgs = z.infer<typeof FinancialInsightsArgsSchema>;

export const BudgetReviewArgsSchema = z.object({
  months: z.number().optional().default(3),
});

export type BudgetReviewArgs = z.infer<typeof BudgetReviewArgsSchema>;

export const UpdateTransactionArgsSchema = z.object({
  transactionId: z.string(),
  categoryId: z.string().optional(),
  payeeId: z.string().optional(),
  notes: z.string().optional(),
  amount: z.number().optional(),
});

export type UpdateTransactionArgs = z.infer<typeof UpdateTransactionArgsSchema>;

export const ImportTransactionsArgsSchema = z.object({
  accountId: z.string().describe('The ID of the account to import transactions into'),
  transactions: z
    .array(
      z.object({
        date: z.string().describe('Transaction date in YYYY-MM-DD format'),
        amount: z.number().describe('Transaction amount in cents (negative for expenses, positive for income)'),
        payee_name: z.string().optional().describe('Name of the payee'),
        imported_payee: z.string().optional().describe('Original payee name from import source'),
        notes: z.string().optional().describe('Transaction notes'),
        imported_id: z.string().optional().describe('Unique identifier from import source to prevent duplicates'),
        cleared: z.boolean().optional().describe('Whether the transaction is cleared'),
        category: z.string().optional().describe('Category ID for the transaction'),
      })
    )
    .describe('Array of transactions to import'),
});

export type ImportTransactionsArgs = z.infer<typeof ImportTransactionsArgsSchema>;

// Additional types used in implementation
export interface CategoryGroupInfo {
  id: string;
  name: string;
  isIncome: boolean;
  isSavingsOrInvestment: boolean;
}

export interface CategorySpending {
  name: string;
  group: string;
  isIncome: boolean;
  total: number;
  transactions: number;
}

export interface GroupSpending {
  name: string;
  total: number;
  categories: CategorySpending[];
}

export interface MonthData {
  year: number;
  month: number;
  income: number;
  expenses: number;
  investments: number;
  transactions: number;
}

export interface MonthBalance {
  year: number;
  month: number;
  balance: number;
  transactions: number;
}
