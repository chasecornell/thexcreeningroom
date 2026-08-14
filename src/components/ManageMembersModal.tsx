import React, { useState } from 'react';
import { X, Users, Plus } from 'lucide-react';
import { MemberProfile } from '../types';

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: MemberProfile[];
  onAddMember: (memberData: Omit<MemberProfile, 'id' | 'addedAt'>) => Promise<void>;
}

const COLORS = [
  { name: 'Emerald', value: 'bg-emerald-600 text-emerald-50', badge: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80', text: 'text-emerald-400', border: 'border-emerald-500/80' },
  { name: 'Blue', value: 'bg-blue-600 text-blue-50', badge: 'bg-blue-950/60 text-blue-300 border-blue-800/80', text: 'text-blue-400', border: 'border-blue-500/80' },
  { name: 'Violet', value: 'bg-violet-600 text-violet-50', badge: 'bg-violet-950/60 text-violet-300 border-violet-800/80', text: 'text-violet-400', border: 'border-violet-500/80' },
  { name: 'Amber', value: 'bg-amber-600 text-amber-50', badge: 'bg-amber-950/60 text-amber-300 border-amber-800/80', text: 'text-amber-400', border: 'border-amber-500/80' },
  { name: 'Rose', value: 'bg-rose-600 text-rose-50', badge: 'bg-rose-950/60 text-rose-300 border-rose-800/80', text: 'text-rose-400', border: 'border-rose-500/80' },
  { name: 'Cyan', value: 'bg-cyan-600 text-cyan-50', badge: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/80', text: 'text-cyan-400', border: 'border-cyan-500/80' },
  { name: 'Fuchsia', value: 'bg-fuchsia-600 text-fuchsia-50', badge: 'bg-fuchsia-950/60 text-fuchsia-300 border-fuchsia-800/80', text: 'text-fuchsia-400', border: 'border-fuchsia-500/80' },
  { name: 'Indigo', value: 'bg-indigo-600 text-indigo-50', badge: 'bg-indigo-950/60 text-indigo-300 border-indigo-800/80', text: 'text-indigo-400', border: 'border-indigo-500/80' },
  { name: 'Lime', value: 'bg-lime-600 text-lime-50', badge: 'bg-lime-950/60 text-lime-300 border-lime-800/80', text: 'text-lime-400', border: 'border-lime-500/80' },
];

export function ManageMembersModal({ isOpen, onClose, members, onAddMember }: ManageMembersModalProps) {
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [initials, setInitials] = useState('');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !shortName || !initials) return;

    try {
      setIsSubmitting(true);
      const colorSet = COLORS[selectedColorIndex];
      await onAddMember({
        name,
        shortName,
        initials: initials.toUpperCase().slice(0, 2),
        avatarColor: colorSet.value,
        badgeBg: colorSet.badge,
        badgeText: colorSet.text,
        borderAccent: colorSet.border,
      });
      setName('');
      setShortName('');
      setInitials('');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#161619] border border-[#26262a] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#222225]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-400 shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Manage Group</h2>
              <p className="text-xs text-zinc-400">Add new members to the roster</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-[#1a1a1d] hover:bg-[#222225] rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[70vh]">
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Current Members ({members.length})</h3>
            <div className="flex flex-wrap gap-2">
              {members.map(m => (
                <div key={m.id} className={`px-2.5 py-1 text-xs font-semibold border rounded-lg ${m.badgeBg}`}>
                  {m.name}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Add New Member</h3>
            
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 ml-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!shortName) setShortName(e.target.value.split(' ')[0]);
                  if (!initials) setInitials(e.target.value.split(' ').map(n => n[0]).join('').slice(0, 2));
                }}
                className="w-full bg-[#0a0a0c] border border-[#26262a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="e.g. John Doe"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 ml-1">Short Name</label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full bg-[#0a0a0c] border border-[#26262a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
                  placeholder="e.g. John"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 ml-1">Initials</label>
                <input
                  type="text"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 2))}
                  className="w-full bg-[#0a0a0c] border border-[#26262a] rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors uppercase"
                  placeholder="e.g. JD"
                  maxLength={2}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 ml-1">Color Theme</label>
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map((color, idx) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => setSelectedColorIndex(idx)}
                    className={`w-full aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-transform ${color.value} ${
                      selectedColorIndex === idx ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    {initials || 'A'}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !name || !shortName || !initials}
              className="w-full mt-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
