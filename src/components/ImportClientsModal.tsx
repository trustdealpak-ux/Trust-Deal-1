import React, { useState, useRef } from 'react';
import { ClientRecord, ClientTag } from '../types';
import {
  Upload,
  X,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Users,
  Check,
} from 'lucide-react';

interface ImportClientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  onImportClients: (imported: ClientRecord[]) => void;
}

export const ImportClientsModal: React.FC<ImportClientsModalProps> = ({
  isOpen,
  onClose,
  businessId,
  onImportClients,
}) => {
  const [parsedRecords, setParsedRecords] = useState<Partial<ClientRecord>[]>([]);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Parses RFC-4180 CSV rows accounting for quoted values with internal commas and newlines
  const parseCSV = (csvText: string): string[][] => {
    // Strip BOM if present
    const cleanText = csvText.charCodeAt(0) === 0xfeff ? csvText.slice(1) : csvText;
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < cleanText.length; i++) {
      const char = cleanText[i];
      const nextChar = cleanText[i + 1];

      if (inQuotes) {
        if (char === '"') {
          if (nextChar === '"') {
            // Escaped quote
            currentCell += '"';
            i++;
          } else {
            // End of quoted cell
            inQuotes = false;
          }
        } else {
          currentCell += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentCell.trim());
          currentCell = '';
        } else if (char === '\r') {
          if (nextChar === '\n') i++;
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        } else if (char === '\n') {
          currentRow.push(currentCell.trim());
          rows.push(currentRow);
          currentRow = [];
          currentCell = '';
        } else {
          currentCell += char;
        }
      }
    }

    if (currentCell.length > 0 || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      rows.push(currentRow);
    }

    return rows.filter((r) => r.some((cell) => cell.length > 0));
  };

  const processCSVFile = (file: File) => {
    setParseError('');
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setParseError('The uploaded CSV file is empty.');
        return;
      }

      try {
        const matrix = parseCSV(text);
        if (matrix.length < 2) {
          setParseError('The CSV file must contain a header row and at least one data row.');
          return;
        }

        const headers = matrix[0].map((h) => h.toLowerCase().trim());

        // Header mapping helper
        const findColIdx = (keywords: string[]) => {
          return headers.findIndex((h) =>
            keywords.some((k) => h === k || h.includes(k))
          );
        };

        const nameIdx = findColIdx(['customer name', 'client name', 'contact name', 'full name', 'name', 'client']);
        const companyIdx = findColIdx(['company', 'organization', 'business', 'company name']);
        const emailIdx = findColIdx(['email address', 'email', 'e-mail']);
        const phoneIdx = findColIdx(['phone number', 'phone', 'telephone', 'mobile', 'cell']);
        const addressIdx = findColIdx(['service address', 'street address', 'address', 'location', 'street']);
        const billingAddressIdx = findColIdx(['billing address', 'billing street']);
        const tagIdx = findColIdx(['client category', 'category', 'client tag', 'tag', 'type']);
        const notesIdx = findColIdx(['internal notes', 'notes', 'comments', 'memo', 'note']);

        if (nameIdx === -1 && emailIdx === -1) {
          setParseError('Could not identify a Name or Email column. Please verify CSV headers.');
          return;
        }

        const dataRows = matrix.slice(1);
        const parsed: Partial<ClientRecord>[] = [];

        dataRows.forEach((row, rowIdx) => {
          const rawName = nameIdx >= 0 ? row[nameIdx] : '';
          const rawCompany = companyIdx >= 0 ? row[companyIdx] : '';
          const rawEmail = emailIdx >= 0 ? row[emailIdx] : '';
          const rawPhone = phoneIdx >= 0 ? row[phoneIdx] : '';
          const rawAddress = addressIdx >= 0 ? row[addressIdx] : '';
          const rawBilling = billingAddressIdx >= 0 ? row[billingAddressIdx] : '';
          const rawTag = tagIdx >= 0 ? row[tagIdx]?.toLowerCase() : '';
          const rawNotes = notesIdx >= 0 ? row[notesIdx] : '';

          // Name fallback if company only
          const resolvedName = rawName || rawCompany || `Client #${rowIdx + 1}`;
          if (!resolvedName && !rawEmail && !rawPhone) return;

          let tag: ClientTag = 'residential';
          if (rawTag.includes('comm') || rawCompany) tag = 'commercial';
          if (rawTag.includes('vip')) tag = 'vip';
          if (rawTag.includes('prop') || rawTag.includes('mgr')) tag = 'property_manager';
          if (rawTag.includes('lead')) tag = 'lead';

          parsed.push({
            id: `client_imported_${Date.now()}_${rowIdx}`,
            businessId,
            name: resolvedName,
            companyName: rawCompany || undefined,
            email: rawEmail || `client${rowIdx + 1}@example.com`,
            phone: rawPhone || '(555) 000-0000',
            serviceAddress: rawAddress || 'Customer Service Address',
            billingAddressSame: !rawBilling || rawBilling === rawAddress,
            billingAddress: rawBilling || undefined,
            tag,
            notes: rawNotes || undefined,
            createdAt: new Date().toISOString(),
          });
        });

        if (parsed.length === 0) {
          setParseError('No valid client rows could be parsed from the CSV file.');
          return;
        }

        setParsedRecords(parsed);
      } catch (err: any) {
        setParseError(`Failed to parse CSV: ${err.message || 'Unknown syntax error'}`);
      }
    };

    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processCSVFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCSVFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    const sampleHeaders = [
      'Customer Name',
      'Company Name',
      'Email Address',
      'Phone Number',
      'Service Address',
      'Billing Address',
      'Client Category',
      'Internal Notes',
    ];
    const sampleRows = [
      [
        'Johnathan Miller',
        'Miller Properties LLC',
        'john@millerproperties.com',
        '(510) 555-0144',
        '742 Evergreen Terrace, Oakland, CA',
        '742 Evergreen Terrace, Oakland, CA',
        'Residential',
        'Prefers text updates. Key under back porch mat.',
      ],
      [
        'Sarah Jenkins',
        'Oakridge Retail Center',
        'sjenkins@oakridgeplaza.com',
        '(415) 555-0189',
        '1200 Commercial Way, Berkeley, CA',
        'PO Box 892, Berkeley, CA',
        'Commercial',
        'Property manager for 4 commercial units.',
      ],
    ];

    const csv =
      '\uFEFF' +
      [
        sampleHeaders.map((h) => `"${h}"`).join(','),
        ...sampleRows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')),
      ].join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'quoteforge_client_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirmImport = () => {
    if (parsedRecords.length === 0) return;
    onImportClients(parsedRecords as ClientRecord[]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Import Clients from CSV
              </h2>
              <p className="text-xs text-slate-400">
                Easily bring in customer lists from QuickBooks, Jobber, Housecall Pro, Excel, or Google Contacts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {parseError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{parseError}</span>
            </div>
          )}

          {/* Upload Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-blue-600 bg-blue-50/50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv,text/csv"
              className="hidden"
            />
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center mx-auto mb-2">
              <Upload className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-800">
              {fileName ? (
                <span className="text-blue-900 font-bold">Selected: {fileName}</span>
              ) : (
                'Drop your CSV file here, or click to browse'
              )}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              Supports CSV files exported from QuickBooks, Xero, Jobber, Housecall Pro, HubSpot, or Excel.
            </p>
          </div>

          {/* Download Sample Template */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
            <span className="text-slate-600">
              Need to check column formatting before importing?
            </span>
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 font-semibold text-blue-900 hover:text-blue-950 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Sample CSV</span>
            </button>
          </div>

          {/* Parsed Preview Table */}
          {parsedRecords.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ready to import {parsedRecords.length} client records</span>
                </span>
                <span className="text-slate-500">Previewing first 4 rows</span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-48 text-[11px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2">Name</th>
                      <th className="p-2">Company</th>
                      <th className="p-2">Email</th>
                      <th className="p-2">Phone</th>
                      <th className="p-2">Service Address</th>
                      <th className="p-2">Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedRecords.slice(0, 4).map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-medium text-slate-900">{rec.name}</td>
                        <td className="p-2">{rec.companyName || '—'}</td>
                        <td className="p-2">{rec.email}</td>
                        <td className="p-2">{rec.phone}</td>
                        <td className="p-2 max-w-[140px] truncate">{rec.serviceAddress}</td>
                        <td className="p-2 capitalize">{rec.tag}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={parsedRecords.length === 0}
              onClick={handleConfirmImport}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-950 rounded-md shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Import {parsedRecords.length} Clients</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
