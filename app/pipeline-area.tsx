"use client";

import { useEffect, useMemo, useRef, useState, type DragEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import EditBusinessDrawer from "./edit-business-drawer";
import WhatsAppLink from "./whatsapp-link";
import { localDateKey } from "./business-date-utils";
import LocationCombobox, { useLocations } from "./location-combobox";

export type Business = {
  id: string;
  name: string;
  contact_name: string | null;
  whatsapp: string | null;
  city: string | null;
  municipality_id: string | null;
  district_id: string | null;
  source: string | null;
  stage: string;
  next_action: string | null;
  next_action_date: string | null;
  potential_value: number | string | null;
  notes: string | null;
  position: number | null;
  created_at: string;
  updated_at: string;
};

type StageDefinition = { readonly title: string; readonly key: string };
type Stage = StageDefinition & { businesses: Business[] };

function formatDate(value: string | null) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" })
    .format(new Date(`${value.slice(0, 10)}T12:00:00`))
    .replace(" de ", " ")
    .replace(".", "");
}

function formatValue(value: number | string | null) {
  if (value === null || value === "" || Number.isNaN(Number(value))) return undefined;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function moveBusiness(stages: Stage[], id: string, source: string, target: string) {
  const business = stages.find((stage) => stage.key === source)?.businesses.find((item) => item.id === id);
  if (!business) return stages;

  return stages.map((stage) => {
    if (stage.key === source) {
      return { ...stage, businesses: stage.businesses.filter((item) => item.id !== id) };
    }
    if (stage.key === target) {
      return { ...stage, businesses: [...stage.businesses, { ...business, stage: target }] };
    }
    return stage;
  });
}

export default function PipelineArea({ children, initialStages }: { children: ReactNode; initialStages: readonly StageDefinition[] }) {
  const areaRef = useRef<HTMLElement>(null);
  const boardDrag = useRef({ startX: 0, scrollLeft: 0, active: false });
  const ignoredCardClick = useRef<string | null>(null);
  const [stages, setStages] = useState<Stage[]>(() =>
    initialStages.map((stage) => ({ ...stage, businesses: [] })),
  );
  const [loading, setLoading] = useState(true);
  const [draggedBusiness, setDraggedBusiness] = useState<{ id: string; stage: string } | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [municipalityFilter, setMunicipalityFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [attentionFilter, setAttentionFilter] = useState("all");
  const totalBusinesses = stages.reduce((total, stage) => total + stage.businesses.length, 0);
  const today = localDateKey();
  const allBusinesses = useMemo(() => stages.flatMap((stage) => stage.businesses), [stages]);
  const { locations, loading: locationsLoading } = useLocations();
  const municipalities = useMemo(() => locations.filter((location) => location.type === "municipality"), [locations]);
  const districts = useMemo(() => locations.filter((location) => location.type === "district" && location.parent_id === municipalityFilter), [locations, municipalityFilter]);
  const withoutNextAction = allBusinesses.filter((business) =>
    !business.next_action?.trim() || !business.next_action_date,
  ).length;
  const filtersActive = Boolean(search.trim()) || stageFilter !== "all" || Boolean(municipalityFilter) || Boolean(districtFilter) || attentionFilter !== "all";

  const filteredStages = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const numericTerm = term.replace(/\D/g, "");

    return stages.map((stage) => ({
      ...stage,
      businesses: stage.businesses.filter((business) => {
        const matchesSearch = !term
          || business.name.toLocaleLowerCase("pt-BR").includes(term)
          || business.contact_name?.toLocaleLowerCase("pt-BR").includes(term)
          || Boolean(numericTerm && business.whatsapp?.replace(/\D/g, "").includes(numericTerm));
        const matchesStage = stageFilter === "all" || business.stage === stageFilter;
        const matchesMunicipality = !municipalityFilter || business.municipality_id === municipalityFilter;
        const matchesDistrict = !districtFilter || business.district_id === districtFilter;
        const date = business.next_action_date?.slice(0, 10);
        const matchesAttention = attentionFilter === "all"
          || (attentionFilter === "overdue" && Boolean(date && date < today))
          || (attentionFilter === "today" && date === today)
          || (attentionFilter === "missing" && (!business.next_action?.trim() || !date));

        return matchesSearch && matchesStage && matchesMunicipality && matchesDistrict && matchesAttention;
      }),
    }));
  }, [attentionFilter, districtFilter, municipalityFilter, search, stageFilter, stages, today]);
  const foundBusinesses = filteredStages.reduce((total, stage) => total + stage.businesses.length, 0);

  function clearFilters() {
    setSearch("");
    setStageFilter("all");
    setMunicipalityFilter("");
    setDistrictFilter("");
    setAttentionFilter("all");
  }

  useEffect(() => {
    let active = true;

    async function loadBusinesses() {
      try {
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .order("position", { ascending: true })
          .order("created_at", { ascending: true });

        if (!active) return;
        if (error) {
          console.error("Erro ao carregar negócios:", error);
          return;
        }

        const businesses = (data ?? []) as Business[];
        setStages((currentStages) => {
          const loadedIds = new Set(businesses.map((business) => business.id));
          const recentlyAdded = currentStages
            .flatMap((stage) => stage.businesses)
            .filter((business) => !loadedIds.has(business.id));
          const allBusinesses = [...businesses, ...recentlyAdded];

          return currentStages.map((stage) => ({
            ...stage,
            businesses: allBusinesses.filter((business) => business.stage === stage.key),
          }));
        });
      } catch (error) {
        console.error("Erro ao carregar negócios:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBusinesses();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function addBusiness(event: Event) {
      const business = (event as CustomEvent<Business>).detail;
      setStages((currentStages) => currentStages.map((stage) =>
        stage.key === "mapeado"
          ? { ...stage, businesses: [...stage.businesses, business] }
          : stage,
      ));
      areaRef.current?.scrollTo({ left: 0, behavior: "smooth" });
    }
    function updateFromElsewhere(event: Event) {
      const updatedBusiness = (event as CustomEvent<Business>).detail;
      setStages((currentStages) => currentStages.map((stage) => ({
        ...stage,
        businesses: stage.key === updatedBusiness.stage
          ? [...stage.businesses.filter((business) => business.id !== updatedBusiness.id), updatedBusiness]
          : stage.businesses.filter((business) => business.id !== updatedBusiness.id),
      })));
    }
    function removeFromElsewhere(event: Event) {
      const businessId = (event as CustomEvent<string>).detail;
      setStages((currentStages) => currentStages.map((stage) => ({
        ...stage,
        businesses: stage.businesses.filter((business) => business.id !== businessId),
      })));
    }

    window.addEventListener("lazenda:new-business", addBusiness);
    window.addEventListener("lazenda:business-updated", updateFromElsewhere);
    window.addEventListener("lazenda:business-deleted", removeFromElsewhere);
    return () => {
      window.removeEventListener("lazenda:new-business", addBusiness);
      window.removeEventListener("lazenda:business-updated", updateFromElsewhere);
      window.removeEventListener("lazenda:business-deleted", removeFromElsewhere);
    };
  }, []);

  function startBoardDrag(event: PointerEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (event.button !== 0 || event.pointerType !== "mouse" || !target.closest(".pipeline-canvas") || target.closest(".deal-card")) return;

    boardDrag.current = { startX: event.clientX, scrollLeft: event.currentTarget.scrollLeft, active: true };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.classList.add("is-dragging");
    event.preventDefault();
  }

  function moveBoard(event: PointerEvent<HTMLElement>) {
    if (!boardDrag.current.active || !areaRef.current) return;
    areaRef.current.scrollLeft = boardDrag.current.scrollLeft - (event.clientX - boardDrag.current.startX);
    event.preventDefault();
  }

  function stopBoardDrag(event: PointerEvent<HTMLElement>) {
    if (!boardDrag.current.active) return;
    boardDrag.current.active = false;
    event.currentTarget.classList.remove("is-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function startCardDrag(event: DragEvent<HTMLElement>, business: Business) {
    if ((event.target as HTMLElement).closest(".whatsapp-action")) {
      event.preventDefault();
      return;
    }
    ignoredCardClick.current = business.id;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", business.id);
    setDraggedBusiness({ id: business.id, stage: business.stage });
  }

  function allowCardDrop(event: DragEvent<HTMLElement>, stage: string) {
    if (!draggedBusiness) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropTarget(stage);
  }

  async function dropCard(event: DragEvent<HTMLElement>, targetStage: string) {
    event.preventDefault();
    const dragged = draggedBusiness;
    finishCardDrag();
    if (!dragged || dragged.stage === targetStage) return;

    setStages((currentStages) => moveBusiness(currentStages, dragged.id, dragged.stage, targetStage));

    try {
      const { error } = await supabase
        .from("businesses")
        .update({ stage: targetStage })
        .eq("id", dragged.id);

      if (!error) return;
      console.error("Erro ao mover negócio:", error);
    } catch (error) {
      console.error("Erro ao mover negócio:", error);
    }

    setStages((currentStages) => moveBusiness(currentStages, dragged.id, targetStage, dragged.stage));
  }

  function finishCardDrag() {
    setDraggedBusiness(null);
    setDropTarget(null);
    window.setTimeout(() => { ignoredCardClick.current = null; }, 0);
  }

  function openBusiness(businessId: string) {
    if (ignoredCardClick.current === businessId) return;
    setSelectedBusinessId(businessId);
  }

  function openBusinessWithKeyboard(event: KeyboardEvent<HTMLElement>, businessId: string) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    setSelectedBusinessId(businessId);
  }

  function updateBusiness(updatedBusiness: Business) {
    setStages((currentStages) => currentStages.map((stage) => ({
      ...stage,
      businesses: stage.key === updatedBusiness.stage
        ? [
            ...stage.businesses.filter((business) => business.id !== updatedBusiness.id),
            updatedBusiness,
          ]
        : stage.businesses.filter((business) => business.id !== updatedBusiness.id),
    })));
  }

  function removeBusiness(businessId: string) {
    setStages((currentStages) => currentStages.map((stage) => ({
      ...stage,
      businesses: stage.businesses.filter((business) => business.id !== businessId),
    })));
  }

  return (
    <main className="pipeline-view" id="pipeline" ref={areaRef} onPointerDown={startBoardDrag} onPointerMove={moveBoard} onPointerUp={stopBoardDrag} onPointerCancel={stopBoardDrag}>
      <div className="pipeline-heading">
        {children}
        <p className="pipeline-summary">
          {loading ? "Carregando negócios..." : <><strong>{totalBusinesses}</strong> negócios em andamento</>}
        </p>
      </div>
      <div className="pipeline-tools" aria-label="Busca e filtros do Pipeline">
        <div className="pipeline-toolbar">
          <label className="pipeline-search">
            <span className="sr-only">Buscar negócio ou contato</span>
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar negócio ou contato" />
            {search && <button type="button" aria-label="Limpar busca" onClick={() => setSearch("")}>×</button>}
          </label>

          <label className="pipeline-filter">
            <span className="sr-only">Filtrar por etapa</span>
            <select aria-label="Filtrar por etapa" value={stageFilter} onChange={(event) => setStageFilter(event.target.value)}>
              <option value="all">Todas as etapas</option>
              {initialStages.map((stage) => <option value={stage.key} key={stage.key}>{stage.title}</option>)}
            </select>
          </label>

          <LocationCombobox
            id="pipeline-municipality-filter"
            label="Filtrar por município"
            options={municipalities}
            selectedId={municipalityFilter}
            loading={locationsLoading}
            compact
            placeholder="Todos os municípios"
            onChange={(location) => {
              setMunicipalityFilter(location?.id ?? "");
              setDistrictFilter("");
            }}
          />

          {municipalityFilter && districts.length > 0 && (
            <LocationCombobox
              id="pipeline-district-filter"
              label="Filtrar por distrito"
              options={districts}
              selectedId={districtFilter}
              compact
              placeholder="Todos os distritos"
              onChange={(location) => setDistrictFilter(location?.id ?? "")}
            />
          )}

          <label className="pipeline-filter attention-filter">
            <span className="sr-only">Filtrar por atenção</span>
            <select aria-label="Filtrar por atenção" value={attentionFilter} onChange={(event) => setAttentionFilter(event.target.value)}>
              <option value="all">Todos</option>
              <option value="overdue">Atrasados</option>
              <option value="today">Para hoje</option>
              <option value="missing">Sem próxima ação</option>
            </select>
          </label>
        </div>

        {(withoutNextAction > 0 || filtersActive) && (
          <div className="pipeline-filter-status">
            {withoutNextAction > 0 && <button className={`missing-action-filter${attentionFilter === "missing" ? " active" : ""}`} type="button" aria-pressed={attentionFilter === "missing"} onClick={() => setAttentionFilter("missing")}><span />{withoutNextAction} sem próxima ação</button>}
            {filtersActive && <span>{foundBusinesses} {foundBusinesses === 1 ? "negócio encontrado" : "negócios encontrados"}</span>}
            {filtersActive && <button className="clear-filters" type="button" onClick={clearFilters}>Limpar filtros</button>}
          </div>
        )}
      </div>

      {filtersActive && foundBusinesses === 0 && (
        <div className="pipeline-filter-empty"><span aria-hidden="true">⌕</span><p>Nenhum negócio atende aos filtros.</p><button type="button" onClick={clearFilters}>Limpar filtros</button></div>
      )}
      <div className="pipeline-scroll" tabIndex={0} aria-label="Pipeline de vendas. Role horizontalmente para ver todas as etapas.">
        <div className="pipeline-canvas">
          <div className="phase-row" aria-label="Fases do pipeline">
            <div className="phase acquisition"><span>Aquisição</span></div>
            <div className="phase conversion"><span>Conversão</span></div>
            <div className="phase expansion"><span>Expansão</span></div>
          </div>
          <section className="kanban" aria-label="Etapas do pipeline" aria-busy={loading}>
            {filteredStages.map((stage) => (
              <article className={`kanban-column${dropTarget === stage.key ? " is-drop-target" : ""}`} key={stage.key} onDragEnter={(event) => allowCardDrop(event, stage.key)} onDragOver={(event) => allowCardDrop(event, stage.key)} onDrop={(event) => dropCard(event, stage.key)}>
                <header className="kanban-heading"><h2>{stage.title}</h2><span>{stage.businesses.length}</span></header>
                <div className="deal-list">
                  {stage.businesses.map((business) => {
                    const value = formatValue(business.potential_value);
                    return (
                      <article className={`deal-card${draggedBusiness?.id === business.id ? " is-being-dragged" : ""}`} draggable key={business.id} role="button" tabIndex={0} onClick={() => openBusiness(business.id)} onKeyDown={(event) => openBusinessWithKeyboard(event, business.id)} onDragStart={(event) => startCardDrag(event, business)} onDragEnd={finishCardDrag}>
                        <h3>{business.name}</h3>
                        <p className="next-action">{business.next_action || "Definir próxima ação"}</p>
                        <div className="deal-meta"><time>{formatDate(business.next_action_date)}</time>{value && <strong>{value}</strong>}</div>
                        <WhatsAppLink whatsapp={business.whatsapp} />
                      </article>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
      {selectedBusinessId && (
        <EditBusinessDrawer
          businessId={selectedBusinessId}
          onClose={() => setSelectedBusinessId(null)}
          onUpdated={updateBusiness}
          onDeleted={removeBusiness}
        />
      )}
    </main>
  );
}
