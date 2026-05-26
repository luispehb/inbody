import Head from "next/head";
import { useState } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend } from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import type { GetServerSideProps } from "next";
import { createClient } from "@supabase/supabase-js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend);

const gridColor = "rgba(156,163,175,0.15)";
const tickColor = "#9ca3af";

interface Measurement {
  id: number; measured_at: string; weight_kg: number; skeletal_muscle_mass_kg: number;
  body_fat_mass_kg: number; body_fat_pct: number; bmi: number; bmr_kcal: number;
  inbody_score: number; total_body_water_l: number; right_arm_lean_kg: number;
  left_arm_lean_kg: number; trunk_lean_kg: number; right_leg_lean_kg: number;
  left_leg_lean_kg: number; right_arm_fat_kg: number; left_arm_fat_kg: number;
  trunk_fat_kg: number; right_leg_fat_kg: number; left_leg_fat_kg: number;
  waist_hip_ratio?: number; visceral_fat_level?: number; protein_kg?: number; mineral_kg?: number;
}

function simpleLineOptions(min: number, max: number) {
  return { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } },
    scales: { x: { ticks: { font: { size: 10 }, color: tickColor, autoSkip: false, maxRotation: 40 }, grid: { color: gridColor } },
      y: { min, max, ticks: { font: { size: 10 }, color: tickColor }, grid: { color: gridColor } } } } as const;
}

const verticalLine = {
  id: "verticalLine",
  afterDraw(chart: any, _args: any, options: { index?: number }) {
    if (options.index == null) return;
    const pt = chart.getDatasetMeta(0).data[options.index];
    if (!pt) return;
    const { ctx, chartArea: { top, bottom } } = chart;
    ctx.save(); ctx.beginPath(); ctx.moveTo(pt.x, top); ctx.lineTo(pt.x, bottom);
    ctx.strokeStyle = "rgba(99,102,241,0.5)"; ctx.lineWidth = 2; ctx.setLineDash([4,3]); ctx.stroke(); ctx.restore();
  },
};

function CompositionChart({ measurements, highlightIndex }: { measurements: Measurement[]; highlightIndex: number }) {
  const sorted = [...measurements].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
  const labels = sorted.map((m) => new Date(m.measured_at).toLocaleDateString("es-GT", { month: "short", year: "2-digit" }));
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Evolución de composición corporal</p>
      <div className="flex gap-5 flex-wrap mb-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#378ADD]" />Masa muscular (eje izq.)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#D85A30]" />Grasa corporal (eje izq.)</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-4 border-t-2 border-dashed border-gray-400" />Peso total (eje der.)</span>
      </div>
      <div style={{ height: 300 }}>
        <Line data={{ labels, datasets: [
          { label: "Masa muscular", data: sorted.map((m) => m.skeletal_muscle_mass_kg), borderColor: "#378ADD", backgroundColor: "rgba(55,138,221,0.08)", tension: 0.35, pointRadius: 5, fill: true, yAxisID: "yLeft", borderWidth: 2 },
          { label: "Grasa corporal", data: sorted.map((m) => m.body_fat_mass_kg), borderColor: "#D85A30", backgroundColor: "rgba(216,90,48,0.06)", tension: 0.35, pointRadius: 5, fill: true, yAxisID: "yLeft", borderWidth: 2 },
          { label: "Peso total", data: sorted.map((m) => m.weight_kg), borderColor: "#888780", backgroundColor: "transparent", tension: 0.35, pointRadius: 4, fill: false, yAxisID: "yRight", borderWidth: 1.5, borderDash: [5,4] },
        ]}}
        options={{ responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
          plugins: { legend: { display: false }, verticalLine: { index: highlightIndex } } as any,
          scales: { x: { ticks: { font: { size: 11 }, color: tickColor, autoSkip: false, maxRotation: 40 }, grid: { color: gridColor } },
            yLeft: { type: "linear", position: "left", min: 6, max: 34, ticks: { font: { size: 11 }, color: tickColor, callback: (v: any) => v + " kg" }, grid: { color: gridColor } },
            yRight: { type: "linear", position: "right", min: 62, max: 68, ticks: { font: { size: 11 }, color: tickColor, callback: (v: any) => v + " kg" }, grid: { drawOnChartArea: false } } } }}
        plugins={[verticalLine as any]} />
      </div>
    </div>
  );
}

function FatPctChart({ measurements }: { measurements: Measurement[] }) {
  const sorted = [...measurements].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
  const labels = sorted.map((m) => new Date(m.measured_at).toLocaleDateString("es-GT", { month: "short", year: "2-digit" }));
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">% Grasa corporal</p>
      <div style={{ height: 160 }}>
        <Line data={{ labels, datasets: [{ data: sorted.map((m) => m.body_fat_pct), borderColor: "#D85A30", backgroundColor: "rgba(216,90,48,0.1)", tension: 0.35, pointRadius: 3, fill: true }] }} options={simpleLineOptions(8, 20)} />
      </div>
    </div>
  );
}

function InBodyScoreChart({ measurements }: { measurements: Measurement[] }) {
  const sorted = [...measurements].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
  const labels = sorted.map((m) => new Date(m.measured_at).toLocaleDateString("es-GT", { month: "short", year: "2-digit" }));
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">InBody Score</p>
      <div style={{ height: 160 }}>
        <Line data={{ labels, datasets: [{ data: sorted.map((m) => m.inbody_score), borderColor: "#1D9E75", backgroundColor: "rgba(29,158,117,0.1)", tension: 0.35, pointRadius: 3, fill: true }] }} options={simpleLineOptions(75, 90)} />
      </div>
    </div>
  );
}

function TotalWaterChart({ measurements }: { measurements: Measurement[] }) {
  const sorted = [...measurements].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
  const labels = sorted.map((m) => new Date(m.measured_at).toLocaleDateString("es-GT", { month: "short", year: "2-digit" }));
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-3">Agua corporal total (L)</p>
      <div style={{ height: 140 }}>
        <Bar data={{ labels, datasets: [{ data: sorted.map((m) => m.total_body_water_l), backgroundColor: "rgba(29,158,117,0.6)", borderRadius: 4 }] }}
          options={{ ...simpleLineOptions(39, 43), scales: { ...simpleLineOptions(39, 43).scales, y: { min: 39, ticks: { font: { size: 10 }, color: tickColor }, grid: { color: gridColor } } } }} />
      </div>
    </div>
  );
}

const SEGMENT_LABELS = ["Tronco", "Pierna D", "Pierna I", "Brazo D", "Brazo I"];
function horizontalBarOptions(max: number) {
  return { responsive: true, maintainAspectRatio: false, indexAxis: "y" as const, plugins: { legend: { display: false } },
    scales: { x: { max, ticks: { font: { size: 10 }, color: tickColor }, grid: { color: gridColor } }, y: { ticks: { font: { size: 11 }, color: tickColor }, grid: { color: gridColor } } } };
}

function SegmentSnapshot({ latest }: { latest: Measurement }) {
  const lean = [latest.trunk_lean_kg, latest.right_leg_lean_kg, latest.left_leg_lean_kg, latest.right_arm_lean_kg, latest.left_arm_lean_kg];
  const fat = [latest.trunk_fat_kg, latest.right_leg_fat_kg, latest.left_leg_fat_kg, latest.right_arm_fat_kg, latest.left_arm_fat_kg];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Distribución por segmento · última medición</p>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <p className="text-xs text-gray-400 mb-2">Masa magra (kg)</p>
          <div style={{ height: 200 }}><Bar data={{ labels: SEGMENT_LABELS, datasets: [{ data: lean, backgroundColor: ["#378ADD","#5DCAA5","#5DCAA5","#AFA9EC","#AFA9EC"], borderRadius: 4 }] }} options={horizontalBarOptions(30)} /></div>
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-2">Masa grasa (kg)</p>
          <div style={{ height: 200 }}><Bar data={{ labels: SEGMENT_LABELS, datasets: [{ data: fat, backgroundColor: ["#D85A30","#F0997B","#F0997B","#FAC775","#FAC775"], borderRadius: 4 }] }} options={horizontalBarOptions(6)} /></div>
        </div>
      </div>
    </div>
  );
}

function LimbEvolutionChart({ measurements }: { measurements: Measurement[] }) {
  const sorted = [...measurements].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
  const labels = sorted.map((m) => new Date(m.measured_at).toLocaleDateString("es-GT", { month: "short", year: "2-digit" }));
  const series = [
    { key: "lean", title: "Masa magra por extremidad (kg)",
      datasets: [
        { label: "Brazo D", data: sorted.map((m) => m.right_arm_lean_kg), borderColor: "#AFA9EC", backgroundColor: "rgba(175,169,236,0.1)", tension: 0.35, pointRadius: 4, borderWidth: 2 },
        { label: "Brazo I", data: sorted.map((m) => m.left_arm_lean_kg), borderColor: "#7C76C8", backgroundColor: "transparent", tension: 0.35, pointRadius: 4, borderDash: [4,3], borderWidth: 2 },
        { label: "Pierna D", data: sorted.map((m) => m.right_leg_lean_kg), borderColor: "#5DCAA5", backgroundColor: "rgba(93,202,165,0.1)", tension: 0.35, pointRadius: 4, borderWidth: 2 },
        { label: "Pierna I", data: sorted.map((m) => m.left_leg_lean_kg), borderColor: "#2A9D7A", backgroundColor: "transparent", tension: 0.35, pointRadius: 4, borderDash: [4,3], borderWidth: 2 },
        { label: "Tronco", data: sorted.map((m) => m.trunk_lean_kg), borderColor: "#378ADD", backgroundColor: "rgba(55,138,221,0.06)", tension: 0.35, pointRadius: 4, borderWidth: 2, yAxisID: "yRight" },
      ], yLeftMin: 3, yLeftMax: 9, yRightMin: 24, yRightMax: 28 },
    { key: "fat", title: "Masa grasa por extremidad (kg)",
      datasets: [
        { label: "Brazo D", data: sorted.map((m) => m.right_arm_fat_kg), borderColor: "#FAC775", backgroundColor: "rgba(250,199,117,0.1)", tension: 0.35, pointRadius: 4, borderWidth: 2 },
        { label: "Brazo I", data: sorted.map((m) => m.left_arm_fat_kg), borderColor: "#E8A020", backgroundColor: "transparent", tension: 0.35, pointRadius: 4, borderDash: [4,3], borderWidth: 2 },
        { label: "Pierna D", data: sorted.map((m) => m.right_leg_fat_kg), borderColor: "#F0997B", backgroundColor: "rgba(240,153,123,0.1)", tension: 0.35, pointRadius: 4, borderWidth: 2 },
        { label: "Pierna I", data: sorted.map((m) => m.left_leg_fat_kg), borderColor: "#D85A30", backgroundColor: "transparent", tension: 0.35, pointRadius: 4, borderDash: [4,3], borderWidth: 2 },
        { label: "Tronco", data: sorted.map((m) => m.trunk_fat_kg), borderColor: "#9B3A18", backgroundColor: "rgba(155,58,24,0.06)", tension: 0.35, pointRadius: 4, borderWidth: 2, yAxisID: "yRight" },
      ], yLeftMin: 0, yLeftMax: 2, yRightMin: 2, yRightMax: 7 },
  ];
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Evolución por segmento corporal</p>
      {series.map((s) => (
        <div key={s.key}>
          <p className="text-xs text-gray-500 font-medium mb-3">{s.title}</p>
          <div className="flex gap-4 flex-wrap mb-3 text-xs text-gray-400">
            {s.datasets.slice(0,4).map((ds) => (
              <span key={ds.label} className="flex items-center gap-1.5">
                <span style={{ display: "inline-block", width: 20, height: 2, background: ds.borderColor, borderRadius: 1 }} />{ds.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5"><span style={{ display: "inline-block", width: 20, height: 2, background: s.datasets[4].borderColor, borderRadius: 1 }} />Tronco (eje der.)</span>
          </div>
          <div style={{ height: 240 }}>
            <Line data={{ labels, datasets: s.datasets as any }}
              options={{ responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
                plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} kg` } } },
                scales: { x: { ticks: { font: { size: 10 }, color: tickColor, autoSkip: false, maxRotation: 40 }, grid: { color: gridColor } },
                  y: { type: "linear", position: "left", min: s.yLeftMin, max: s.yLeftMax, ticks: { font: { size: 10 }, color: tickColor, callback: (v: any) => v + " kg" }, grid: { color: gridColor } },
                  yRight: { type: "linear", position: "right", min: s.yRightMin, max: s.yRightMax, ticks: { font: { size: 10 }, color: tickColor, callback: (v: any) => v + " kg" }, grid: { drawOnChartArea: false } } } }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({ label, value, delta, deltaType = "neutral" }: { label: string; value: string; delta?: string; deltaType?: "good" | "bad" | "neutral" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 cursor-default transition-all duration-150 hover:border-gray-200 hover:shadow-sm">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 leading-tight tabular-nums">{value}</p>
      {delta && <p className={`text-xs mt-1 ${deltaType === "good" ? "text-emerald-500" : deltaType === "bad" ? "text-red-400" : "text-gray-400"}`}>{delta}</p>}
    </div>
  );
}

export default function Home({ measurements }: { measurements: Measurement[] }) {
  const sorted = [...measurements].sort((a, b) => new Date(a.measured_at).getTime() - new Date(b.measured_at).getTime());
  const [selectedIndex, setSelectedIndex] = useState(sorted.length - 1);
  const selected = sorted[selectedIndex] ?? sorted[sorted.length - 1];
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (!selected) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400 text-sm">No hay mediciones todavía.</p></div>;
  const peakWeight = Math.max(...sorted.map((m) => m.weight_kg));
  const peakFat = Math.max(...sorted.map((m) => m.body_fat_mass_kg));
  const minMuscle = Math.min(...sorted.map((m) => m.skeletal_muscle_mass_kg));
  const peakFatPct = Math.max(...sorted.map((m) => m.body_fat_pct));
  return (
    <>
      <Head>
        <title>InBody Dashboard · Luispe</title>
        <meta name="description" content="Progreso de composición corporal" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10 space-y-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-1">Composición corporal</p>
            <h1 className="text-2xl font-medium text-gray-900">Luispe</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {new Date(first.measured_at).toLocaleDateString("es-GT", { month: "short", year: "numeric" })} → {new Date(last.measured_at).toLocaleDateString("es-GT", { month: "short", year: "numeric" })} · {measurements.length} mediciones · InBody 270
            </p>
          </div>
          <select value={selectedIndex} onChange={(e) => setSelectedIndex(Number(e.target.value))} className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-200 cursor-pointer transition-colors hover:border-gray-300">
            {[...sorted].reverse().map((m, i) => {
              const realIdx = sorted.length - 1 - i;
              return <option key={m.id ?? realIdx} value={realIdx}>{new Date(m.measured_at).toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })}</option>;
            })}
          </select>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Peso" value={`${selected.weight_kg.toFixed(1)} kg`} delta={selected.weight_kg - peakWeight < 0 ? `▼ ${Math.abs(selected.weight_kg - peakWeight).toFixed(1)} kg vs pico` : undefined} deltaType="good" />
          <StatCard label="Masa muscular" value={`${selected.skeletal_muscle_mass_kg.toFixed(1)} kg`} delta={selected.skeletal_muscle_mass_kg - minMuscle > 0 ? `▲ ${(selected.skeletal_muscle_mass_kg - minMuscle).toFixed(1)} kg vs mín` : undefined} deltaType="good" />
          <StatCard label="Grasa corporal" value={`${selected.body_fat_mass_kg.toFixed(1)} kg`} delta={selected.body_fat_mass_kg - peakFat < 0 ? `▼ ${Math.abs(selected.body_fat_mass_kg - peakFat).toFixed(1)} kg vs pico` : undefined} deltaType="good" />
          <StatCard label="% Grasa" value={`${selected.body_fat_pct.toFixed(1)} %`} delta={selected.body_fat_pct - peakFatPct < 0 ? `▼ ${Math.abs(selected.body_fat_pct - peakFatPct).toFixed(1)} pp vs pico` : undefined} deltaType="good" />
          <StatCard label="InBody Score" value={`${selected.inbody_score}`} delta={`rango ${Math.min(...sorted.map((m) => m.inbody_score))}–${Math.max(...sorted.map((m) => m.inbody_score))}`} deltaType="neutral" />
          <StatCard label="IMC" value={`${selected.bmi.toFixed(1)}`} delta="kg/m²" deltaType="neutral" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-widest mb-4">Métricas adicionales</p>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-y-4 gap-x-6 text-sm">
            {[["TMB", `${selected.bmr_kcal.toLocaleString()} kcal`], ["Cin.–cadera", selected.waist_hip_ratio?.toFixed(2) ?? "—"], ["Grasa visceral", selected.visceral_fat_level ? `Nv. ${selected.visceral_fat_level}` : "—"], ["Proteína", selected.protein_kg ? `${selected.protein_kg.toFixed(1)} kg` : "—"], ["Mineral óseo", selected.mineral_kg ? `${selected.mineral_kg.toFixed(2)} kg` : "—"]].map(([label, value]) => (
              <div key={label}><p className="text-xs text-gray-400 mb-0.5">{label}</p><p className="font-medium text-gray-900">{value}</p></div>
            ))}
          </div>
        </div>
        <CompositionChart measurements={measurements} highlightIndex={selectedIndex} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FatPctChart measurements={measurements} />
          <InBodyScoreChart measurements={measurements} />
        </div>
        <SegmentSnapshot latest={selected} />
        <LimbEvolutionChart measurements={measurements} />
        <TotalWaterChart measurements={measurements} />
        <p className="text-center text-xs text-gray-300 pb-4">
          Medición seleccionada: {new Date(selected.measured_at).toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.from("measurements").select("*").order("measured_at", { ascending: false });
  if (error || !data) return { props: { measurements: [] } };
  return { props: { measurements: data } };
};
