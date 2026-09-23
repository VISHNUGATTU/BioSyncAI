import React, { useState } from 'react';
import {
  Send,
  BellRing,
  Users,
  UserRound,
  FlaskConical,
  ShieldAlert,
  CheckCircle2,
  Info,
} from 'lucide-react';

import api from '../api/axios';

const Notifications = () => {
  const [notification, setNotification] = useState({
    title: '',
    message: '',
    targetUserType: 'All',
    priority: 'Medium',
  });

  const [statusMsg, setStatusMsg] = useState('');
  const [sending, setSending] = useState(false);

  const handleChange = (field, value) => {
    setNotification((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSend = async (e) => {
    e.preventDefault();

    try {
      setSending(true);
      setStatusMsg('');

      const payload = {
        title: notification.title,
        message: notification.message,
        type: 'System_Alert',
        priority: notification.priority,
        targetUserType:
          notification.targetUserType === 'All'
            ? null
            : notification.targetUserType,
      };

      const res = await api.post('/notifications', payload);

      if (res.data.success) {
        setStatusMsg(
          'Push notification sent successfully across the platform!'
        );

        setNotification({
          title: '',
          message: '',
          targetUserType: 'All',
          priority: 'Medium',
        });

        setTimeout(() => setStatusMsg(''), 5000);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      alert('Error sending notification.');
    } finally {
      setSending(false);
    }
  };

  const audienceOptions = [
    {
      value: 'All',
      title: 'Everyone',
      description: 'Users & Lab Assistants',
      icon: Users,
    },
    {
      value: 'User',
      title: 'Patients',
      description: 'Registered users only',
      icon: UserRound,
    },
    {
      value: 'LabAssistant',
      title: 'Lab Assistants',
      description: 'Laboratory team only',
      icon: FlaskConical,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500 dark:text-cyan-400">
            Communication Center
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-[-0.035em] text-slate-900 dark:text-white sm:text-[28px]">
          Push Notifications Center
        </h1>

        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-500">
          Broadcast important alerts and operational messages across BioSync
          AI.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,680px)_minmax(280px,1fr)]">
        {/* Compose card */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
          {/* Card header */}
          <div className="border-b border-slate-200/80 px-6 py-5 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-400/[0.08] text-cyan-400">
                <BellRing size={19} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  Compose Message
                </h2>

                <p className="mt-0.5 text-[11px] text-slate-400 dark:text-slate-600">
                  Create and broadcast a platform notification
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Success message */}
            {statusMsg && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] p-4">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-400/[0.1] text-emerald-400">
                  <CheckCircle2 size={15} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-emerald-500 dark:text-emerald-400">
                    Notification sent
                  </p>

                  <p className="mt-0.5 text-[11px] leading-5 text-emerald-600/80 dark:text-emerald-400/70">
                    {statusMsg}
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <label
                  htmlFor="notification-title"
                  className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500"
                >
                  Notification Title
                </label>

                <input
                  id="notification-title"
                  type="text"
                  placeholder="e.g. System Maintenance Scheduled"
                  value={notification.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="notification-message"
                    className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500"
                  >
                    Message
                  </label>

                  <span className="text-[10px] text-slate-400 dark:text-slate-600">
                    {notification.message.length} characters
                  </span>
                </div>

                <textarea
                  id="notification-message"
                  placeholder="Write the full notification message here..."
                  rows={5}
                  value={notification.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  required
                  className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm leading-6 text-slate-800 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-cyan-400/50 focus:bg-white focus:ring-4 focus:ring-cyan-500/[0.06] dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-600 dark:hover:border-slate-700 dark:focus:bg-slate-950"
                />
              </div>

              {/* Audience */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
                  Target Audience
                </label>

                <div className="grid gap-2 sm:grid-cols-3">
                  {audienceOptions.map((option) => {
                    const Icon = option.icon;
                    const selected =
                      notification.targetUserType === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          handleChange('targetUserType', option.value)
                        }
                        className={`group rounded-xl border p-3 text-left transition-all ${
                          selected
                            ? 'border-cyan-400/30 bg-cyan-400/[0.07] shadow-[0_0_20px_rgba(34,211,238,0.05)]'
                            : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700'
                        }`}
                      >
                        <div
                          className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${
                            selected
                              ? 'bg-cyan-400/[0.12] text-cyan-400'
                              : 'bg-slate-200/70 text-slate-400 dark:bg-slate-800/70 dark:text-slate-500'
                          }`}
                        >
                          <Icon size={15} />
                        </div>

                        <p
                          className={`text-xs font-semibold ${
                            selected
                              ? 'text-cyan-500 dark:text-cyan-300'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {option.title}
                        </p>

                        <p className="mt-0.5 text-[9px] leading-4 text-slate-400 dark:text-slate-600">
                          {option.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-3">
                <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-500">
                  Priority
                </label>

                <div className="grid grid-cols-3 gap-2">
                  {['Low', 'Medium', 'High'].map((priority) => {
                    const selected = notification.priority === priority;

                    const styles = {
                      Low: selected
                        ? 'border-blue-400/30 bg-blue-400/[0.07] text-blue-400'
                        : '',
                      Medium: selected
                        ? 'border-amber-400/30 bg-amber-400/[0.07] text-amber-400'
                        : '',
                      High: selected
                        ? 'border-red-400/30 bg-red-400/[0.07] text-red-400'
                        : '',
                    };

                    return (
                      <button
                        key={priority}
                        type="button"
                        onClick={() => handleChange('priority', priority)}
                        className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                          styles[priority]
                        } ${
                          !selected
                            ? 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-500 dark:hover:border-slate-700'
                            : ''
                        }`}
                      >
                        <span className="flex items-center justify-center gap-2">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              priority === 'Low'
                                ? 'bg-blue-400'
                                : priority === 'Medium'
                                  ? 'bg-amber-400'
                                  : 'bg-red-400'
                            }`}
                          />
                          {priority}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Info */}
              <div className="flex items-start gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3.5 dark:border-slate-800/80 dark:bg-slate-950/40">
                <Info
                  size={14}
                  className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-600"
                />

                <p className="text-[10px] leading-5 text-slate-500 dark:text-slate-600">
                  The notification will be delivered according to the selected
                  audience and priority. Review the message carefully before
                  broadcasting.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={sending}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-xs font-bold text-slate-950 shadow-[0_8px_24px_rgba(34,211,238,0.12)] transition-all hover:bg-cyan-400 hover:shadow-[0_8px_30px_rgba(34,211,238,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                    Broadcasting...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Broadcast Notification
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Preview / information panel */}
        <aside className="hidden xl:block">
          <div className="sticky top-6 space-y-4">
            {/* Preview */}
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/50">
              <div className="border-b border-slate-200/80 px-5 py-4 dark:border-slate-800/80">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-600">
                  Live Preview
                </p>
              </div>

              <div className="p-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-400/[0.1] text-cyan-400">
                      <BellRing size={17} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                          BioSync AI
                        </p>

                        <span className="text-[9px] text-slate-400 dark:text-slate-600">
                          now
                        </span>
                      </div>

                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">
                        {notification.title || 'Notification title'}
                      </p>

                      <p className="mt-1.5 line-clamp-4 text-[11px] leading-5 text-slate-500 dark:text-slate-500">
                        {notification.message ||
                          'Your notification message will appear here as recipients see it.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-lg border border-cyan-400/15 bg-cyan-400/[0.06] px-2.5 py-1 text-[9px] font-semibold text-cyan-400">
                    {notification.targetUserType === 'All'
                      ? 'Everyone'
                      : notification.targetUserType === 'User'
                        ? 'Patients'
                        : 'Lab Assistants'}
                  </span>

                  <span
                    className={`rounded-lg border px-2.5 py-1 text-[9px] font-semibold ${
                      notification.priority === 'High'
                        ? 'border-red-400/15 bg-red-400/[0.06] text-red-400'
                        : notification.priority === 'Medium'
                          ? 'border-amber-400/15 bg-amber-400/[0.06] text-amber-400'
                          : 'border-blue-400/15 bg-blue-400/[0.06] text-blue-400'
                    }`}
                  >
                    {notification.priority} Priority
                  </span>
                </div>
              </div>
            </div>

            {/* Safety note */}
            <div className="rounded-2xl border border-amber-400/10 bg-amber-400/[0.03] p-5">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/15 bg-amber-400/[0.06] text-amber-400">
                  <ShieldAlert size={16} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Broadcast awareness
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-slate-500 dark:text-slate-600">
                    High-priority notifications should be reserved for
                    time-sensitive platform or operational events.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Notifications;