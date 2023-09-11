# fxrm

Upgrades native forms to support modern features, like `touched` state, custom validation, input
restoration, transforms, masks, native events, and more. `htmx` for forms.

For React bindings, see [@fxrm/react](./docs/fxrm-react.md). Supports both controlled and
uncontrolled inputs.

## Installation

```js
npm add fxrm

npm add @fxrm/react
```

## Features

`fxrm` 

## API

```ts
register(root: HTMLElement): void;
unregister(root: HTMLElement): void;

form<T>(name: string): T

interface Field<TField> {
  value?: TField;
  touched: boolean;
  error?: string;
}

field<TForm, F extends DeepKey<TForm>>(formName: string, field: F): Field<DeepValue<F>>
```

## Usage

### HTML + Vanilla JS

```html
<!DOCTYPE html>
<html>
<body>
  <form id="login" method="post">
    <label for="username">Username</label>
    <input id="username" name="username" required>
    <div class="error-message">A username is required.</div>

    <label for="password">Password</label>
    <input id="password" name="password" type="password" required>
    <div class="error-message">A password is required.</div>

    <button type="reset">Reset</button>
    <button type="submit">Submit</button>
  </form>
  <script type="module">
    import * as fxrm from "https://esm.sh/fxrm";

    fxrm.register(document.documentElement);
  </script>
</body>
</html>
```

For plain HTML forms, import `fxrm` from a CDN like https://esm.sh or from your own server. Call
`fxrm.register` with an element such as `document.documentElement` to upgrade all of its descendant
`<form>` elements. If you only want `fxrm` to upgrade a smaller subtree, pass the root of that
subtree instead. No other code is needed!

All form inputs that `fxrm` controls will gain a `fxrm-touched="false"` attribute, which is set to
`"true"` after the first time the input has been blurred, or just before the form is submitted. This
can be targeted with CSS, and used in combination with the `:invalid` pseudo-class to show error
messages only after the input has been touched, like:

```css
.error-message { display: none; }
[fxrm-touched="true"]:invalid + .error-message { display: block; }

/* same effect, but works when JS is disabled */
:not([fxrm-touched="false"]):invalid + .error-message { display: block; }
```

If using Tailwind CSS, you can add a `touched:` variant with

```js
const plugin = require('tailwindcss/plugin')

module.exports = {
  // ...
  plugins: [
    plugin(function({ addVariant }) {
      addVariant('touched', '&:not([fxrm-touched="false"])');
    })
  ]
}
```

Don't explicitly set this attribute—it's managed by `fxrm`.

### React

Using `fxrm` with a UI library unlocks type safety and more powerful features, but still backed by
the simplicity of a native-like API.

```tsx
import React from 'react';
import { z } from 'zod';
import * as fxrm from 'fxrm';
import { useFxrm } from '@fxrm/react';

const schema = z.object({
  username: z.string(),
  password: z.string().min(8, 'Password must have 8 characters'),
});

type Form = z.infer<typeof schema>;

function ExampleForm() {
  const handleSubmit = (e) => { e.preventDefault(); /* handle submit */ }

  // can provide `defaultValues` so that `fields` has values on initial render; `fxrm.value()` will return `''` otherwise
  const defaultValues = { username: '', password: '' };
  const form = useFxrm<Form>('login', { defaultValues,  /* or 'input' */, validateSchema: schema });

  // note: will probably have to persist all `fields` information to `useSyncExternalStore` so that it's concurrent-mode safe;
  // don't read directly from DOM during render
  // Implement this using Proxy get tracking, and a known Symbol read for `fxrm.*` methods
  console.log(fxrm.touched(fields.username)); // false
  console.log(fxrm.value(fields.username)); // ''
  console.log(fxrm.name(fields.username)); // 'username'
  console.log(fxrm.field('username') === fields.username); // true
  console.log(fxrm.valid(fields.username)); // false

  return (
    <fxrm.form id="login" onSubmit={handleSubmit}>
      <label htmlFor="username">Username</label>
      <input id="username" name={fields.username} required>
      <div className="error-message">{fxrm.error(fields.username)}</div>

      <PasswordInput />

      <button type="reset">Reset</button>
      <button type="submit">Submit</button>
    </fxrm.form>
  )
}

function TextField({ name }) {
  const field = useFxrmField('password'); // gets form name, initial value from context

  return (
    <>
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" required>
      <div className="error-message">{fxrm.error(field)}</div>
    </>
  )
}
```
