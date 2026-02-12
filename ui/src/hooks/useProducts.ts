import { useQuery } from "@tanstack/react-query";
import { getProducts, type Product } from "@/api/products";

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

	const requiredProducts = products.filter((product) => product.required);
	const optionalProducts = products.filter((product) => !product.required);

	return { products, isLoading, error, getProductById, getProductsByCategory, getProductsByName, requiredProducts, optionalProducts };
}
