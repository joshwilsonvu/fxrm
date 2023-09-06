import { useSyncExternalStore } from "react";

const fieldSym: unique symbol = Symbol("field");

type FieldId = { formId: string; fieldName: string };
type FieldAccessor = {
  toString(): string;
  [fieldSym]: FieldId;
};

type FieldsAccessor<TForm> = TForm extends object
  ? {
      [K in keyof TForm]: FieldsAccessor<TForm[K]>;
    }
  : FieldAccessor;

function createFieldsAccessor<TForm>(
  formId: string,
  fieldName = ""
): FieldsAccessor<TForm> {
  return new Proxy(
    {},
    {
      get(target, property) {
        if (property === fieldSym) {
          // provide info to fxrm functions, opaque to all other code
          return { formId, fieldName };
        }
        if (property === Symbol.toPrimitive || property === "toString") {
          // stringify to field name
          return () => fieldName;
        }
        if (typeof property === "string") {
          return createFieldsAccessor(
            formId,
            fieldName ? `${fieldName}.${property}` : property
          );
        }
        return undefined;
      },
      has(target, property) {
        return typeof property === "string" || property === fieldSym;
      },
    }
  ) as FieldsAccessor<TForm>;
}

/**
 * Gets the current value of a particular field. To be concurrent-mode safe,
 * cache the result in a sync external store so other concurrent renders can read from that,
 * to guarantee that renders are pure.
 */
export const value = (field: FieldAccessor, current = false) => {
  if (!(fieldSym in field)) {
    return '';
  }
  const { formId, fieldName } = field[fieldSym];

};