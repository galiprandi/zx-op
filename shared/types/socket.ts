export interface CacheInvalidateEvent {
  queryKey: string[];
  data: unknown;
}

export interface SocketEvents {
  "cache-invalidate": CacheInvalidateEvent;
}
