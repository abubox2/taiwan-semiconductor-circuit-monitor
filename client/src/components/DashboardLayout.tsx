import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/useMobile";
import { Building2, ClipboardList, Database, FileText, LayoutDashboard, LogOut, MapPinned, Network, PanelLeft, Radar, RadioTower, Users } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

const menuItems = [
  { icon: LayoutDashboard, label: "決策總覽", path: "/" },
  { icon: Building2, label: "供應鏈企業", path: "/companies" },
  { icon: Network, label: "廠區與機房", path: "/facilities" },
  { icon: Radar, label: "銷售商機", path: "/opportunities" },
  { icon: RadioTower, label: "需求與訊號", path: "/signals" },
  { icon: Users, label: "聯絡與來源", path: "/evidence" },
  { icon: MapPinned, label: "據點地圖", path: "/map" },
  { icon: FileText, label: "週報中心", path: "/reports" },
  { icon: Database, label: "資料更新", path: "/workbench" },
  { icon: ClipboardList, label: "監控設定", path: "/settings" },
];
const SIDEBAR_WIDTH_KEY = "semicon-monitor-sidebar-width";
const DEFAULT_WIDTH = 268;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => Number(localStorage.getItem(SIDEBAR_WIDTH_KEY)) || DEFAULT_WIDTH);
  const { loading, user } = useAuth();
  useEffect(() => localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()), [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <SecureEntry />;
  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><LayoutContent setSidebarWidth={setSidebarWidth}>{children}</LayoutContent></SidebarProvider>;
}

function SecureEntry() {
  return <div className="relative min-h-screen overflow-hidden bg-[#071a1a] px-6 text-white"><div className="absolute -left-48 top-8 h-[38rem] w-[38rem] rounded-full bg-teal-500/20 blur-[110px]" /><div className="absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full bg-orange-500/20 blur-[100px]" /><main className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center"><section className="glass-panel topographic-line max-w-xl rounded-[2rem] p-9 text-center sm:p-14"><div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-200/25 bg-cyan-300/10"><Radar className="h-8 w-8 text-cyan-100" /></div><p className="mb-4 text-xs font-semibold tracking-[0.25em] text-orange-200">SEMICONNECT INTELLIGENCE</p><h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">掌握每一條<br/><span className="text-cyan-100">關鍵連線</span>的可能性</h1><p className="mx-auto mt-6 max-w-md leading-7 text-white/65">台灣半導體供應鏈與機房網路商機管理平台，將公開證據、廠區需求與銷售行動收斂為可執行的決策視圖。</p><Button onClick={() => startLogin()} className="mt-9 h-12 rounded-xl bg-orange-400 px-7 font-semibold text-[#09201e] hover:bg-orange-300">登入監控平台</Button><p className="mt-5 text-xs text-white/40">受保護的內部決策工作區</p></section></main></div>;
}

function LayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth(); const [location, setLocation] = useLocation(); const { state, toggleSidebar } = useSidebar(); const isMobile = useIsMobile(); const sidebarRef = useRef<HTMLDivElement>(null); const [resizing, setResizing] = useState(false); const collapsed = state === "collapsed"; const current = menuItems.find(item => item.path === location);
  useEffect(() => { const move = (event: MouseEvent) => { if (!resizing || collapsed) return; const start = sidebarRef.current?.getBoundingClientRect().left ?? 0; const next = event.clientX - start; if (next >= 220 && next <= 360) setSidebarWidth(next); }; const release = () => setResizing(false); if (resizing) { document.addEventListener("mousemove", move); document.addEventListener("mouseup", release); } return () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", release); }; }, [collapsed, resizing, setSidebarWidth]);
  return <><div ref={sidebarRef} className="relative"><Sidebar collapsible="icon" className="border-r border-cyan-100/10 bg-[#071c1b] text-white"><SidebarHeader className="h-[84px] px-3"><div className="flex h-full items-center gap-3"><button onClick={toggleSidebar} aria-label="切換側欄" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-cyan-200/15 bg-cyan-200/5 text-cyan-100 hover:bg-cyan-200/12"><PanelLeft className="h-4 w-4" /></button>{!collapsed && <div className="min-w-0"><p className="truncate text-sm font-bold tracking-wide text-white">Semiconnect</p><p className="mt-0.5 truncate text-[10px] tracking-[0.18em] text-cyan-100/55">NETWORK INTELLIGENCE</p></div>}</div></SidebarHeader><SidebarContent className="px-2 py-4"><p className="px-3 pb-3 text-[10px] font-semibold tracking-[0.18em] text-white/35 group-data-[collapsible=icon]:hidden">MONITOR WORKSPACE</p><SidebarMenu>{menuItems.map(item => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={item.label} className="mb-1 h-11 rounded-xl px-3 text-white/62 hover:bg-cyan-200/8 hover:text-white data-[active=true]:bg-gradient-to-r data-[active=true]:from-cyan-300/17 data-[active=true]:to-transparent data-[active=true]:text-cyan-50"><item.icon className="h-4 w-4"/><span className="text-sm">{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarContent><SidebarFooter className="p-3"><div className="rounded-2xl border border-cyan-100/10 bg-white/[0.035] p-2"><div className="flex items-center gap-2.5"><Avatar className="h-8 w-8 border border-orange-200/20"><AvatarFallback className="bg-orange-300/15 text-xs text-orange-100">{user?.name?.slice(0,1).toUpperCase() || "U"}</AvatarFallback></Avatar>{!collapsed && <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-white">{user?.name || "使用者"}</p><p className="truncate text-[10px] text-white/40">商機工作區</p></div>}{!collapsed && <button onClick={logout} title="登出" className="grid h-7 w-7 place-items-center rounded-lg text-white/45 hover:bg-white/10 hover:text-orange-100"><LogOut className="h-3.5 w-3.5"/></button>}</div></div></SidebarFooter></Sidebar><div className={`absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-cyan-300/30 ${collapsed ? "hidden" : ""}`} onMouseDown={() => setResizing(true)} /></div><SidebarInset className="min-h-screen bg-transparent">{isMobile && <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-cyan-100/10 bg-[#091e1d]/90 px-4 backdrop-blur-xl"><SidebarTrigger className="text-cyan-100"/><div><p className="text-xs tracking-[0.15em] text-orange-200">SEMICONNECT</p><p className="text-sm font-medium text-white">{current?.label || "監控平台"}</p></div></header>}<main className="monitor-page flex-1 p-4 sm:p-6 lg:p-8">{children}</main></SidebarInset></>;
}
