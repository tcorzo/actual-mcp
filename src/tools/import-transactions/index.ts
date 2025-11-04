import api from '@actual-app/api';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { initActualApi } from '../../actual-api.js';
import { successWithJson, errorFromCatch } from '../../utils/response.js';
import { ImportTransactionsArgsSchema, type ImportTransactionsArgs, ToolInput } from '../../types.js';
import type { ImportTransactionsResult } from './types.js';

export const schema = {
  name: 'import-transactions',
  description:
    'Import multiple transactions at once. Automatically runs all rules, reconciles duplicates using imported_id, and creates transfers. Returns arrays of added/updated transaction IDs and any errors.',
  inputSchema: zodToJsonSchema(ImportTransactionsArgsSchema) as ToolInput,
};

export async function handler(args: ImportTransactionsArgs): Promise<CallToolResult> {
  try {
    await initActualApi();

    const { accountId, transactions } = args;

    if (!transactions || transactions.length === 0) {
      return errorFromCatch(new Error('No transactions provided for import'));
    }

    // Import transactions using the Actual API
    // The API will run rules, reconcile duplicates, and create transfers automatically
    const result = (await api.importTransactions(accountId, transactions)) as ImportTransactionsResult;

    // Format the response
    const summary = {
      added: result.added || [],
      updated: result.updated || [],
      errors: result.errors || [],
      summary: {
        totalAdded: (result.added || []).length,
        totalUpdated: (result.updated || []).length,
        totalErrors: (result.errors || []).length,
      },
    };

    return successWithJson(summary);
  } catch (error) {
    return errorFromCatch(error);
  }
}
