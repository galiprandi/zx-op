import { useMutation } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { createCheckin, type CheckinResponse, type CheckinPayload } from '@/api/checkin';
import { formatPrice, formatTimeValue, isTimeProduct, type Product } from '@/api/products';
import { notifyCartUpdate, type CartItem as ApiCartItem } from '@/api/cart';
import { MobileShell } from '@/components/MobileShell';
import { ActionButton } from '@/components/ActionButton';
import { QRScanner } from '@/components/QRScanner';
import { SessionTime } from '@/components/SessionTime';
import { StatusBadge } from '@/components/StatusBadge';
import { GlassCard } from '@/components/GlassCard';
import { CartSheet } from '@/components/CartSheet';
import { Modal } from '@/components/Modal';
import { SurfaceCard } from '@/components/SurfaceCard';
import { ChevronDown, Package, ShoppingCart } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useSocket } from '@/hooks/useSocket';
import { useActiveSessions, usePlayerSession } from '@/hooks/usePlayerSession';
import { usePaymentMethods } from '@/hooks/usePaymentMethods';
import { formatCurrency } from '@/lib/currency';
import { resolveDisplaySeconds, resolveVisualState } from '@/lib/sessionTimeCalc';
import { getSyncedNowMs } from '@/lib/serverClock';

interface CartItem {
  product: Product;
  quantity: number;
}

interface OptimisticConfirmation {
  barcodeId: string;
  items: number;
  total: number;
  totalSecondsAdded: number;
}

function toWholeAmount(value: number): number {
  return Math.round(value);
}

export function CheckInView() {
  useSocket();

  const [barcodeId, setBarcodeId] = useState('');
  const [activeBarcode, setActiveBarcode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastCheckinData, setLastCheckinData] = useState<CheckinResponse | null>(null);
  const [optimisticConfirmation, setOptimisticConfirmation] = useState<OptimisticConfirmation | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [isCameraScannerOpen, setIsCameraScannerOpen] = useState(false);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [nowTs, setNowTs] = useState(() => getSyncedNowMs());
  const scannerInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNowTs(getSyncedNowMs()), 1000);
    return () => clearInterval(id);
  }, []);

  const {
    requiredProducts,
    optionalProducts,
    calculateTotalPrice: calculateCartTotalPrice,
    calculateTotalTime: calculateCartTotalTime,
  } = useProducts();

  const { data: paymentMethods = [] } = usePaymentMethods();

  const { session } = usePlayerSession(activeBarcode);
  const { waitingSessions } = useActiveSessions();

  const checkinMutation = useMutation({
    mutationFn: (data: CheckinPayload) => createCheckin(data),
    onSuccess: (data: CheckinResponse) => {
      setLastCheckinData(data);
      setShowConfirmation(true);

      setTimeout(() => {
        setShowConfirmation(false);
        resetForm();
      }, 3000);
    },
    onError: (error) => {
      setShowConfirmation(false);
      setLastCheckinData(null);
      setOptimisticConfirmation(null);
      setShowPaymentStep(true);
      console.error('Error creating checkin:', error);
      alert('Error al procesar el check-in');
    },
  });

  const resetForm = () => {
    const effectiveBarcode = (activeBarcode || barcodeId).trim();

    setBarcodeId('');
    setActiveBarcode('');
    setCart([]);
    setLastCheckinData(null);
    setOptimisticConfirmation(null);
    setShowPaymentStep(false);
    setPaymentAmounts({});

    if (effectiveBarcode) {
      notifyCartUpdate(effectiveBarcode, []).catch(console.error);
    }
  };

  const handleBarcodeSearch = useCallback((value?: string) => {
    const trimmedBarcode = (value ?? barcodeId).trim();
    if (!trimmedBarcode) {
      alert('Por favor ingrese un código de pulsera válido');
      return;
    }
    setBarcodeId(trimmedBarcode);
    setActiveBarcode(trimmedBarcode);
  }, [barcodeId]);

  const addToCart = (product: Product) => {
    if (!product || !product.id) {
      console.error('Invalid product');
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product.id === product.id);
      let newCart;
      if (existingItem) {
        if (existingItem.quantity >= 99) {
          alert('No se pueden agregar más de 99 unidades del mismo producto');
          return prevCart;
        }
        newCart = prevCart.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      } else {
        newCart = [...prevCart, { product, quantity: 1 }];
      }

      const effectiveBarcode = (activeBarcode || barcodeId).trim();
      if (effectiveBarcode) {
        const apiCart: ApiCartItem[] = newCart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        }));
        notifyCartUpdate(effectiveBarcode, apiCart).catch(console.error);
      }

      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => {
      const newCart = prevCart.filter((item) => item.product.id !== productId);
      const effectiveBarcode = (activeBarcode || barcodeId).trim();
      if (effectiveBarcode) {
        const apiCart: ApiCartItem[] = newCart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        }));
        notifyCartUpdate(effectiveBarcode, apiCart).catch(console.error);
      }
      return newCart;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart((prevCart) => {
        const newCart = prevCart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item,
        );

        const effectiveBarcode = (activeBarcode || barcodeId).trim();
        if (effectiveBarcode) {
          const apiCart: ApiCartItem[] = newCart.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          }));
          notifyCartUpdate(effectiveBarcode, apiCart).catch(console.error);
        }

        return newCart;
      });
    }
  };

  const getTotalPrice = useCallback(() => {
    return calculateCartTotalPrice(cart.map((item) => ({ id: item.product.id, quantity: item.quantity })));
  }, [cart, calculateCartTotalPrice]);

  const getTotalTime = useCallback(() => {
    return calculateCartTotalTime(cart.map((item) => ({ id: item.product.id, quantity: item.quantity })));
  }, [cart, calculateCartTotalTime]);

  const getAvailableRequiredProducts = useMemo(() => requiredProducts, [requiredProducts]);
  const getAvailableOptionalProducts = useMemo(() => optionalProducts, [optionalProducts]);

  const getTotalItems = useCallback(() => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  }, [cart]);

  const hasRequiredProducts = () => true;
  const isMissingRequired = !hasRequiredProducts();

  const getSessionVisualState = () => (session ? resolveVisualState(session) : 'expired');

  const handleStartPayment = () => {
    const effectiveBarcode = (activeBarcode || barcodeId).trim();
    if (!effectiveBarcode || cart.length === 0) {
      alert('Por favor ingrese el código de pulsera y agregue productos');
      return;
    }

    if (paymentMethods.length === 0) {
      const shouldOpenSettings = window.confirm(
        'No hay medios de pago activos. Debes configurarlos antes de cobrar. ¿Ir a Configuración?',
      );
      if (shouldOpenSettings) {
        window.location.href = '/settings';
      }
      return;
    }

    if (!activeBarcode) {
      setActiveBarcode(effectiveBarcode);
    }

    setShowPaymentStep(true);
  };

  const paymentSummary = useMemo(() => {
    const total = toWholeAmount(getTotalPrice());
    const rows = paymentMethods
      .map((method) => {
        const raw = paymentAmounts[method.id] ?? '';
        const value = Number(raw);
        const amount = Number.isFinite(value) && value > 0 ? toWholeAmount(value) : 0;
        return { method, amount, raw };
      })
      .filter((row) => row.amount > 0);

    const allocated = rows.reduce((sum, row) => sum + row.amount, 0);
    const remaining = total - allocated;
    const valid = rows.length > 0 && allocated === total;

    return { total, rows, allocated, remaining, valid };
  }, [paymentAmounts, paymentMethods, getTotalPrice]);

  const handleTogglePaymentMethod = (methodId: string) => {
    setPaymentAmounts((prev) => {
      const current = prev[methodId] ?? '';
      if (current !== '') {
        return {
          ...prev,
          [methodId]: '',
        };
      }

      const total = getTotalPrice();
      const allocatedWithoutCurrent = paymentMethods.reduce((sum, method) => {
        if (method.id === methodId) return sum;
        const raw = prev[method.id] ?? '';
        const value = Number(raw);
        return sum + (Number.isFinite(value) && value > 0 ? toWholeAmount(value) : 0);
      }, 0);
      const remaining = Math.max(0, toWholeAmount(total) - allocatedWithoutCurrent);

      return {
        ...prev,
        [methodId]: String(remaining),
      };
    });
  };

  const handleConfirmPayment = () => {
    const effectiveBarcode = (activeBarcode || barcodeId).trim();
    if (!paymentSummary.valid) {
      alert('La suma de medios de pago debe coincidir exactamente con el total');
      return;
    }

    const checkinData: CheckinPayload = {
      barcodeId: effectiveBarcode,
      products: cart.map((item) => ({
        id: item.product.id,
        quantity: item.quantity,
      })),
      paymentAllocations: paymentSummary.rows.map((row) => ({
        paymentMethodId: row.method.id,
        amount: row.amount,
      })),
    };

    setOptimisticConfirmation({
      barcodeId: effectiveBarcode,
      items: getTotalItems(),
      total: paymentSummary.total,
      totalSecondsAdded: getTotalTime(),
    });
    setShowConfirmation(true);
    setShowPaymentStep(false);
    checkinMutation.mutate(checkinData);
  };

  const getSessionStatusDisplay = () => {
    if (!activeBarcode || !session) return null;

    const visualState = getSessionVisualState();
    const displaySeconds = resolveDisplaySeconds(session, nowTs, waitingSessions);
    const timeState = visualState === 'waiting' || visualState === 'paused' ? 'stop' : undefined;

    return (
      <GlassCard className="px-2 py-1">
        <div className="flex items-center justify-between">
          <StatusBadge status={visualState} size="sm" />
          <div className="flex items-center gap-2">
            <SessionTime seconds={displaySeconds} visualState={visualState} state={timeState} format="adaptive" size="sm" />
            <div className="text-[8px] text-muted-foreground">({Math.floor(displaySeconds / 60)}min)</div>
          </div>
        </div>
      </GlassCard>
    );
  };

  const shouldAutoFocusScanner =
    !activeBarcode &&
    !checkinMutation.isPending &&
    !showConfirmation &&
    !showPaymentStep &&
    !isCameraScannerOpen;

  if (showPaymentStep) {
    return (
      <MobileShell
        title="Check-in: Medio de pago"
        footer={
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-border/30 bg-card/30 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Total</span>
                <span className="text-xl font-bold">{formatPrice(paymentSummary.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>Asignado</span>
                <span>{formatPrice(paymentSummary.allocated)}</span>
              </div>
              <div className="flex justify-between">
                <span>Restante</span>
                <span
                  className={
                    paymentSummary.remaining > 0
                      ? 'text-red-400'
                      : paymentSummary.remaining < 0
                        ? 'text-green-400'
                        : 'text-foreground'
                  }
                >
                  {formatPrice(paymentSummary.remaining)}
                </span>
              </div>
            </div>

            <ActionButton
              variant="cta"
              tone="success"
              onClick={handleConfirmPayment}
              disabled={!paymentSummary.valid || checkinMutation.isPending}
              loading={checkinMutation.isPending}
            >
              Confirmar cobro
            </ActionButton>

            <ActionButton
              variant="cancel"
              onClick={() => setShowPaymentStep(false)}
              disabled={checkinMutation.isPending}
              size="md"
            >
              Volver
            </ActionButton>
            {!paymentSummary.valid && (
              <p className="text-xs text-amber-300 text-center">
                Asigna montos hasta completar el total exacto para habilitar el cobro.
              </p>
            )}
          </div>
        }
      >
        <div className="px-4 pb-4 space-y-3">
          <p className="text-sm text-muted-foreground">Selecciona uno o más medios y asigna montos. La suma debe ser exacta.</p>

          <div className="space-y-2">
            {paymentMethods.map((method) => {
              const value = paymentAmounts[method.id] ?? '';
              const isSelected = value !== '';

              return (
                <SurfaceCard key={method.id} contentPaddingClassName="[&>div]:p-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={`h-5 w-5 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-primary-foreground' : 'border-border text-transparent'}`}
                      onClick={() => handleTogglePaymentMethod(method.id)}
                      aria-label={isSelected ? `Deseleccionar ${method.name}` : `Seleccionar ${method.name}`}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePaymentMethod(method.id)}
                      className="flex-1 text-left"
                    >
                      <p className="font-medium">{method.name}</p>
                    </button>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      className="w-28 rounded-md border border-border/50 bg-background px-2 py-1 text-right"
                      value={value}
                      onChange={(event) =>
                        setPaymentAmounts((prev) => ({
                          ...prev,
                          [method.id]:
                            event.target.value === ''
                              ? ''
                              : String(toWholeAmount(Number(event.target.value))),
                        }))
                      }
                      placeholder="0"
                    />
                  </div>
                </SurfaceCard>
              );
            })}
          </div>
        </div>
      </MobileShell>
    );
  }

  return (
    <MobileShell
      title="Check-in"
      footer={
        <div className="space-y-3">
          {cart.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-card/30 rounded-lg border border-border/20">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>{getTotalItems()} items</span>
                <span>-</span>
                <span className="font-medium text-foreground">{formatPrice(getTotalPrice())}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}

          <ActionButton
            variant="cta"
            tone="success"
            onClick={handleStartPayment}
            disabled={!(activeBarcode || barcodeId).trim() || cart.length === 0 || isMissingRequired || checkinMutation.isPending}
            loading={checkinMutation.isPending}
          >
            COBRAR {formatPrice(getTotalPrice())}
            {getTotalTime() > 0 && (
              <span className="ml-2 text-sm bg-primary/20 px-2 py-1 rounded">+{formatTimeValue(getTotalTime())}</span>
            )}
          </ActionButton>
          {isMissingRequired && <div className="text-xs text-yellow-400">Debes incluir los productos obligatorios</div>}
        </div>
      }
    >
      <div className="w-full space-y-4 flex-1 min-h-0">
        <QRScanner
          value={barcodeId}
          onChange={setBarcodeId}
          onSubmit={handleBarcodeSearch}
          onScannedSubmit={handleBarcodeSearch}
          placeholder={checkinMutation.isPending ? 'Procesando...' : 'Código de pulsera'}
          disabled={checkinMutation.isPending}
          inputRef={scannerInputRef}
          autoFocus={shouldAutoFocusScanner}
          selectOnFocus
          onScannerVisibilityChange={setIsCameraScannerOpen}
          enableGlobalKeyboardWedge
          globalKeyboardDisabled={showConfirmation}
        />

        {getSessionStatusDisplay()}

        <div className="space-y-6 flex-1 min-h-0">
          {(getAvailableRequiredProducts.length > 0 || getAvailableOptionalProducts.length > 0) && (
            <div className="w-full max-h-full overflow-y-auto space-y-3 pr-1">
              {getAvailableRequiredProducts.length > 0 && (
                <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 justify-center">
                  {getAvailableRequiredProducts.map((product: Product) => {
                    const cartItem = cart.find((item) => item.product.id === product.id);
                    return (
                      <ProductButton
                        key={product.id}
                        product={product}
                        onClick={() => addToCart(product)}
                        quantity={cartItem?.quantity}
                      />
                    );
                  })}
                </div>
              )}
              {getAvailableOptionalProducts.map((product: Product) => {
                const cartItem = cart.find((item) => item.product.id === product.id);
                return (
                  <ProductListItem
                    key={product.id}
                    product={product}
                    onClick={() => addToCart(product)}
                    quantity={cartItem?.quantity}
                  />
                );
              })}
            </div>
          )}

          {getAvailableRequiredProducts.length === 0 && getAvailableOptionalProducts.length === 0 && (
            <SurfaceCard contentPaddingClassName="[&>div]:p-6">
              <div className="text-center space-y-2">
                <Package className="w-10 h-10 text-muted-foreground mx-auto" />
                <h3 className="text-base font-medium text-foreground">No hay productos disponibles</h3>
                <p className="text-sm text-muted-foreground">Crea productos en Administración para poder hacer check-in.</p>
              </div>
            </SurfaceCard>
          )}
        </div>
      </div>

      <Modal
        isOpen={showConfirmation}
        onClose={() => {
          if (lastCheckinData) {
            setShowConfirmation(false);
          }
        }}
        title={lastCheckinData ? '¡Check-in Exitoso!' : 'Confirmando cobro...'}
        type={lastCheckinData ? 'success' : 'info'}
        autoClose={!!lastCheckinData}
        autoCloseDelay={3000}
        closable={!!lastCheckinData}
        details={
          <>
            {!lastCheckinData && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Procesando en caja...
              </div>
            )}
            <div className="font-medium">Código: {optimisticConfirmation?.barcodeId || activeBarcode || barcodeId}</div>
            <div className="font-medium">Items: {optimisticConfirmation?.items ?? getTotalItems()}</div>
            <div className="font-bold text-lg text-green-400">
              Total: {formatPrice(optimisticConfirmation?.total ?? getTotalPrice())}
            </div>
            {(lastCheckinData?.totalSecondsAdded || optimisticConfirmation?.totalSecondsAdded) &&
              (lastCheckinData?.totalSecondsAdded || optimisticConfirmation?.totalSecondsAdded || 0) > 0 && (
              <div className="text-xs text-blue-400">
                +{formatTimeValue(lastCheckinData?.totalSecondsAdded || optimisticConfirmation?.totalSecondsAdded || 0)} de tiempo añadido
              </div>
            )}
          </>
        }
      />

      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onUpdateQuantity={updateQuantity}
        totalPrice={getTotalPrice()}
        totalTime={getTotalTime()}
      />
    </MobileShell>
  );
}

function ProductButton({ product, onClick, quantity }: { product: Product; onClick: () => void; quantity?: number }) {
  const formatPrice = (price: number) => formatCurrency(price);

  return (
    <div className="bg-slate-100/85 border border-slate-200 rounded-lg transition-all duration-200 hover:border-primary/40 p-3 min-h-[72px]">
      <button
        type="button"
        onClick={onClick}
        className="relative w-full h-full text-left transform hover:scale-[1.01] active:scale-[0.99] transition-transform"
      >
        <div className="flex flex-col h-full justify-between space-y-2">
          <div className="font-semibold text-sm text-foreground line-clamp-2 leading-tight pr-8">{product.name}</div>

          <div className="flex items-center justify-between">
            {isTimeProduct(product) && product.timeValueSeconds && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded-md font-medium">({formatTimeValue(product.timeValueSeconds)})</span>
              </div>
            )}
            <span className="text-s font-bold text-primary">{formatPrice(product.price)}</span>
          </div>
        </div>

        {quantity && quantity > 0 && (
          <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium min-w-[20px] text-center">
            {quantity}
          </div>
        )}
      </button>
    </div>
  );
}

function ProductListItem({ product, onClick, quantity }: { product: Product; onClick: () => void; quantity?: number }) {
  const formatPrice = (price: number) => formatCurrency(price);

  return (
    <div className="bg-slate-100/85 border border-slate-200 rounded-lg transition-all duration-200 hover:border-primary/40">
      <button type="button" onClick={onClick} className="w-full text-left py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-medium text-base text-foreground">{product.name}</div>
          </div>
          <div className="flex items-center gap-2">
            {isTimeProduct(product) && product.timeValueSeconds && (
              <span className="text-xs bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded-md font-medium">+{formatTimeValue(product.timeValueSeconds)}</span>
            )}
            <span className="text-base font-bold text-primary">{formatPrice(product.price)}</span>
            {quantity && quantity > 0 && (
              <div className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full font-medium min-w-[2rem] text-center">{quantity}</div>
            )}
          </div>
        </div>
      </button>
    </div>
  );
}
