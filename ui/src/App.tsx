import { Route, Routes } from "react-router-dom";
import { CheckInView } from "./views/CheckInView";
import { OperationView } from "./views/OperationView";
import { ProductsView } from "./views/ProductsView";
import { MonitorView } from "./views/MonitorView";
import { AccessView } from "./views/AccessView";

function App() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Routes>
				<Route path="/" element={<OperationView />} />
				<Route path="/checkin" element={<CheckInView />} />
				<Route path="/monitor" element={<MonitorView />} />
				<Route path="/products" element={<ProductsView />} />
				<Route path="/accesos" element={<AccessView />} />
			</Routes>
		</div>
	);
}

export default App;
