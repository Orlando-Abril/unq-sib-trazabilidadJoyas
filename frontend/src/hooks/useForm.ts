import { useState } from "react";
import type { ChangeEvent } from "react";

// Manejo genérico de un formulario de campos de texto.
// Evita repetir el patrón useState + onChange en cada página.
export function useForm<T extends Record<string, string>>(initial: T) {
  const [form, setForm] = useState<T>(initial);

  function update(field: keyof T) {
    return (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function reset() {
    setForm(initial);
  }

  return { form, update, reset };
}
