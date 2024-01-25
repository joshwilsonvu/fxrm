// var toKey = (formId, ...fieldName) => {
//   const escaped = [formId, fieldName].map((s) => s.replace(/[.:]/g, "\\$&"));
//   return `${escaped[0]}:${escaped.slice(1).join(".")}`;
// };
// var fromKey = (key) => {
//   return key.split(/(?<!\\)[.:]/).map((s) => s.replace(/\\([.:])/g, "$1"));
// };

// class FormObserver {
//   fields: Map<string, FieldObserver>;

//   constructor(public form: HTMLFormElement, public formId: string) {
//     this.fields = new Map();
//   }

//   getField(fieldName: string) {
//     let fieldObserver = this.fields.get(fieldName);
//     if (!fieldObserver) {
//       const field = this.form.elements.namedItem(fieldName);
//       if (field == null || field instanceof HTMLFieldSetElement) return null;

//       fieldObserver = new FieldObserver(this.formId, fieldName);
//     }
//     if (fieldObserver.el) return field;
//   }

//   markAccessed(fieldName: string) {
//     let accessedField = this.accessedFields.get(fieldName);
//     if (!accessedField) {
//       accessedField = new FieldObserver(this.formId, fieldName);
//       this.accessedFields.set(fieldName, accessedField);
//     }
//     return accessedField;
//   }
// }



class FieldData {
  name: string;
  value: unknown = "";
  errors?: Array<string>;
  touched = false;
  changed = false;

  constructor(name: string) {
    this.name = name;
  }
}

class FieldObserver {
  // el?: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  listeners: Array<{ cb(fo: FieldObserver): void; on: BitField }> = [];

  constructor(
    public fieldName: string,
    public el: FieldElement,
    public formId?: string
  ) {
    if (!this.formId) {
      const form = this.getForm();
      this.formId = form?.id;
    }
  }

  subscribe(cb: (fo: this) => void, on: BitField): void {
    const listener = this.listeners.find((l) => l.cb === cb);
    if (listener) {
      listener.on |= on; // subscribe to everything in `on` if not already
    } else {
      this.listeners.push({ cb, on });
    }
  }

  unsubscribe(cb: (fo: this) => void): void {
    const index = this.listeners.findIndex(
      ({ cb: listenerCb }) => listenerCb === cb
    );
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notify(change: BitField) {
    this.listeners.forEach(({ cb, on }) => {
      if (change & on) {
        cb(this);
      }
    });
  }

  private getForm() {
    if (this.el instanceof RadioNodeList) {
      return (this.el[0] as HTMLInputElement | undefined)?.form;
    } else {
      return this.el.form;
    }
  }
}

/**
 * Data structure: global map, of field names to field observers. Each observer
 * stores the ID of the form, or a generated ID associated with the reference
 * to the form element, or null if the field doesn't have an associated form.
 *
 * How does `value()` work before render result is out? It returns empty or
 * initial from context, duh! So likewise we can get form ID from context whenever
 * it's actually needed. In SSR, it would still need to be provided sometimes.
 * I don't like the design where existing content could throw when new content
 * is added with the same field name, but framework integrations can generate an
 * ID if it's not provided and encourage users to assign it to the <form> element.
 */
const fields = new Map<string, FieldObserver | Array<FieldObserver>>();
const subscribers = new Set<FormSubscription>();

const register = () => {
  const de = document.documentElement;
  const a = de.addEventListener.bind(de);
  a("submit", onSubmit);
  a("change", onChange);
  a("input", onInput);
  a("focusin", onFocusIn);
  a("focusout", onFocusOut);
};

const unregister = () => {
  const de = document.documentElement;
  const r = de.removeEventListener.bind(de);
  r("submit", onSubmit);
  r("change", onChange);
  r("input", onInput);
  r("focusin", onFocusIn);
  r("focusout", onFocusOut);
};

const onSubmit = (e: SubmitEvent) => {};

const onChange = (e: Event) => {};

const onInput = (e: Event) => {};

const onFocusIn = (e: FocusEvent) => {};

const onFocusOut = (e: FocusEvent) => {};

const value = (formId: string, fieldName: string) => {
  const fieldObserver = getField(formId, fieldName);
};

const getField = (
  fieldName: string,
  formId?: string | null
): FieldObserver | null => {
  const key = JSON.stringify([fieldName, formId]);
  let fieldObserver = fields.get(key);
  if (!fieldObserver) {
    const form = document.forms.namedItem(formId); // prefers `id` but technically supports `name`
    if (!form) {
      return null;
    }
    const field = form.elements.namedItem(fieldName) as FieldElement | null;
    if (
      !field ||
      !(field instanceof HTMLElement || field instanceof RadioNodeList)
    ) {
      return null;
    }
    fieldObserver = new FieldObserver(fieldName, field, formId);
    fields.set(key, fieldObserver);
  }
  return fieldObserver;
};

/**
 * value: 1 << 0
 * errors: 1 << 1
 * touched: 1 << 2
 * dirty (touched and changed): 1 << 3
 *
 * Doesn't quite address timing, i.e. on input vs on change, we'll get there
 */
type BitField = number & {};
type FieldId = string;

export class FormSubscription {
  tracked: Map<FieldId, BitField>;
  cb: () => void;
  called = false;

  constructor(cb: () => void) {
    this.cb = cb;
    this.tracked = new Map();
    subscribers.add(this);
  }

  track(field: FieldId, on: BitField) {
    const current = this.tracked.get(field) ?? 0;
    const result = current | on;
    if (result !== current) {
      this.tracked.set(field, result);
    }
  }

  onChange(changes: Array<[field: FieldId, change: BitField]>) {
    for (const [field, change] of changes) {
      if (!this.called && (this.tracked.get(field) ?? 0) & change) {
        this.cb();
        this.called = true;
        return true;
      }
    }
    return false;
  }

  reset() {
    this.called = false;
    this.tracked.clear();
  }

  dispose() {
    subscribers.delete(this);
  }
}

const subscribe = (field: FieldId, on: BitField) => {
  // TODO: add listener to be called for any changes, return unsubscribe fn
};

/*
const form = (

);
*/

export { register, unregister, getField, subscribe };
