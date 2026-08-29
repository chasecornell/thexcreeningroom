import { X, Clapperboard, Star, Trophy, MessageSquare, TrendingUp } from 'lucide-react';

interface AboutAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutAppModal({ isOpen, onClose }: AboutAppModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#0a0a0c]/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-[#111114] border border-[#222225] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#222225] bg-gradient-to-r from-[#111114] to-[#16161a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20 shadow-xs">
              <Clapperboard className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">About The App</h2>
              <p className="text-xs text-amber-400/80 font-semibold tracking-wide">
                OR: WHY WE ARE ALL HERE
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#222225] text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-zinc-300">
          
          <div className="bg-[#16161a] border border-[#26262a] rounded-2xl p-5 shadow-inner">
            <p className="text-base leading-relaxed">
              Alright, listen up. Welcome to <strong className="text-amber-400">The Screening Room</strong>. 
              This isn't your grandma's Goodreads for movies, and it isn't a safe space for your terrible taste. 
              This is where your cinematic reputation goes to die.
            </p>
            <p className="mt-3 leading-relaxed">
              <strong>The Core Loop:</strong> You add a movie you think is a masterpiece. We all watch it. We judge it (and by extension, we judge you). That's it. Don't overcomplicate it.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            
            {/* Adding Movies */}
            <div className="bg-[#111114] border border-[#222225] rounded-xl p-4 transition-colors hover:border-amber-500/30">
              <div className="flex items-center gap-2 mb-2 text-amber-400">
                <Clapperboard className="w-4 h-4" />
                <h3 className="font-bold text-zinc-100 uppercase tracking-wider text-xs">Adding Movies</h3>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                Hit the giant yellow button. The app knows who you are, so no hiding behind "I didn't pick this" when the movie turns out to be a 2-hour snooze fest. You own your garbage here.
              </p>
            </div>

            {/* Rating */}
            <div className="bg-[#111114] border border-[#222225] rounded-xl p-4 transition-colors hover:border-emerald-500/30">
              <div className="flex items-center gap-2 mb-2 text-emerald-400">
                <Star className="w-4 h-4" />
                <h3 className="font-bold text-zinc-100 uppercase tracking-wider text-xs">The Rating System</h3>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                1 to 5 stars. 5 means it's a flawless masterpiece. 1 means you owe the squad a written apology for stealing 90 minutes of our lives. Be honest.
              </p>
            </div>

            {/* Leaderboard */}
            <div className="bg-[#111114] border border-[#222225] rounded-xl p-4 transition-colors hover:border-blue-500/30">
              <div className="flex items-center gap-2 mb-2 text-blue-400">
                <Trophy className="w-4 h-4" />
                <h3 className="font-bold text-zinc-100 uppercase tracking-wider text-xs">The Leaderboard</h3>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                We track your <strong>Curator Score</strong>. It's based on how much the group actually likes the movies you recommend. Stay at the top, you're a god. Sink to the bottom, and your movie privileges might get revoked.
              </p>
            </div>

            {/* Chat Lounge */}
            <div className="bg-[#111114] border border-[#222225] rounded-xl p-4 transition-colors hover:border-rose-500/30">
              <div className="flex items-center gap-2 mb-2 text-rose-400">
                <MessageSquare className="w-4 h-4" />
                <h3 className="font-bold text-zinc-100 uppercase tracking-wider text-xs">Chat Lounge</h3>
              </div>
              <p className="text-xs leading-relaxed text-zinc-400">
                Talk trash during the movie. Drop a GIF when the plot makes zero sense. It's real-time, so bring your A-game. If you're not roasting, you're not trying.
              </p>
            </div>

          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
            <TrendingUp className="w-5 h-5 text-amber-400 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-amber-300 mb-1">Squad Stats</h4>
            <p className="text-xs text-amber-500/80">
              Cold, hard analytics. We have literal bar charts proving who brings the heat and who brings the pain. Check the stats tab before you argue.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-[#222225] bg-[#16161a] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-sm font-bold shadow-md transition cursor-pointer"
          >
            Got it, Let's Watch
          </button>
        </div>
      </div>
    </div>
  );
}
