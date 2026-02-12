import { useQuery } from "@tanstack/react-query";
import { getProducts, getTimeProducts, type Product } from "@/api/products";

export function useProducts() {
	const {
		data: products = [],
		isLoading,
		error,
	} = useQuery<Product[], Error>({
		queryKey: ["products"],
		queryFn: getProducts,
	});

	const getProductById = (id: string) => products.find((product) => product.id === id);

	// Filter products by category
	const getProductsByCategory = (category: string) =>
		products.filter((product) => product.category === category);

	// Filter products by name
	const getProductsByName = (name: string) =>
		products.filter((product) => product.name.toLowerCase().includes(name.toLowerCase()));

	// Filter time products (products with timeValueSeconds)
	const getTimeProducts = () => products.filter((product) => 
		product.timeValueSeconds !== null && product.timeValueSeconds !== undefined && product.timeValueSeconds > 0
	);

	// Filter non-time products
	const getNonTimeProducts = () => products.filter((product) => 
		product.timeValueSeconds === null || product.timeValueSeconds === undefined || product.timeValueSeconds === 0
	);

	const requiredProducts = products.filter((product) => product.required);
	const optionalProducts = products.filter((product) => !product.required);

	// Get unique categories
	const getCategories = () => {
		const categories = [...new Set(products.map(product => product.category))];
		return categories.sort();
	};

	// Get products by category with counts
	const getCategoriesWithCounts = () => {
		const categoryMap = new Map<string, number>();
		products.forEach(product => {
			const count = categoryMap.get(product.category) || 0;
			categoryMap.set(product.category, count + 1);
		});
		return Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));
	};

	// Calculate total price for a product selection
	const calculateTotalPrice = (selection: Array<{ id: string; quantity: number }>) => {
		return selection.reduce((total, item) => {
			const product = getProductById(item.id);
			return total + (product?.price || 0) * item.quantity;
		}, 0);
	};

	// Calculate total time for a product selection
	const calculateTotalTime = (selection: Array<{ id: string; quantity: number }>) => {
		return selection.reduce((total, item) => {
			const product = getProductById(item.id);
			const timeValue = product?.timeValueSeconds || 0;
			return total + timeValue * item.quantity;
		}, 0);
	};

	return {
		products,
		isLoading,
		error,
		getProductById,
		getProductsByCategory,
		getProductsByName,
		getTimeProducts,
		getNonTimeProducts,
		requiredProducts,
		optionalProducts,
		getCategories,
		getCategoriesWithCounts,
		calculateTotalPrice,
		calculateTotalTime,
	};
}

export function useTimeProducts() {
	const {
		data: timeProducts = [],
		isLoading,
		error,
	} = useQuery<Product[], Error>({
		queryKey: ["timeProducts"],
		queryFn: getTimeProducts,
	});

	return {
		timeProducts,
		isLoading,
		error,
	};
}
