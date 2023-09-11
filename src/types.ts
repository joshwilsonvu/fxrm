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

export type DeepKeys<T> = unknown extends T
  ? keyof T
  : object extends T
  ? string
  : T extends readonly any[] & IsTuple<T>
  ? AllowedIndexes<T> | DeepKeysPrefix<T, AllowedIndexes<T>>
  : T extends any[]
  ? DeepKeys<T[number]>
  : T extends Date
  ? never
  : T extends object
  ? (keyof T & string) | DeepKeysPrefix<T, keyof T>
  : never;

type DeepKeysPrefix<T, TPrefix> = TPrefix extends keyof T & (number | string)
  ? `${TPrefix}.${DeepKeys<T[TPrefix]> & string}`
  : never;

export type DeepValue<T, TProp> = T extends Record<string | number, any>
  ? TProp extends `${infer TBranch}.${infer TDeepProp}`
    ? DeepValue<T[TBranch], TDeepProp>
    : T[TProp & string]
  : never;

  type Example = {
    foo: string,
    bar: {
      baz: string,
      quux: number,
      asdg: Date,
      asdgh: [string, number, { qwreyer: number, qwehjdfh: string }],
      sdfh: Array<{ foo: string }>
    }
  }
type DK = DeepKeys<Example>
type DV = DeepValue<Example, 'bar.sdfh.8'>

type IT = AllowedIndexes<[string, number]>

type TF = unknown extends {} ? true : false