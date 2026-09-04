import PipelineArea from "./pipeline-area";
import NewDealDrawer from "./new-deal-drawer";
import TodayView from "./today-view";

const pipeline = [
  { title: "Mapeado", key: "mapeado" },
  { title: "Abordado", key: "abordado" },
  { title: "Comunidade", key: "comunidade" },
  { title: "Diagnóstico", key: "diagnostico" },
  { title: "Oportunidade", key: "oportunidade" },
  { title: "Venda", key: "venda" },
  { title: "Cliente ativo", key: "cliente_ativo" },
  { title: "Expansão", key: "expansao" },
] as const;

function LeafMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M18.9 4.2C12.7 4.5 7.2 7.3 6.1 12.3c-.5 2.1.3 4.1 1.8 5.2 1.8 1.3 4.4 1 6.3-.5 3.5-2.8 4.2-8 4.7-12.8Z" />
        <path d="M5 20c1.9-4 4.8-7.1 9.1-9.4" />
      </svg>
    </span>
  );
}

export default function Home() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#hoje" aria-label="Lazenda — início"><LeafMark /><span>Lazenda</span></a>
        <nav className="main-nav" aria-label="Navegação principal">
          <a className="nav-link today-link active" href="#hoje">Hoje</a>
          <a className="nav-link pipeline-link" href="#pipeline">Pipeline</a>
          <span className="nav-link nav-disabled" aria-disabled="true">Dashboard</span>
        </nav>
        <NewDealDrawer />
      </header>

      <TodayView />

      <PipelineArea initialStages={pipeline}>
        <div>
            <p className="eyebrow">Jornada comercial</p>
            <h1>Pipeline</h1>
            <p className="intro">Acompanhe cada negócio, do primeiro contato à expansão.</p>
        </div>
      </PipelineArea>
    </div>
  );
}
