# Check-in Flow Specification

## 1. Overview

This document describes the complete check-in flow for the Zona Xtreme attraction system. The check-in process handles both new wristband creation and existing wristband time/product additions.

## 2. Core Business Logic

### 2.1 Wristband Identification
- **Input Method**: Manual barcode entry via keyboard or QR scanner
- **Barcode Format**: Any string (numeric, alphanumeric, or QR code data)
- **Validation**: No validation on input - accepts any barcode
- **Real-time Lookup**: System queries existing sessions as user types

### 2.2 Session States
- **New Wristband**: Barcode not found in system → Create new session on checkout
- **Existing Active Session**: Barcode found with remaining time → Allow additional time/products
- **Existing Expired Session**: Barcode found with no remaining time → Allow time/products extension
- **No Session**: Barcode exists but no active session → Create new session

### 2.3 Product Assignment Rules
- **Required Products**: Must be selected for ALL check-ins (new and existing)
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
- **Required Products**: Auto-selected if already owned, must be selected for new
- **Time Products**: Add to existing time or create new allocation
- **Quantity Controls**: +1/-1 buttons for each product
- **Price Calculation**: Real-time total update

### 3.5 Checkout Process
1. **Validation**: Ensure required products are selected
2. **Payment Processing**: Create transaction record
3. **Session Creation/Update**: 
   - New wristband: Create new PlayerSession
   - Existing: Update session with additional time/products
4. **Success Feedback**: Show confirmation overlay
5. **Form Reset**: Clear barcode and selections

## 4. Technical Implementation

### 4.1 API Endpoints
```
GET /api/sessions/status/:barcodeId
- Returns: SessionStatusResponse or 404 if not found

POST /api/checkin
- Body: CheckinPayload
- Creates: Transaction + PlayerSession (if new) or updates existing

GET /api/products
- Returns: All available products
```

### 4.2 State Management
```typescript
interface CheckinState {
  barcodeId: string;
  session?: SessionStatusResponse;
  cart: CartItem[];
  isLoading: boolean;
  showConfirmation: boolean;
}
```

### 4.3 Business Rules
1. **Barcode Input**: Accept any string, no validation on entry
2. **Session Lookup**: Debounced API call after typing stops
3. **Product Selection**: Required products mandatory for checkout
4. **Time Calculation**: Add to existing time or create new session
5. **Transaction Creation**: Always create transaction record

## 5. Edge Cases

### 5.1 Network Issues
- **Offline Mode**: Queue check-ins locally, sync when online
- **API Failures**: Show retry options, maintain cart state

### 5.2 Data Validation
- **Invalid Products**: Handle product not found errors gracefully
- **Price Changes**: Use current price from API at checkout time
- **Session Conflicts**: Handle concurrent session updates

### 5.3 User Experience
- **Fast Typing**: Debounce API calls to avoid excessive requests
- **Scanner Input**: Handle QR scanner auto-submit behavior
- **Error Recovery**: Clear error states on new barcode entry

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
