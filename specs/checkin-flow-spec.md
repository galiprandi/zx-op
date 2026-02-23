# Check-in Flow Specification

## 1. Overview

This document describes the complete check-in flow for the Zona Xtreme attraction system. The check-in process handles both new wristband creation and existing wristband time/product additions.

## 2. Core Business Logic

### 2.1 Wristband Identification
- **Input Method**: Manual barcode entry via keyboard or QR scanner
- **Barcode Format**: Any string (numeric, alphanumeric, or QR code data)
- **Validation**: No validation on input - accepts any barcode
- **Lookup Trigger**: Session lookup runs on explicit submit events (manual `Enter`, QR decode, or keyboard wedge `Enter`)

### 2.2 Session States
- **New Wristband**: Barcode not found in system → Create new session on checkout
- **Existing Active Session**: Barcode found with remaining time → Allow additional time/products
- **Existing Expired Session**: Barcode found with no remaining time → Allow time/products extension
- **No Session**: Barcode exists but no active session → Create new session

### 2.3 Product Assignment Rules
- **Favorite Products (required=true flag)**: Shown with visual priority in check-in, but not mandatory for checkout
- **Optional Products**: Can be added to any check-in
- **Time Products**: Add to existing time or create new time allocation
- **Non-time Products**: Always added (medias, snacks, etc.)

## 3. User Interface Flow

### 3.1 Initial State
```
┌─────────────────────────┐
│ ZX Logo    Online ●      │
├─────────────────────────┤
│                         │
│ [🔍 Código de pulsera ]  │
│                         │
│   (No session info)     │
│                         │
│ Product Grid (disabled)│
│   - Required: Show      │
│   - Optional: Show      │
│                         │
│ [💳 COBRAR $0] (disabled)│
└─────────────────────────┘
```

### 3.2 Barcode Entry (New Wristband)
```
┌─────────────────────────┐
│ ZX Logo    Online ●      │
├─────────────────────────┤
│                         │
│ [🔍 ABC12345 ]         │
│                         │
│   📋 Nueva Pulsera      │
│   ⏱️ Sin tiempo         │
│                         │
│ Product Grid (enabled)  │
│   - Required: Selectable │
│   - Optional: Selectable │
│                         │
│ [💳 COBRAR $X] (enabled) │
└─────────────────────────┘
```

### 3.3 Barcode Entry (Existing Session)
```
┌─────────────────────────┐
│ ZX Logo    Online ●      │
├─────────────────────────┤
│                         │
│ [🔍 ABC12345 ]         │
│                         │
│   ▶️ En Juego (15:32)   │
│   ⏱️ Tiempo restante     │
│                         │
│ Product Grid (enabled)  │
│   - Required: Already ✓ │
│   - Optional: Selectable │
│                         │
│ [💳 COBRAR $X] (enabled) │
│   ⚠️ Agregar tiempo      │
│      extenderá sesión    │
└─────────────────────────┘
```

### 3.4 Product Selection
- **Favorite Products**: Displayed first for quick tap access (non-blocking)
- **Time Products**: Add to existing time or create new allocation
- **Quantity Controls**: +1/-1 buttons for each product
- **Price Calculation**: Real-time total update

### 3.5 Checkout Process (Two-Step)
1. **Validation**: Ensure barcode and at least one product are selected
2. **Step 2 - Payment Method Selection**:
   - Open dedicated payment step view after pressing `COBRAR`
   - Allow one or multiple payment methods with split amounts
   - Enforce strict validation: sum(split amounts) == cart total (integer amounts, no decimals)
   - If no active methods are configured, block checkout and redirect to Settings
3. **Payment Processing**: Create check-in sale header + transaction items + payment allocations
4. **Session Creation/Update**:
   - New wristband: Create new PlayerSession
   - Existing: Update session with additional time/products
5. **Success Feedback**: Show immediate optimistic confirmation ("Confirmando cobro..."), then success on API response
6. **Form Reset**: Clear barcode and selections

## 4. Technical Implementation

### 4.1 API Endpoints
```
GET /api/sessions/status/:barcodeId
- Returns: SessionStatusResponse or 404 if not found

POST /api/checkin
- Body: CheckinPayload
- Creates: Transaction + PlayerSession (if new) or updates existing

GET /api/payment-methods
- Returns: Active payment methods only

GET /api/payment-methods/admin
- Returns: Full list (including inactive/deleted) for settings CRUD

GET /api/products
- Returns: All available products
```

### 4.2 State Management
```typescript
interface CheckinState {
  barcodeId: string;
  session?: SessionStatusResponse;
  cart: CartItem[];
  paymentAllocations: Array<{ paymentMethodId: string; amount: number }>;
  currentStep: "products" | "payment";
  isLoading: boolean;
  showConfirmation: boolean;
}
```

### 4.3 Business Rules
1. **Barcode Input**: Accept any string, no validation on entry
2. **Session Lookup**: Triggered on submit confirmation (`Enter`, QR decode, keyboard wedge `Enter`)
3. **Product Selection**: Favorite products are prioritized visually, not required
4. **Time Calculation**: Add to existing time or create new session
5. **Transaction Creation**: Always create transaction record
6. **Payment Allocation Validation**: Strict split sum validation with integer precision (no decimals)

## 5. Edge Cases

### 5.1 Network Issues
- **Offline Mode**: Queue check-ins locally, sync when online
- **API Failures**: Show retry options, maintain cart state

### 5.2 Data Validation
- **Invalid Products**: Handle product not found errors gracefully
- **Price Changes**: Use current price from API at checkout time
- **Session Conflicts**: Handle concurrent session updates
- **No Payment Methods**: Prevent checkout and require configuration in Settings

### 5.3 User Experience
- **Fast Typing**: Typed data remains local until a submit event confirms the wristband code
- **Scanner Input**: Handle QR scanner auto-submit behavior
- **Error Recovery**: Clear error states on new barcode entry
- **Keyboard Wedge**: Barcode scanners that emulate keyboard input can submit codes without input focus (submit on `Enter`)

### 5.4 Input Focus & Keyboard Wedge Scanner
- In check-in products step, scanner input must auto-focus and select current value when no wristband has been confirmed yet.
- Keyboard wedge capture is enabled only while scanner input is mounted in check-in products step.
- Keyboard wedge flow:
  - accumulate printable keys in an internal buffer,
  - submit on `Enter`,
  - ignore empty `Enter`,
  - clear stale buffer after inactivity timeout.
- A new scan replaces current check-in wristband immediately (`barcodeId` and active lookup target).
- Keyboard wedge capture is paused while modal overlays for scanner camera or checkout confirmation are visible.

## 6. Success Metrics

### 6.1 Performance
- **API Response**: < 500ms for session lookup
- **UI Updates**: < 100ms for cart calculations
- **Checkout Process**: < 2s total completion time

### 6.2 User Experience
- **Error Rate**: < 1% failed check-ins
- **Completion Rate**: > 95% successful check-ins
- **Time to Complete**: < 30s average check-in time

## 7. Future Enhancements

### 7.1 Advanced Features
- **Customer History**: Show previous sessions for returning customers
- **Package Deals**: Pre-configured product bundles
- **Loyalty Points**: Track and reward repeat customers

### 7.2 Integration Points
- **Payment Gateway**: Credit card processing integration
- **Ticketing System**: Integration with external ticket providers
- **Analytics Dashboard**: Check-in metrics and trends

## 8. Testing Requirements

### 8.1 Unit Tests
- Barcode input validation
- Cart calculation logic
- Session creation/update flows

### 8.2 Integration Tests
- API endpoint responses
- Database transaction handling
- WebSocket real-time updates

### 8.3 User Acceptance Tests
- Complete check-in flow scenarios
- Error handling and recovery
- Performance under load
- Scanner keyboard wedge submission without input focus
