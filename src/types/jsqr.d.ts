declare module 'jsqr' {
  export default function jsQR(data: Uint8ClampedArray, width: number, height: number, options?: object): { data: string } | null;
}
