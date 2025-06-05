
import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ToolRatingProps {
  rating: number;
  onRatingChange: (rating: number) => void;
  readonly?: boolean;
}

export function ToolRating({ rating, onRatingChange, readonly = false }: ToolRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Button
          key={star}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          disabled={readonly}
          onMouseEnter={() => !readonly && setHoveredRating(star)}
          onMouseLeave={() => !readonly && setHoveredRating(0)}
          onClick={() => !readonly && onRatingChange(star)}
        >
          <Star
            className={`h-3 w-3 ${
              star <= (hoveredRating || rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        </Button>
      ))}
    </div>
  );
}
