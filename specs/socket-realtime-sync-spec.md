# Socket Real-Time Sync Specification

## Overview

This specification defines the real-time synchronization system using Socket.io for keeping all views (Check-in, Monitor, Dashboard) synchronized without manual refreshes. The system follows the **Backend-Driven Updates Only** principle from AGENTS.md section 5.1.

## Architecture

```
Backend Data Persistence → Socket Event Emission → Frontend Socket Listeners → Query Updates → UI Refresh
```

## Socket Events Specification

### 1. Transaction Events

#### `transaction:created`
**Trigger**: When a new transaction is created (check-in, product purchase)

**Payload**:
```typescript
{
  transaction: Transaction,
  playerSession: PlayerSession,
  dashboardStats: Partial<DashboardStats> // Optional: for immediate UI updates
}
```

**Frontend Response**:
- **Monitor View**: Invalidates `["dashboardStats"]` and `["performanceMetrics"]`
- **Check-in View**: Invalidates `["checkinHistory"]` 
- **Optimization**: Use `setQueryData` with partial dashboardStats if provided

#### `transaction:updated`
**Trigger**: When a transaction is modified (refund, correction)

**Payload**:
```typescript
{
  transaction: Transaction,
  dashboardStats: Partial<DashboardStats> // Optional
}
```

**Frontend Response**: Same as `transaction:created`

### 2. Player Session Events

#### `session:created`
**Trigger**: When a new player session is created

**Payload**:
```typescript
{
  playerSession: PlayerSession,
  activeSessions: PlayerSession[] // Current active sessions list
}
```

**Frontend Response**:
- **Monitor View**: `setQueryData(["activeSessions"], activeSessions)`
- **Check-in View**: `setQueryData(["playerSession", barcodeId], playerSession)`
- **Boarding View**: Invalidates `["activeSessions"]`

#### `session:updated`
**Trigger**: When session data changes (time added, status change)

**Payload**:
```typescript
{
  playerSession: PlayerSession,
  dashboardStats?: Partial<DashboardStats> // If occupancy/revenue changed
}
```

**Frontend Response**:
- **Monitor View**: `setQueryData(["playerSession", sessionId], playerSession)`
- **Check-in View**: `setQueryData(["playerSession", barcodeId], playerSession)`
- **Dashboard View**: If dashboardStats provided, `setQueryData(["dashboardStats"], newStats)`

#### `session:play`
**Trigger**: When a session is activated (player enters zone)

**Payload**:
```typescript
{
  playerSession: PlayerSession,
  activeSessions: PlayerSession[]
}
```

**Frontend Response**:
- **Monitor View**: `setQueryData(["activeSessions"], activeSessions)`
- **Boarding View**: Invalidates `["activeSessions"]`

#### `session:pause`
**Trigger**: When a session is paused (technical stop)

**Payload**:
```typescript
{
  playerSession: PlayerSession,
  activeSessions: PlayerSession[]
}
```

**Frontend Response**: Same as `session:play`

#### `session:ended`
**Trigger**: When a session is completed (player leaves)

**Payload**:
```typescript
{
  playerSession: PlayerSession,
  activeSessions: PlayerSession[],
  dashboardStats?: Partial<DashboardStats>
}
```

**Frontend Response**:
- **Monitor View**: Updates activeSessions and optionally dashboardStats
- **All Views**: Remove session from active displays

### 3. Product Events

#### `product:created`
**Trigger**: When a new product is added

**Payload**:
```typescript
{
  product: Product
}
```

**Frontend Response**: Invalidates `["products"]` in all views

#### `product:updated`
**Trigger**: When product details change (price, time value)

**Payload**:
```typescript
{
  product: Product
}
```

**Frontend Response**: `setQueryData(["products"], updatedProductsList)`

#### `product:deleted`
**Trigger**: When a product is removed

**Payload**:
```typescript
{
  productId: string
}
```

**Frontend Response**: Invalidates `["products"]`

### 4. System Events

#### `system:settings:updated`
**Trigger**: When system settings change (max occupancy, rates)

**Payload**:
```typescript
{
  settings: SystemSettings
}
```

**Frontend Response**: `setQueryData(["systemSettings"], settings)`

#### `system:capacity:changed`
**Trigger**: When occupancy limits change

**Payload**:
```typescript
{
  maxOccupancy: number,
  currentOccupancy: number,
  dashboardStats: Partial<DashboardStats>
}
```

**Frontend Response**: Updates capacity displays and dashboard stats

## Frontend Implementation Strategy

### Query Update Patterns

#### 1. **setQueryData** (Preferred for immediate updates)
Use when backend provides complete/partial data in the socket payload:

```typescript
socket.on("session:updated", ({ playerSession, dashboardStats }) => {
  // Update specific session immediately
  queryClient.setQueryData(["playerSession", playerSession.barcodeId], playerSession);
  
  // Update dashboard stats if provided
  if (dashboardStats) {
    queryClient.setQueryData(["dashboardStats"], dashboardStats);
  }
});
```

#### 2. **invalidateQueries** (Fallback)
Use when backend doesn't provide data or data is complex:

```typescript
socket.on("product:deleted", () => {
  queryClient.invalidateQueries({ queryKey: ["products"] });
});
```

### View-Specific Socket Listeners

#### Monitor View
```typescript
// Priority: dashboardStats > activeSessions > performanceMetrics
socket.on("transaction:created", handleTransactionUpdate);
socket.on("session:updated", handleSessionUpdate);
socket.on("system:capacity:changed", handleCapacityUpdate);
```

#### Check-in View
```typescript
// Priority: playerSession > checkinHistory > products
socket.on("session:updated", handleSessionUpdate);
socket.on("transaction:created", handleTransactionUpdate);
```

#### Boarding/In-Flight View
```typescript
// Priority: activeSessions > playerSession
socket.on("session:play", handleActiveSessionsUpdate);
socket.on("session:pause", handleActiveSessionsUpdate);
```

## Backend Implementation Guidelines

### Event Emission Rules

1. **Always emit after successful persistence**
2. **Include relevant data in payload when possible**
3. **Use partial data for frequent updates (dashboard stats)**
4. **Batch multiple updates when appropriate**

### Payload Optimization

#### Include Full Data When:
- Creating new resources (session, transaction)
- Complex state changes
- Low-frequency events

#### Include Partial Data When:
- Updating counters (dashboard stats)
- Simple field changes
- High-frequency events

Example:
```typescript
// Full data for new session
socket.emit("session:created", {
  playerSession: fullSessionObject,
  activeSessions: currentActiveSessions
});

// Partial data for stats update
socket.emit("dashboard:stats:updated", {
  currentRevenue: newTotal,
  activePlayers: currentCount,
  totalTransactions: transactionCount
});
```

## Error Handling & Resilience

### Frontend
- **Socket reconnection**: Automatic with exponential backoff
- **Event validation**: Verify payload structure before processing
- **Fallback mechanisms**: Invalidate queries if setQueryData fails

### Backend
- **Event logging**: Log all emitted events for debugging
- **Error isolation**: Socket emission failures shouldn't break persistence
- **Retry logic**: Retry failed socket emissions with backoff

## Performance Considerations

### Frontend
- **Debounce rapid updates**: For high-frequency events (timer updates)
- **Selective updates**: Only update relevant queries
- **Payload validation**: Avoid processing malformed events

### Backend
- **Batch emissions**: Group multiple updates when possible
- **Payload size**: Minimize data sent over socket
- **Event throttling**: Limit high-frequency events

## Testing Strategy

### Unit Tests
- Socket event handlers
- Query update logic
- Payload validation

### Integration Tests
- End-to-end socket flow
- Multi-view synchronization
- Error scenarios

### Load Tests
- Concurrent socket connections
- High-frequency event handling
- Memory usage optimization

## Monitoring & Debugging

### Event Tracking
- Log all socket events with timestamps
- Track event delivery success rates
- Monitor payload sizes

### Performance Metrics
- Socket connection health
- Query update frequency
- UI refresh latency

## Security Considerations

- **Event validation**: Verify event source and permissions
- **Payload sanitization**: Validate all incoming data
- **Rate limiting**: Prevent event flooding attacks
