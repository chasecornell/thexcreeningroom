import React, { useState, useMemo, useEffect } from 'react';
import {
  Mail,
  Flame,
  Clock,
  Settings,
  Sparkles,
  Send,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Eye,
  Code2,
  AlertCircle,
  Film,
  UserCheck,
  BellOff,
  Bell,
  RefreshCw,
  X,
  ExternalLink,
} from 'lucide-react';
import { MovieItem, MemberProfile, ChatMessage, HotTake, PersonName, UserEmailPreferences } from '../types';
import {
  buildWeeklyRoastData,
  buildDailyDigestData,
  renderWeeklyRoastHtml,
  renderDailyDigestHtml,
  fetchAiWeeklyRoast,
  sendTestEmailDispatch,
} from '../services/emailService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface EmailAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  movies: MovieItem[];
  members: MemberProfile[];
  chatMessages: ChatMessage[];
  hotTakes: HotTake[];
  currentMemberName: PersonName | null;
  userEmail?: string | null;
  userId?: string | null;
  onShowToast: (text: string, type?: 'success' | 'info') => void;
}

export const EmailAlertsModal: React.FC<EmailAlertsModalProps> = ({
  isOpen,
  onClose,
  movies,
  members,
  chatMessages,
  hotTakes,
  currentMemberName,
  userEmail,
  userId,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'weekly' | 'daily' | 'settings'>('weekly');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [viewMode, setViewMode] = useState<'preview' | 'html'>('preview');

  // Preferences State
  const [emailInput, setEmailInput] = useState<string>(userEmail || 'akleyweg@gmail.com');
  const [optOutDaily, setOptOutDaily] = useState<boolean>(false);
  const [optOutWeekly, setOptOutWeekly] = useState<boolean>(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState<boolean>(false);

  // AI Roast state
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [customRoastData, setCustomRoastData] = useState<any>(null);

  // Sending state
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [copiedHtml, setCopiedHtml] = useState<boolean>(false);

  // Load preferences from Firestore on mount
  useEffect(() => {
    if (!isOpen) return;

    if (userEmail) {
      setEmailInput(userEmail);
    }

    if (userId) {
      const fetchPrefs = async () => {
        try {
          const prefRef = doc(db, 'email_preferences', userId);
          const snap = await getDoc(prefRef);
          if (snap.exists()) {
            const data = snap.data() as UserEmailPreferences;
            if (data.email) setEmailInput(data.email);
            setOptOutDaily(!!data.optOutDailyDigest);
            setOptOutWeekly(!!data.optOutWeeklyRoast);
          }
        } catch (err) {
          console.warn('Could not load email preferences:', err);
        }
      };
      fetchPrefs();
    }
  }, [isOpen, userId, userEmail]);

  const activeCuratorName = currentMemberName || 'Adam';

  // Build weekly roast data
  const weeklyData = useMemo(() => {
    return buildWeeklyRoastData(
      activeCuratorName,
      movies,
      members,
      chatMessages,
      hotTakes,
      customRoastData
    );
  }, [activeCuratorName, movies, members, chatMessages, hotTakes, customRoastData]);

  // Build daily digest data
  const dailyData = useMemo(() => {
    return buildDailyDigestData(movies);
  }, [movies]);

  // Render HTML strings
  const weeklyHtml = useMemo(() => {
    return renderWeeklyRoastHtml(weeklyData, activeCuratorName);
  }, [weeklyData, activeCuratorName]);

  const dailyHtml = useMemo(() => {
    return renderDailyDigestHtml(dailyData, activeCuratorName);
  }, [dailyData, activeCuratorName]);

  // Handle AI Sarcastic Generation
  const handleGenerateAiRoast = async () => {
    setIsGeneratingAi(true);
    try {
      const topCurator = weeklyData.topCurator;
      const bottomCurator = weeklyData.bottomCurator;
      const unratedCount = weeklyData.unratedMovies.length;
      const hotTakeText = weeklyData.recentHotTake?.hotTakeText;
      const chatQuotes = chatMessages.slice(0, 3).map((c) => `${c.author}: ${c.text}`);

      const aiResult = await fetchAiWeeklyRoast(
        activeCuratorName,
        topCurator,
        bottomCurator,
        unratedCount,
        movies.slice(0, 5),
        hotTakeText,
        chatQuotes
      );

      if (aiResult) {
        setCustomRoastData(aiResult);
        onShowToast('✨ Fresh sarcastic AI roast generated with live 7-day stats!', 'success');
      } else {
        onShowToast('⚠️ Generated punk commentary from built-in roast engine.', 'info');
      }
    } catch (err) {
      console.error('Failed to generate AI roast:', err);
      onShowToast('Failed to generate AI roast. Used template fallback.', 'info');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Handle Copy HTML
  const handleCopyHtml = async () => {
    const htmlToCopy = activeTab === 'weekly' ? weeklyHtml : dailyHtml;
    try {
      await navigator.clipboard.writeText(htmlToCopy);
      setCopiedHtml(true);
      onShowToast('📋 Responsive Email HTML copied to clipboard!', 'success');
      setTimeout(() => setCopiedHtml(false), 2500);
    } catch {
      onShowToast('Failed to copy to clipboard', 'info');
    }
  };

  // Handle Send Test Email
  const handleSendTest = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      onShowToast('Please enter a valid email address first', 'info');
      setActiveTab('settings');
      return;
    }

    setIsSendingTest(true);
    try {
      const type = activeTab === 'daily' ? 'daily' : 'weekly';
      const subject =
        type === 'daily'
          ? `[The Screening Room] 🌅 Daily 6:00 AM Watchlist Dispatch (${dailyData.moviesAdded.length} New Titles)`
          : `[The Screening Room] 🎬 Weekly 7-Day Sarcastic Roast & Hitlist for ${activeCuratorName}`;

      const res = await sendTestEmailDispatch(emailInput, subject, type, activeCuratorName);
      onShowToast(`🚀 ${res.message || 'Test email dispatched successfully!'}`, 'success');
    } catch (err: any) {
      onShowToast(`Failed to send test email: ${err.message || 'Unknown error'}`, 'info');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Save Preferences to Firestore
  const handleSavePreferences = async () => {
    if (!emailInput || !emailInput.includes('@')) {
      onShowToast('Please enter a valid email address', 'info');
      return;
    }

    setIsSavingPrefs(true);
    try {
      if (userId) {
        const prefRef = doc(db, 'email_preferences', userId);
        await setDoc(
          prefRef,
          {
            email: emailInput.trim(),
            optOutDailyDigest: optOutDaily,
            optOutWeeklyRoast: optOutWeekly,
            updatedAt: Date.now(),
            memberName: activeCuratorName,
          },
          { merge: true }
        );
      }

      onShowToast('✅ Email alert preferences saved successfully!', 'success');
    } catch (err) {
      console.error('Failed to save preferences:', err);
      onShowToast('Failed to save preferences to cloud', 'info');
    } finally {
      setIsSavingPrefs(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="email-alerts-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="email-alerts-modal-card"
        className="relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Email Alert & Weekly Roast Engine
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                  Automated Dispatch
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Weekly 7-Day sarcastic summary + Daily 6:00 AM new movie alerts with opt-out controls.
              </p>
            </div>
          </div>

          <button
            id="close-email-modal-btn"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 py-2.5 border-b border-zinc-800 bg-zinc-900/30 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
            <button
              id="tab-weekly-roast"
              onClick={() => setActiveTab('weekly')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'weekly'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              Weekly Sarcastic Roast (7-Day)
            </button>

            <button
              id="tab-daily-dispatch"
              onClick={() => setActiveTab('daily')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'daily'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Daily 6:00 AM Dispatch
            </button>

            <button
              id="tab-email-settings"
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-amber-500 text-zinc-950 shadow-md font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Preferences & Opt-Out
            </button>
          </div>

          {/* Action Toolbar for Preview Tabs */}
          {activeTab !== 'settings' && (
            <div className="flex items-center gap-2">
              {/* Preview Mode toggle */}
              <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('preview')}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    viewMode === 'preview'
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-300'
                  }`}
                  title="Rendered Email Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('html')}
                  className={`p-1.5 rounded-md text-xs transition-colors ${
                    viewMode === 'html'
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:text-zinc-300'
                  }`}
                  title="Raw HTML Source"
                >
                  <Code2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Device width toggle */}
              {viewMode === 'preview' && (
                <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-md text-xs transition-colors ${
                      previewDevice === 'desktop'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-zinc-300'
                    }`}
                    title="Desktop Preview"
                  >
                    <Monitor className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-md text-xs transition-colors ${
                      previewDevice === 'mobile'
                        ? 'bg-zinc-800 text-white'
                        : 'text-zinc-400 hover:text-zinc-300'
                    }`}
                    title="Mobile Preview (iPhone/Android)"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* AI Sarcasm Generator (Weekly only) */}
              {activeTab === 'weekly' && (
                <button
                  id="generate-ai-roast-btn"
                  onClick={handleGenerateAiRoast}
                  disabled={isGeneratingAi}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-amber-600 hover:from-violet-500 hover:to-amber-500 text-white text-xs font-semibold rounded-lg shadow transition-all disabled:opacity-50"
                  title="Generate spicy AI sarcasm from recent member metrics"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAi ? 'Roasting...' : 'AI Re-Roast'}</span>
                </button>
              )}

              {/* Copy HTML */}
              <button
                onClick={handleCopyHtml}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg border border-zinc-700 transition-colors"
                title="Copy HTML to clipboard"
              >
                {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedHtml ? 'Copied!' : 'Copy HTML'}</span>
              </button>

              {/* Send Test Dispatch */}
              <button
                id="send-test-email-btn"
                onClick={handleSendTest}
                disabled={isSendingTest}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-pulse' : ''}`} />
                <span>{isSendingTest ? 'Sending...' : 'Send Test'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-zinc-950/80">
          {/* TAB 1: WEEKLY ROAST PREVIEW */}
          {activeTab === 'weekly' && (
            <div className="flex flex-col items-center">
              {/* Feature highlights bar */}
              <div className="w-full max-w-3xl mb-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-lg">
                  <span className="text-amber-400 font-bold">Top Taste:</span> {weeklyData.topCurator}
                </div>
                <div className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-lg">
                  <span className="text-red-400 font-bold">Bottom Slacker:</span> {weeklyData.bottomCurator}
                </div>
                <div className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-lg">
                  <span className="text-amber-400 font-bold">Your Unrated:</span> {weeklyData.unratedMovies.length} movies
                </div>
                <div className="p-2 bg-zinc-900/90 border border-zinc-800 rounded-lg">
                  <span className="text-blue-400 font-bold">Cadence:</span> Every Sunday 6pm
                </div>
              </div>

              {viewMode === 'preview' ? (
                <div
                  className={`transition-all duration-300 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl bg-zinc-900 ${
                    previewDevice === 'mobile' ? 'w-[375px]' : 'w-full max-w-3xl'
                  }`}
                >
                  <iframe
                    title="Weekly Roast Preview"
                    srcDoc={weeklyHtml}
                    className="w-full h-[580px] bg-[#09090b] border-0"
                  />
                </div>
              ) : (
                <div className="w-full max-w-3xl">
                  <pre className="p-4 bg-zinc-900 text-zinc-300 text-xs font-mono rounded-xl border border-zinc-800 overflow-x-auto max-h-[560px]">
                    {weeklyHtml}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DAILY 6:00 AM DISPATCH PREVIEW */}
          {activeTab === 'daily' && (
            <div className="flex flex-col items-center">
              {/* Daily schedule info bar */}
              <div className="w-full max-w-3xl mb-4 p-3 bg-zinc-900/90 border border-zinc-800 rounded-xl flex items-center justify-between text-xs text-zinc-300">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>
                    <strong>Schedule:</strong> Daily at <strong>6:00 AM</strong> to all curators when new movies are added.
                  </span>
                </div>
                <div className="text-amber-400 font-medium">
                  {dailyData.moviesAdded.length} titles in current digest
                </div>
              </div>

              {viewMode === 'preview' ? (
                <div
                  className={`transition-all duration-300 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl bg-zinc-900 ${
                    previewDevice === 'mobile' ? 'w-[375px]' : 'w-full max-w-3xl'
                  }`}
                >
                  <iframe
                    title="Daily Dispatch Preview"
                    srcDoc={dailyHtml}
                    className="w-full h-[580px] bg-[#09090b] border-0"
                  />
                </div>
              ) : (
                <div className="w-full max-w-3xl">
                  <pre className="p-4 bg-zinc-900 text-zinc-300 text-xs font-mono rounded-xl border border-zinc-800 overflow-x-auto max-h-[560px]">
                    {dailyHtml}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PREFERENCES & OPT-OUT */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
              {/* Recipient Email Config */}
              <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-3">
                <label className="block text-sm font-bold text-white">
                  Curator Dispatch Email Address
                </label>
                <p className="text-xs text-zinc-400">
                  Where daily watchlist additions and the weekly sarcastic recap will be delivered.
                </p>
                <div className="flex gap-2">
                  <input
                    id="email-prefs-input"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="youremail@gmail.com"
                    className="flex-1 px-3.5 py-2.5 bg-zinc-950 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={() => setEmailInput(userEmail || 'akleyweg@gmail.com')}
                    className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Use Login Email
                  </button>
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-xl space-y-4">
                <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-2">
                  Alert Subscriptions & Opt-Out Controls
                </h3>

                {/* Daily 6am Toggle */}
                <div className="flex items-start justify-between gap-4 p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-white">
                        Daily 6:00 AM New Movie Alerts
                      </span>
                      {optOutDaily ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-red-950/60 text-red-400 border border-red-800 rounded-full">
                          Opted Out
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800 rounded-full">
                          Active (6:00 AM)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">
                      Delivers a morning summary at 6:00 AM of any movies newly queued by other curators in the last 24 hours.
                    </p>
                  </div>

                  <button
                    id="toggle-daily-opt-out-btn"
                    onClick={() => setOptOutDaily(!optOutDaily)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      !optOutDaily ? 'bg-amber-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        !optOutDaily ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Weekly Roast Toggle */}
                <div className="flex items-start justify-between gap-4 p-3.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-bold text-white">
                        Weekly 7-Day Sarcastic Roast & Unrated Hitlist
                      </span>
                      {optOutWeekly ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-red-950/60 text-red-400 border border-red-800 rounded-full">
                          Opted Out
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800 rounded-full">
                          Active (Weekly)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400">
                      Sends a Sunday evening breakdown roasting curator taste shifts, shaming slackers, and listing the top 10 movies you haven't reviewed yet.
                    </p>
                  </div>

                  <button
                    id="toggle-weekly-opt-out-btn"
                    onClick={() => setOptOutWeekly(!optOutWeekly)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      !optOutWeekly ? 'bg-amber-500' : 'bg-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        !optOutWeekly ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* 1-Click Unsubscribe Simulation Test */}
              <div className="p-4 bg-zinc-900/50 border border-zinc-800/80 rounded-xl flex items-center justify-between text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <BellOff className="w-4 h-4 text-zinc-500" />
                  <span>Instant 1-Click Unsubscribe link is automatically embedded in all email footers.</span>
                </div>
                <button
                  onClick={() => {
                    setOptOutDaily(true);
                    setOptOutWeekly(true);
                    onShowToast('Opted out of all email alerts via 1-click unsubscribe simulation', 'info');
                  }}
                  className="text-red-400 hover:underline font-semibold"
                >
                  Test Unsubscribe All
                </button>
              </div>

              {/* Save Preferences Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="save-email-prefs-btn"
                  onClick={handleSavePreferences}
                  disabled={isSavingPrefs}
                  className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingPrefs ? 'Saving...' : 'Save Preferences'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
