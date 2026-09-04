"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import type { Business } from "./pipeline-area";
import BusinessFormFields, { currencyToNumber, onlyDigits } from "./business-form-fields";

const stageLabels: Record<string, string> = {
  mapeado: "Mapeado",
  abordado: "Abordado",
  comunidade: "Comunidade",
  diagnostico: "Diagnóstico",
  oportunidade: "Oportunidade",
  venda: "Venda",
  cliente_ativo: "Cliente ativo",
  expansao: "Expansão",
};

type EditBusinessDrawerProps = {
  businessId: string;
  onClose: () => void;
  onUpdated: (business: Business) => void;
  onDeleted: (businessId: string) => void;
};

export default function EditBusinessDrawer({ businessId, onClose, onUpdated, onDeleted }: EditBusinessDrawerProps) {
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [nameError, setNameError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    async function loadBusiness() {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("id", businessId)
          .single();

        if (!active) return;
        if (error) {
          console.error("Erro ao carregar negócio:", error);
          setErrorMessage("Não foi possível carregar este negócio.");
          return;
        }
        setBusiness(data as Business);
      } catch (error) {
        console.error("Erro ao carregar negócio:", error);
        if (active) setErrorMessage("Não foi possível carregar este negócio.");
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBusiness();
    return () => { active = false; };
  }, [businessId]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape" || saving || deleting) return;
      if (confirmingDelete) {
        setConfirmingDelete(false);
        setErrorMessage("");
      } else {
        onClose();
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [confirmingDelete, deleting, onClose, saving]);

  async function saveBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!business) return;

    const data = new FormData(event.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    if (!name) {
      setNameError("Informe um nome que não contenha apenas espaços.");
      nameRef.current?.focus();
      return;
    }

    const date = String(data.get("date") ?? "");
    const value = currencyToNumber(String(data.get("value") ?? ""));
    setSaving(true);
    setErrorMessage("");

    try {
      const { data: updatedBusiness, error } = await supabase
        .from("businesses")
        .update({
          name,
          contact_name: String(data.get("contact") ?? "").trim() || null,
          whatsapp: onlyDigits(String(data.get("whatsapp") ?? "")) || null,
          city: String(data.get("city") ?? "").trim() || business.city || null,
          municipality_id: String(data.get("municipality_id") ?? "") || null,
          district_id: String(data.get("district_id") ?? "") || null,
          source: String(data.get("origin") ?? "").trim() || null,
          next_action: String(data.get("action") ?? "").trim() || null,
          next_action_date: date || null,
          potential_value: value,
          notes: String(data.get("notes") ?? "").trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", business.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao salvar negócio:", error);
        setErrorMessage("Não foi possível salvar as alterações.");
        return;
      }

      const savedBusiness = updatedBusiness as Business;
      onUpdated(savedBusiness);
      window.dispatchEvent(new CustomEvent("lazenda:business-updated", { detail: savedBusiness }));
      onClose();
    } catch (error) {
      console.error("Erro ao salvar negócio:", error);
      setErrorMessage("Não foi possível salvar as alterações.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteBusiness() {
    if (!business) return;

    setDeleting(true);
    setErrorMessage("");
    try {
      const { error } = await supabase.from("businesses").delete().eq("id", business.id);
      if (error) {
        console.error("Erro ao excluir negócio:", error);
        setErrorMessage("Não foi possível excluir este negócio.");
        return;
      }

      onDeleted(business.id);
      window.dispatchEvent(new CustomEvent("lazenda:business-deleted", { detail: business.id }));
      setConfirmingDelete(false);
      onClose();
    } catch (error) {
      console.error("Erro ao excluir negócio:", error);
      setErrorMessage("Não foi possível excluir este negócio.");
    } finally {
      setDeleting(false);
    }
  }

  return createPortal(
    <div className="drawer-layer is-open">
      <button className="drawer-backdrop" type="button" aria-label="Fechar negócio" onClick={onClose} />
      <aside className="deal-drawer" role="dialog" aria-modal="true" aria-labelledby="edit-drawer-title">
        <header className="drawer-header">
          <div><p className="eyebrow">Detalhes do negócio</p><h2 id="edit-drawer-title">Editar negócio</h2></div>
          <button className="drawer-close" type="button" aria-label="Fechar" onClick={onClose}>×</button>
        </header>

        {loading && <p className="drawer-status">Carregando negócio...</p>}
        {!loading && !business && <p className="drawer-status">{errorMessage}</p>}
        {business && (
          <form className="deal-form" onSubmit={saveBusiness}>
            <BusinessFormFields
                initialValues={{
                  name: business.name,
                  contact: business.contact_name ?? "",
                  whatsapp: business.whatsapp ?? "",
                  city: business.city ?? "",
                  municipalityId: business.municipality_id ?? "",
                  districtId: business.district_id ?? "",
                  origin: business.source ?? "",
                  action: business.next_action ?? "",
                  date: business.next_action_date ?? "",
                  value: business.potential_value,
                  notes: business.notes ?? "",
                }}
                nameRef={nameRef}
                nameError={nameError}
                onNameChange={() => setNameError("")}
                stageLabel={stageLabels[business.stage] ?? business.stage}
              />

            {errorMessage && <p className="form-error" role="alert">{errorMessage}</p>}
            <footer className="drawer-actions">
              <button className="delete-button" type="button" disabled={saving || deleting} onClick={() => { setErrorMessage(""); setConfirmingDelete(true); }}>Excluir negócio</button>
              <button className="cancel-button" type="button" disabled={saving || deleting} onClick={onClose}>Cancelar</button>
              <button className="save-button" type="submit" disabled={saving || deleting}>{saving ? "Salvando..." : "Salvar alterações"}</button>
            </footer>
          </form>
        )}
      </aside>

      {confirmingDelete && business && (
        <div className="confirm-layer">
          <button className="confirm-backdrop" type="button" aria-label="Cancelar exclusão" disabled={deleting} onClick={() => { setConfirmingDelete(false); setErrorMessage(""); }} />
          <div className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
            <span className="confirm-icon" aria-hidden="true">!</span>
            <h3 id="confirm-title">Excluir negócio?</h3>
            <p id="confirm-description">Esta ação excluirá permanentemente {business.name}.</p>
            {errorMessage && <p className="confirm-error" role="alert">{errorMessage}</p>}
            <div className="confirm-actions">
              <button className="cancel-button" type="button" autoFocus disabled={deleting} onClick={() => { setConfirmingDelete(false); setErrorMessage(""); }}>Cancelar</button>
              <button className="danger-button" type="button" disabled={deleting} onClick={deleteBusiness}>{deleting ? "Excluindo..." : "Excluir negócio"}</button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  );
}
