import { Route, Routes } from "react-router-dom";
import { AppProviders } from "@/providers/AppProviders";
import { CheckInView } from "./views/CheckInView";
import { OperationView } from "./views/OperationView";
import { ProductsView } from "./views/ProductsView";
import { MonitorView } from "./views/MonitorView";
import { AccessView } from "./views/AccessView";
import { LandingView } from "./views/LandingView";

function App() {
	return (
		<AppProviders>
			<Routes>
				<Route path="/" element={<LandingView />} />
				<Route path="/operation" element={<OperationView />} />
				<Route path="/checkin" element={<CheckInView />} />
				<Route path="/monitor" element={<MonitorView />} />
				<Route path="/products" element={<ProductsView />} />
				<Route path="/accesos" element={<AccessView />} />
			</Routes>
		</AppProviders>
	);
}

export default App;
