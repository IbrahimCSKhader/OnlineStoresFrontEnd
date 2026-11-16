import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import CatalogTranslationFields from "./CatalogTranslationFields.jsx";

afterEach(cleanup);
function Form({ enabled = true, base = "A", initial = {} }) {
  const [form, setForm] = useState(initial);
  return <><CatalogTranslationFields store={{ enableLanguageSwitching: enabled, defaultLanguage: base }}
    form={form} product onChange={(key, value) => setForm(p => ({ ...p, [key]: value }))} />
    <output data-testid="state">{JSON.stringify(form.translations)}</output></>;
}
function selectLanguage(label) {
  fireEvent.mouseDown(screen.getByRole("combobox"));
  fireEvent.click(screen.getByRole("option", { name: label }));
}
it("keeps the normal page unchanged when language switching is disabled", () => {
  render(<Form enabled={false} />);
  expect(screen.queryByRole("combobox")).toBeNull();
});
it("preserves translations while switching and supports clearing a saved field", () => {
  render(<Form initial={{ translations: [{ language: "I", name: "ישן" }] }} />);
  selectLanguage("English");
  fireEvent.change(screen.getByLabelText("الاسم — English"), { target: { value: "Chair" } });
  fireEvent.change(screen.getByLabelText("الوصف المختصر — English"), { target: { value: "Oak" } });
  selectLanguage("עברית");
  expect(screen.getByLabelText("الاسم — עברית")).toHaveValue("ישן");
  expect(screen.getByLabelText("الاسم — עברית")).toHaveAttribute("dir", "rtl");
  fireEvent.change(screen.getByLabelText("الاسم — עברית"), { target: { value: "" } });
  selectLanguage("English");
  expect(screen.getByLabelText("الاسم — English")).toHaveValue("Chair");
  expect(screen.getByLabelText("الوصف المختصر — English")).toHaveValue("Oak");
  expect(JSON.parse(screen.getByTestId("state").textContent)).toEqual([
    { language: "E", name: "Chair", shortDescription: "Oak" }, { language: "I", name: "" },
  ]);
});
it("offers Arabic for stores whose base language is English", () => {
  render(<Form base="E" />);
  fireEvent.mouseDown(screen.getByRole("combobox"));
  expect(screen.queryByRole("option", { name: "English" })).toBeNull();
  fireEvent.click(screen.getByRole("option", { name: "العربية" }));
  expect(screen.getByLabelText("الاسم — العربية")).toBeInTheDocument();
});
