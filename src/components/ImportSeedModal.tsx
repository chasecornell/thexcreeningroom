import { useState, useId } from 'react';
import { X, Upload, Check, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { MovieItem, PersonName } from '../types';

interface ImportSeedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (movies: Omit<MovieItem, 'id'>[]) => Promise<void>;
}

export function ImportSeedModal({ isOpen, onClose, onImport }: ImportSeedModalProps) {
  const [rawText, setRawText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const textareaId = useId();

  if (!isOpen) return null;

  const handleImport = async () => {
    setError(null);
    setSuccessCount(null);
    if (!rawText.trim()) {
      setError('Please paste seed movie data (JSON array or list of titles).');
      return;
    }

    setIsProcessing(true);
    try {
      let parsedMovies: Omit<MovieItem, 'id'>[] = [];

      // Try JSON parse first
      try {
        const json = JSON.parse(rawText);
        if (Array.isArray(json)) {
          parsedMovies = json.map((item, idx) => ({
            title: item.title || item.Title || `Movie ${idx + 1}`,
            year: String(item.year || item.Year || ''),
            releaseDate: item.releaseDate || item.Released || '',
            genre: item.genre || item.Genre || 'Uncategorized',
            poster: item.poster || item.Poster || '',
            imdbID: item.imdbID || item.imdbId || '',
            imdbRating: String(item.imdbRating || item.Rating || ''),
            director: item.director || item.Director || '',
            plot: item.plot || item.Plot || '',
            runtime: item.runtime || item.Runtime || '',
            addedBy: (item.addedBy as PersonName) || 'Adam',
            addedAt: item.addedAt || (Date.now() - idx * 1000),
            ratings: item.ratings || {},
            notes: item.notes || '',
          }));
        } else if (typeof json === 'object') {
          parsedMovies = [json];
        }
      } catch {
        // Fallback: Parse line-by-line titles (e.g. "Inception (2010)" or just "Inception")
        const lines = rawText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

        if (lines.length === 0) {
          throw new Error('No valid movie lines found');
        }

        parsedMovies = lines.map((line, idx) => {
          // Check for year in parentheses like "The Matrix (1999)"
          const yearMatch = line.match(/\((\d{4})\)/);
          const year = yearMatch ? yearMatch[1] : '';
          const title = line.replace(/\(\d{4}\)/, '').trim();

          return {
            title: title || line,
            year: year,
            releaseDate: year ? `01 Jan ${year}` : '',
            genre: 'Drama',
            poster: '',
            imdbID: '',
            imdbRating: '',
            director: '',
            plot: '',
            runtime: '',
            addedBy: 'Adam',
            addedAt: Date.now() - idx * 1000,
            ratings: {},
            notes: '',
          };
        });
      }

      if (parsedMovies.length === 0) {
        throw new Error('No movies could be parsed from the provided input.');
      }

      await onImport(parsedMovies);
      setSuccessCount(parsedMovies.length);
      setTimeout(() => {
        onClose();
        setRawText('');
        setSuccessCount(null);
      }, 1500);
    } catch (err: unknown) {
      console.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Failed to parse seed data. Please verify JSON or line format.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      id="import-seed-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="import-seed-modal-card"
        className="bg-[#111114] border border-[#26262a] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#222225] bg-[#151518]">
          <div className="flex items-center gap-2.5">
            <Upload className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Load Your Seed Movies</h2>
              <p className="text-xs text-zinc-400">Paste JSON array or line-by-line list of movie titles</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#202026] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label htmlFor={textareaId} className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span>Seed Data Input (JSON or Plain Titles)</span>
              <span className="text-[11px] text-zinc-500 font-normal">Supports JSON or 1 movie per line</span>
            </label>
            <textarea
              id={textareaId}
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={`Example JSON:
[
  { "title": "The Matrix", "year": "1999", "ratings": { "Adam": 5, "Don": 4 } },
  { "title": "Interstellar", "year": "2014", "ratings": { "Tristan Brady": 5 } }
]

Or Plain Text List:
Inception (2010)
The Godfather (1972)
Pulp Fiction (1994)`}
              className="w-full p-3 rounded-xl border border-[#26262a] bg-[#161619] text-xs font-mono text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successCount !== null && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs font-medium">
              <Check className="w-4 h-4 shrink-0" />
              <span>Successfully loaded {successCount} seed movies into Firestore!</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-[#161619] border border-[#222225] text-xs text-zinc-400 space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ready for Chat or Direct Paste</span>
            </div>
            <p>
              You can paste your seed movie data directly here, or send your seed movie list directly in the chat and it will be populated into Firestore.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#222225] bg-[#151518]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-[#202026] rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={isProcessing}
            className="px-5 py-2 text-xs font-bold text-zinc-950 bg-amber-500 hover:bg-amber-400 rounded-xl transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <span>Importing into Firestore...</span>
            ) : (
              <>
                <FileText className="w-4 h-4" />
                <span>Save to Firestore</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
