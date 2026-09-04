"use client";

import { useRef, useState, type FormEvent, type RefObject } from "react";
import LocationCombobox, { useLocations } from "./location-combobox";

export type BusinessFormValues = {
  name?: string;
  contact?: string;
  whatsapp?: string;
  city?: string;
  municipalityId?: string;
  districtId?: string;
  origin?: string;
  action?: string;
  date?: string;
  value?: number | string | null;
  notes?: string;
};

type BusinessFormFieldsProps = {
  initialValues?: BusinessFormValues;
  nameRef?: RefObject<HTMLInputElement | null>;
  nameError?: string;
  onNameChange?: () => void;
  stageLabel?: string;
  municipalityRequired?: boolean;
};

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function currencyToNumber(value: string) {
  const digits = onlyDigits(value);
  return digits ? Number(digits) / 100 : null;
}

function formatPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  const area = digits.slice(0, 2);
  const number = digits.slice(2);
  const split = number.length > 8 ? 5 : 4;
  return `(${area}) ${number.slice(0, split)}${number.length > split ? `-${number.slice(split)}` : ""}`;
}

function formatCurrencyDigits(digits: string) {
  if (!digits) return "";
  const cents = Number(digits.slice(0, 10)) / 100;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents);
}

function initialCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "";
  return formatCurrencyDigits(String(Math.round(Number(value) * 100)));
}

function CharacterCount({ length, max, threshold }: { length: number; max: number; threshold: number }) {
  if (length < threshold) return null;
  return <small className="character-count" aria-live="polite">{length}/{max}</small>;
}

export default function BusinessFormFields({ initialValues = {}, nameRef, nameError, onNameChange, stageLabel, municipalityRequired = false }: BusinessFormFieldsProps) {
  const dateRef = useRef<HTMLInputElement>(null);
  const [phone, setPhone] = useState(() => formatPhone(initialValues.whatsapp ?? ""));
  const [currency, setCurrency] = useState(() => initialCurrency(initialValues.value));
  const [lengths, setLengths] = useState({
    name: initialValues.name?.length ?? 0,
    action: initialValues.action?.length ?? 0,
    notes: initialValues.notes?.length ?? 0,
  });
  const { locations, loading: locationsLoading } = useLocations();
  const [municipalityId, setMunicipalityId] = useState(initialValues.municipalityId ?? "");
  const [districtId, setDistrictId] = useState(initialValues.districtId ?? "");
  const municipalities = locations.filter((location) => location.type === "municipality");
  const districts = locations.filter((location) => location.type === "district" && location.parent_id === municipalityId);
  const municipality = municipalities.find((location) => location.id === municipalityId);

  function trackLength(field: keyof typeof lengths, event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const length = event.currentTarget.value.length;
    setLengths((current) => ({ ...current, [field]: length }));
    if (field === "name") onNameChange?.();
  }

  return (
    <div className="form-fields">
      {stageLabel && <div className="current-stage"><span>Etapa atual</span><strong>{stageLabel}</strong></div>}
      <label className={`field field-primary${nameError ? " field-invalid" : ""}`}>
        <span>Nome do negócio <em>*</em></span>
        <input ref={nameRef} name="name" required maxLength={100} autoComplete="off" placeholder="Ex.: Fazenda Boa Vista" defaultValue={initialValues.name ?? ""} aria-invalid={Boolean(nameError)} aria-describedby={nameError ? "name-error" : undefined} onInput={(event) => trackLength("name", event)} />
        {nameError && <small className="field-error" id="name-error">{nameError}</small>}
        <CharacterCount length={lengths.name} max={100} threshold={85} />
      </label>

      <label className="field field-primary">
        <span>Próxima ação</span>
        <input name="action" maxLength={160} autoComplete="off" placeholder="Ex.: Agendar conversa" defaultValue={initialValues.action ?? ""} onInput={(event) => trackLength("action", event)} />
        <CharacterCount length={lengths.action} max={160} threshold={135} />
      </label>

      <label className="field"><span>Nome do contato</span><input name="contact" maxLength={80} autoComplete="name" placeholder="Nome da pessoa" defaultValue={initialValues.contact ?? ""} /></label>
      <label className="field"><span>WhatsApp</span><input name="whatsapp" type="tel" inputMode="numeric" autoComplete="tel" placeholder="(67) 99999-9999" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} /></label>
      <div className="field location-field">
        <LocationCombobox
          label="Município"
          name="municipality_id"
          options={municipalities}
          selectedId={municipalityId}
          required={municipalityRequired}
          loading={locationsLoading}
          placeholder="Pesquise um município"
          onChange={(location) => {
            setMunicipalityId(location?.id ?? "");
            setDistrictId("");
          }}
        />
        <input type="hidden" name="city" value={municipality?.name ?? ""} />
        {!municipalityId && initialValues.city && <small className="legacy-location">Localidade anterior: {initialValues.city}</small>}
      </div>
      <div className="field location-field">
        <LocationCombobox
          label="Distrito"
          name="district_id"
          options={districts}
          selectedId={districtId}
          loading={locationsLoading}
          disabled={!municipalityId || districts.length === 0}
          placeholder={municipalityId ? "Selecione um distrito" : "Selecione o município primeiro"}
          onChange={(location) => setDistrictId(location?.id ?? "")}
        />
        {!locationsLoading && municipalityId && districts.length === 0 && <small className="location-empty-note">Nenhum distrito cadastrado</small>}
      </div>
      <label className="field"><span>Origem</span><input name="origin" maxLength={80} autoComplete="off" placeholder="Indicação, evento..." defaultValue={initialValues.origin ?? ""} /></label>

      <label className="field">
        <span>Data da próxima ação</span>
        <div className="date-control" onClick={(event) => { if (event.target !== dateRef.current) dateRef.current?.showPicker?.(); }}>
          <input ref={dateRef} name="date" type="date" defaultValue={initialValues.date?.slice(0, 10) ?? ""} />
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v3m10-3v3M4.5 9.5h15M6 5h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" /></svg>
        </div>
      </label>

      <label className="field">
        <span>Valor potencial</span>
        <input className="currency-control" name="value" type="text" inputMode="numeric" autoComplete="off" placeholder="R$ 0,00" value={currency} onChange={(event) => setCurrency(formatCurrencyDigits(onlyDigits(event.target.value).slice(0, 10)))} />
      </label>

      <label className="field field-wide">
        <span>Observações</span>
        <textarea name="notes" rows={3} maxLength={2000} placeholder="Contexto adicional sobre o negócio" defaultValue={initialValues.notes ?? ""} onInput={(event) => trackLength("notes", event)} />
        <CharacterCount length={lengths.notes} max={2000} threshold={1800} />
      </label>
    </div>
  );
}
