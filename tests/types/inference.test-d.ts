/**
 * Compile-only assertions that generated method signatures infer the right
 * types. Checked by `tsc --noEmit` (this file has no runtime tests).
 */
import type { PagePromise } from '../../src/core/pagination';
import type { ExpandableExpense, Expenses } from '../../src/expenses';
import type { VendorResponse, Vendors } from '../../src/payments';

type Equal<A, B> =
    (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// vendors.create resolves to the VendorResponse schema type.
export type CreateResolvesToVendorResponse = Expect<
    Equal<Awaited<ReturnType<Vendors['create']>>, VendorResponse>
>;

// vendors.create's body is the CreateVendorRequest shape (company_name required-ish check).
type CreateBody = Parameters<Vendors['create']>[0];
export type CreateBodyHasCompanyName = Expect<
    Equal<CreateBody extends { company_name?: string | null } ? true : false, true>
>;

// vendors.delete resolves void (empty 200 in the spec).
export type DeleteResolvesVoid = Expect<Equal<Awaited<ReturnType<Vendors['delete']>>, void>>;

// expenses.list returns a PagePromise, and iterating it yields ExpandableExpense.
type ListReturn = ReturnType<Expenses['list']>;
export type ListReturnsPagePromise = Expect<
    ListReturn extends PagePromise<infer _P> ? true : false
>;
type ElementOf<T> = T extends AsyncIterable<infer E> ? E : never;
export type ListIteratesExpenses = Expect<Equal<ElementOf<ListReturn>, ExpandableExpense>>;

// expenses.list accepts the bracket-named expand[] query param.
type ListQuery = NonNullable<Parameters<Expenses['list']>[0]>;
export type ExpandIsStringArray = Expect<Equal<ListQuery['expand[]'], string[] | null | undefined>>;
