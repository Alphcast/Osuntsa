import React, { useState } from 'react';
import {
  Bell,
  Mail,
  Smartphone,
  Calendar,
  CheckCircle2,
  Trash2,
  PauseCircle,
  PlayCircle,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  Send,
  X,
  Clock,
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { RevenueHead, PaymentReminder } from '../types';
import { formatKoboToNaira } from '../services/prnService';
import { useToast } from '../context/ToastContext';

interface PaymentReminderViewProps {
  revenueHeads: RevenueHead[];
  onPayNow: (revenueHeadId: string) => void;
}

export const PaymentReminderView: React.FC<PaymentReminderViewProps> = ({
  revenueHeads,
  onPayNow,
}) => {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<PaymentReminder[]>(StorageService.getReminders());
  const [payerName, setPayerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [channel, setChannel] = useState<'SMS' | 'EMAIL' | 'BOTH'>('BOTH');
  const [selectedRevenueHeadId, setSelectedRevenueHeadId] = useState(
    revenueHeads[0]?.id || 'rev-direct-assessment'
  );
  const [frequency, setFrequency] = useState<'ANNUAL' | 'MONTHLY' | 'TERMLY'>('ANNUAL');
  const [nextDueDate, setNextDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 45);
    return d.toISOString().split('T')[0];
  });
  const [leadDays, setLeadDays] = useState(14);
  const [customReference, setCustomReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Simulated live notification preview
  const [testNotification, setTestNotification] = useState<{
    show: boolean;
    channel: 'SMS' | 'EMAIL' | 'BOTH';
    phone?: string;
    email?: string;
    message: string;
    sentAt: string;
  } | null>(null);

  const selectedHead = revenueHeads.find((h) => h.id === selectedRevenueHeadId) || revenueHeads[0];

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!payerName.trim()) {
      setErrorMessage('Please enter your full name or registered business name.');
      return;
    }

    if (channel === 'SMS' && !phone.trim()) {
      setErrorMessage('Please enter your phone number to receive SMS alerts.');
      return;
    }

    if (channel === 'EMAIL' && !email.trim()) {
      setErrorMessage('Please enter your email address to receive notifications.');
      return;
    }

    if (channel === 'BOTH' && (!phone.trim() || !email.trim())) {
      setErrorMessage('Please provide both phone number and email address.');
      return;
    }

    try {
      setIsSubmitting(true);
      const reminder = await StorageService.createReminder({
        payerName: payerName.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        channel,
        revenueHeadId: selectedRevenueHeadId,
        frequency,
        nextDueDate,
        leadDays: Number(leadDays),
        customReference: customReference.trim() || undefined,
      });

      setReminders(StorageService.getReminders());
      setSuccessMessage(`Payment reminder successfully scheduled for ${reminder.revenueHeadName}!`);
      toast.success(
        'Reminder Scheduled',
        `Automated ${reminder.channel} alerts activated for ${reminder.payerName} (${reminder.revenueHeadName}).`
      );

      // Trigger automatic simulated preview
      setTestNotification({
        show: true,
        channel,
        phone: reminder.phone,
        email: reminder.email,
        sentAt: new Date().toLocaleTimeString('en-NG'),
        message: `[OSUN-TSA REMINDER] Dear ${reminder.payerName}, your Osun State ${reminder.revenueHeadName} (${formatKoboToNaira(reminder.estimatedAmountKobo)}) is due on ${new Date(reminder.nextDueDate).toLocaleDateString('en-NG')}. Pay online without penalties at osun.gov.ng. Reference: ${reminder.customReference || reminder.revenueHeadCode}. Ministry of Finance, Osun State.`,
      });

      // Clear input fields
      setPayerName('');
      setPhone('');
      setEmail('');
      setCustomReference('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create reminder.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = (id: string) => {
    StorageService.toggleReminderStatus(id);
    setReminders(StorageService.getReminders());
  };

  const handleDelete = (id: string) => {
    StorageService.deleteReminder(id);
    setReminders(StorageService.getReminders());
  };

  const handleSendTestNow = (reminder: PaymentReminder) => {
    setTestNotification({
      show: true,
      channel: reminder.channel,
      phone: reminder.phone,
      email: reminder.email,
      sentAt: new Date().toLocaleTimeString('en-NG'),
      message: `[OSUN-TSA REMINDER] Dear ${reminder.payerName}, your Osun State ${reminder.revenueHeadName} (${formatKoboToNaira(reminder.estimatedAmountKobo)}) is scheduled for renewal on ${new Date(reminder.nextDueDate).toLocaleDateString('en-NG')}. Visit osun.gov.ng to settle into the TSA Central Reserve. Ref: ${reminder.customReference || reminder.revenueHeadCode}.`,
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 mb-3">
          <Bell className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Osun State Tax & Payment Reminder Service
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-slate-600">
          Subscribe to automated SMS and email reminders for recurring state taxes, vehicle licensing, land use charge, and school fees. Stay compliant and avoid late-penalty surcharges.
        </p>
      </div>

      {/* Simulated Live Alert Pop-up */}
      {testNotification && (
        <div className="max-w-2xl mx-auto bg-slate-900 text-white rounded-xl border border-slate-700 p-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-emerald-400 font-mono">
                LIVE NOTIFICATION DISPATCH SIMULATOR
              </span>
            </div>
            <button
              onClick={() => setTestNotification(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
              <span>Channel: <strong className="text-white">{testNotification.channel}</strong></span>
              {testNotification.phone && (
                <span>SMS: <strong className="text-white">{testNotification.phone}</strong></span>
              )}
              {testNotification.email && (
                <span>Email: <strong className="text-white">{testNotification.email}</strong></span>
              )}
              <span>Dispatched: {testNotification.sentAt}</span>
            </div>

            <div className="bg-slate-800/90 p-3.5 rounded-lg border border-slate-700 text-slate-100 font-mono text-xs leading-relaxed">
              {testNotification.message}
            </div>

            <div className="text-[11px] text-emerald-300 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Delivered via Osun State Government Telco SMS Gateway & Cloud Mail Relay</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Form + Active Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Reminder Form (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 sm:p-7 shadow-xs space-y-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Set Up a Recurring Payment Reminder
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Choose your tax obligation and preferred notification channel.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleCreateReminder} className="space-y-4 text-xs">
            {/* Tax or Fee Selection */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Select Tax / Obligation <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedRevenueHeadId}
                onChange={(e) => setSelectedRevenueHeadId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-700"
              >
                {revenueHeads.map((head) => (
                  <option key={head.id} value={head.id}>
                    {head.name} ({head.code})
                  </option>
                ))}
              </select>
              {selectedHead && (
                <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                  <span>MDA: {selectedHead.mdaName}</span>
                  <span className="font-mono font-bold text-slate-700">
                    Statutory Rate: {formatKoboToNaira(selectedHead.defaultAmountKobo)}
                  </span>
                </div>
              )}
            </div>

            {/* Payer Name */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payer / Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="e.g. Adewale Adeleke or Osun Springs Ltd"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            {/* Notification Channel */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                Notification Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setChannel('SMS')}
                  className={`py-2 px-3 rounded border text-center font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    channel === 'SMS'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>SMS Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('EMAIL')}
                  className={`py-2 px-3 rounded border text-center font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    channel === 'EMAIL'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Email Only</span>
                </button>

                <button
                  type="button"
                  onClick={() => setChannel('BOTH')}
                  className={`py-2 px-3 rounded border text-center font-medium transition-colors flex items-center justify-center gap-1.5 ${
                    channel === 'BOTH'
                      ? 'border-emerald-700 bg-emerald-50 text-emerald-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>Both (SMS & Email)</span>
                </button>
              </div>
            </div>

            {/* Phone & Email Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phone Number (for SMS Alerts)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 0803 123 4567"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address (for Digital Notices)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. adewale@example.com"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>
            </div>

            {/* Frequency & Next Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Billing Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                >
                  <option value="ANNUAL">Annual (Once a Year)</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="TERMLY">Termly / Semester</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Next Due Date
                </label>
                <input
                  type="date"
                  value={nextDueDate}
                  onChange={(e) => setNextDueDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lead Notice
                </label>
                <select
                  value={leadDays}
                  onChange={(e) => setLeadDays(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700"
                >
                  <option value={7}>7 days before due date</option>
                  <option value={14}>14 days before due date</option>
                  <option value={30}>30 days before due date</option>
                </select>
              </div>
            </div>

            {/* Custom Reference */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Custom Reference / Identifier <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={customReference}
                onChange={(e) => setCustomReference(e.target.value)}
                placeholder="e.g. Plate No: OS-492-B2, Plot 14 Ring Road, or Student Matric: 21/0492"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 text-white font-bold rounded-md shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Bell className="w-4 h-4" />
                <span>{isSubmitting ? 'Scheduling Reminder...' : 'Activate Payment Reminder'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Active Reminders List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                My Active Reminders ({reminders.length})
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                Automated Engine
              </span>
            </div>

            {reminders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No active payment reminders. Use the form to schedule notifications.
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {reminders.map((rem) => (
                  <div
                    key={rem.id}
                    className={`p-3.5 rounded-lg border transition-colors space-y-2 text-xs ${
                      rem.status === 'ACTIVE'
                        ? 'border-slate-200 bg-slate-50/50'
                        : 'border-slate-200 bg-slate-100/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-bold text-slate-900 leading-snug">
                          {rem.revenueHeadName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {rem.payerName} {rem.customReference && `· ${rem.customReference}`}
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          rem.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {rem.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-200/60 font-mono">
                      <span>Due: {new Date(rem.nextDueDate).toLocaleDateString('en-NG')}</span>
                      <span>Notice: {rem.leadDays}d before</span>
                      <span className="capitalize">{rem.channel.toLowerCase()}</span>
                    </div>

                    {/* Actions */}
                    <div className="pt-1 flex items-center justify-between">
                      <button
                        onClick={() => handleSendTestNow(rem)}
                        className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Test Alert</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(rem.id)}
                          className="text-slate-500 hover:text-slate-700 text-[11px]"
                          title={rem.status === 'ACTIVE' ? 'Pause reminders' : 'Resume reminders'}
                        >
                          {rem.status === 'ACTIVE' ? (
                            <PauseCircle className="w-4 h-4 text-amber-600" />
                          ) : (
                            <PlayCircle className="w-4 h-4 text-emerald-600" />
                          )}
                        </button>

                        <button
                          onClick={() => onPayNow(rem.revenueHeadId)}
                          className="px-2 py-0.5 bg-emerald-800 text-white rounded text-[10px] font-bold hover:bg-emerald-900 transition-colors"
                        >
                          Pay Now
                        </button>

                        <button
                          onClick={() => handleDelete(rem.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete reminder"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compliance & Privacy Assurance */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>NDPA 2023 Data Privacy Compliance</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Your contact information is encrypted and used exclusively for official Osun State Government statutory payment notifications. We never share taxpayer records with third parties.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
