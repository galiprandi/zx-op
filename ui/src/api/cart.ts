export interface CartItem {
  productId: string;
  quantity: number;
}

export async function notifyCartUpdate(barcodeId: string, cart: CartItem[]) {
  const response = await fetch(
    `/api/cart/notify`,
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
