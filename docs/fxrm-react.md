# @fxrm/react

## Examples

```tsx
function Input({ name }) {
  // gets form ID from context if any
  const field = useField(name);
}
```

```jsx
import useToast from "./useToast";

function LoginForm {
  const addToast = useToast();
  const form = useForm({ id }); // id auto-generated if not given

  return (
    <form.Provider>
      <form
        className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-box bg-base-100 p-8 shadow-lg"
        onSubmit={(e) => {
          // prevent default behavior, grab form data, show a toast
          e.preventDefault();
          const data = form.data;
          console.log(data);

          addToast("You are now logged in. Thanks for visiting!");
        }}
        id={form.id}
      >
        <h1 className="text-2xl">Log in</h1>
        <EmailField />
        <PasswordField />
        <div className="mt-4 flex justify-end gap-4">
          <button type="submit" className="btn btn-primary">
            Submit
          </button>
        </div>
      </form>
    </form.Provider>
  );
};

function EmailField() {
  const fields = useFields();

  return (
    <label className="form-control w-full">
      <div className="label">
        <span className="label-text">Email</span>
      </div>
      <input
        name={email}
        type="email"
        placeholder="you@example.com"
        className="input input-bordered w-full"
        autoFocus
      />
    </label>
  );
}

function PasswordField() {
  const fields = useFields();
  const hasEmail = watch(() => !!value(fields.email));

  return (
    <label className="form-control w-full">
      <div className="label">
        <span className="label-text">Password</span>
      </div>
      <input
        name="password"
        type="password"
        className="input input-bordered w-full"
      />
    </label>
  );
}

export default LoginForm;
```
