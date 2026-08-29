import { useState } from 'react';
import { X, Star, Info, Trophy, Film, Sparkles } from 'lucide-react';

interface RatingSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLeaderboard?: () => void;
}

export function RatingSystemModal({ isOpen, onClose, onOpenLeaderboard }: RatingSystemModalProps) {
  const [activeTab, setActiveTab] = useState<'movies' | 'curators'>('movies');

  if (!isOpen) return null;

  const movieRatings = [
    {
      stars: 5,
      label: "Masterpiece",
      description: "Seriously, question your life choices unless you're going to watch this movie.",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20"
    },
    {
      stars: 4,
      label: "Very Good",
      description: "Very good.",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20"
    },
    {
      stars: 3,
      label: "Average",
      description: "Yes, give it a watch but don't expect too much.",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20"
    },
    {
      stars: 2,
      label: "Poor",
      description: "Watchable if you have absolutely nothing left to do in your life.",
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      border: "border-orange-400/20"
    },
    {
      stars: 1,
      label: "Terrible",
      description: "Absolutely terrible. Don't watch it.",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20"
    }
  ];

  const curatorTiers = [
    {
      stars: 5,
      range: "4.5 – 5.0",
      title: "Masterpiece Curator",
      description: "Their movie picks are certified gold. You must watch anything they upload.",
      color: "text-amber-400",
      bg: "bg-amber-400/10",
      border: "border-amber-400/20"
    },
    {
      stars: 4,
      range: "3.5 – 4.4",
      title: "Very Good Taste",
      description: "Consistently uploads high-caliber, enjoyable films.",
      color: "text-emerald-400",
      bg: "bg-emerald-400/10",
      border: "border-emerald-400/20"
    },
    {
      stars: 3,
      range: "2.5 – 3.4",
      title: "Average Recommender",
      description: "Decent movie picks, but don't expect every choice to blow you away.",
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20"
    },
    {
      stars: 2,
      range: "1.5 – 2.4",
      title: "Poor / Risky Taste",
      description: "Watchable picks only if you have nothing else to do.",
      color: "text-orange-400",
      bg: "bg-orange-400/10",
      border: "border-orange-400/20"
    },
    {
      stars: 1,
      range: "1.0 – 1.4",
      title: "Terrible Taste",
      description: "Steer clear of their recommendations. Pure torture.",
      color: "text-rose-500",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-[#161619] border border-[#26262a] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#222225]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400 shadow-xs">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Rating System Guide</h2>
              <p className="text-xs text-zinc-400">Scoring scale for movies & member curators</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-[#1a1a1d] hover:bg-[#222225] rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#222225] bg-[#121215] px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('movies')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'movies'
                ? 'border-amber-400 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Movie Scores (1–5)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('curators')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'curators'
                ? 'border-amber-400 text-white'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Member Curator Ratings</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 flex flex-col gap-3 max-h-[65vh] overflow-y-auto">
          {activeTab === 'movies' ? (
            <>
              <p className="text-xs text-zinc-400 mb-1">
                When rating a movie you watched, use this official 1 to 5 star rubric:
              </p>
              {movieRatings.map((rating) => (
                <div 
                  key={rating.stars} 
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3.5 rounded-xl border ${rating.bg} ${rating.border}`}
                >
                  <div className="flex items-center shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`w-4 h-4 ${
                          i < rating.stars 
                            ? `fill-current ${rating.color}` 
                            : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${rating.color} mb-0.5`}>
                      {rating.stars} {rating.stars === 1 ? 'Star' : 'Stars'} — {rating.label}
                    </p>
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                      {rating.description}
                    </p>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-xs text-zinc-300 leading-relaxed">
                <div className="font-bold text-amber-400 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>How Member Ratings Work</span>
                </div>
                Every time you upload a movie, other members score it. Your <strong>Curator Rating</strong> is the real-time average of all reviews received on your movie picks!
              </div>

              {curatorTiers.map((tier) => (
                <div 
                  key={tier.stars} 
                  className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3.5 rounded-xl border ${tier.bg} ${tier.border}`}
                >
                  <div className="flex items-center shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`w-4 h-4 ${
                          i < tier.stars 
                            ? `fill-current ${tier.color}` 
                            : 'text-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className={`text-sm font-bold ${tier.color}`}>
                        {tier.title}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 text-zinc-400 font-mono">
                        {tier.range} ★
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                      {tier.description}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[#222225] bg-[#111114] flex items-center justify-between gap-3">
          {activeTab === 'curators' && onOpenLeaderboard ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLeaderboard();
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>View Leaderboard</span>
            </button>
          ) : (
            <div className="text-xs text-zinc-500">
              The Screening Room
            </div>
          )}
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-[#202026] hover:bg-[#2a2a32] border border-[#2e2e36] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
