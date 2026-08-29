import React, { useState } from 'react';
import {
  X,
  Send,
  Reply,
  MessageSquare,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { MovieItem, MovieComment, MemberProfile, PersonName } from '../types';
import {
  addMovieComment,
  removeMovieComment,
  toggleMovieCommentReaction,
} from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';
import { GifModal } from './GifModal';
import { EmojiPickerPopover, POPULAR_REACTION_EMOJIS } from './EmojiPickerPopover';
import { ReactionButtons } from './ReactionButtons';

interface CommentsModalProps {
  movie: MovieItem;
  currentUserProfile: { personName: PersonName | null; isAdmin: boolean } | null;
  members: MemberProfile[];
  onClose: () => void;
}

export function CommentsModal({
  movie,
  currentUserProfile,
  members,
  onClose,
}: CommentsModalProps) {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<MovieComment | null>(null);
  const [attachedGif, setAttachedGif] = useState<string | null>(null);
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const comments = movie.comments || [];

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() && !attachedGif) return;
    if (!currentUserProfile?.personName) {
      alert('Please select your profile from the top bar to post comments!');
      return;
    }

    setIsSubmitting(true);
    try {
      const parentId = replyTo ? (replyTo.parentId || replyTo.id) : null;
      let textToPost = newComment.trim();
      if (replyTo && replyTo.parentId && !textToPost.startsWith(`@${replyTo.author}`)) {
        textToPost = `@${replyTo.author} ${textToPost}`;
      }

      const comment: MovieComment = {
        id: uuidv4(),
        text: textToPost,
        author: currentUserProfile.personName,
        createdAt: Date.now(),
        parentId,
        gifUrl: attachedGif || undefined,
        likes: [],
        dislikes: [],
      };

      await addMovieComment(movie.id, comment);
      setNewComment('');
      setAttachedGif(null);
      setReplyTo(null);
    } catch (err) {
      console.error('Failed to add movie comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleReaction = async (
    commentId: string,
    reactionType: 'like' | 'dislike'
  ) => {
    if (!currentUserProfile?.personName) {
      alert('Please select your profile from the top bar to react!');
      return;
    }
    await toggleMovieCommentReaction(
      movie.id,
      commentId,
      currentUserProfile.personName,
      reactionType
    );
  };

  const handleDeleteComment = async (commentId: string) => {
    if (window.confirm('Delete this comment?')) {
      await removeMovieComment(movie.id, commentId);
    }
  };

  const topLevelComments = comments
    .filter((c) => !c.parentId)
    .sort((a, b) => b.createdAt - a.createdAt);
  const replies = comments
    .filter((c) => c.parentId)
    .sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#111114] border border-[#222225] rounded-2xl shadow-2xl w-full max-w-xl max-h-[88vh] flex flex-col overflow-hidden text-zinc-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#222225] bg-[#151518]">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate flex items-center gap-2">
                <span>Discussion:</span>
                <span className="text-amber-400 truncate">{movie.title}</span>
              </h2>
              <p className="text-[11px] text-zinc-400">
                {comments.length} {comments.length === 1 ? 'comment' : 'comments'} • Reviews & banter
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#202026] transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
          {topLevelComments.length === 0 ? (
            <div className="text-center text-zinc-500 py-12 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto opacity-40 text-amber-500" />
              <p className="text-sm font-semibold text-zinc-400">No comments yet</p>
              <p className="text-xs text-zinc-500">
                Be the first to share your thoughts, roast the film, or drop a reaction GIF!
              </p>
            </div>
          ) : (
            topLevelComments.map((comment) => {
              const commentReplies = replies.filter((r) => r.parentId === comment.id);

              return (
                <div key={comment.id} className="space-y-2">
                  <CommentBubble
                    comment={comment}
                    members={members}
                    currentUserProfile={currentUserProfile}
                    repliesCount={commentReplies.length}
                    onReply={() => setReplyTo(comment)}
                    onToggleReaction={(type) => handleToggleReaction(comment.id, type)}
                    onDelete={() => handleDeleteComment(comment.id)}
                  />

                  {/* Threaded Replies */}
                  {commentReplies.length > 0 && (
                    <div className="pl-6 sm:pl-8 border-l-2 border-amber-500/20 ml-4 sm:ml-6 space-y-2">
                      {commentReplies.map((reply) => (
                        <CommentBubble
                          key={reply.id}
                          comment={reply}
                          isReply
                          members={members}
                          currentUserProfile={currentUserProfile}
                          onReply={() => setReplyTo(reply)}
                          onToggleReaction={(type) => handleToggleReaction(reply.id, type)}
                          onDelete={() => handleDeleteComment(reply.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Input Area with Emoji, GIF, and Reactions */}
        <div className="p-3.5 sm:p-4 border-t border-[#222225] bg-[#151518] space-y-2">
          {/* Replying context banner */}
          {replyTo && (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-300 animate-in fade-in">
              <div className="flex items-center gap-2 truncate">
                <Reply className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Replying to <strong className="font-bold text-white">{replyTo.author}</strong>:
                </span>
                <span className="italic text-zinc-300 truncate">"{replyTo.text}"</span>
              </div>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="p-1 hover:text-white text-zinc-400 hover:bg-amber-500/20 rounded-md transition cursor-pointer"
                title="Cancel reply"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Attached GIF preview */}
          {attachedGif && (
            <div className="relative inline-block rounded-xl overflow-hidden border border-amber-500/50 bg-black/60 shadow-lg">
              <img
                src={attachedGif}
                alt="Attached GIF"
                className="h-24 max-w-xs object-cover rounded-lg"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => setAttachedGif(null)}
                className="absolute top-1.5 right-1.5 p-1 bg-black/80 hover:bg-rose-600 text-white rounded-full transition shadow-md cursor-pointer"
                title="Remove GIF"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Media bar: Quick Emojis + GIF + Emoji Popover */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              {POPULAR_REACTION_EMOJIS.slice(0, 6).map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setNewComment((prev) => prev + em)}
                  className="px-1.5 py-0.5 text-sm rounded-lg hover:bg-[#222228] hover:scale-115 active:scale-95 transition cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <EmojiPickerPopover
                onSelectEmoji={(emoji) => setNewComment((prev) => prev + emoji)}
              />
              <button
                type="button"
                onClick={() => setIsGifModalOpen(true)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer border ${
                  attachedGif
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#1b1b20] hover:bg-[#24242c] text-zinc-300 border-[#2a2a32]'
                }`}
                title="Attach GIF"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>GIF</span>
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                replyTo
                  ? `Reply to ${replyTo.author}...`
                  : currentUserProfile?.personName
                  ? `Comment on ${movie.title} as ${currentUserProfile.personName}...`
                  : 'Select your profile in top bar to comment...'
              }
              disabled={isSubmitting}
              className="flex-1 bg-[#0c0c0e] border border-[#26262c] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={(!newComment.trim() && !attachedGif) || isSubmitting}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-amber-950 px-4 py-2.5 rounded-xl font-bold transition flex items-center justify-center cursor-pointer shadow-sm shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* GIF Picker Modal */}
      {isGifModalOpen && (
        <GifModal
          onSelectGif={(url) => setAttachedGif(url)}
          onClose={() => setIsGifModalOpen(false)}
        />
      )}
    </div>
  );
}

interface CommentBubbleProps {
  key?: string;
  comment: MovieComment;
  members: MemberProfile[];
  currentUserProfile: { personName: PersonName | null; isAdmin: boolean } | null;
  repliesCount?: number;
  isReply?: boolean;
  onReply?: () => void;
  onToggleReaction: (type: 'like' | 'dislike') => void;
  onDelete: () => void;
}

function CommentBubble({
  comment,
  members,
  currentUserProfile,
  repliesCount = 0,
  isReply = false,
  onReply,
  onToggleReaction,
  onDelete,
}: CommentBubbleProps) {
  const authorProfile = members.find((m) => m.name === comment.author);
  const isAuthor = currentUserProfile?.personName === comment.author;
  const canDelete = isAuthor || currentUserProfile?.isAdmin;

  return (
    <div
      className={`rounded-xl border p-3 sm:p-3.5 transition ${
        isReply ? 'bg-[#15151a] border-[#222228]' : 'bg-[#18181e] border-[#262630]'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {authorProfile && (
            authorProfile.avatarUrl ? (
              <img
                src={authorProfile.avatarUrl}
                alt={authorProfile.name}
                className="w-5 h-5 rounded-full object-cover shrink-0"
              />
            ) : (
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${authorProfile.avatarColor} shrink-0`}
              >
                {authorProfile.initials}
              </span>
            )
          )}
          <span className="font-bold text-zinc-100 text-xs">{comment.author}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500">
            {new Date(comment.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </span>
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1 text-zinc-500 hover:text-rose-400 rounded transition cursor-pointer"
              title="Delete comment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Comment text */}
      {comment.text && (
        <p className="text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap break-words leading-relaxed">
          {comment.text}
        </p>
      )}

      {/* Attached GIF */}
      {comment.gifUrl && (
        <div className="mt-2 rounded-xl overflow-hidden border border-[#2a2a32] bg-[#0c0c0e] max-w-xs">
          <img
            src={comment.gifUrl}
            alt="Attached GIF"
            loading="lazy"
            className="w-full max-h-48 object-contain rounded-lg"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Footer: Reactions + Reply */}
      <div className="mt-2.5 pt-2 border-t border-[#222228] flex items-center justify-between gap-2">
        <ReactionButtons
          likes={comment.likes}
          dislikes={comment.dislikes}
          currentPerson={currentUserProfile?.personName}
          members={members}
          onToggleReaction={onToggleReaction}
          compact
        />

        {onReply && (
          <button
            type="button"
            onClick={onReply}
            className="text-xs text-zinc-400 hover:text-amber-400 font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply {repliesCount > 0 ? `(${repliesCount})` : ''}</span>
          </button>
        )}
      </div>
    </div>
  );
}
