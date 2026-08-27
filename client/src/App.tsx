import { Toaster } from "@/components/ui/sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DataWorkbenchPage from "./pages/DataWorkbenchPage";
import { CompaniesPage, EvidencePage, FacilitiesPage, NetworkMapPage, OpportunitiesPage, ReportsPage, SettingsPage, SignalsPage } from "./pages/MonitorPages";
import NotFound from "./pages/NotFound";

function RoutedPage({ component: Component }: { component: React.ComponentType }) { return <DashboardLayout><Component /></DashboardLayout>; }
function Router() { return <Switch><Route path="/" component={() => <RoutedPage component={Home} />}/><Route path="/companies" component={() => <RoutedPage component={CompaniesPage} />}/><Route path="/facilities" component={() => <RoutedPage component={FacilitiesPage} />}/><Route path="/opportunities" component={() => <RoutedPage component={OpportunitiesPage} />}/><Route path="/signals" component={() => <RoutedPage component={SignalsPage} />}/><Route path="/evidence" component={() => <RoutedPage component={EvidencePage} />}/><Route path="/map" component={() => <RoutedPage component={NetworkMapPage} />}/><Route path="/reports" component={() => <RoutedPage component={ReportsPage} />}/><Route path="/workbench" component={() => <RoutedPage component={DataWorkbenchPage} />}/><Route path="/settings" component={() => <RoutedPage component={SettingsPage} />}/><Route path="/404" component={NotFound}/><Route component={NotFound}/></Switch>; }
export default function App() { return <ErrorBoundary><ThemeProvider defaultTheme="dark"><TooltipProvider><Toaster theme="dark"/><Router/></TooltipProvider></ThemeProvider></ErrorBoundary>; }
