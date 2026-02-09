import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { CheckInView } from "./views/CheckInView";
import { MonitorView } from "./views/MonitorView";
import { OperationView } from "./views/OperationView";
import { ProductsView } from "./views/ProductsView";

function App() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Layout>
				<Routes>
					<Route path="/" element={<CheckInView />} />
					<Route path="/checkin" element={<CheckInView />} />
					<Route path="/operation" element={<OperationView />} />
					<Route path="/monitor" element={<MonitorView />} />
					<Route path="/products" element={<ProductsView />} />
				</Routes>
			</Layout>
		</div>
	);
}

export default App;
