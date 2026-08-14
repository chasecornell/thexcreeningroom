import React, { useState } from 'react';
import { X, Send, Reply, MessageSquare } from 'lucide-react';
import { MovieItem, MovieComment, MemberProfile, PersonName } from '../types';
import { addMovieComment } from '../lib/firebase';
import { v4 as uuidv4 } from 'uuid';

interface CommentsModalProps {
  movie: MovieItem;
  currentUserProfile: { personName: PersonName | null; isAdmin: boolean } | null;
  members: MemberProfile[];
  onClose: () => void;
}

export function CommentsModal({ movie, currentUserProfile, members, onClose }: CommentsModalProps) {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const comments = movie.comments || [];

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserProfile?.personName) return;

    const comment: MovieComment = {
      id: uuidv4(),
      text: newComment.trim(),
      author: currentUserProfile.personName,
      createdAt: Date.now(),
      parentId: replyTo,
    };

    await addMovieComment(movie.id, comment);
    setNewComment('');
    setReplyTo(null);
  };

  const topLevelComments = comments.filter((c) => !c.parentId).sort((a, b) => b.createdAt - a.createdAt);
  const replies = comments.filter((c) => c.parentId).sort((a, b) => a.createdAt - b.createdAt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#111114] border border-[#222225] rounded-2xl shadow-xl w-full max-w-lg max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-[#222225]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            Comments - {movie.title}
          </h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-[#222225]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {topLevelComments.length === 0 ? (
            <div className="text-center text-zinc-500 py-8">
              No comments yet. Be the first to start the discussion!
            </div>
          ) : (
            topLevelComments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <CommentBubble comment={comment} members={members} onReply={() => setReplyTo(comment.id)} />
                
                {/* Replies */}
                {replies
                  .filter((r) => r.parentId === comment.id)
                  .map((reply) => (
                    <div key={reply.id} className="pl-8 border-l border-[#222225] ml-4">
                      <CommentBubble comment={reply} members={members} />
                    </div>
                  ))}
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[#222225] bg-[#151518] rounded-b-2xl">
          {replyTo && (
            <div className="flex items-center justify-between text-xs text-amber-400 mb-2 px-1">
              <span>Replying to a comment...</span>
              <button onClick={() => setReplyTo(null)} className="hover:text-amber-300 hover:underline">
                Cancel
              </button>
            </div>
          )}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-[#0c0c0e] border border-[#222225] rounded-xl px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:hover:bg-amber-500 text-amber-950 px-3 py-2 rounded-xl font-medium transition flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function CommentBubble({ comment, members, onReply }: { comment: MovieComment; members: MemberProfile[]; onReply?: () => void }) {
  const authorProfile = members.find((m) => m.name === comment.author);
  
  return (
    <div className="bg-[#18181d] border border-[#222225] rounded-xl p-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {authorProfile && (
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${authorProfile.avatarColor}`}>
              {authorProfile.initials}
            </span>
          )}
          <span className="font-semibold text-zinc-200 text-xs">{comment.author}</span>
        </div>
        <span className="text-[10px] text-zinc-500">
          {new Date(comment.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="text-sm text-zinc-300 whitespace-pre-wrap">{comment.text}</p>
      {onReply && (
        <div className="mt-2 text-right">
          <button
            onClick={onReply}
            className="text-xs text-zinc-400 hover:text-amber-400 flex items-center gap-1 ml-auto transition"
          >
            <Reply className="w-3 h-3" /> Reply
          </button>
        </div>
      )}
    </div>
  );
}
