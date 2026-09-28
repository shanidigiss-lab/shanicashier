import JsBarcode from 'jsbarcode';

/**
 * Plays realistic POS retail scanner beep using native Web Audio API.
 * High-pitched crisp confirmation beep (1750 Hz).
 */
export function playBarcodeBeep(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1900, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch (e) {
    // AudioContext blocked by browser autoplay policy until user gesture
  }
}

/**
 * Plays an error/not found double buzz tone.
 */
export function playBarcodeErrorBeep(): void {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  } catch (e) {
    // ignore
  }
}

/**
 * Generates an automatic random SKU/Barcode in clean retail format.
 */
export function generateRandomBarcode(prefix = 'BRC'): string {
  const timestamp = Date.now().toString().slice(-4);
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${timestamp}${randomNum}`;
}

export interface BarcodeRenderOptions {
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  background?: string;
  lineColor?: string;
}

/**
 * Renders a barcode safely into an SVG element.
 */
export function renderBarcodeSvg(
  svgElement: SVGSVGElement | null,
  value: string,
  options: BarcodeRenderOptions = {}
): boolean {
  if (!svgElement || !value) return false;

  try {
    JsBarcode(svgElement, value, {
      format: options.format || 'CODE128',
      width: options.width ?? 1.8,
      height: options.height ?? 48,
      displayValue: options.displayValue ?? true,
      fontSize: options.fontSize ?? 12,
      margin: options.margin ?? 6,
      background: options.background ?? '#ffffff',
      lineColor: options.lineColor ?? '#1a1a1a',
      font: 'monospace',
    });
    return true;
  } catch (err) {
    console.warn(`Could not render barcode for "${value}" in format ${options.format}:`, err);
    // Fallback to generic CODE128 if specific format failed
    try {
      JsBarcode(svgElement, value, {
        format: 'CODE128',
        width: options.width ?? 1.8,
        height: options.height ?? 48,
        displayValue: options.displayValue ?? true,
        fontSize: options.fontSize ?? 12,
        margin: options.margin ?? 6,
        font: 'monospace',
      });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Exports an SVG barcode as a downloadable PNG image.
 */
export function downloadBarcodePng(svgElement: SVGSVGElement, filename: string): void {
  try {
    const xml = new XMLSerializer().serializeToString(svgElement);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const image64 = 'data:image/svg+xml;base64,' + svg64;

    const img = new Image();
    img.src = image64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const link = document.createElement('a');
      link.download = `${filename || 'barcode'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
  } catch (err) {
    console.error('Failed to download barcode PNG:', err);
  }
}
