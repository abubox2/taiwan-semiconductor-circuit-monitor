import { MapView } from "@/components/Map";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2, MapPinned, Network } from "lucide-react";
import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

export type MapLocation = { id: number; name: string; region: string; city: string; latitude: string | null; longitude: string | null; company: { name: string } | null; requirements: unknown[] };
function formatCoordinate(value: string | null) { return value ? Number(value).toFixed(5) : "—"; }

export function MapFallbackList({ locations, mapUnavailable }: { locations: MapLocation[]; mapUnavailable: boolean }) {
  return <aside className="rounded-2xl border border-cyan-100/14 bg-[#07201f]/78 p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-white">{mapUnavailable ? "地圖備援位置清單" : "已定位據點"}</h2><p className="mt-1 text-xs text-white/42">公開可核對的座標資料</p></div><span className="rounded-full bg-cyan-100/10 px-2 py-1 text-xs text-cyan-100">{locations.length}</span></div>{mapUnavailable && <p className="mt-4 rounded-lg border border-orange-200/15 bg-orange-200/5 px-3 py-2 text-xs leading-5 text-orange-100/80">外部地圖目前不可用；以下清單保留企業、地區及座標，仍可作為區域優先級判讀依據。</p>}<div className="mt-4 space-y-3">{locations.length ? locations.map(location => <article className="rounded-xl border border-white/8 bg-black/10 p-4" key={location.id}><p className="text-sm font-medium text-white">{location.name}</p><p className="mt-1 text-xs text-cyan-100/60">{location.company?.name || "未對應企業"}</p><p className="mt-3 text-xs text-white/48">{location.region} · {location.city}</p><p className="mt-1 font-mono text-[11px] text-white/36">{formatCoordinate(location.latitude)}, {formatCoordinate(location.longitude)}</p><p className="mt-2 text-xs text-orange-100/75">關聯需求：{location.requirements.length} 筆</p></article>) : <div className="rounded-xl border border-dashed border-white/10 p-5 text-sm leading-6 text-white/45">尚無經核對座標的據點。可在資料更新頁補充完整地址後進行定位。</div>}</div></aside>;
}

export default function NetworkMapPage() {
  const locations = trpc.monitor.mapLocations.useQuery();
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [region, setRegion] = useState("");
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const markers = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const regions = useMemo(() => Array.from(new Set((locations.data ?? []).map(location => location.region))).sort(), [locations.data]);
  const filtered = useMemo(() => (locations.data ?? []).filter(location => !region || location.region === region), [locations.data, region]);
  const requirementCount = filtered.reduce((total, location) => total + location.requirements.length, 0);

  useEffect(() => {
    if (!map || !window.google?.maps?.marker) return;
    markers.current.forEach(marker => { marker.map = null; });
    markers.current = filtered.map(location => new window.google!.maps.marker.AdvancedMarkerElement({ map, position: { lat: Number(location.latitude), lng: Number(location.longitude) }, title: `${location.company?.name || "企業"} · ${location.name}` }));
    if (filtered[0]) map.setCenter({ lat: Number(filtered[0].latitude), lng: Number(filtered[0].longitude) });
    return () => { markers.current.forEach(marker => { marker.map = null; }); };
  }, [filtered, map]);

  if (locations.isLoading) return <div className="grid min-h-[45vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-cyan-100" /></div>;
  return <div className="mx-auto max-w-[1500px]"><header className="mb-6 flex flex-col gap-4 border-b border-cyan-100/10 pb-6 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-[11px] font-semibold tracking-[0.2em] text-orange-200/80">LOCATION INTELLIGENCE</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">企業廠區與機房據點地圖</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-white/52">以企業提供或公開可核對的座標呈現據點分布；地圖僅供區域商機分析，不推定企業實際線路路由或服務 SLA。</p></div><select value={region} onChange={event => setRegion(event.target.value)} className="h-10 rounded-xl border border-cyan-100/18 bg-[#0a2726] px-3 text-sm text-white outline-none"><option value="">所有已定位地區</option>{regions.map(item => <option value={item} key={item}>{item}</option>)}</select></header><div className="mb-5 grid gap-4 sm:grid-cols-3"><Metric label="定位據點" value={filtered.length} icon={MapPinned}/><Metric label="關聯網路需求" value={requirementCount} icon={Network}/><Metric label="分析區域" value={region || "全部"} icon={Building2}/></div><div className="grid gap-5 xl:grid-cols-[1.7fr_0.85fr]"><section className="overflow-hidden rounded-2xl border border-cyan-100/14 bg-[#07201f]/78 shadow-[0_20px_80px_rgba(0,0,0,0.2)]"><MapView initialCenter={{ lat: 23.5, lng: 121 }} initialZoom={7} onMapReady={setMap} onMapError={() => setMapUnavailable(true)} /></section><MapFallbackList locations={filtered as MapLocation[]} mapUnavailable={mapUnavailable}/></div></div>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof MapPinned }) { return <div className="rounded-2xl border border-cyan-100/14 bg-[#082725]/70 p-5"><div className="flex items-center justify-between"><p className="text-xs text-white/45">{label}</p><Icon className="h-4 w-4 text-orange-100"/></div><p className="mt-2 text-2xl font-semibold text-white">{value}</p></div>; }
