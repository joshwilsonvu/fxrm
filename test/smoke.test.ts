import { expect, test, describe, beforeEach, afterEach } from "vitest";
import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";

import { register, unregister } from "../src/dom";

function loadHTML() {
  document.body.innerHTML = `
    <form id="test">
      <label for="test-name">Name</label>
      <input id="test-name" type="text" name="name" />

      <label for="test-email">Email</label>
      <input id="test-email" type="email" name="email" />

      <button type="submit">Submit</button>
      <button type="reset">Reset</button>
    </form>
  `;
}

beforeEach(() => register());
afterEach(() => unregister());

test("it works", () => {
  expect(true).toBe(true);
});

test("test utils", async () => {
  loadHTML();
  const nameInput = screen.getByLabelText("Name");
  expect(nameInput).toBeVisible();

  const user = userEvent.setup();
  await user.tab();
  await user.keyboard("Josh");

  expect(nameInput).toBeValid();
});
