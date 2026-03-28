'use client';

import { useIsFavorite, useToggleFavorite } from '../lib/hooks';
import { getToken } from '../lib/auth';

interface FavoriteButtonProps {
  entityType: 'company' | 'opportunity' | 'school' | 'job' | 'course';
  entityId: number;
  className?: string;
}

export function FavoriteButton({ entityType, entityId, className = '' }: FavoriteButtonProps) {
  const token = getToken();
  const { data: isFav, isLoading } = useIsFavorite(entityType, entityId);
  const { add, remove } = useToggleFavorite();

  if (!token) return null; // Don't show for unauthenticated users

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFav) {
      remove.mutate({ entityType, entityId });
    } else {
      add.mutate({ entityType, entityId });
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || add.isPending || remove.isPending}
      className={`transition-colors ${className}`}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFav ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-red-500">
          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground hover:text-red-500">
          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
        </svg>
      )}
    </button>
  );
}
