import React, { useState, useRef } from 'react';
import { X, Upload, Trash2, Camera } from 'lucide-react';
import { MemberProfile, PersonName } from '../types';
import { updateMemberAvatar } from '../lib/firebase';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMember: MemberProfile;
  members?: MemberProfile[];
  onSelectPersonName?: (name: PersonName) => void;
  onOpenEmailAlerts?: () => void;
}

export function EditProfileModal({
  isOpen,
  onClose,
  currentMember,
  members = [],
  onSelectPersonName,
  onOpenEmailAlerts,
}: EditProfileModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please select a valid image file.");
      return;
    }

    try {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height = Math.round((height *= MAX_WIDTH / width));
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width = Math.round((width *= MAX_HEIGHT / height));
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);

          // Get compressed WebP or JPEG
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

          await updateMemberAvatar(currentMember.id, dataUrl);
          setIsUploading(false);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to upload image', err);
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (window.confirm("Remove profile picture?")) {
      try {
        setIsUploading(true);
        await updateMemberAvatar(currentMember.id, null);
        setIsUploading(false);
      } catch (err) {
        console.error('Failed to remove image', err);
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-[#161619] border border-[#26262a] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#222225]">
          <h2 className="text-lg font-bold text-white tracking-tight">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white bg-[#1a1a1d] hover:bg-[#222225] rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col items-center space-y-5">
          <div className="relative group">
            {currentMember.avatarUrl ? (
              <img 
                src={currentMember.avatarUrl} 
                alt={currentMember.name} 
                className="w-24 h-24 rounded-full object-cover border-4 border-[#222225]"
              />
            ) : (
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border-4 border-[#222225] ${currentMember.avatarColor}`}>
                {currentMember.initials}
              </div>
            )}
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:opacity-50"
            >
              <Camera className="w-6 h-6 text-white mb-1" />
              <span className="text-[10px] text-white font-semibold">Change</span>
            </button>
          </div>
          
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg, image/png, image/webp"
            className="hidden"
          />

          <div className="text-center w-full">
            <h3 className="text-lg font-bold text-white">{currentMember.name}</h3>
            <p className="text-xs text-zinc-400 mt-1">Update your profile avatar and identity.</p>

            {onSelectPersonName && members.length > 0 && (
              <div className="mt-3 text-left">
                <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  Linked Member Identity
                </label>
                <select
                  value={currentMember.name}
                  onChange={(e) => onSelectPersonName(e.target.value)}
                  className="w-full bg-[#0e0e11] border border-[#2e2e36] text-zinc-100 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.name}>
                      {m.name} {m.name === 'Senior Iglesia' ? '(Curator - Matt Churches)' : m.name === 'Matt Tighe' ? '(Matt Tighe)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-col w-full gap-2 mt-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-2.5 bg-[#202026] hover:bg-[#2a2a32] border border-[#2e2e36] text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </button>
            
            {onOpenEmailAlerts && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenEmailAlerts();
                }}
                className="w-full py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                📧 Manage Email Alerts & 7-Day Roast
              </button>
            )}

            {currentMember.avatarUrl && (
              <button
                onClick={handleRemoveAvatar}
                disabled={isUploading}
                className="w-full py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Remove Image
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
