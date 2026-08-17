import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  Reply,
  Trash2,
  ChevronDown,
  ChevronUp,
  Film,
  Sparkles,
  Search,
  X,
  Radio,
  Image as ImageIcon,
} from 'lucide-react';
import { ChatMessage, MemberProfile, PersonName } from '../types';
import {
  addGeneralChatMessage,
  toggleGeneralChatReaction,
  deleteGeneralChatMessage,
  deleteAllGeneralChatMessages,
  forceSeedGeneralChat,
} from '../lib/firebase';
import { GifModal } from './GifModal';
import { EmojiPickerPopover, POPULAR_REACTION_EMOJIS } from './EmojiPickerPopover';
import { ReactionButtons } from './ReactionButtons';

interface GeneralChatProps {
  messages: ChatMessage[];
  members: MemberProfile[];
  currentUserProfile: { personName: PersonName | null; isAdmin: boolean } | null;
}

export function GeneralChat({ messages, members, currentUserProfile }: GeneralChatProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [attachedGif, setAttachedGif] = useState<string | null>(null);
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [isGifModalOpen, setIsGifModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  // Group top-level messages vs replies
  const topLevelMessages = messages.filter((m) => !m.parentId);
  const replies = messages.filter((m) => m.parentId);

  // Top 2 most recent top-level messages for the collapsed preview
  const previewMessages = topLevelMessages.slice(0, 2);

  // Filtered top-level messages when expanded
  const filteredMessages = topLevelMessages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const textMatch = m.text.toLowerCase().includes(q);
    const authorMatch = m.author.toLowerCase().includes(q);
    const hasMatchingReply = replies.some(
      (r) => r.parentId === m.id && (r.text.toLowerCase().includes(q) || r.author.toLowerCase().includes(q))
    );
    return textMatch || authorMatch || hasMatchingReply;
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedGif) return;
    if (!currentUserProfile?.personName) {
      alert('Please select your profile from the top right to join the chat!');
      return;
    }

    setIsPosting(true);
    try {
      await addGeneralChatMessage({
        text: inputText.trim(),
        author: currentUserProfile.personName,
        createdAt: Date.now(),
        parentId: replyToMessage?.id || null,
        gifUrl: attachedGif || undefined,
        likes: [],
        dislikes: [],
      });

      setInputText('');
      setAttachedGif(null);
      setReplyToMessage(null);
    } catch (err) {
      console.error('Failed to send general chat message:', err);
    } finally {
      setIsPosting(false);
    }
  };

  const handleToggleReaction = async (
    message: ChatMessage,
    reactionType: 'like' | 'dislike'
  ) => {
    if (!currentUserProfile?.personName) {
      alert('Please select your profile from the top bar to react!');
      return;
    }
    await toggleGeneralChatReaction(
      message.id,
      currentUserProfile.personName,
      reactionType,
      message.likes || [],
      message.dislikes || []
    );
  };

  const handleDelete = async (messageId: string) => {
    if (window.confirm('Delete this message from the stream?')) {
      await deleteGeneralChatMessage(messageId);
    }
  };

  const handleClearAllMessages = async () => {
    if (window.confirm('Are you sure you want to delete ALL messages in General Chat? This cannot be undone.')) {
      setIsPosting(true);
      try {
        await deleteAllGeneralChatMessages();
      } catch (err) {
        console.error('Failed to delete all messages:', err);
      } finally {
        setIsPosting(false);
      }
    }
  };

  const handleSeedSampleBanter = async () => {
    setIsPosting(true);
    try {
      await forceSeedGeneralChat();
    } catch (err) {
      console.error('Failed to seed sample banter:', err);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <section
      id="screening-room-general-chat"
      className="bg-[#111114] border border-[#222225] rounded-2xl shadow-md overflow-hidden transition-all duration-200"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6 bg-[#151519] border-b border-[#222225]">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Screening Room Lounge
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                <Radio className="w-2.5 h-2.5 animate-pulse" /> Live Stream
              </span>
              <span className="text-[11px] font-semibold text-zinc-400 px-2 py-0.2 bg-[#1a1a20] rounded-md border border-[#282830]">
                {messages.length} {messages.length === 1 ? 'post' : 'posts'}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Unfiltered movie banter, roasts, why someone added a movie & nonsense
            </p>
          </div>
        </div>

        {/* Expand / Collapse and Quick Stats */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {currentUserProfile?.isAdmin && messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllMessages}
              disabled={isPosting}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/50 transition cursor-pointer"
              title="Delete all messages in General Chat"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear Chat</span>
            </button>
          )}

          {messages.length === 0 && (
            <button
              type="button"
              onClick={handleSeedSampleBanter}
              disabled={isPosting}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Sample Banter</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              isExpanded
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                : 'bg-[#18181d] text-zinc-300 hover:text-white border-[#282830] hover:border-zinc-600'
            }`}
          >
            <span>{isExpanded ? 'Collapse Lounge' : `Expand Chat (${messages.length})`}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Chat Body */}
      <div className="p-4 sm:p-6 space-y-4">
        {/* If Collapsed, show top 2 messages preview */}
        {!isExpanded && (
          <div className="space-y-3">
            {previewMessages.length === 0 ? (
              <div className="py-6 text-center text-zinc-400 text-xs bg-[#0e0e11] rounded-xl border border-[#1e1e24] p-4 flex flex-col items-center gap-2">
                <span>No chat banter yet. Be the first to drop a hot take or load sample group discussions!</span>
                <button
                  type="button"
                  onClick={handleSeedSampleBanter}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Seed Starter Banter & GIFs</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 px-1 font-medium">
                  <span>Recent 2 Hot Takes:</span>
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="text-amber-400 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <span>View all {messages.length} messages</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>

                {previewMessages.map((msg) => {
                  const msgReplies = replies.filter((r) => r.parentId === msg.id);
                  return (
                    <ChatMessageCard
                      key={msg.id}
                      message={msg}
                      repliesCount={msgReplies.length}
                      members={members}
                      currentUserProfile={currentUserProfile}
                      onReply={() => {
                        setReplyToMessage(msg);
                        setIsExpanded(true);
                      }}
                      onToggleReaction={(type) => handleToggleReaction(msg, type)}
                      onDelete={() => handleDelete(msg.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* If Expanded, show full interactive feed with search & replies */}
        {isExpanded && (
          <div className="space-y-4">
            {/* Search filter in expanded mode */}
            {topLevelMessages.length > 3 && (
              <div className="relative max-w-sm">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter chat by text or member..."
                  className="w-full bg-[#0d0d10] border border-[#24242a] rounded-xl pl-8 pr-7 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
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
            )}

            {/* Expanded Messages List */}
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredMessages.length === 0 ? (
                <div className="py-8 text-center text-zinc-500 text-xs">
                  {searchQuery ? 'No matching chat messages found.' : 'The lounge is empty. Start the conversation!'}
                </div>
              ) : (
                filteredMessages.map((msg) => {
                  const msgReplies = replies
                    .filter((r) => r.parentId === msg.id)
                    .sort((a, b) => a.createdAt - b.createdAt);

                  return (
                    <div key={msg.id} className="space-y-2">
                      <ChatMessageCard
                        message={msg}
                        repliesCount={msgReplies.length}
                        members={members}
                        currentUserProfile={currentUserProfile}
                        onReply={() => setReplyToMessage(msg)}
                        onToggleReaction={(type) => handleToggleReaction(msg, type)}
                        onDelete={() => handleDelete(msg.id)}
                      />

                      {/* Threaded replies */}
                      {msgReplies.length > 0 && (
                        <div className="pl-6 sm:pl-8 border-l-2 border-amber-500/20 ml-4 sm:ml-6 space-y-2">
                          {msgReplies.map((reply) => (
                            <ChatMessageCard
                              key={reply.id}
                              message={reply}
                              isReply
                              members={members}
                              currentUserProfile={currentUserProfile}
                              onToggleReaction={(type) => handleToggleReaction(reply, type)}
                              onDelete={() => handleDelete(reply.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Chat Input Section */}
        <div className="pt-3 border-t border-[#222225] space-y-2 bg-[#141418] rounded-xl p-3 sm:p-4 border">
          {/* Replying context banner */}
          {replyToMessage && (
            <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-1.5 text-xs text-amber-300 animate-in fade-in">
              <div className="flex items-center gap-2 truncate">
                <Reply className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>
                  Replying to <strong className="font-bold text-white">{replyToMessage.author}</strong>:
                </span>
                <span className="italic text-zinc-300 truncate">"{replyToMessage.text}"</span>
              </div>
              <button
                type="button"
                onClick={() => setReplyToMessage(null)}
                className="p-1 hover:text-white text-zinc-400 hover:bg-amber-500/20 rounded-md transition cursor-pointer"
                title="Cancel reply"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Attached GIF preview before sending */}
          {attachedGif && (
            <div className="relative inline-block rounded-xl overflow-hidden border border-amber-500/50 bg-black/60 shadow-lg">
              <img
                src={attachedGif}
                alt="Attached GIF"
                className="h-28 max-w-xs object-cover rounded-lg"
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
              <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-amber-400">
                GIF ATTACHED
              </div>
            </div>
          )}

          {/* Quick Reaction Bar & Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Quick Emojis */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider hidden sm:inline mr-1">
                Quick:
              </span>
              {POPULAR_REACTION_EMOJIS.slice(0, 7).map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setInputText((prev) => prev + em)}
                  className="px-1.5 py-0.5 text-sm rounded-lg hover:bg-[#222228] hover:scale-115 active:scale-95 transition cursor-pointer"
                >
                  {em}
                </button>
              ))}
            </div>

            {/* Media Add Buttons: Emoji & GIF */}
            <div className="flex items-center gap-1.5">
              <EmojiPickerPopover
                onSelectEmoji={(emoji) => setInputText((prev) => prev + emoji)}
              />

              <button
                type="button"
                onClick={() => setIsGifModalOpen(true)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer border ${
                  attachedGif
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#1b1b20] hover:bg-[#24242c] text-zinc-300 border-[#2a2a32]'
                }`}
                title="Attach reaction GIF"
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                <span>GIF</span>
              </button>
            </div>
          </div>

          {/* Main Input & Send Row */}
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  replyToMessage
                    ? `Reply to ${replyToMessage.author}...`
                    : currentUserProfile?.personName
                    ? `Drop a hot take, roasted movie review, or banter as ${currentUserProfile.personName}...`
                    : 'Select your profile in top bar to chat...'
                }
                disabled={isPosting}
                className="w-full bg-[#0d0d10] border border-[#26262c] rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={(!inputText.trim() && !attachedGif) || isPosting}
              className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-amber-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Post</span>
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
    </section>
  );
}

interface ChatMessageCardProps {
  key?: string;
  message: ChatMessage;
  repliesCount?: number;
  isReply?: boolean;
  members: MemberProfile[];
  currentUserProfile: { personName: PersonName | null; isAdmin: boolean } | null;
  onReply?: () => void;
  onToggleReaction: (type: 'like' | 'dislike') => void;
  onDelete: () => void;
}

function ChatMessageCard({
  message,
  repliesCount = 0,
  isReply = false,
  members,
  currentUserProfile,
  onReply,
  onToggleReaction,
  onDelete,
}: ChatMessageCardProps) {
  const authorProfile = members.find((m) => m.name === message.author);
  const isAuthor = currentUserProfile?.personName === message.author;
  const canDelete = isAuthor || currentUserProfile?.isAdmin;

  // Format relative or compact date
  const timeString = formatRelativeTime(message.createdAt);

  return (
    <div
      className={`rounded-xl border transition-all duration-150 p-3 sm:p-3.5 ${
        isReply
          ? 'bg-[#151519] border-[#222228]'
          : 'bg-[#16161b] border-[#26262e] shadow-xs hover:border-[#383844]'
      }`}
    >
      {/* Author Bar */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-extrabold ${
              authorProfile?.avatarColor || 'bg-zinc-700 text-white'
            } shrink-0`}
          >
            {authorProfile?.initials || message.author.slice(0, 2)}
          </span>

          <span className="text-xs font-bold text-zinc-100 truncate">
            {message.author}
          </span>

          {authorProfile && (
            <span
              className={`hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold border ${authorProfile.badgeBg}`}
            >
              {authorProfile.shortName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-zinc-500">{timeString}</span>

          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="p-1 text-zinc-500 hover:text-rose-400 rounded hover:bg-rose-950/30 transition cursor-pointer"
              title="Delete message"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Message Text */}
      {message.text && (
        <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap break-words">
          {message.text}
        </p>
      )}

      {/* Attached Animated GIF */}
      {message.gifUrl && (
        <div className="mt-2 rounded-xl overflow-hidden border border-[#2a2a32] bg-[#0c0c0e] max-w-sm">
          <img
            src={message.gifUrl}
            alt="Attached GIF"
            loading="lazy"
            className="w-full max-h-56 object-contain rounded-lg"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Footer: Reactions (Likes/Dislikes) + Reply */}
      <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-[#222228]/80">
        {/* Likes and Dislikes */}
        <ReactionButtons
          likes={message.likes}
          dislikes={message.dislikes}
          currentPerson={currentUserProfile?.personName}
          members={members}
          onToggleReaction={onToggleReaction}
          compact
        />

        {/* Reply Button */}
        {onReply && (
          <button
            type="button"
            onClick={onReply}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-400 font-semibold px-2 py-1 rounded-lg hover:bg-amber-500/10 transition cursor-pointer"
          >
            <Reply className="w-3.5 h-3.5" />
            <span>Reply {repliesCount > 0 ? `(${repliesCount})` : ''}</span>
          </button>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
