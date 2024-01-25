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
  "OBJECT",
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





// TODO make getters for accesses on each property that `tracked |= PROPERTY_FLAG`, no setters,
// but this has to be on an individual subscription.

export type FormInfo = {
  id: string;
  submitCount: number;
};

const changed = (fi: FieldInfo) => fi.value !== (fi.initialValue ?? "");

const refresh = (
  fi: FieldInfo,
  options: { formId?: string; event?: "change" | "input" | "blur" | "focus" }
) => {
  const formId = options?.formId;
  const event = options?.event;

  // get a live NodeList if we don't have one
  const nl = document.getElementsByName(fi.name);
  const el = loadEl(nl, formId);

  if (el) {
    const value = loadValue(el);
    const error = el.validationMessage;
    if (value !== fi.value || error !== fi.error) {
      return {
        ...fi,
        value,
        error,
      };
    }
  }

  return fi;
};

/**
 * 
 * @param nl
 * @param formId
 * @returns
 */
const loadEl = (
  nl: NodeListOf<HTMLElement>,
  formId: string | undefined
): FieldElement | undefined => {
  /**
   * A live NodeList of elements with name `name` (usually one).
   *
   * Live NodeLists are created lazily, and only query nodes when accessed. The browser invalidates
   * the cache for this NodeList when DOM mutations that would affect it occur, so that the next access
   * re-queries the nodes. By handling caching for us, this saves us a lot of code.
   *
   * The DOM is the ultimate source of truth for field values, but for integrating with UI frameworks
   * and subscriptions, we need to copy DOM values to other fields so that initial data can be used before
   * the DOM has been constructed.
   *
   * TODO: maybe don't put this in FieldData
   */
  for (const el of nl) {
    if (isFieldElement(el) && el.form?.id === formId) {
      return el;
    }
  }
};

/**
 * Gets the value of a field element. If the element is a radio button, gets the value of the radio
 * button with the same name that's checked, or ''.
 * 
 * Can't use this before rendering, or before mounting the element in a rerender; will have to fall
 * back to default values.
 */
const loadValue = (el: FieldElement): string => {
  if (isRadioInput(el)) {
    if (el.checked) return el.value;

    const nl = document.getElementsByName(el.name);
    for (const otherRadio of nl) {
      if (
        otherRadio !== el &&
        isRadioInput(otherRadio) &&
        otherRadio.checked &&
        otherRadio.form?.id === el.form?.id
      ) {
        return otherRadio.value;
      }
    }
    return "";
  }
  if (isCheckboxInput(el)) {
    return String(el.checked);
  }
  return el.value;
};

const FORM_ID_UNDEFINED = Symbol("form.id undefined");
const forms = {};

const formObservers = new Set<FormObserver>();

/**
 * Inspired by MutationObserver, *Observer browser APIs.
 *
 * Key point is that this class should do everything: expose a way to access fields in a type-safe way,
 * start and stop tracking which fields are used and what data is used about each field, and fire the callback
 * when any tracked changes occur. A React integration will just wire up the callback to useSES and determine
 * when to track.
 *
 * Solid integration might not use this class and wrap the data in a store instead, TBD.
 */
export class FormObserver {
  constructor(public callback: (formObserver: FormObserver) => void, public formId: string | undefined) {}

  observe(name: string, on: number) {
    formObservers.add(this);
  }

  disconnect() {
    formObservers.delete(this);
  }
}





