
export type FieldInfo = {
  /** The name of the field. */
  readonly name: string;
  /** If an object or array member, the name of the parent. */
  readonly parent?: string;
  /**
   * The value of the field, but not necessarily the actual current value; only changed on the
   * 'change' event, as opposed to the 'input' event (which React uses for `onChange`). Recommended
   * for most cases.
   */
  value: string;
  /** The current value of the field (or whether it's checked, as 'true' | 'false'). */
  valueNow: string;
  /** The initial value, if given or inferred from `ref`; can show if the field is changed. */
  readonly initialValue?: string;
  /** A human-readable validation message loaded from the DOM, or the empty string. */
  error: string;
  /** Whether the field has been interacted with + blurred, ex. `:is(:user-valid, :user-invalid)`. */
  touched: boolean;
  /**
   * Whether the field has been validated, or for async validations, whether the validation is
   * currently in-flight and unknown.
   */
  status: "unvalidated" | "validating" | "validated";
  /** Whether the field currently matches `:focus`. */
  focused: boolean;
  /** Whether `error` was truthy at the moment when the field was focused, if it is still focused. */
  hadErrorWhenFocused: boolean;
};

/**
 * value: 1 << 0
 * errors: 1 << 1
 * touched: 1 << 2
 * dirty (touched and changed): 1 << 3
 *
 * Doesn't quite address timing, i.e. on input vs on change, we'll get there
 */
export type BitField = number & {};
export const VALUE_FLAG = 1 << 0,
  VALUE_NOW_FLAG = 1 << 1,
  ERROR_FLAG = 1 << 2,
  FOCUSED_FLAG = 1 << 3,
  TOUCHED_FLAG = 1 << 4,
  ALL_FLAG = 0x1F;

/**
 * To handle different storage mechanisms for different frameworks (i.e. immutable state in React,
 * stores in Solid, mutable objects in Vanilla), just make the main interface to integrate with
 * stores a setter function and let framework integrations handle the details.
 */
export type Setter = (
  formId: string,
  fieldName: string,
  update: Partial<FieldInfo> | ((fi: FieldInfo) => Partial<FieldInfo>)
) => void;
export type Getter = (formId: string, fieldName: string) => FieldInfo;

type FieldElement =
  | HTMLButtonElement
  | HTMLInputElement
  // | HTMLObjectElement
  | HTMLOutputElement
  | HTMLSelectElement
  | HTMLTextAreaElement;

const FIELD_ELEMENT_TAG_NAMES = new Set([
  "BUTTON",
  "INPUT",
  // "OBJECT",
  "OUTPUT",
  "SELECT",
  "TEXTAREA",
]);

const isFieldElement = (node: unknown): node is FieldElement => {
  return (
    node instanceof HTMLElement && FIELD_ELEMENT_TAG_NAMES.has(node.tagName)
  );
};
const isRadioInput = (node: unknown): node is HTMLInputElement => {
  return node instanceof HTMLInputElement && node.type === "radio";
};
const isCheckboxInput = (node: unknown): node is HTMLInputElement => {
  {
    return node instanceof HTMLInputElement && node.type === "checkbox";
  }
};

const wrap = (fn: (el: FieldElement) => void) => (e: Event) => {
  if (isFieldElement(e.target) && e.target.name) {
    fn(e.target);
  }
};
const options = { passive: true };

class Fxrm {
  constructor(public get: Getter, public set: Setter) { }

  register(el: HTMLElement) {
    const a = el.addEventListener.bind(el);
    a("input", this.onInput, options);
    a("change", this.onChange, options);
    a("focusin", this.onFocusIn, options);
    a("focusout", this.onFocusOut, options);
    a("submit", this.onSubmit, options);
    a("reset", this.onReset, options);
  }

  unregister(el: HTMLElement) {
    const r = el.removeEventListener.bind(el);
    r("input", this.onInput);
    r("change", this.onChange);
    r("focusin", this.onFocusIn);
    r("focusout", this.onFocusOut);
    r("submit", this.onSubmit);
    r("reset", this.onReset);
  }

  private onInput = wrap((el) => {
    this.set(el.form?.id ?? "", el.name, () => ({ valueNow: el.value }));
  });

  private onChange = wrap((el) => {
    this.set(el.form?.id ?? "", el.name, () => ({
      value: el.value,
      valueNow: el.value,
    }));
  });

  private onFocusIn = wrap((el) => {
    this.set(el.form?.id ?? "", el.name, (fi) => ({
      focused: true,
      hadErrorWhenFocused: !!fi.error,
    }));
  });

  onFocusOut = wrap((el) => {
    this.set(el.form?.id ?? "", el.name, (fi) => ({
      focused: true,
      hadErrorWhenFocused: !!fi.error,
    }));
  });

  onSubmit = (e: SubmitEvent) => { };

  onReset = (e: Event) => { };
}

const fieldSym: unique symbol = Symbol("field");

interface FieldId {
  fieldName: string;
}
type FieldAccessor<TContext> = {
  toString(): string;
  readonly [fieldSym]: FieldId & TContext;
};

type FieldsAccessor<TForm, TContext> = TForm extends (
  ...params: any[]
) => any
  ? never
  : TForm extends object
  ? {
    readonly [K in keyof TForm]: FieldsAccessor<TForm[K], TContext>;
  } & FieldAccessor<TContext>
  : FieldAccessor<TContext>;

/**
 * Handles automatic tracking and subscription callbacks when there are changes to fields. Only
 * necessary for Vanilla, React, Preact—frameworks with reactive stores can use their own
 * primitives.
 */
export class FxrmSubscriber<TContext> {
  private _tracked: Map<string, number>;
  private _trackingAll = false;
  private _cb: (subscriber: FxrmSubscriber<TContext>) => void;
  context: TContext;

  constructor(cb: (subscriber: FxrmSubscriber<TContext>) => void, context: TContext) {
    this._tracked = new Map();
    this._cb = cb;
    this.context = context;
  }

  /** Subscribe to the specified updates for a particular field, or start tracking accesses. */
  track(arg?: string | FieldAccessor<TContext>, when: BitField = 0): void {
    switch (typeof arg) {
      case "undefined":
        this._trackingAll = true;
        break;
      case "string":
      case "number": {
        const currentWhen = this._tracked.get(arg) ?? 0;
        this._tracked.set(
          arg,
          currentWhen | when
        );
        break;
      }
      default: {
        const fieldName = arg[fieldSym]?.fieldName;
        if (fieldName) {
          this.track(fieldName, when);
        }
      }
    }
  }

  /** Track accesses within the callback. */
  trackWithin(cb: () => void): void {
    this._trackingAll = true;
    cb();
    this._trackingAll = false;
  }

  /** Stop tracking accesses after starting with `.track()`. */
  untrack(): void {
    this._trackingAll = false;
  }

  /** Reset the set of tracked updates. */
  reset(): void {
    this._tracked.clear();
  }

  /** Mark a particular field as accessed; will be tracked if all accesses are being tracked. */
  access(arg: string | FieldAccessor<TContext>, when: BitField = 0): void {
    if (this._trackingAll) {
      this.track(arg, when);
    }
  }

  /**
   * Call subscriber function if a tracked field attribute has changed. Internal use only.
   * @private
   */
  _notify(field: string | FieldAccessor<TContext>, when: BitField) {
    const fieldStr = field.toString();
    // either same string or starts with string and has nested fields after
    const matches = (trackedField: string) =>
      fieldStr.startsWith(trackedField) &&
      (trackedField.length === fieldStr.length ||
        fieldStr[trackedField.length] === ".");

    for (const kv of this._tracked.entries()) {
      if (matches(String(kv[0])) && (kv[1] & when)) {
        this._cb(this);
        break;
      }
    }
  }

  /** Create a proxy fieldsAccessor that calls `.access()` when appropriate. */
  createFieldsAccessor<TForm extends object>(): FieldsAccessor<TForm, TContext> {
    return createFieldsAccessorImpl({
      fieldName: "",
      // types don't really matter here, it'll work
      fs: this,
    });
  }
}

const createFieldsAccessorImpl = <TForm extends object, TContext>(args: {
  fieldName: string;
  fs: FxrmSubscriber<TContext>;
}): FieldsAccessor<TForm, TContext> => {
  return new Proxy(
    {},
    {
      get: (target, property) => {
        if (property === fieldSym) {
          // provide info to fxrm functions, opaque to all other code
          return args;
        }
        if (property === Symbol.toPrimitive || property === "toString") {
          // stringify to field name
          return () => args.fieldName;
        }
        if (typeof property === "string") {
          return createFieldsAccessorImpl({
            fs: args.fs,
            fieldName: args.fieldName
              ? `${args.fieldName}.${property}`
              : property,
          });
        }
        return undefined;
      },
      has: (target, property) =>
        property === fieldSym ||
        typeof property === "string" ||
        typeof property === "number",
    }
  ) as FieldsAccessor<TForm, TContext>;
};

// DEMO
const sub = new FxrmSubscriber(() => { }, { formId: 'abc' });
const form = sub.createFieldsAccessor<{ foo: string, bar: number }>();
sub.track(form.bar, 7);
