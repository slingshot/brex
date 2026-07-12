import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: {
        index: 'src/index.ts',
        accounting: 'src/accounting/index.ts',
        budgets: 'src/budgets/index.ts',
        expenses: 'src/expenses/index.ts',
        fields: 'src/fields/index.ts',
        onboarding: 'src/onboarding/index.ts',
        payments: 'src/payments/index.ts',
        team: 'src/team/index.ts',
        transactions: 'src/transactions/index.ts',
        travel: 'src/travel/index.ts',
        webhooks: 'src/webhooks/index.ts',
    },
    format: ['esm'],
    fixedExtension: false,
    dts: true,
    sourcemap: true,
    clean: true,
    target: 'es2022',
});
