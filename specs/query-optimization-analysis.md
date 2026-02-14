# Query & Socket Events Optimization Analysis

## Current State Analysis

### Views and Their Queries

#### 1. **CheckInView** (`/ui/src/views/CheckInView.tsx`)
**Queries Used:**
- `["playerSession", barcodeId]` - Session status for scanned barcode
- `["products"]` - Product catalog (required + optional)
- `["timeProducts"]` - Time-specific products (via useProducts)

**Socket Events Impact:**
- ✅ `session:updated` → Updates playerSession
- ✅ `session:play/pause` → Updates playerSession  
- ✅ `product:created/updated/deleted` → Updates products
- ❌ `transaction:created` → No direct impact (but should update dashboard)

#### 2. **MonitorView** (`/ui/src/views/MonitorView.tsx`)
**Queries Used:**
- `["dashboardStats"]` - Revenue, occupancy, transactions count
- `["performanceMetrics"]` - System performance data
- `["activeSessions"]` - Current active sessions (via useActiveSessions)
- `["systemSettings"]` - Max occupancy and system config

**Socket Events Impact:**
- ✅ `transaction:created` → Updates dashboardStats
- ✅ `session:play/pause/updated` → Updates activeSessions + dashboardStats
- ✅ `system:capacity:changed` → Updates systemSettings (not implemented yet)
- ❌ `session:created` → Should update activeSessions

#### 3. **ProductsView** (`/ui/src/views/ProductsView.tsx`)
**Queries Used:**
- `["products"]` - Product catalog for CRUD operations

**Socket Events Impact:**
- ✅ `product:created/updated/deleted` → Updates products
- ❌ Manual invalidation still exists (violates AGENTS.md rule!)

## Current Socket Event Implementation

### Events in `useSocket.ts`:
```typescript
// Product Events
socket.on("product:created", () => queryClient.invalidateQueries(["products"]));
socket.on("product:updated", () => queryClient.invalidateQueries(["products"]));
socket.on("product:deleted", () => queryClient.invalidateQueries(["products"]));

// Session Events  
socket.on("session:play", () => {
  queryClient.invalidateQueries(["playerSession"]);
  queryClient.invalidateQueries(["activeSessions"]);
  queryClient.invalidateQueries(["dashboardStats"]);
});

socket.on("session:pause", () => {
  queryClient.invalidateQueries(["playerSession"]);
  queryClient.invalidateQueries(["activeSessions"]);
  queryClient.invalidateQueries(["dashboardStats"]);
});

socket.on("session:updated", () => {
  queryClient.invalidateQueries(["playerSession"]);
  queryClient.invalidateQueries(["activeSessions"]);
  queryClient.invalidateQueries(["dashboardStats"]);
});

// Transaction Events
socket.on("transaction:created", () => {
  queryClient.invalidateQueries(["transactions"]);
  queryClient.invalidateQueries(["checkinHistory"]);
  queryClient.invalidateQueries(["dashboardStats"]);
});

// Cart Events
socket.on("cart:updated", () => {
  queryClient.invalidateQueries(["products"]);
  queryClient.invalidateQueries(["playerSession"]);
});
```

## Problems Identified

### 1. **Over-Invalidation**
- `session:play/pause` invalidates `["playerSession"]` for ALL barcodes
- Should only invalidate the specific session that changed
- Wastes network requests and causes unnecessary re-renders

### 2. **Missing setQueryData Optimization**
- All events use `invalidateQueries` (full refetch)
- No events use `setQueryData` (immediate updates with provided data)
- Backend could send partial data to avoid full API calls

### 3. **Manual Invalidation Violation**
- `ProductsView` still manually invalidates queries
- Violates AGENTS.md section 5.1 rule
- Should rely only on socket events

### 4. **Missing Events**
- No `session:created` event handler
- No `system:settings:updated` event handler
- No `performance:metrics:updated` event

### 5. **Inefficient Query Structure**
- `["playerSession"]` without barcode key invalidates all sessions
- Should use `["playerSession", barcodeId]` for granular updates

## Optimization Plan

### Phase 1: Fix Query Structure

#### 1.1 Granular Session Updates
```typescript
// Before (invalidates ALL player sessions)
socket.on("session:updated", () => {
  queryClient.invalidateQueries(["playerSession"]);
});

// After (only invalidates specific session)
socket.on("session:updated", ({ playerSession }) => {
  queryClient.setQueryData(["playerSession", playerSession.barcodeId], playerSession);
  queryClient.invalidateQueries(["activeSessions"]);
  queryClient.invalidateQueries(["dashboardStats"]);
});
```

#### 1.2 Add Missing Event Handlers
```typescript
// Add session:created handler
socket.on("session:created", ({ playerSession, activeSessions }) => {
  queryClient.setQueryData(["playerSession", playerSession.barcodeId], playerSession);
  queryClient.setQueryData(["activeSessions"], activeSessions);
});

// Add system events
socket.on("system:settings:updated", ({ settings }) => {
  queryClient.setQueryData(["systemSettings"], settings);
});
```

### Phase 2: Implement setQueryData Strategy

#### 2.1 Transaction Events with Partial Data
```typescript
socket.on("transaction:created", ({ transaction, dashboardStats }) => {
  // Update transaction history
  queryClient.invalidateQueries(["transactions"]);
  queryClient.invalidateQueries(["checkinHistory"]);
  
  // Update dashboard immediately with partial data
  if (dashboardStats) {
    queryClient.setQueryData(["dashboardStats"], dashboardStats);
  }
});
```

#### 2.2 Session Events with Full Data
```typescript
socket.on("session:updated", ({ playerSession, dashboardStats }) => {
  // Immediate update for specific session
  queryClient.setQueryData(["playerSession", playerSession.barcodeId], playerSession);
  
  // Update dashboard stats if provided
  if (dashboardStats) {
    queryClient.setQueryData(["dashboardStats"], dashboardStats);
  }
  
  // Still invalidate activeSessions to refresh the list
  queryClient.invalidateQueries(["activeSessions"]);
});
```

### Phase 3: Remove Manual Invalidation

#### 3.1 Clean Up ProductsView
```typescript
// Remove manual invalidations
const createMutation = useMutation({
  mutationFn: createProduct,
  onSuccess: () => {
    setIsCreateModalOpen(false);
    resetForm();
    // ❌ REMOVE: queryClient.invalidateQueries(["products"]);
  },
});
```

#### 3.2 Add Product Events with Data
```typescript
// Backend should emit product:created with full product data
socket.on("product:created", ({ product }) => {
  queryClient.setQueryData(["products"], (old: Product[] = []) => [...old, product]);
});

socket.on("product:updated", ({ product }) => {
  queryClient.setQueryData(["products"], (old: Product[] = []) => 
    old.map(p => p.id === product.id ? product : p)
  );
});

socket.on("product:deleted", ({ productId }) => {
  queryClient.setQueryData(["products"], (old: Product[] = []) => 
    old.filter(p => p.id !== productId)
  );
});
```

### Phase 4: Performance Optimizations

#### 4.1 Reduce Refetch Intervals
```typescript
// Monitor queries can be less frequent with socket updates
export const useDashboardStats = () => {
  return useQuery<DashboardStats>({
    queryKey: ["dashboardStats"],
    queryFn: getDashboardStats,
    refetchInterval: 300000, // 5 minutes (was 1 minute)
    staleTime: 120000, // 2 minutes (was 30 seconds)
  });
};
```

#### 4.2 Add Query Selectors for Specific Data
```typescript
// Instead of invalidating all products, use selectors
const useRequiredProducts = () => {
  return useQuery({
    queryKey: ["products", "required"],
    queryFn: () => getProducts().then(p => p.filter(p => p.required)),
    select: (data: Product[]) => data.filter(p => p.required),
  });
};
```

## Implementation Priority

### High Priority (Fix Critical Issues)
1. ✅ Fix query structure for granular session updates
2. ✅ Add missing event handlers (`session:created`, `system:events`)
3. ✅ Remove manual invalidations from ProductsView

### Medium Priority (Performance)
4. 🔄 Implement setQueryData for transaction events
5. 🔄 Implement setQueryData for session events
6. 🔄 Reduce refetch intervals

### Low Priority (Advanced Optimization)
7. ⏳ Add query selectors for specific data
8. ⏳ Implement batch event processing
9. ⏳ Add event debouncing for high-frequency updates

## Expected Results

### Performance Improvements
- **50% reduction** in unnecessary API calls
- **Immediate UI updates** for most operations
- **Better user experience** with instant feedback
- **Reduced server load** from fewer refetches

### Consistency Improvements
- **No more manual invalidations** (follows AGENTS.md)
- **Predictable update patterns** 
- **Better debugging** with clear event flow
- **Easier testing** with deterministic behavior

## Testing Strategy

### Unit Tests
- Test each socket event handler
- Verify setQueryData vs invalidateQueries behavior
- Test query key structure

### Integration Tests  
- End-to-end check-in flow
- Multi-view synchronization
- Event payload validation

### Performance Tests
- Measure API call reduction
- Test UI update latency
- Load testing with concurrent users
