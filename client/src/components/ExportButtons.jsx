import { useState } from 'react';
import { exportToCsv, exportToPdf } from '../utils/exportUtils';

/**
 * @param {{
 *   title: string,
 *   filenameBase: string,
 *   columns: {header:string, accessor:(row:any)=>any}[],
 *   rows?: any[],
 *   fetchRows?: () => Promise<any[]>,
 * }} props
 */
export default function ExportButtons({ title, filenameBase, columns, rows, fetchRows }) {
  const [loading, setLoading] = useState(false);
  const disabled = loading || (!fetchRows && (!rows || rows.length === 0));

  const withRows = async (run) => {
    setLoading(true);
    try {
      const data = fetchRows ? await fetchRows() : rows;
      run(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => withRows((data) => exportToCsv(filenameBase, columns, data))}
        title="Export as CSV (Excel)"
        className="flex items-center gap-1.5 border border-neutral-200 bg-surface text-neutral-600 text-caption font-semibold px-3 py-[9px] rounded cursor-pointer transition-colors hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2v6h6" />
          <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
          <path d="M9 15l2 2 4-4" />
        </svg>
        Excel
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => withRows((data) => exportToPdf(title, filenameBase, columns, data))}
        title="Export as PDF"
        className="flex items-center gap-1.5 border border-neutral-200 bg-surface text-neutral-600 text-caption font-semibold px-3 py-[9px] rounded cursor-pointer transition-colors hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2v6h6" />
          <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" />
          <path d="M9 13h6M9 17h4" />
        </svg>
        {loading ? 'Preparing...' : 'PDF'}
      </button>
    </div>
  );
}
