import React, { useState, useMemo } from 'react';
import { X, Search, Link as LinkIcon, Film, Sparkles, Check } from 'lucide-react';
import { CURATED_GIFS, GIF_CATEGORIES, CuratedGif } from '../data/curatedGifs';

interface GifModalProps {
  onSelectGif: (url: string) => void;
  onClose: () => void;
}

export function GifModal({ onSelectGif, onClose }: GifModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customUrl, setCustomUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'browse' | 'custom'>('browse');
  const [customUrlError, setCustomUrlError] = useState(false);

  const filteredGifs = useMemo(() => {
    return CURATED_GIFS.filter((gif) => {
      const matchesCategory =
        selectedCategory === 'All' || gif.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase().trim();
      return (
        gif.title.toLowerCase().includes(q) ||
        gif.category.toLowerCase().includes(q) ||
        gif.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, selectedCategory]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    onSelectGif(customUrl.trim());
    onClose();
  };

  return (
    <div
      id="gif-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="gif-modal-container"
        className="bg-[#121215] border border-[#26262a] w-full max-w-xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-100 animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222225] bg-[#16161a]">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Choose a Reaction GIF</h3>
              <p className="text-[11px] text-zinc-400">Movie reactions, memes & hot takes</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#0d0d10] p-0.5 rounded-lg border border-[#26262a] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  activeTab === 'browse'
                    ? 'bg-amber-500 text-amber-950 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Browse
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('custom')}
                className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1 ${
                  activeTab === 'custom'
                    ? 'bg-amber-500 text-amber-950 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <LinkIcon className="w-3 h-3" /> URL
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#222228] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeTab === 'browse' ? (
          <>
            {/* Search and Category Filter */}
            <div className="p-3.5 border-b border-[#222225] space-y-2.5 bg-[#141418]">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search GIFs (e.g. popcorn, laugh, fire, trash, why, scorsese)..."
                  className="w-full bg-[#0d0d10] border border-[#26262c] rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
                {GIF_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-semibold'
                        : 'bg-[#18181d] border-[#26262c] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* GIFs Grid */}
            <div className="flex-1 overflow-y-auto p-3.5">
              {filteredGifs.length === 0 ? (
                <div className="py-12 text-center text-zinc-500 space-y-2">
                  <Film className="w-8 h-8 mx-auto opacity-40 text-amber-500" />
                  <p className="text-xs">No matching GIFs found.</p>
                  <p className="text-[11px] text-zinc-600">
                    Try another search keyword or switch to the "URL" tab to paste any GIF link!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {filteredGifs.map((gif: CuratedGif) => (
                    <button
                      key={gif.id}
                      onClick={() => {
                        onSelectGif(gif.url);
                        onClose();
                      }}
                      className="group relative rounded-xl overflow-hidden border border-[#242429] hover:border-amber-500/80 bg-[#15151a] aspect-video focus:outline-none focus:ring-2 focus:ring-amber-500 transition cursor-pointer"
                    >
                      <img
                        src={gif.url}
                        alt={gif.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                        <span className="text-[10px] font-semibold text-amber-300 truncate drop-shadow-sm">
                          {gif.title}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Custom GIF / Image URL Tab */
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Paste Direct GIF or Image URL
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    setCustomUrlError(false);
                  }}
                  placeholder="https://media.giphy.com/.../giphy.gif"
                  className="w-full bg-[#0d0d10] border border-[#26262c] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {customUrl.trim() && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-zinc-400">GIF Preview:</span>
                  <div className="rounded-xl overflow-hidden border border-[#26262c] bg-[#0c0c0e] max-h-48 flex items-center justify-center p-2">
                    <img
                      src={customUrl}
                      alt="Custom preview"
                      onError={() => setCustomUrlError(true)}
                      className="max-h-44 max-w-full object-contain rounded-lg"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {customUrlError && (
                    <p className="text-[11px] text-rose-400">
                      Failed to load image preview. Please check that the URL ends in .gif, .png, or .jpg.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222225]">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-zinc-400 hover:text-white rounded-xl hover:bg-[#202026] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCustomSubmit}
                disabled={!customUrl.trim() || customUrlError}
                className="px-4 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-amber-950 rounded-xl transition flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Attach GIF
              </button>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="px-5 py-2.5 border-t border-[#222225] bg-[#141418] text-[11px] text-zinc-500 flex items-center justify-between">
          <span className="flex items-center gap-1 text-zinc-400">
            <Sparkles className="w-3 h-3 text-amber-400" /> Instant Screening Room GIFs
          </span>
          <span>Click any GIF to attach</span>
        </div>
      </div>
    </div>
  );
}
