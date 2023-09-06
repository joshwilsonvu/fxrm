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

class FieldObserver {
  // el?: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  listeners: Array<(fo: this) => void> = [];

  constructor(
    public formId: string,
    public fieldName: string,
    public el: HTMLElement | RadioNodeList
  ) {}

  subscribe(cb: (fo: this) => void): void {
    this.listeners.push(cb);
  }

  unsubscribe(cb: (fo: this) => void): void {
    const index = this.listeners.findIndex((l) => l === cb);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notify() {
    this.listeners.forEach((l) => l(this));
  }
}

const fields = new Map<string, FieldObserver>();

export const register = () => {
  const de = document.documentElement;
  const a = de.addEventListener.bind(de);
  a("submit", onSubmit);
  a("change", onChange);
  a("input", onInput);
  a("focusin", onFocusIn);
  a("focusout", onFocusOut);
};

export const unregister = () => {
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

const getField = (formId: string, fieldName: string): FieldObserver | null => {
  const key = JSON.stringify([formId, fieldName]);
  let fieldObserver = fields.get(key);
  if (!fieldObserver) {
    const form = document.forms.namedItem(formId); // prefers `id` but technically supports `name`
    if (!form) {
      return null;
    }
    const field = form.elements.namedItem(fieldName);
    if (
      !field ||
      !(field instanceof HTMLElement || field instanceof RadioNodeList)
    ) {
      return null;
    }
    fieldObserver = new FieldObserver(formId, fieldName, field);
    fields.set(key, fieldObserver);
  }
  return fieldObserver;
};

const subscribe = (field: FieldId) => {
  // TODO: add listener to be called for any changes, return unsubscribe fn
};

/*
const form = (
  <form id="test">
    <label for="test-name">Name</label>
    <input id="test-name" type="text" name="name" />

    <label for="test-email">Email</label>
    <input id="test-email" type="email" name="email" value={value('test', 'email')} />


  </form>
);
*/
