export {};

declare global {
  interface Window {
    /** test hooks and runtime globals used by the app */
    [key: string]: any;
  }
}
