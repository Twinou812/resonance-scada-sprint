"use client";

import { createClient } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    "",
);

type TelemetryRow = {
  engine_rpm?: number | string | null;
  operator_hr?: number | string | null;
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

async function persistTelemetry(patch: {
  engine_rpm?: number;
  operator_hr?: number;
}) {
  const { error } = await supabase
    .from("telemetry_state")
    .update(patch)
    .eq("id", 1);

  if (error) {
    console.error("telemetry_state update failed", error.message);
  }
}

type SensorSize = "primary" | "secondary";

type SensorBlockProps = {
  label: string;
  value: string | number;
  baseline?: string;
  colorClass?: string;
  unit?: string;
  size?: SensorSize;
  annotation?: string;
};

function SensorBlock({
  label,
  value,
  baseline,
  colorClass = "text-teal-400",
  unit,
  size = "secondary",
  annotation,
}: SensorBlockProps) {
  const isPrimary = size === "primary";

  return (
    <div className="min-w-0">
      <div className="text-[9px] uppercase tracking-[0.22em] text-neutral-500 xl:text-[10px]">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span
          className={`${
            isPrimary
              ? "text-3xl font-light leading-none tracking-tight lg:text-4xl xl:text-5xl"
              : "text-xl font-light leading-none tracking-tight xl:text-2xl"
          } whitespace-nowrap tabular-nums ${colorClass}`}
        >
          {value}
        </span>
        {unit ? (
          <span
            className={`uppercase tracking-wide text-neutral-500 ${
              isPrimary ? "text-[10px] xl:text-xs" : "text-[9px] xl:text-[10px]"
            }`}
          >
            {unit}
          </span>
        ) : null}
        {annotation ? (
          <span className="ml-1 text-[10px] uppercase tracking-[0.18em] text-amber-500">
            {annotation}
          </span>
        ) : null}
      </div>
      {baseline ? (
        <div className="mt-0.5 text-[9px] tabular-nums tracking-wide text-neutral-600 xl:text-[10px]">
          {baseline}
        </div>
      ) : null}
    </div>
  );
}

function PanelHeader({
  title,
  ambient,
  status = "ONLINE",
}: {
  title: string;
  ambient: string;
  status?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="truncate text-[9px] uppercase tracking-[0.2em] text-neutral-400 xl:text-[10px] xl:tracking-[0.28em]">
        {title}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-[9px] uppercase tracking-[0.16em] text-neutral-500 xl:gap-4 xl:text-[10px]">
        <span className="whitespace-nowrap">
          Ambient <span className="tabular-nums text-neutral-400">{ambient}</span>
        </span>
        <span className="flex items-center gap-1.5 whitespace-nowrap text-teal-400">
          <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
          {status}
        </span>
      </div>
    </div>
  );
}

function DockSlider({
  label,
  value,
  unit,
  min,
  max,
  step = 1,
  accent = "#2dd4bf",
  valueClassName = "text-teal-400",
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step?: number;
  accent?: string;
  valueClassName?: string;
  onChange: (next: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-[9px] uppercase tracking-[0.2em] text-neutral-500 xl:text-[10px]">
          {label}
        </span>
        <span className={`shrink-0 text-[11px] tabular-nums ${valueClassName}`}>
          {value}
          <span className="ml-1 text-neutral-500">{unit}</span>
        </span>
      </div>
      <input
        className="scada-slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        style={{
          background: `linear-gradient(to right, ${accent} 0%, ${accent} ${pct}%, #262626 ${pct}%, #262626 100%)`,
        }}
      />
    </label>
  );
}

function PlantNominalCalm({ operatorHr }: { operatorHr: number }) {
  return (
    <main className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
      <svg
        viewBox="0 0 120 120"
        className="h-40 w-40 text-emerald-400 xl:h-56 xl:w-56"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="60"
          cy="60"
          r="54"
          stroke="currentColor"
          strokeWidth="3.5"
        />
        <path
          d="M36 62.5 52 78 86 42"
          stroke="currentColor"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <h1 className="mt-8 text-4xl font-light uppercase tracking-[0.35em] text-emerald-400 xl:text-6xl">
        Plant Nominal
      </h1>
      <div className="mt-8 rounded-full border border-amber-400/70 bg-amber-400/10 px-5 py-2 text-center text-[11px] uppercase tracking-[0.22em] text-amber-400 xl:text-sm">
        Operator overload: HR {operatorHr} BPM — take a breath
      </div>
    </main>
  );
}

function CasualtyCalmPanel({
  rpm,
  jacket,
}: {
  rpm: number;
  jacket: number;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-neutral-950">
      <header className="flex items-center justify-between border-b border-neutral-900 px-4 py-2">
        <nav className="flex items-center gap-5 text-[9px] uppercase tracking-[0.28em] text-neutral-500">
          <span>Cons</span>
          <span className="text-neutral-300">Diesel</span>
          <span>Aux</span>
          <span>Hvac</span>
        </nav>
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.16em]">
          <div className="rounded border border-amber-500 px-2 py-1 text-amber-500">
            Casualty
          </div>
          <div className="rounded border border-neutral-800 px-2 py-1 text-neutral-400">
            Seastate <span className="tabular-nums text-teal-400">7/5</span>
          </div>
          <button className="rounded border border-neutral-700 px-2 py-1 text-neutral-400">
            Sea watch
          </button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 justify-center px-4 pt-6 xl:pt-10">
        <section className="h-fit w-full max-w-3xl border border-amber-500 bg-neutral-950">
          <div className="flex items-center justify-between gap-3 border-b border-amber-500/40 px-4 py-2">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-amber-500">
              <span className="text-amber-500">▴</span>
              Stbd Main Diesel — MTU 16V
            </div>
            <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.16em] text-neutral-500">
              <span>Asymmetric collapse</span>
              <span className="text-amber-500">State 3</span>
              <span>Turbocharger differential</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 border-b border-amber-500/30 px-4 py-4">
            <SensorBlock
              label="Engine RPM"
              value={rpm}
              unit="RPM"
              size="primary"
              colorClass="text-amber-500"
              annotation="⚠ Casualty"
            />
            <SensorBlock
              label="Jacket Water"
              value={jacket}
              unit="°F"
              size="primary"
              colorClass="text-teal-400"
            />
          </div>

          <div className="grid grid-cols-4 border-b border-amber-500/30">
            <div className="border-r border-amber-500/20 p-3">
              <SensorBlock
                label="Lube Oil Press"
                value={60}
                unit="PSI"
                baseline="40–80"
                colorClass="text-teal-400"
              />
            </div>
            <div className="border-r border-amber-500/20 p-3">
              <SensorBlock
                label="Lube Oil Temp"
                value={171}
                unit="°F"
                colorClass="text-teal-400"
              />
            </div>
            <div className="border-r border-amber-500/20 p-3">
              <SensorBlock
                label="Fuel Press"
                value={44}
                unit="PSI"
                baseline="40–60"
                colorClass="text-teal-400"
              />
            </div>
            <div className="p-3">
              <SensorBlock
                label="Turbo 1 RPM"
                value={8000}
                unit="RPM"
                colorClass="text-amber-500"
              />
            </div>
            <div className="border-r border-t border-amber-500/20 p-3">
              <SensorBlock
                label="Fuel Rack Posn"
                value={19}
                baseline="0–24"
                colorClass="text-teal-400"
              />
            </div>
            <div className="border-r border-t border-amber-500/20 p-3">
              <SensorBlock
                label="Coolant Press"
                value={17}
                unit="PSI"
                baseline="15–25"
                colorClass="text-teal-400"
              />
            </div>
            <div className="border-r border-t border-amber-500/20 p-3">
              <SensorBlock
                label="Exhaust Temp"
                value={815}
                unit="°F"
                colorClass="text-teal-400"
              />
            </div>
            <div className="border-t border-amber-500/20 p-3">
              <SensorBlock
                label="Turbo 2 RPM"
                value={32800}
                unit="RPM"
                colorClass="text-teal-400"
              />
            </div>
          </div>

          <div className="px-4 py-2 text-[10px] uppercase tracking-[0.16em] text-amber-500">
            Diagnostic feed: turbocharger differential detected — isolate lube
            oil and air side casualty
          </div>
        </section>
      </main>
    </div>
  );
}

function CasualtyOverloadAlert({
  rpm,
  onSecureDiesel,
}: {
  rpm: number;
  onSecureDiesel: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-black">
      <header className="flex items-center justify-between border-b border-red-900 px-4 py-2">
        <nav className="flex items-center gap-5 text-[9px] uppercase tracking-[0.28em] text-red-900">
          <span>Cons</span>
          <span className="text-red-700">Diesel</span>
          <span>Aux</span>
          <span>Hvac</span>
        </nav>
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.16em]">
          <div className="rounded border border-red-500 bg-red-900 px-2 py-1 text-red-100">
            Casualty
          </div>
          <button className="rounded border border-red-800 px-2 py-1 text-red-500">
            Sea watch
          </button>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center px-4">
        <section className="w-full max-w-5xl border border-red-500 bg-red-900 px-6 py-8 text-red-100 xl:px-12 xl:py-12">
          <div className="text-center text-[10px] uppercase tracking-[0.45em] text-red-200/80">
            Triage isolation · State 4
          </div>
          <h1 className="mt-4 text-center text-3xl font-light uppercase tracking-[0.18em] text-red-100 xl:text-6xl">
            Stbd MTU Runaway Casualty
          </h1>

          <div className="mt-8 grid grid-cols-3 divide-x divide-red-500/70 text-center">
            <div className="px-2">
              <div className="text-[9px] uppercase tracking-[0.28em] text-red-200/70">
                Engine RPM
              </div>
              <div className="mt-2 text-5xl font-light tabular-nums leading-none text-red-100 xl:text-7xl">
                {rpm}
              </div>
              <div className="mt-2 text-[9px] uppercase tracking-[0.22em] text-red-300">
                ↑ Runaway
              </div>
            </div>
            <div className="px-2">
              <div className="text-[9px] uppercase tracking-[0.28em] text-red-200/70">
                Turbo 1 RPM
              </div>
              <div className="mt-2 text-5xl font-light leading-none text-amber-400 xl:text-7xl">
                &lt;10k
              </div>
              <div className="mt-2 text-[9px] uppercase tracking-[0.22em] text-amber-500">
                ↓ Mechanical failure
              </div>
            </div>
            <div className="px-2">
              <div className="text-[9px] uppercase tracking-[0.28em] text-red-200/70">
                Turbo 2 RPM
              </div>
              <div className="mt-2 text-5xl font-light leading-none text-amber-400 xl:text-7xl">
                &gt;30k
              </div>
              <div className="mt-2 text-[9px] uppercase tracking-[0.22em] text-amber-500">
                ↑ Overspeed
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onSecureDiesel}
            className="mt-10 w-full bg-red-100 px-4 py-5 text-sm font-semibold uppercase tracking-[0.18em] text-red-950 xl:py-6 xl:text-xl"
          >
            Secure diesel — isolate turbo 1 lube oil & air bank
          </button>
        </section>
      </main>
    </div>
  );
}

export default function Home() {
  const [engineRpm, setEngineRpm] = useState(1800);
  const [jacketWater, setJacketWater] = useState(160);
  const [solarKw, setSolarKw] = useState(0);
  const [dampRate, setDampRate] = useState(72);
  const [operatorHr, setOperatorHr] = useState(78);

  useEffect(() => {
    let active = true;

    const applyRow = (row: TelemetryRow | null | undefined) => {
      if (!row) return;
      const nextRpm = asNumber(row.engine_rpm);
      const nextHr = asNumber(row.operator_hr);
      if (nextRpm !== null) setEngineRpm(nextRpm);
      if (nextHr !== null) setOperatorHr(nextHr);
    };

    const loadInitial = async () => {
      const { data, error } = await supabase
        .from("telemetry_state")
        .select("engine_rpm, operator_hr")
        .eq("id", 1)
        .single();

      if (error) {
        console.error("telemetry_state fetch failed", error.message);
        return;
      }
      if (active) applyRow(data);
    };

    void loadInitial();

    const channel = supabase
      .channel("telemetry_state")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "telemetry_state",
          filter: "id=eq.1",
        },
        (payload) => {
          applyRow(payload.new as TelemetryRow);
        },
      )
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const setEngineRpmAndPersist = (next: number) => {
    setEngineRpm(next);
    void persistTelemetry({ engine_rpm: next });
  };

  const setOperatorHrAndPersist = (next: number) => {
    setOperatorHr(next);
    void persistTelemetry({ operator_hr: next });
  };

  const isPlantNominal = engineRpm < 2000;
  const isPlantCasualty = engineRpm > 2000;
  const isOperatorOverloaded = operatorHr > 120;
  const isOperatorCalm = operatorHr <= 120;
  const isState2 = isPlantNominal && isOperatorOverloaded;
  const isState3 = isPlantCasualty && isOperatorCalm;
  const isState4 = isPlantCasualty && isOperatorOverloaded;

  const telemetry = useMemo(
    () => ({
      portDiesel: {
        rpm: engineRpm,
        jacket: jacketWater,
        lube: 62,
        fuel: 45,
        turbo1: 42500,
        turbo2: 42200,
      },
      stbdDiesel: {
        rpm: engineRpm,
        jacket: jacketWater + 2,
        lube: 60,
        fuel: 44,
        turbo1: 41800,
        turbo2: 41500,
      },
      portGen: {
        load: 250,
        voltage: 450,
        hz: "60.0",
        rpm: engineRpm,
        jacket: jacketWater - 5,
      },
      stbdGen: {
        load: 248,
        voltage: 450,
        hz: "60.0",
        rpm: engineRpm,
        jacket: jacketWater - 3,
      },
    }),
    [engineRpm, jacketWater],
  );

  return (
    <div
      className={`flex h-screen w-screen flex-col overflow-hidden font-mono text-neutral-300 ${
        isState4 ? "bg-black" : isState2 ? "bg-slate-950" : "bg-neutral-950"
      }`}
    >
      {isState4 ? (
        <CasualtyOverloadAlert
          rpm={engineRpm}
          onSecureDiesel={() => setEngineRpmAndPersist(600)}
        />
      ) : isState3 ? (
        <CasualtyCalmPanel rpm={engineRpm} jacket={jacketWater + 2} />
      ) : isState2 ? (
        <PlantNominalCalm operatorHr={operatorHr} />
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-12 grid-rows-[auto_1fr] overflow-hidden">
      <header className="col-span-12 grid grid-cols-12 items-center gap-3 border-b border-neutral-800 px-3 py-1.5 xl:px-4">
        <nav className="col-span-3 flex items-center gap-3 text-[9px] uppercase tracking-[0.22em] text-neutral-500 xl:gap-5 xl:text-[10px] xl:tracking-[0.28em]">
          <span>Cons</span>
          <span className="text-teal-400">Diesel</span>
          <span>Aux</span>
          <span>Hvac</span>
        </nav>

        <div className="col-span-4 flex items-center justify-center gap-3 whitespace-nowrap">
          <span className="text-[9px] uppercase tracking-[0.22em] text-neutral-500 xl:text-[10px]">
            Load total
          </span>
          <span className="text-sm tabular-nums text-teal-400">138 kW</span>
          <span className="h-px w-10 bg-teal-400/80 xl:w-16" />
        </div>

        <div className="col-span-5 flex items-center justify-end gap-2 text-[9px] uppercase tracking-[0.14em] xl:gap-3 xl:text-[10px] xl:tracking-[0.18em]">
          <div className="flex items-center gap-2 whitespace-nowrap rounded border border-neutral-800 px-2 py-1 text-neutral-400">
            <span className="text-teal-400">State 1</span>
            <span>Nominal</span>
            <span>High density</span>
          </div>
          <div className="whitespace-nowrap rounded border border-neutral-800 px-2 py-1 text-neutral-400">
            Seastate <span className="tabular-nums text-teal-400">7/5</span>
          </div>
          <button className="whitespace-nowrap rounded border border-teal-400/40 px-2 py-1 text-teal-400">
            Sea watch
          </button>
        </div>
      </header>

      <main className="col-span-12 grid min-h-0 grid-cols-12 grid-rows-2">
        <section className="col-span-6 flex min-h-0 flex-col overflow-hidden border-r border-b border-neutral-800 p-3 xl:p-5">
          <PanelHeader title="Port Main Diesel (MTU 16V)" ambient="82 °F" />
          <div className="mt-3 grid grid-cols-2 gap-6 xl:mt-4 xl:gap-8">
            <SensorBlock
              label="Engine RPM"
              value={telemetry.portDiesel.rpm}
              unit="RPM"
              size="primary"
              colorClass="text-teal-400"
            />
            <SensorBlock
              label="Jacket Water"
              value={telemetry.portDiesel.jacket}
              unit="°F"
              size="primary"
              colorClass="text-teal-400"
            />
          </div>
          <div className="min-h-3 flex-1" />
          <div className="grid grid-cols-4 gap-4 xl:gap-6">
            <SensorBlock
              label="Lube Oil Press"
              value={telemetry.portDiesel.lube}
              unit="PSI"
              baseline="40–80"
              colorClass="text-teal-400"
            />
            <SensorBlock
              label="Fuel Press"
              value={telemetry.portDiesel.fuel}
              unit="PSI"
              baseline="40–60"
              colorClass="text-teal-400"
            />
            <SensorBlock
              label="Turbo 1 RPM"
              value={telemetry.portDiesel.turbo1}
              unit="RPM"
              baseline="30k–45k"
              colorClass="text-teal-400"
            />
            <SensorBlock
              label="Turbo 2 RPM"
              value={telemetry.portDiesel.turbo2}
              unit="RPM"
              baseline="30k–45k"
              colorClass="text-teal-400"
            />
          </div>
        </section>

        <section className="col-span-6 flex min-h-0 flex-col overflow-hidden border-b border-neutral-800 p-3 xl:p-5">
          <PanelHeader title="Stbd Main Diesel (MTU 16V)" ambient="75 °F" />
          <div className="mt-3 grid grid-cols-2 gap-6 xl:mt-4 xl:gap-8">
            <SensorBlock
              label="Engine RPM"
              value={telemetry.stbdDiesel.rpm}
              unit="RPM"
              size="primary"
              colorClass="text-teal-400"
            />
            <SensorBlock
              label="Jacket Water"
              value={telemetry.stbdDiesel.jacket}
              unit="°F"
              size="primary"
              colorClass="text-teal-400"
            />
          </div>
          <div className="min-h-3 flex-1" />
          <div className="grid grid-cols-4 gap-4 xl:gap-6">
            <SensorBlock
              label="Lube Oil Press"
              value={telemetry.stbdDiesel.lube}
              unit="PSI"
              baseline="40–80"
              colorClass="text-teal-400"
            />
            <SensorBlock
              label="Fuel Press"
              value={telemetry.stbdDiesel.fuel}
              unit="PSI"
              baseline="40–60"
              colorClass="text-teal-400"
            />
            <SensorBlock
              label="Turbo 1 RPM"
              value={telemetry.stbdDiesel.turbo1}
              unit="RPM"
              baseline="30k–45k"
              colorClass="text-teal-400"
            />
            <SensorBlock
              label="Turbo 2 RPM"
              value={telemetry.stbdDiesel.turbo2}
              unit="RPM"
              baseline="30k–45k"
              colorClass="text-teal-400"
            />
          </div>
        </section>

        <section className="col-span-6 flex min-h-0 flex-col overflow-hidden border-r border-neutral-800 p-3 xl:p-5">
          <PanelHeader title="Port Gen" ambient="82 °F" />
          <div className="mt-3 grid grid-cols-3 gap-4 xl:mt-4 xl:gap-8">
            <SensorBlock
              label="Electrical Load"
              value={telemetry.portGen.load}
              unit="kW"
              size="primary"
              colorClass="text-teal-400"
            />
            <SensorBlock
              label="Voltage"
              value={telemetry.portGen.voltage}
              unit="VAC"
              size="primary"
              colorClass="text-teal-400"
            />
            <SensorBlock
              label="Frequency"
              value={telemetry.portGen.hz}
              unit="Hz"
              size="primary"
              colorClass="text-teal-400"
            />
          </div>
          <div className="min-h-3 flex-1" />
          <div className="grid grid-cols-2 gap-6 xl:gap-8">
            <SensorBlock
              label="Engine RPM"
              value={telemetry.portGen.rpm}
              unit="RPM"
              baseline="1700–1900"
              colorClass="text-teal-400"
            />
            <SensorBlock
              label="Jacket Water"
              value={telemetry.portGen.jacket}
              unit="°F"
              baseline="140–180"
              colorClass="text-teal-400"
            />
          </div>
        </section>

        <section className="col-span-6 flex min-h-0 flex-col overflow-hidden p-3 xl:p-5">
          <PanelHeader title="Stbd Gen" ambient="82 °F" />
          <div className="mt-3 grid grid-cols-3 gap-4 xl:mt-4 xl:gap-8">
            <SensorBlock
              label="Electrical Load"
              value={telemetry.stbdGen.load}
              unit="kW"
              size="primary"
              colorClass="text-teal-400"
            />
            <SensorBlock
              label="Voltage"
              value={telemetry.stbdGen.voltage}
              unit="VAC"
              size="primary"
              colorClass="text-teal-400"
            />
            <SensorBlock
              label="Frequency"
              value={telemetry.stbdGen.hz}
              unit="Hz"
              size="primary"
              colorClass="text-teal-400"
            />
          </div>
          <div className="min-h-3 flex-1" />
          <div className="grid grid-cols-2 gap-6 xl:gap-8">
            <SensorBlock
              label="Engine RPM"
              value={telemetry.stbdGen.rpm}
              unit="RPM"
              baseline="1700–1900"
              colorClass="text-teal-400"
            />
            <SensorBlock
              label="Jacket Water"
              value={telemetry.stbdGen.jacket}
              unit="°F"
              baseline="140–180"
              colorClass="text-teal-400"
            />
          </div>
        </section>
      </main>
        </div>
      )}

      <footer
        className={`grid grid-cols-12 items-center gap-4 px-3 py-2 xl:gap-6 xl:px-4 xl:py-3 ${
          isState4
            ? "border-t border-red-500 bg-black"
            : "border-t border-neutral-800"
        }`}
      >
        <div className="col-span-2 min-w-0">
          <div
            className={`text-[9px] uppercase tracking-[0.2em] xl:text-[10px] xl:tracking-[0.28em] ${
              isState4 ? "text-red-500" : "text-neutral-500"
            }`}
          >
            {isState4
              ? "Stabilizer control deck — casualty mode"
              : "Stabilizer control deck"}
          </div>
          <div className="mt-1 text-[9px] uppercase tracking-[0.18em] text-neutral-400 xl:mt-2 xl:text-[10px]">
            {isState3 || isState4 ? "Target thrust" : "Offset thrust"}
          </div>
          <div
            className={`mt-0.5 text-[10px] uppercase tracking-[0.16em] xl:text-[11px] ${
              isState4
                ? "text-red-500"
                : isState3
                  ? "text-amber-500"
                  : "text-teal-400"
            }`}
          >
            {isState3 || isState4 ? "Stbd MTS Dif / Casualty" : "All engines"}
          </div>
        </div>

        <div className="col-span-10 grid grid-cols-5 gap-4 xl:gap-6">
          <DockSlider
            label="Operator HR"
            value={operatorHr}
            unit="BPM"
            min={50}
            max={180}
            accent={
              isState4
                ? "#ef4444"
                : isOperatorOverloaded
                  ? "#fbbf24"
                  : "#2dd4bf"
            }
            valueClassName={
              isState4
                ? "text-red-500"
                : isOperatorOverloaded
                  ? "text-amber-400"
                  : "text-teal-400"
            }
            onChange={setOperatorHrAndPersist}
          />
          <DockSlider
            label="Solar PV Inverters"
            value={solarKw}
            unit="kW"
            min={0}
            max={120}
            onChange={setSolarKw}
          />
          <DockSlider
            label="Vibration Damp Rate"
            value={dampRate}
            unit="RPM"
            min={0}
            max={120}
            onChange={setDampRate}
          />
          <DockSlider
            label="Engine RPM"
            value={engineRpm}
            unit="RPM"
            min={600}
            max={3200}
            step={10}
            accent={
              isState4 ? "#ef4444" : isPlantCasualty ? "#f59e0b" : "#2dd4bf"
            }
            valueClassName={
              isState4
                ? "text-red-500"
                : isPlantCasualty
                  ? "text-amber-500"
                  : "text-teal-400"
            }
            onChange={setEngineRpmAndPersist}
          />
          <DockSlider
            label="Jacket Water Temp"
            value={jacketWater}
            unit="°F"
            min={120}
            max={210}
            onChange={setJacketWater}
          />
        </div>
      </footer>
    </div>
  );
}
