"use client";

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { supabase } from "@/lib/supabase";

export type Location = {
  id: string;
  name: string;
  type: "municipality" | "district";
  parent_id: string | null;
  state: string;
  state_code: string;
  active: boolean;
};

let cachedLocations: Location[] | null = null;
let locationsRequest: Promise<Location[]> | null = null;

function loadActiveMsLocations() {
  if (cachedLocations) return Promise.resolve(cachedLocations);
  if (locationsRequest) return locationsRequest;

  locationsRequest = (async () => {
    const { data, error } = await supabase
      .from("locations")
      .select("id, name, type, parent_id, state, state_code, active")
      .eq("active", true)
      .eq("state_code", "MS");

    if (error) throw error;

    cachedLocations = ((data ?? []) as Location[]).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" }),
    );
    return cachedLocations;
  })().finally(() => {
    locationsRequest = null;
  });

  return locationsRequest;
}

export function useLocations() {
  const [locations, setLocations] = useState<Location[]>(() => cachedLocations ?? []);
  const [loading, setLoading] = useState(() => cachedLocations === null);

  useEffect(() => {
    let active = true;

    loadActiveMsLocations()
      .then((loadedLocations) => {
        if (active) setLocations(loadedLocations);
      })
      .catch((error) => {
        console.error("Erro ao carregar localidades:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  return { locations, loading };
}

type LocationComboboxProps = {
  id?: string;
  label: string;
  name?: string;
  options: Location[];
  selectedId: string;
  onChange: (location: Location | null) => void;
  placeholder: string;
  required?: boolean;
  compact?: boolean;
  loading?: boolean;
  disabled?: boolean;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

export default function LocationCombobox({
  id,
  label,
  name,
  options,
  selectedId,
  onChange,
  placeholder,
  required = false,
  compact = false,
  loading = false,
  disabled = false,
}: LocationComboboxProps) {
  const generatedId = useId();
  const inputId = id ?? `location-${generatedId}`;
  const listId = `${inputId}-options`;
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = options.find((option) => option.id === selectedId) ?? null;
  const [searchQuery, setSearchQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const displayedValue = open ? searchQuery : selected?.name ?? "";

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const filteredOptions = useMemo(() => {
    const term = normalize(searchQuery);
    return term ? options.filter((option) => normalize(option.name).includes(term)) : options;
  }, [options, searchQuery]);

  const safeActiveIndex = Math.min(activeIndex, Math.max(filteredOptions.length - 1, 0));

  useEffect(() => {
    inputRef.current?.setCustomValidity(required && !selectedId ? "Selecione um município da lista." : "");
  }, [required, selectedId]);

  function selectOption(option: Location) {
    onChange(option);
    setSearchQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function openOptions() {
    if (open) return;
    setSearchQuery("");
    setActiveIndex(0);
    setOpen(true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        openOptions();
      } else {
        setActiveIndex((current) => Math.min(current + 1, filteredOptions.length - 1));
      }
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        setSearchQuery("");
        setOpen(true);
        setActiveIndex(Math.max(filteredOptions.length - 1, 0));
      } else {
        setActiveIndex((current) => Math.max(current - 1, 0));
      }
    } else if (event.key === "Enter" && open && filteredOptions[safeActiveIndex]) {
      event.preventDefault();
      selectOption(filteredOptions[safeActiveIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      setSearchQuery("");
    }
  }

  return (
    <div className={`location-combobox${compact ? " location-combobox-compact" : ""}`} ref={rootRef}>
      <label className={compact ? "sr-only" : undefined} htmlFor={inputId}>
        {label}{required && <em> *</em>}
      </label>
      <div className="location-input-wrap">
        <input
          ref={inputRef}
          id={inputId}
          role="combobox"
          type="text"
          autoComplete="off"
          value={displayedValue}
          placeholder={loading ? "Carregando..." : placeholder}
          disabled={loading || disabled}
          required={required}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={open && filteredOptions[safeActiveIndex] ? `${inputId}-option-${filteredOptions[safeActiveIndex].id}` : undefined}
          onFocus={openOptions}
          onClick={openOptions}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setActiveIndex(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {selectedId && (
          <button type="button" aria-label={`Limpar ${label.toLocaleLowerCase("pt-BR")}`} onClick={() => { onChange(null); setSearchQuery(""); inputRef.current?.focus(); }}>×</button>
        )}
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true"><path d="m6 8 4 4 4-4" /></svg>
      </div>
      {name && <input type="hidden" name={name} value={selectedId} />}
      {open && !loading && (
        <div className="location-options" id={listId} role="listbox">
          {filteredOptions.length ? filteredOptions.map((option, index) => (
            <button
              id={`${inputId}-option-${option.id}`}
              className={index === safeActiveIndex ? "active" : ""}
              type="button"
              role="option"
              aria-selected={option.id === selectedId}
              key={option.id}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectOption(option)}
            >
              <span>{option.name}</span><small>{option.state_code}</small>
            </button>
          )) : <p>Nenhuma localidade encontrada</p>}
        </div>
      )}
    </div>
  );
}
