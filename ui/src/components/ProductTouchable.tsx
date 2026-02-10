interface Product {
	id: string;
	name: string;
	price: number;
}

interface ProductTouchableProps {
	product: Product;
	onClick: (product: Product) => void;
}

export function ProductTouchable({ product, onClick }: ProductTouchableProps) {
	const formatPrice = (price: number) => {
		return new Intl.NumberFormat("es-CL", {
			style: "currency",
			currency: "CLP",
		}).format(price);
	};

	return (
		<button
			key={product.id}
			type="button"
			className="group relative overflow-hidden border border-gray-200 rounded-xl bg-white p-3 shadow-sm hover:shadow-md hover:border-yellow-300 hover:bg-gradient-to-br hover:from-yellow-50 hover:to-orange-50 transition-all duration-200 text-left transform hover:scale-[1.02] active:scale-[0.98]"
			onClick={() => onClick(product)}
		>
			<div className="absolute inset-0 bg-gradient-to-br from-yellow-400/0 to-orange-400/0 group-hover:from-yellow-400/5 group-hover:to-orange-400/5 transition-opacity duration-200" />
			<div className="relative">
				<div className="font-semibold text-sm text-gray-800 mb-2 line-clamp-2 leading-tight">
					{product.name}
				</div>
				<div className="flex items-center justify-between">
					<div className="text-lg font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
						{formatPrice(product.price)}
					</div>
					<div className="w-2 h-2 rounded-full bg-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
				</div>
			</div>
		</button>
	);
}
