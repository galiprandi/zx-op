const { VITE_API_BASE_URL, VITE_API_BASE_PORT } = import.meta.env;

export interface CartItem {
  productId: string;
  quantity: number;
}

export async function notifyCartUpdate(barcodeId: string, cart: CartItem[]) {
  const response = await fetch(
    `${VITE_API_BASE_URL}:${VITE_API_BASE_PORT}/api/cart/notify`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ barcodeId, cart }),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to notify cart update');
  }

  return response.json();
}
