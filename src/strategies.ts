import type { FieldInfo, FormInfo } from "./dom";

/** Given a field's data, returns whether to validate the field or not. */
type ValidationStrategy = (fi: FieldInfo, form?: FormInfo) => boolean;

// expose something like this as an option, using fi data 
const validationStrategies = {
  live(fi) {
    return fi.touched || !!fi.valueNow;
  },
  late(fi) {
    return fi.touched;
  },
  emptyOnSubmit(fi, form) {
    return !fi.value ? (form?.submitCount ?? 0) > 0 : fi.touched;
  },
  rewardEarlyPunishLate(fi) {
    // when going back into a field, if it was already valid, do late validation; if it was invalid, validate now so that
    return fi.focused ? fi.hadErrorWhenFocused : fi.touched;
  },
} satisfies Record<string, ValidationStrategy>;
