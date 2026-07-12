import { describe, expect, test } from 'bun:test';
import { GenerationError } from '../scripts/generate/common';
import type { OperationIR } from '../scripts/generate/ir';
import {
    assignNames,
    defaultNounCandidates,
    deriveMethodName,
    namespaceFromTag,
    splitCamelWords,
} from '../scripts/generate/naming';
import type { Overrides } from '../scripts/generate/overrides';

describe('splitCamelWords', () => {
    test.each([
        ['createVendor', ['create', 'Vendor']],
        ['getVendorById', ['get', 'Vendor', 'By', 'Id']],
        ['listExpenses', ['list', 'Expenses']],
        ['getEINStatus', ['get', 'EIN', 'Status']],
        ['listSpendLimits', ['list', 'Spend', 'Limits']],
    ])('%s → %p', (input, expected) => {
        expect(splitCamelWords(input)).toEqual(expected);
    });
});

describe('namespaceFromTag', () => {
    test.each([
        ['Vendors', 'vendors'],
        ['Card Expenses', 'cardExpenses'],
        ['Legal Entities', 'legalEntities'],
        ['Spend Limits (v2)', 'spendLimitsV2'],
        ['Budget Programs', 'budgetPrograms'],
        ['Accounting Integrations', 'accountingIntegrations'],
    ])('%s → %s', (tag, expected) => {
        expect(namespaceFromTag(tag)).toBe(expected);
    });
});

describe('deriveMethodName', () => {
    const derive = (operationId: string, tag: string) =>
        deriveMethodName(operationId, defaultNounCandidates(tag));

    test.each([
        // [operationId, tag, expected]
        ['createVendor', 'Vendors', 'create'],
        ['getVendorById', 'Vendors', 'get'],
        ['listVendors', 'Vendors', 'list'],
        ['updateVendor', 'Vendors', 'update'],
        ['deleteVendor', 'Vendors', 'delete'],
        ['getTransfersById', 'Transfers', 'get'],
        ['createIncomingTransfer', 'Transfers', 'createIncoming'],
        ['listExpenses', 'Expenses', 'list'],
        // trailing `_1` dedup suffix + compound tag noun
        ['listExpenses_1', 'Card Expenses', 'list'],
        ['getCardExpense', 'Card Expenses', 'get'],
        ['getMe', 'Users', 'getMe'],
        ['getUserLimit', 'Users', 'getLimit'],
        ['setUserLimit', 'Users', 'setLimit'],
        ['listCardAccounts', 'Accounts', 'listCard'],
        ['getPrimaryAccount', 'Accounts', 'getPrimary'],
        ['listTripBookings', 'Trips', 'listBookings'],
        ['getBooking', 'Trips', 'getBooking'],
        ['disconnectIntegration', 'Accounting Integrations', 'disconnect'],
        ['getCompany', 'Companies', 'get'],
        ['getCardNumber', 'Cards', 'getNumber'],
        ['lockCard', 'Cards', 'lock'],
        // ById only strips as an exact trailing pair
        ['listCardsByUserId', 'Cards', 'listByUserId'],
    ])('%s (tag %s) → %s', (operationId, tag, expected) => {
        expect(derive(operationId, tag)).toBe(expected);
    });

    test('returns null when stripping empties the name (needs an override)', () => {
        expect(derive('receiptMatch', 'Receipt Match')).toBeNull();
    });
});

function op(partial: Partial<OperationIR> & Pick<OperationIR, 'operationId' | 'tag'>): OperationIR {
    return {
        specId: 'payments',
        path: '/v1/x',
        method: 'get',
        summary: undefined,
        description: undefined,
        deprecated: false,
        scopes: [],
        pathParams: [],
        queryParamNames: [],
        queryHasRequired: false,
        hasBody: false,
        bodyRequired: false,
        idempotency: 'none',
        successStatus: '200',
        successHasJson: true,
        paginated: false,
        ...partial,
    };
}

const NO_OVERRIDES: Overrides = { tags: {}, operations: {} };

describe('assignNames', () => {
    test('assigns namespace and method from tag + operationId', () => {
        const named = assignNames(
            [op({ operationId: 'createVendor', tag: 'Vendors' })],
            NO_OVERRIDES,
        );
        expect(named[0]?.namespace).toBe('vendors');
        expect(named[0]?.methodName).toBe('create');
    });

    test('operation overrides win verbatim', () => {
        const overrides: Overrides = {
            tags: {},
            operations: { 'payments.createVendor': 'make' },
        };
        const named = assignNames([op({ operationId: 'createVendor', tag: 'Vendors' })], overrides);
        expect(named[0]?.methodName).toBe('make');
    });

    test('tag overrides remap namespace and resource nouns', () => {
        const overrides: Overrides = {
            tags: {
                'payments.Budgets': {
                    namespace: 'budgets',
                    resourceNouns: ['SpendBudgets', 'SpendBudget'],
                },
            },
            operations: {},
        };
        const named = assignNames(
            [op({ operationId: 'listSpendBudgets', tag: 'Budgets' })],
            overrides,
        );
        expect(named[0]?.namespace).toBe('budgets');
        expect(named[0]?.methodName).toBe('list');
    });

    test('two tags may share a namespace', () => {
        const overrides: Overrides = {
            tags: {
                'payments.Receipt Match': { namespace: 'receipts' },
                'payments.Receipt Upload': { namespace: 'receipts' },
            },
            operations: {
                'payments.receiptMatch': 'match',
                'payments.receiptUpload': 'upload',
            },
        };
        const named = assignNames(
            [
                op({ operationId: 'receiptMatch', tag: 'Receipt Match' }),
                op({ operationId: 'receiptUpload', tag: 'Receipt Upload' }),
            ],
            overrides,
        );
        expect(named.map((n) => `${n.namespace}.${n.methodName}`)).toEqual([
            'receipts.match',
            'receipts.upload',
        ]);
    });

    test('fails with the override key when derivation empties a name', () => {
        const attempt = () =>
            assignNames([op({ operationId: 'receiptMatch', tag: 'Receipt Match' })], NO_OVERRIDES);
        expect(attempt).toThrow(GenerationError);
        expect(attempt).toThrow(/payments\.receiptMatch/);
    });

    test('fails on method collisions within a namespace, naming both operations', () => {
        expect(() =>
            assignNames(
                [
                    op({ operationId: 'listVendors', tag: 'Vendors' }),
                    op({ operationId: 'listVendor', tag: 'Vendors', path: '/v1/y' }),
                ],
                NO_OVERRIDES,
            ),
        ).toThrow(/listVendors[\s\S]*listVendor|listVendor[\s\S]*listVendors/);
    });

    test('fails on unused overrides', () => {
        const overrides: Overrides = {
            tags: {},
            operations: { 'payments.nonexistentOp': 'x' },
        };
        expect(() =>
            assignNames([op({ operationId: 'createVendor', tag: 'Vendors' })], overrides),
        ).toThrow(/nonexistentOp/);
    });
});
