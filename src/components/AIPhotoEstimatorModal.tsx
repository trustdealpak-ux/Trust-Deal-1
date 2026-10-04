import React, { useState } from 'react';
import { BusinessProfile, LineItem, UnitType } from '../types';
import { formatCurrency } from '../utils/calculations';
import {
  Camera,
  Upload,
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Eye,
  Layers,
  Wrench,
  ShieldAlert,
} from 'lucide-react';

interface AIPhotoEstimatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: BusinessProfile;
  onApplyItems: (items: LineItem[], recommendedScope?: string) => void;
}

// 4 realistic pre-seeded site images (data URIs / SVG visual representations) so users can test immediately with 1 click even without uploading their own photo
const SAMPLE_PHOTOS = [
  {
    id: 'plumbing_heater',
    title: 'Water Heater Rupture & Corrosion',
    trade: 'plumbing',
    description: '50-Gal tank with bottom rust ring and failed temperature relief valve.',
    badge: 'Plumbing',
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23e2e8f0"/><rect x="130" y="50" width="140" height="200" rx="20" fill="%2394a3b8"/><rect x="150" y="30" width="20" height="25" fill="%23b45309"/><rect x="230" y="30" width="20" height="25" fill="%233b82f6"/><path d="M130 220 Q200 240 270 220" stroke="%23b45309" stroke-width="8" fill="none"/><text x="200" y="160" font-family="sans-serif" font-size="14" font-weight="bold" fill="%231e293b" text-anchor="middle">50-GAL TANK LEAK</text><text x="200" y="180" font-family="sans-serif" font-size="11" fill="%23dc2626" text-anchor="middle">CORROSION / VALVE FAILURE</text></svg>`,
  },
  {
    id: 'electrical_panel',
    title: '100A Federal Pacific Panel Overload',
    trade: 'electrical',
    description: 'Outdated double-tapped bus bar with scorch marks and no surge arrestor.',
    badge: 'Electrical',
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23334155"/><rect x="100" y="40" width="200" height="220" rx="8" fill="%2364748b"/><line x1="200" y1="50" x2="200" y2="250" stroke="%231e293b" stroke-width="6"/><rect x="120" y="70" width="60" height="20" fill="%230f172a"/><rect x="120" y="100" width="60" height="20" fill="%23ef4444"/><rect x="220" y="70" width="60" height="20" fill="%230f172a"/><text x="200" y="170" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23fef08a" text-anchor="middle">100A MAIN BURN RISK</text></svg>`,
  },
  {
    id: 'hvac_condenser',
    title: 'Seized Compressor & Crushed Fins',
    trade: 'hvac',
    description: 'Outdoor condenser unit with seized fan motor and low Freon charge.',
    badge: 'HVAC',
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23cbd5e1"/><rect x="110" y="60" width="180" height="180" rx="12" fill="%23475569"/><circle cx="200" cy="150" r="60" fill="%231e293b"/><text x="200" y="155" font-family="sans-serif" font-size="14" font-weight="bold" fill="%2338bdf8" text-anchor="middle">A/C CONDENSER</text></svg>`,
  },
  {
    id: 'bathroom_remodel',
    title: 'Bathroom Mold & Subfloor Dry Rot',
    trade: 'general_contracting',
    description: 'Leaking shower pan with subfloor deflection and outdated plumbing stack.',
    badge: 'Remodel',
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f1f5f9"/><rect x="80" y="50" width="240" height="200" fill="%23e2e8f0" stroke="%2394a3b8"/><text x="200" y="150" font-family="sans-serif" font-size="14" font-weight="bold" fill="%230f172a" text-anchor="middle">SHOWER PAN WATER DAMAGE</text></svg>`,
  },
];

export const AIPhotoEstimatorModal: React.FC<AIPhotoEstimatorModalProps> = ({
  isOpen,
  onClose,
  business,
  onApplyItems,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(SAMPLE_PHOTOS[0].previewSvg);
  const [activePhotoTitle, setActivePhotoTitle] = useState(SAMPLE_PHOTOS[0].title);
  const [customNotes, setCustomNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImage(result);
      setActivePhotoTitle(file.name);
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const runVisualAnalysis = async () => {
    if (!selectedImage) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/ai/analyze-site-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: selectedImage,
          mimeType: 'image/jpeg',
          trade: business.trade,
          customNotes,
        }),
      });
      const data = await res.json();
      if (data.analysis) {
        setAnalysisResult(data.analysis);
      }
    } catch (err) {
      console.error('Visual analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-100 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-blue-900 text-white">
                <Camera className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-900">
                AI Job Site Photo Estimator (Vision Engine)
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                Gemini Multimodal
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Upload or snap a job site defect photo. Gemini identifies equipment specs, hazards, and generates itemized line items.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          {/* Preset Samples & Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                1. Select Sample Site Photo or Upload Your Own
              </label>
              <label className="text-xs font-semibold text-blue-900 hover:text-blue-950 cursor-pointer inline-flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_PHOTOS.map((sp) => {
                const isSelected = selectedImage === sp.previewSvg;

                return (
                  <button
                    key={sp.id}
                    onClick={() => {
                      setSelectedImage(sp.previewSvg);
                      setActivePhotoTitle(sp.title);
                      setAnalysisResult(null);
                    }}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'border-blue-900 bg-blue-50/60 ring-1 ring-blue-900'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="w-full h-16 bg-slate-100 rounded overflow-hidden flex items-center justify-center border border-slate-200/80">
                      <img
                        src={sp.previewSvg}
                        alt={sp.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p className="text-[11px] font-bold text-slate-900 truncate">
                      {sp.title}
                    </p>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">
                      {sp.badge}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Photo Preview & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div className="sm:col-span-5 h-32 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center shadow-2xs">
              {selectedImage ? (
                <img
                  src={selectedImage}
                  alt="Selected Site"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-xs text-slate-400">No Image Selected</span>
              )}
            </div>

            <div className="sm:col-span-7 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  {activePhotoTitle}
                </span>
                <span className="text-[10px] text-slate-400 uppercase font-semibold">
                  Trade: {business.trade}
                </span>
              </div>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Optional notes: e.g. Customer noticed leak 2 days ago, shutoff stuck"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-900"
              />
              <button
                onClick={runVisualAnalysis}
                disabled={isAnalyzing || !selectedImage}
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-md shadow-xs transition-colors cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Analyzing Photo with Gemini Vision...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Visual Inspection</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-4 pt-1 animate-in fade-in duration-150">
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-emerald-900 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>Detected: {analysisResult.equipmentIdentified}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Inspected
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Condition:</strong>{' '}
                  {analysisResult.conditionAssessment}
                </p>
                <p className="text-slate-700 leading-relaxed">
                  <strong className="text-slate-900">Recommended Scope:</strong>{' '}
                  {analysisResult.recommendedScope}
                </p>
              </div>

              {/* Safety Hazards */}
              {analysisResult.safetyHazards && analysisResult.safetyHazards.length > 0 && (
                <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                    <span>Safety Precautions & Building Code Requirements:</span>
                  </p>
                  <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                    {analysisResult.safetyHazards.map((sh: string, i: number) => (
                      <li key={i}>{sh}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Generated Line Items */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center justify-between">
                  <span>Detected Line Items for Quote</span>
                  <span className="text-[11px] font-normal text-slate-500">
                    {analysisResult.suggestedItems?.length || 0} Line Items
                  </span>
                </h4>

                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                  {analysisResult.suggestedItems?.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="p-3 text-xs flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{item.description}</p>
                        <p className="text-[11px] text-slate-500 capitalize">
                          {item.category} · {item.quantity} {item.unit}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900 tabular-nums shrink-0">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {analysisResult && (
            <button
              onClick={() => {
                const lineItems: LineItem[] = (analysisResult.suggestedItems || []).map(
                  (item: any, idx: number) => ({
                    id: `vision_${Date.now()}_${idx}`,
                    category: item.category || 'labor',
                    description: item.description,
                    quantity: item.quantity || 1,
                    unit: item.unit || 'units',
                    unitPrice: item.unitPrice || 150,
                    unitCost: item.unitCost || 70,
                    taxable: !!item.taxable,
                    isOptional: false,
                    selected: true,
                  })
                );
                onApplyItems(lineItems, analysisResult.recommendedScope);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Apply {analysisResult.suggestedItems?.length || 0} Items to Quote</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
