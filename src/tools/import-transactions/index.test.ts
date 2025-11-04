import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler, schema } from './index.js';
import type { ImportTransactionsArgs } from '../../types.js';

// CRITICAL: Mock before imports
vi.mock('../../actual-api.js', () => ({
  initActualApi: vi.fn(),
  shutdownActualApi: vi.fn(),
}));

vi.mock('@actual-app/api', () => ({
  default: {
    importTransactions: vi.fn(),
  },
}));

import api from '@actual-app/api';
import { initActualApi } from '../../actual-api.js';

describe('import-transactions tool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('schema', () => {
    it('should have correct tool name', () => {
      expect(schema.name).toBe('import-transactions');
    });

    it('should have a description', () => {
      expect(schema.description).toBeTruthy();
      expect(schema.description).toContain('Import multiple transactions');
    });

    it('should have input schema', () => {
      expect(schema.inputSchema).toBeDefined();
    });
  });

  describe('handler', () => {
    it('should successfully import transactions and return results', async () => {
      const args: ImportTransactionsArgs = {
        accountId: 'account-123',
        transactions: [
          {
            date: '2024-01-15',
            amount: -5000,
            payee_name: 'Coffee Shop',
            notes: 'Morning coffee',
            imported_id: 'ext-001',
          },
          {
            date: '2024-01-16',
            amount: -10000,
            payee_name: 'Grocery Store',
            imported_id: 'ext-002',
          },
        ],
      };

      const mockResult = {
        added: ['tx-1', 'tx-2'],
        updated: [],
        errors: [],
      };

      vi.mocked(api.importTransactions).mockResolvedValue(mockResult);

      const result = await handler(args);

      expect(initActualApi).toHaveBeenCalledOnce();
      expect(api.importTransactions).toHaveBeenCalledWith('account-123', args.transactions);
      expect(result.content).toBeDefined();
      expect(result.content).toHaveLength(1);

      const content = result.content[0];
      if (content.type === 'text') {
        const parsed = JSON.parse(content.text);
        expect(parsed.added).toEqual(['tx-1', 'tx-2']);
        expect(parsed.updated).toEqual([]);
        expect(parsed.summary.totalAdded).toBe(2);
        expect(parsed.summary.totalUpdated).toBe(0);
        expect(parsed.summary.totalErrors).toBe(0);
      } else {
        throw new Error('Expected text content');
      }
    });

    it('should handle transactions with updates for duplicates', async () => {
      const args: ImportTransactionsArgs = {
        accountId: 'account-123',
        transactions: [
          {
            date: '2024-01-15',
            amount: -5000,
            payee_name: 'Coffee Shop',
            imported_id: 'ext-001',
          },
        ],
      };

      const mockResult = {
        added: [],
        updated: ['tx-existing'],
        errors: [],
      };

      vi.mocked(api.importTransactions).mockResolvedValue(mockResult);

      const result = await handler(args);

      expect(result.content).toBeDefined();
      expect(result.content).toHaveLength(1);

      const content = result.content[0];
      if (content.type === 'text') {
        const parsed = JSON.parse(content.text);
        expect(parsed.added).toEqual([]);
        expect(parsed.updated).toEqual(['tx-existing']);
        expect(parsed.summary.totalAdded).toBe(0);
        expect(parsed.summary.totalUpdated).toBe(1);
      } else {
        throw new Error('Expected text content');
      }
    });

    it('should handle empty transactions array', async () => {
      const args: ImportTransactionsArgs = {
        accountId: 'account-123',
        transactions: [],
      };

      const result = await handler(args);

      expect(result.isError).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toHaveLength(1);

      const content = result.content[0];
      if (content.type === 'text') {
        expect(content.text).toContain('No transactions provided');
      } else {
        throw new Error('Expected text content');
      }
    });

    it('should handle import errors from API', async () => {
      const args: ImportTransactionsArgs = {
        accountId: 'account-123',
        transactions: [
          {
            date: '2024-01-15',
            amount: -5000,
            payee_name: 'Coffee Shop',
          },
        ],
      };

      const mockResult = {
        added: [],
        updated: [],
        errors: [{ message: 'Invalid transaction date format' }],
      };

      vi.mocked(api.importTransactions).mockResolvedValue(mockResult);

      const result = await handler(args);

      expect(result.content).toBeDefined();
      const content = result.content[0];
      if (content.type === 'text') {
        const parsed = JSON.parse(content.text);
        expect(parsed.errors).toHaveLength(1);
        expect(parsed.summary.totalErrors).toBe(1);
      } else {
        throw new Error('Expected text content');
      }
    });

    it('should handle API throwing an error', async () => {
      const args: ImportTransactionsArgs = {
        accountId: 'account-123',
        transactions: [
          {
            date: '2024-01-15',
            amount: -5000,
            payee_name: 'Coffee Shop',
          },
        ],
      };

      vi.mocked(api.importTransactions).mockRejectedValue(new Error('Account not found'));

      const result = await handler(args);

      expect(result.isError).toBe(true);
      expect(result.content).toBeDefined();
      const content = result.content[0];
      if (content.type === 'text') {
        expect(content.text).toContain('Account not found');
      } else {
        throw new Error('Expected text content');
      }
    });

    it('should handle transactions with all optional fields', async () => {
      const args: ImportTransactionsArgs = {
        accountId: 'account-123',
        transactions: [
          {
            date: '2024-01-15',
            amount: -5000,
            payee_name: 'Coffee Shop',
            imported_payee: 'COFFEE*SHOP*NYC',
            notes: 'Business meeting',
            imported_id: 'ext-123',
            cleared: true,
            category: 'cat-001',
          },
        ],
      };

      const mockResult = {
        added: ['tx-new'],
        updated: [],
        errors: [],
      };

      vi.mocked(api.importTransactions).mockResolvedValue(mockResult);

      const result = await handler(args);

      expect(api.importTransactions).toHaveBeenCalledWith('account-123', args.transactions);
      expect(result.content).toBeDefined();
      const content = result.content[0];
      if (content.type === 'text') {
        const parsed = JSON.parse(content.text);
        expect(parsed.added).toEqual(['tx-new']);
        expect(parsed.summary.totalAdded).toBe(1);
      } else {
        throw new Error('Expected text content');
      }
    });

    it('should handle mixed results (added, updated, and errors)', async () => {
      const args: ImportTransactionsArgs = {
        accountId: 'account-123',
        transactions: [
          {
            date: '2024-01-15',
            amount: -5000,
            payee_name: 'Coffee Shop',
            imported_id: 'ext-001',
          },
          {
            date: '2024-01-16',
            amount: -10000,
            payee_name: 'Grocery Store',
            imported_id: 'ext-002',
          },
          {
            date: '2024-01-17',
            amount: -3000,
            payee_name: 'Gas Station',
            imported_id: 'ext-003',
          },
        ],
      };

      const mockResult = {
        added: ['tx-1'],
        updated: ['tx-2'],
        errors: [{ message: 'Transaction 3 has invalid category' }],
      };

      vi.mocked(api.importTransactions).mockResolvedValue(mockResult);

      const result = await handler(args);

      expect(result.content).toBeDefined();
      const content = result.content[0];
      if (content.type === 'text') {
        const parsed = JSON.parse(content.text);
        expect(parsed.added).toEqual(['tx-1']);
        expect(parsed.updated).toEqual(['tx-2']);
        expect(parsed.errors).toHaveLength(1);
        expect(parsed.summary.totalAdded).toBe(1);
        expect(parsed.summary.totalUpdated).toBe(1);
        expect(parsed.summary.totalErrors).toBe(1);
      } else {
        throw new Error('Expected text content');
      }
    });
  });
});
