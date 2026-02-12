import { Route, Routes } from "react-router-dom";
import { CheckInView } from "./views/CheckInView";
import { OperationView } from "./views/OperationView";
import { ProductsView } from "./views/ProductsView";
import { MonitorView } from "./views/MonitorView";

function App() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Routes>
				<Route path="/" element={<OperationView />} />
				<Route path="/checkin" element={<CheckInView />} />
				<Route path="/monitor" element={<MonitorView />} />
				<Route path="/products" element={<ProductsView />} />
			</Routes>
		</div>
	);
}

export default App;
