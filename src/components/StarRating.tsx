import { useState, MouseEvent } from 'react';
import { Star, X } from 'lucide-react';
import { PersonName } from '../types';

interface StarRatingProps {
  person: PersonName;
  rating?: number; // 1 to 5, or undefined
  onChange: (newRating: number) => void;
  disabled?: boolean;
}

export function StarRating({ person, rating = 0, onChange, disabled = false }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [showClearHover, setShowClearHover] = useState(false);

  const displayRating = hoverRating !== null ? hoverRating : rating;
  const isWatched = rating > 0;

  const handleStarClick = (starValue: number) => {
    if (disabled) return;
    // If clicking the current rating, toggle it off
    if (rating === starValue) {
      onChange(0);
    } else {
      onChange(starValue);
    }
  };

  const handleClear = (e: MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onChange(0);
  };

  return (
    <div
      id={`rating-${person.replace(/\s+/g, '-').toLowerCase()}`}
      className="flex flex-col items-center justify-center gap-1 group/rating py-1 px-1.5 rounded-lg transition-colors hover:bg-[#1c1c22]"
      onMouseLeave={() => {
        setHoverRating(null);
        setShowClearHover(false);
      }}
    >
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = displayRating >= star;
          return (
            <button
              key={star}
              type="button"
              id={`star-${person.replace(/\s+/g, '-').toLowerCase()}-${star}`}
              disabled={disabled}
              onClick={() => handleStarClick(star)}
              onMouseEnter={() => setHoverRating(star)}
              className={`p-0.5 rounded transition-transform duration-150 focus:outline-none focus:ring-1 focus:ring-amber-400 ${
                disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:scale-125'
              }`}
              title={
                isWatched
                  ? `${person}: ${star} star${star > 1 ? 's' : ''} (Click ${star === rating ? 'to clear' : 'to change'})`
                  : `Mark watched & rate ${star} star${star > 1 ? 's' : ''}`
              }
              aria-label={`${person} rating ${star} stars`}
            >
              <Star
                className={`w-4 h-4 transition-colors duration-150 ${
                  isFilled
                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]'
                    : 'text-[#3f3f46] hover:text-amber-300/80'
                }`}
              />
            </button>
          );
        })}

        {isWatched && (
          <button
            type="button"
            onClick={handleClear}
            onMouseEnter={() => setShowClearHover(true)}
            onMouseLeave={() => setShowClearHover(false)}
            title={`Clear ${person}'s rating (mark unwatched)`}
            className="ml-0.5 p-0.5 text-zinc-500 hover:text-rose-400 rounded opacity-0 group-hover/rating:opacity-100 transition-opacity focus:opacity-100 cursor-pointer"
            aria-label="Clear rating"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Sub-label showing numerical rating or unwatched indicator */}
      <div className="text-[11px] font-medium h-4 flex items-center justify-center">
        {isWatched ? (
          <span className="text-amber-400 font-semibold flex items-center gap-0.5">
            {rating} <span className="text-[10px] text-zinc-500">/ 5</span>
          </span>
        ) : (
          <span className="text-zinc-600 text-[10px] italic">
            —
          </span>
        )}
      </div>
    </div>
  );
}
