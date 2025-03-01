// The globalThis property provides a standard way of accessing the global this value
// (and hence the global object itself) across environments.
const globalTemp: typeof globalThis = globalThis;

export function initGlobal() {
  // @ts-expect-error because ts doesn't recognize the WebSocket property
  globalTemp.WebSocket = globalTemp;
}
