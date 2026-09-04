"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import type { Business } from "./pipeline-area";
import BusinessFormFields, { currencyToNumber, onlyDigits } from "./business-form-fields";

export default function NewDealDrawer() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!open) return;
    nameRef.current?.focus();

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) setOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, saving]);

  async function saveDeal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (!name) {
      setNameError("Informe um nome que não contenha apenas espaços.");
      nameRef.current?.focus();
      return;
    }
    if (!String(data.get("municipality_id") ?? "")) {
      event.currentTarget.querySelector<HTMLInputElement>("[role='combobox']")?.reportValidity();
      return;
    }

    setSaving(true);
    setErrorMessage("");
    const date = String(data.get("date") ?? "");
    const value = currencyToNumber(String(data.get("value") ?? ""));
    try {
      const { data: business, error } = await supabase
        .from("businesses")
        .insert({
          name,
          contact_name: String(data.get("contact") ?? "").trim() || null,
          whatsapp: onlyDigits(String(data.get("whatsapp") ?? "")) || null,
          city: String(data.get("city") ?? "").trim() || null,
          municipality_id: String(data.get("municipality_id") ?? "") || null,
          district_id: String(data.get("district_id") ?? "") || null,
          source: String(data.get("origin") ?? "").trim() || null,
          stage: "mapeado",
          next_action: String(data.get("action") ?? "").trim() || null,
          next_action_date: date || null,
          potential_value: value,
          notes: String(data.get("notes") ?? "").trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Erro ao criar negócio:", error);
        setErrorMessage("Não foi possível salvar o negócio. Tente novamente.");
        return;
      }

      window.dispatchEvent(new CustomEvent("lazenda:new-business", {
        detail: business as Business,
      }));
      formRef.current?.reset();
      setOpen(false);
      window.location.hash = "pipeline";
    } catch (error) {
      console.error("Erro ao criar negócio:", error);
      setErrorMessage("Não foi possível salvar o negócio. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button className="new-deal" type="button" onClick={() => { setNameError(""); setErrorMessage(""); setOpen(true); }}>
        <span aria-hidden="true">+</span>Negócio
      </button>

      {open && createPortal(<div className="drawer-layer is-open">
        <button className="drawer-backdrop" type="button" aria-label="Fechar formulário" disabled={saving} onClick={() => setOpen(false)} />
        <aside className="deal-drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title">
          <header className="drawer-header">
            <div><p className="eyebrow">Novo cadastro</p><h2 id="drawer-title">Criar negócio</h2></div>
            <button className="drawer-close" type="button" aria-label="Fechar" onClick={() => setOpen(false)}>×</button>
          </header>

          <form className="deal-form" ref={formRef} onSubmit={saveDeal}>
            <BusinessFormFields nameRef={nameRef} nameError={nameError} onNameChange={() => setNameError("")} municipalityRequired />

            {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
            <footer className="drawer-actions">
              <button className="cancel-button" type="button" onClick={() => setOpen(false)}>Cancelar</button>
              <button className="save-button" type="submit" disabled={saving}>{saving ? "Salvando..." : "Salvar negócio"}</button>
            </footer>
          </form>
        </aside>
      </div>, document.body)}
    </>
  );
}
