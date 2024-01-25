import { useLayoutEffect, useMemo, useReducer } from "react";
import { useSyncExternalStore } from 'use-sync-external-store/shim';
import { FxrmSubscriber, type FieldInfo, type Setter } from "./core";

const store = new Map<string, Map<string, FieldInfo>>();
const setter: Setter = (formId, fieldName, attrs) => {

}


const useFxrm = (options) => {
  const subscriptionRef = useRef();
  const getSubscription = () => {
    if (!subscriptionRef.current) {
      subscriptionRef.current = new FormSubscription()
    }
  }
  const store = useSyncExternalStore()
  const rerender = useReducer(/*****/);

  useLayoutEffect(() => {
    // apply default values to inputs
  }, []);

  // renders should be pure, and you shouldn't
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
