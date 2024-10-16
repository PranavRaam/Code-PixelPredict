// global.d.ts
export {};

declare global {
  interface Window {
    MathJax: any;  // You can specify the type more precisely if you know it
  }
}
