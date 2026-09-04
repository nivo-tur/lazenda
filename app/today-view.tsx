"use client";

import { useEffect, useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import EditBusinessDrawer from "./edit-business-drawer";
import type { Business } from "./pipeline-area";
import WhatsAppLink from "./whatsapp-link";
import { localDateKey } from "./business-date-utils";

const stageLabels: Record<string, string> = {
  mapeado: "Mapeado", abordado: "Abordado", comunidade: "Comunidade",
  diagnostico: "Diagnóstico", oportunidade: "Oportunidade", venda: "Venda",
  cliente_ativo: "Cliente ativo", expansao: "Expansão",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(`${value.slice(0, 10)}T12:00:00`))
    .replace(" de ", " ")
    .replace(".", "");
}

function formatValue(value: Business["potential_value"]) {
  if (value === null || value === "" || Number.isNaN(Number(value))) return null;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency", currency: "BRL", maximumFractionDigits: 0,
  }).format(Number(value));
}

function overdueDays(date: string, today: string) {
  const start = Date.parse(`${date.slice(0, 10)}T00:00:00Z`);
  const end = Date.parse(`${today}T00:00:00Z`);
  return Math.round((end - start) / 86_400_000);
}

function replaceBusiness(businesses: Business[], updated: Business) {
  return businesses.some((business) => business.id === updated.id)
    ? businesses.map((business) => business.id === updated.id ? updated : business)
    : [...businesses, updated];
}

function TodayHeaderArt() {
  return (
    <div className="today-header-art" aria-hidden="true">
      <svg viewBox="0 0 520 220" fill="none">
        <circle className="art-sun" cx="376" cy="55" r="25" />
        <path className="art-horizon" d="M12 155c70-29 116-31 180-5 61 25 111 20 165-15 52-34 94-34 151-7" />
        <path className="art-field" d="M10 174c88-17 159-13 226 3 78 19 171 13 272-24" />
        <path className="art-field art-field-soft" d="M55 195c91-18 171-10 244 2 65 11 126 5 186-17" />
        <g className="art-plant">
          <path d="M430 176c-2-33 2-65 18-96" />
          <path d="M440 106c-17-2-28-10-32-24 17-1 29 7 32 24Z" />
          <path d="M443 121c18-4 32-15 38-31-19 0-32 11-38 31Z" />
          <path d="M434 143c-17-3-29-12-34-27 18-1 31 9 34 27Z" />
        </g>
        <g className="art-grass">
          <path d="M84 176c0-20-4-35-14-48m14 48c2-23 9-41 21-55m-21 55c-6-18-15-30-27-39" />
          <path d="M122 178c0-14 4-27 13-39m-13 39c-3-14-10-25-20-33" />
        </g>
      </svg>
    </div>
  );
}

export default function TodayView() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [completingBusiness, setCompletingBusiness] = useState<Business | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completionError, setCompletionError] = useState("");
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const today = localDateKey();

  useEffect(() => {
    let active = true;

    async function loadBusinesses() {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .not("next_action_date", "is", null)
          .order("next_action_date", { ascending: true });

        if (!active) return;
        if (error) {
          console.error("Erro ao carregar ações de hoje:", error);
          return;
        }
        setBusinesses((data ?? []) as Business[]);
      } catch (error) {
        console.error("Erro ao carregar ações de hoje:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBusinesses();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function addOrUpdate(event: Event) {
      const business = (event as CustomEvent<Business>).detail;
      setBusinesses((current) => replaceBusiness(current, business));
    }
    function remove(event: Event) {
      const businessId = (event as CustomEvent<string>).detail;
      setBusinesses((current) => current.filter((business) => business.id !== businessId));
    }

    window.addEventListener("lazenda:new-business", addOrUpdate);
    window.addEventListener("lazenda:business-updated", addOrUpdate);
    window.addEventListener("lazenda:business-deleted", remove);
    return () => {
      window.removeEventListener("lazenda:new-business", addOrUpdate);
      window.removeEventListener("lazenda:business-updated", addOrUpdate);
      window.removeEventListener("lazenda:business-deleted", remove);
    };
  }, []);

  useEffect(() => {
    function closeCompletion(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape" && completingBusiness && !completing) {
        setCompletingBusiness(null);
        setCompletionError("");
      }
    }
    window.addEventListener("keydown", closeCompletion);
    return () => window.removeEventListener("keydown", closeCompletion);
  }, [completing, completingBusiness]);

  const groups = useMemo(() => {
    const dated = businesses.filter((business) => business.next_action_date);
    return {
      overdue: dated
        .filter((business) => business.next_action_date!.slice(0, 10) < today)
        .sort((a, b) => a.next_action_date!.localeCompare(b.next_action_date!)),
      today: dated.filter((business) => business.next_action_date!.slice(0, 10) === today),
      upcoming: dated
        .filter((business) => business.next_action_date!.slice(0, 10) > today)
        .sort((a, b) => a.next_action_date!.localeCompare(b.next_action_date!)),
    };
  }, [businesses, today]);

  async function completeAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!completingBusiness) return;
    const data = new FormData(event.currentTarget);
    const nextAction = String(data.get("next_action") ?? "").trim();
    const nextDate = String(data.get("next_action_date") ?? "");
    if (!nextAction) {
      setCompletionError("Informe a próxima ação para continuar.");
      return;
    }

    setCompleting(true);
    setCompletionError("");
    try {
      const { data: updated, error } = await supabase
        .from("businesses")
        .update({ next_action: nextAction, next_action_date: nextDate, updated_at: new Date().toISOString() })
        .eq("id", completingBusiness.id)
        .select()
        .single();

      if (error) {
        console.error("Erro ao concluir ação:", error);
        setCompletionError("Não foi possível atualizar a próxima ação.");
        return;
      }

      const updatedBusiness = updated as Business;
      setBusinesses((current) => replaceBusiness(current, updatedBusiness));
      window.dispatchEvent(new CustomEvent("lazenda:business-updated", { detail: updatedBusiness }));
      setCompletingBusiness(null);
    } catch (error) {
      console.error("Erro ao concluir ação:", error);
      setCompletionError("Não foi possível atualizar a próxima ação.");
    } finally {
      setCompleting(false);
    }
  }

  function openFromKeyboard(event: KeyboardEvent<HTMLElement>, businessId: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setSelectedBusinessId(businessId);
  }

  const visibleUpcoming = showAllUpcoming ? groups.upcoming : groups.upcoming.slice(0, 5);
  const hiddenUpcoming = groups.upcoming.length - visibleUpcoming.length;
  const sections = [
    { title: "Atrasados", tone: "overdue", items: groups.overdue, total: groups.overdue.length, empty: "Nenhuma ação atrasada." },
    { title: "Hoje", tone: "today", items: groups.today, total: groups.today.length, empty: "Seu dia está livre para novas oportunidades." },
    { title: "Próximos", tone: "upcoming", items: visibleUpcoming, total: groups.upcoming.length, empty: "Nenhuma próxima ação agendada." },
  ] as const;

  return (
    <main className="main-content today-view" id="hoje">
      <div className="page-heading today-heading">
        <div className="today-heading-copy">
          <p className="eyebrow">Visão do dia</p>
          <h1>Hoje</h1>
          {!loading && (
            <div className="operational-summary" aria-label="Resumo operacional">
              <span className="summary-stat summary-overdue"><i /><strong>{groups.overdue.length}</strong><small>{groups.overdue.length === 1 ? "atrasada" : "atrasadas"}</small></span>
              <span className="summary-stat summary-today"><i /><strong>{groups.today.length}</strong><small>para hoje</small></span>
              <span className="summary-stat summary-now"><i /><strong>{groups.overdue.length + groups.today.length}</strong><small>pendências agora</small></span>
            </div>
          )}
          <p className="intro">{loading ? "Carregando próximas ações..." : "Acompanhe o que merece sua atenção agora."}</p>
        </div>
        <TodayHeaderArt />
      </div>

      <section className="board today-board" aria-label="Próximas ações comerciais" aria-busy={loading}>
        {sections.map((section) => (
          <article className={`board-column action-column ${section.tone}`} key={section.title}>
            <header className="column-heading">
              <div className="column-title"><span className="status-dot" aria-hidden="true" /><h2>{section.title}</h2></div>
              <span className="count" aria-label={`${section.total} negócios`}>{section.total}</span>
            </header>

            <div className="action-list">
              {!loading && section.items.length === 0 && <div className="today-empty"><span aria-hidden="true">✓</span><p>{section.empty}</p></div>}
              {section.items.map((business) => {
                const value = formatValue(business.potential_value);
                const daysLate = section.tone === "overdue" ? overdueDays(business.next_action_date!, today) : 0;
                const delayTone = daysLate > 7 ? " delay-high" : daysLate > 3 ? " delay-medium" : "";
                return (
                  <article className={`action-card${delayTone}`} key={business.id} role="button" tabIndex={0} onClick={() => setSelectedBusinessId(business.id)} onKeyDown={(event) => openFromKeyboard(event, business.id)}>
                    <div className="action-card-heading"><h3>{business.name}</h3></div>
                    <p>{business.next_action || "Sem próxima ação informada"}</p>
                    <div className="action-urgency">
                      {section.tone === "overdue" ? <strong>{daysLate} {daysLate === 1 ? "dia" : "dias"} atrasado</strong> : <strong>{section.tone === "today" ? "Hoje" : formatDate(business.next_action_date!)}</strong>}
                      {section.tone === "overdue" && <time title={`Data original: ${formatDate(business.next_action_date!)}`}>{formatDate(business.next_action_date!)}</time>}
                    </div>
                    <div className="action-card-secondary"><span>{stageLabels[business.stage] ?? business.stage}</span>{value && <strong>{value}</strong>}</div>
                    <footer className="action-card-footer">
                      <WhatsAppLink whatsapp={business.whatsapp} />
                      <button type="button" className="complete-action" onKeyDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); setCompletionError(""); setCompletingBusiness(business); }}>Concluir ação</button>
                    </footer>
                  </article>
                );
              })}
              {section.tone === "upcoming" && groups.upcoming.length > 5 && (
                <button className="show-more-actions" type="button" aria-expanded={showAllUpcoming} onClick={() => setShowAllUpcoming((current) => !current)}>
                  {showAllUpcoming ? "Recolher" : `Ver mais ${hiddenUpcoming}`}
                </button>
              )}
            </div>
          </article>
        ))}
      </section>

      {selectedBusinessId && <EditBusinessDrawer businessId={selectedBusinessId} onClose={() => setSelectedBusinessId(null)} onUpdated={(business) => setBusinesses((current) => replaceBusiness(current, business))} onDeleted={(businessId) => setBusinesses((current) => current.filter((business) => business.id !== businessId))} />}

      {completingBusiness && createPortal(
        <div className="confirm-layer">
          <button className="confirm-backdrop" type="button" aria-label="Cancelar" disabled={completing} onClick={() => { setCompletingBusiness(null); setCompletionError(""); }} />
          <form className="confirm-dialog action-completion" role="dialog" aria-modal="true" aria-labelledby="completion-title" onSubmit={completeAction}>
            <span className="completion-icon" aria-hidden="true">✓</span>
            <h3 id="completion-title">Concluir ação</h3>
            <p>Qual será o próximo passo de {completingBusiness.name}?</p>
            <label className="field"><span>Próxima ação <em>*</em></span><input name="next_action" required maxLength={160} autoFocus placeholder="Ex.: Enviar proposta revisada" /></label>
            <label className="field"><span>Próxima data <em>*</em></span><div className="date-control"><input name="next_action_date" type="date" required /><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v3m10-3v3M4.5 9.5h15M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg></div></label>
            {completionError && <p className="confirm-error" role="alert">{completionError}</p>}
            <div className="confirm-actions">
              <button className="cancel-button" type="button" disabled={completing} onClick={() => { setCompletingBusiness(null); setCompletionError(""); }}>Cancelar</button>
              <button className="save-button" type="submit" disabled={completing}>{completing ? "Salvando..." : "Concluir ação"}</button>
            </div>
          </form>
        </div>, document.body,
      )}
    </main>
  );
}
