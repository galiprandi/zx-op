import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { AppProviders } from "@/providers/AppProviders";

const LandingView = lazy(() => import("./views/LandingView").then((m) => ({ default: m.LandingView })));
const OperationView = lazy(() => import("./views/OperationView").then((m) => ({ default: m.OperationView })));
const CheckInView = lazy(() => import("./views/CheckInView").then((m) => ({ default: m.CheckInView })));
const MonitorView = lazy(() => import("./views/MonitorView").then((m) => ({ default: m.MonitorView })));
const ReportsView = lazy(() => import("./views/ReportsView").then((m) => ({ default: m.ReportsView })));
const ProductsView = lazy(() => import("./views/ProductsView").then((m) => ({ default: m.ProductsView })));
const AccessView = lazy(() => import("./views/AccessView").then((m) => ({ default: m.AccessView })));
const SettingsView = lazy(() => import("./views/SettingsView").then((m) => ({ default: m.SettingsView })));

function App() {
	return (
		<AppProviders>
			<Suspense fallback={<div className="min-h-screen grid place-items-center text-muted-foreground">Cargando...</div>}>
				<Routes>
					<Route path="/" element={<LandingView />} />
					<Route path="/operation" element={<OperationView />} />
					<Route path="/checkin" element={<CheckInView />} />
					<Route path="/monitor" element={<MonitorView />} />
					<Route path="/reports" element={<ReportsView />} />
					<Route path="/products" element={<ProductsView />} />
					<Route path="/access" element={<AccessView />} />
					<Route path="/settings" element={<SettingsView />} />
				</Routes>
			</Suspense>
		</AppProviders>
	);
}

export default App;
