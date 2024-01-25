/*
 * The following types were taken from
 * https://github.com/TanStack/form/blob/main/packages/form-core/src/utils.ts under the MIT license.
 * Thank you for your work!
 */

type Index40 =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29
  | 30
  | 31
  | 32
  | 33
  | 34
  | 35
  | 36
  | 37
  | 38
  | 39;

// Is this type a tuple?
type IsTuple<T> = T extends readonly any[] & { length: infer Length }
  ? Length extends Index40
    ? T
    : never
  : never;

// If this type is a tuple, what indices are allowed?
type AllowedIndexes<
  Tuple extends ReadonlyArray<any>,
  Keys extends number = never
> = Tuple extends readonly []
  ? Keys
  : Tuple extends readonly [infer _, ...infer Tail]
  ? AllowedIndexes<Tail, Keys | Tail["length"]>
  : Keys;

/** All dot-separate paths for this type, including numbers. */
export type DeepKeys<T> = (unknown extends T // if T is wider than unknown (any)
  ? keyof T & string // shrug?
  : object extends T // if T is wider than object
  ? string
  : T extends ((...params: any[]) => any) | Date
  ? never
  : T extends IsTuple<T>
  ? AllowedIndexes<T> | DeepKeysPrefix<T, AllowedIndexes<T>>
  : T extends readonly any[]
  ? number | DeepKeysPrefix<T, number>
  : T extends object
  ? (keyof T & (string | number)) | DeepKeysPrefix<T, keyof T>
  : never) &
  (string | number); // shouldn't be needed but helps

type DeepKeysPrefix<T, TPrefix> = TPrefix extends keyof T & (number | string)
  ? `${TPrefix}.${DeepKeys<T[TPrefix]> & (string | number)}`
  : never;

/** Given any key from DeepKeys, get the type of the value at that possibly nested key. */
export type DeepValue<T, TProp> = boolean extends (
  T extends never ? true : false
)
  ? // if T is any
    any
  : T extends ((...params: any[]) => any) | Date
  ? never
  : T extends readonly any[]
  ? TProp extends `${infer TBranch extends number}.${infer TDeepProp}`
    ? DeepValue<T[TBranch], TDeepProp>
    : never
  : T extends Record<string | number, any>
  ? TProp extends `${infer TBranch}.${infer TDeepProp}`
    ? DeepValue<T[TBranch], TDeepProp>
    : T[TProp & (string | number)]
  : never;

// type TF = unknown extends {} ? true : false
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type T = DeepKeys<{
    foo: {
      bar: [];
      baz: Array<number>;
      quux: Date;
    };
    1: number;
    asdg: () => void;
    asdgh: any;
    sdfh: unknown;
    53: [12, unknown, any, never, "sdfh"];
  }>

/** To use DeepKeys with a recursive type, use DeepKeys<LimitDepth<RecursiveType>> */
export type LimitDepth<
  T,
  TLength = 5,
  TDepth extends any[] = []
> = TDepth["length"] extends TLength
  ? never
  : T extends object
  ? {
      [K in keyof T]: LimitDepth<T[K], TLength, [any, ...TDepth]>;
    }
  : T extends Array<infer U>
  ? Array<LimitDepth<U, TLength, [any, ...TDepth]>>
  : T;
