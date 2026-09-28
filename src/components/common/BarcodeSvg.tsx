import React, { useEffect, useRef } from 'react';
import { renderBarcodeSvg, downloadBarcodePng, BarcodeRenderOptions } from '../../utils/barcode';

interface BarcodeSvgProps {
  value: string;
  format?: 'CODE128' | 'EAN13' | 'UPC' | 'CODE39';
  width?: number;
  height?: number;
  displayValue?: boolean;
  fontSize?: number;
  margin?: number;
  className?: string;
  showDownloadButton?: boolean;
  downloadFilename?: string;
}

export const BarcodeSvg: React.FC<BarcodeSvgProps> = ({
  value,
  format = 'CODE128',
  width = 1.8,
  height = 44,
  displayValue = true,
  fontSize = 12,
  margin = 6,
  className = '',
  showDownloadButton = false,
  downloadFilename,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      renderBarcodeSvg(svgRef.current, value, {
        format: format as BarcodeRenderOptions['format'],
        width,
        height,
        displayValue,
        fontSize,
        margin,
      });
    }
  }, [value, format, width, height, displayValue, fontSize, margin]);

  if (!value) return null;

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg ref={svgRef} className="max-w-full overflow-hidden" />
      {showDownloadButton && (
        <button
          type="button"
          onClick={() => {
            if (svgRef.current) {
              downloadBarcodePng(svgRef.current, downloadFilename || `barcode-${value}`);
            }
          }}
          className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#7e4e78] hover:text-[#5d3558] font-semibold hover:underline cursor-pointer"
        >
          <span className="material-symbols-outlined text-[14px]">download</span>
          Download PNG
        </button>
      )}
    </div>
  );
};
