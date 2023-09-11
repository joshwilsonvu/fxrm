import { useMemo, useReducer, useSyncExternalStore } from "react";
import { getField, subscribe } from "./dom";

const fieldSym: unique symbol = Symbol("field");

interface FieldContext {
  formId?: string;
}
interface FieldId extends FieldContext {
  fieldName: string;
}
type FieldAccessor = {
  toString(): string;
  [fieldSym]: FieldId;
};

type FieldsAccessor<TForm> = TForm extends object
  ? {
      [K in keyof TForm]: FieldsAccessor<TForm[K]>;
    } & FieldAccessor
  : FieldAccessor;

function createFieldsAccessor<TForm>(
  fieldName = "",
  context?: {
    formId?: string;
  }
): FieldsAccessor<TForm> {
  return new Proxy(
    {},
    {
      get(target, property) {
        if (property === fieldSym) {
          // provide info to fxrm functions, opaque to all other code
          return { fieldName, ...context };
        }
        if (property === Symbol.toPrimitive || property === "toString") {
          // stringify to field name
          return () => fieldName;
        }
        if (typeof property === "string") {
          return createFieldsAccessor(
            fieldName ? `${fieldName}.${property}` : property,
            context
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

const useFxrm = (options) => {
  const rerender = useReducer(/*****/);

  // renders should be pure, and you shouldnt
  // read or write from refs/mutable variables during render. but that's what we're going to do!
  // it's just a perf optimization,
  // the result will be consistent, because
  // anything that is accessed is stored in state to stay pure
  return useMemo(() => {
    // const api = new FormApi(options);
    return createFieldsAccessor({ ...options, rerender });
  }, []);
};

/**
 * Gets the current value of a particular field. To be concurrent-mode safe,
 * cache the result in a sync external store so other concurrent renders can read from that,
 * to guarantee that renders are pure.
 */
export const value = (
  field: FieldAccessor,
  options?: {
    // renderOn: "change" | "input";
    rerender(): void;
  }
) => {
  if (!(fieldSym in field)) {
    return "";
  }
  const rerender = options?.rerender;
  const { formId, fieldName } = field[fieldSym];
  rerender && getField(fieldName, formId)?.subscribe(rerender, 1 << 0);
  return theValue;
};
