import React, { useState } from 'react';
import { RevenueHead, Invoice, Language } from '../types';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Building2,
  User,
  Phone,
  Mail,
  FileCheck,
  GraduationCap,
  BookOpen,
} from 'lucide-react';
import { formatKoboToNaira, nairaToKobo } from '../services/prnService';
import { calculateGatewayFeeKobo } from '../services/gatewayService';
import { OSUN_LGAS } from '../data/initialData';
import { StorageService } from '../services/storageService';
import { t } from '../services/i18n';

interface InvoiceGenerationModalProps {
  revenueHead: RevenueHead;
  language: Language;
  onClose: () => void;
  onInvoiceCreated: (invoice: Invoice) => void;
}

const OSUN_POPULAR_SCHOOLS = [
  'Osogbo Grammar School, Osogbo',
  'Fakunle Comprehensive High School, Osogbo',
  'Ataoja School of Science, Osogbo',
  'St. Charles Grammar School, Osogbo',
  'Ilesa Grammar School, Ilesa',
  'Oduduwa College, Ile-Ife',
  'Baptist High School, Ede',
  'Ejigbo Baptist High School, Ejigbo',
  'Inisa Grammar School, Inisa',
  'Gbongan Community High School, Gbongan',
  'Moremi High School, Ile-Ife',
  'Government Technical College, Osogbo',
  'OTHER_CUSTOM_SCHOOL',
];

const SECONDARY_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

// 10 Sections as requested
const CLASS_SECTIONS = [
  'Section A (Emerald)',
  'Section B (Diamond)',
  'Section C (Gold)',
  'Section D (Silver)',
  'Section E (Ruby)',
  'Section F (Sapphire)',
  'Section G (Pearl)',
  'Section H (Topaz)',
  'Section I (Onyx)',
  'Section J (Bronze)',
];

const ACADEMIC_TERMS = ['1st Term', '2nd Term', '3rd Term'];
const ACADEMIC_SESSIONS = ['2025/2026', '2026/2027'];

export const InvoiceGenerationModal: React.FC<InvoiceGenerationModalProps> = ({
  revenueHead,
  language,
  onClose,
  onInvoiceCreated,
}) => {
  const isSecondarySchoolFee =
    revenueHead.id === 'rev-secondary-school-fee' ||
    revenueHead.category === 'Secondary Education' ||
    revenueHead.name.toLowerCase().includes('secondary school');

  // Student & Academic fields
  const [studentName, setStudentName] = useState('');
  const [schoolNameOption, setSchoolNameOption] = useState('Osogbo Grammar School, Osogbo');
  const [customSchoolName, setCustomSchoolName] = useState('');
  const [studentClass, setStudentClass] = useState('JSS 1');
  const [section, setSection] = useState('Section A (Emerald)');
  const [term, setTerm] = useState('1st Term');
  const [academicSession, setAcademicSession] = useState('2025/2026');
  const [admissionNumber, setAdmissionNumber] = useState('');

  // Payer / Parent fields
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [payerNin, setPayerNin] = useState('');
  const [payerTin, setPayerTin] = useState('');
  const [payerLga, setPayerLga] = useState('Osogbo');
  const [customAmountNaira, setCustomAmountNaira] = useState(
    revenueHead.isAmountVariable ? '25000' : ''
  );
  const [customDescription, setCustomDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const baseAmountKobo = revenueHead.isAmountVariable
    ? nairaToKobo(customAmountNaira)
    : revenueHead.defaultAmountKobo;

  const gatewayFeeKobo = calculateGatewayFeeKobo(baseAmountKobo);
  const totalAmountKobo = baseAmountKobo + gatewayFeeKobo;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isSecondarySchoolFee && !studentName.trim()) {
      setErrorMessage("Please enter the student's full name.");
      return;
    }
    if (isSecondarySchoolFee && schoolNameOption === 'OTHER_CUSTOM_SCHOOL' && !customSchoolName.trim()) {
      setErrorMessage('Please type in the secondary school name.');
      return;
    }
    if (!payerName.trim()) {
      setErrorMessage(
        isSecondarySchoolFee
          ? 'Please enter the Parent or Guardian full name.'
          : 'Please enter the full name or company name of the payer.'
      );
      return;
    }
    if (!payerPhone.trim()) {
      setErrorMessage('Please provide a valid phone number for SMS receipt delivery.');
      return;
    }
    if (baseAmountKobo <= 0) {
      setErrorMessage('Amount to pay must be greater than zero.');
      return;
    }

    try {
      setIsSubmitting(true);

      const effectiveSchool =
        schoolNameOption === 'OTHER_CUSTOM_SCHOOL'
          ? customSchoolName.trim()
          : schoolNameOption;

      const studentDetails = isSecondarySchoolFee
        ? {
            studentName: studentName.trim(),
            schoolName: effectiveSchool,
            studentClass,
            section,
            term,
            academicSession,
            admissionNumber: admissionNumber.trim() || undefined,
            parentName: payerName.trim(),
          }
        : undefined;

      const effectiveDescription = isSecondarySchoolFee
        ? `${term} School Fee for ${studentName.trim()} (${studentClass} - ${section}), ${effectiveSchool} [Session ${academicSession}]`
        : customDescription.trim() || undefined;

      const invoice = await StorageService.createInvoice({
        revenueHeadId: revenueHead.id,
        amountKobo: baseAmountKobo,
        payerName: payerName.trim(),
        payerEmail: payerEmail.trim() || 'student@osun.gov.ng',
        payerPhone: payerPhone.trim(),
        payerNin: payerNin.trim() || undefined,
        payerTin: payerTin.trim() || undefined,
        payerLga,
        description: effectiveDescription,
        studentDetails,
      });

      onInvoiceCreated(invoice);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to create assessment invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-emerald-800 text-white flex items-center justify-center font-bold text-xs">
              TSA
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Generate PRN & Assessment
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {revenueHead.mdaCode} · {revenueHead.code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Revenue Head Information Card */}
          <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-slate-700">
            <div className="font-semibold text-emerald-900 text-sm">{revenueHead.name}</div>
            <p className="mt-1 text-slate-600">{revenueHead.description}</p>
            <div className="mt-2 text-slate-500 flex items-center gap-2 font-mono">
              <span>TSA Sub-Account:</span>
              <span className="font-semibold text-emerald-800">{revenueHead.tsaSubAccountCode}</span>
            </div>
          </div>

          {/* Amount Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {revenueHead.isAmountVariable ? 'Assessed Fee Amount (₦)' : 'Statutory Amount'}
            </label>
            {revenueHead.isAmountVariable ? (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">₦</span>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={customAmountNaira}
                  onChange={(e) => setCustomAmountNaira(e.target.value)}
                  placeholder="e.g. 25000"
                  required
                  className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>
            ) : (
              <div className="py-2 px-3 bg-slate-100 rounded-md text-sm font-bold font-mono text-slate-900">
                {formatKoboToNaira(revenueHead.defaultAmountKobo)}
              </div>
            )}
          </div>

          {/* Secondary School Student & Academic Information */}
          {isSecondarySchoolFee && (
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-3.5">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-950 uppercase tracking-wider">
                <GraduationCap className="w-4 h-4 text-blue-700" />
                <span>Student Academic Enrollment Particulars</span>
              </div>

              {/* Student Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Student Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="e.g. Adeyemi Samuel Ayomide"
                  required={isSecondarySchoolFee}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 font-medium"
                />
              </div>

              {/* School Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Osun State Secondary School <span className="text-red-500">*</span>
                </label>
                <select
                  value={schoolNameOption}
                  onChange={(e) => setSchoolNameOption(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 font-medium"
                >
                  {OSUN_POPULAR_SCHOOLS.map((school) => (
                    <option key={school} value={school}>
                      {school === 'OTHER_CUSTOM_SCHOOL' ? '+ Other / Type School Name...' : school}
                    </option>
                  ))}
                </select>

                {schoolNameOption === 'OTHER_CUSTOM_SCHOOL' && (
                  <input
                    type="text"
                    value={customSchoolName}
                    onChange={(e) => setCustomSchoolName(e.target.value)}
                    placeholder="Enter secondary school name and town"
                    required
                    className="mt-2 w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                  />
                )}
              </div>

              {/* Class (JSS 1 to SSS 3) and Class Arm/Section (10 Sections) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Student Class (JSS 1 to SSS 3) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 font-bold"
                  >
                    {SECONDARY_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Class Section / Arm (10 Sections) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 font-medium"
                  >
                    {CLASS_SECTIONS.map((sec) => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Term & Session & Admission No */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Academic Term
                  </label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                  >
                    {ACADEMIC_TERMS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Academic Session
                  </label>
                  <select
                    value={academicSession}
                    onChange={(e) => setAcademicSession(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-700"
                  >
                    {ACADEMIC_SESSIONS.map((s) => (
                      <option key={s} value={s}>
                        {s} Session
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    Admission / Reg No.
                  </label>
                  <input
                    type="text"
                    value={admissionNumber}
                    onChange={(e) => setAdmissionNumber(e.target.value)}
                    placeholder="e.g. OS/2026/0491"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-700 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Payer Details */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {isSecondarySchoolFee ? 'Parent / Guardian Contact Details (Payer)' : t('payerDetails', language)}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Full Name / Company <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={payerName}
                  onChange={(e) => setPayerName(e.target.value)}
                  placeholder="e.g. Adebayo Ogunlesi"
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Phone Number (for SMS) <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={payerPhone}
                  onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder="e.g. 0803 123 4567"
                  required
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={payerEmail}
                  onChange={(e) => setPayerEmail(e.target.value)}
                  placeholder="e.g. adebayo@example.com"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Local Government Area (LGA)
                </label>
                <select
                  value={payerLga}
                  onChange={(e) => setPayerLga(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700 bg-white"
                >
                  {OSUN_LGAS.map((lga) => (
                    <option key={lga} value={lga}>
                      {lga}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  National Identity Number (NIN) <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={11}
                  value={payerNin}
                  onChange={(e) => setPayerNin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="11 digits NIN"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tax Identification Number (TIN) <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={payerTin}
                  onChange={(e) => setPayerTin(e.target.value)}
                  placeholder="e.g. 20491823-0001"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs font-mono focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Specific Purpose / Identification Reference <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="e.g. Matric No: 20/0948, Vehicle Reg No: OS-492-B2"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>
          </div>

          {/* Breakdown Box */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Base Assessment Fee:</span>
              <span className="font-mono tabular-nums">{formatKoboToNaira(baseAmountKobo)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Statutory E-Collection Charge:</span>
              <span className="font-mono tabular-nums">{formatKoboToNaira(gatewayFeeKobo)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1.5 text-sm">
              <span>Total Settlement to Osun TSA:</span>
              <span className="font-mono tabular-nums text-emerald-800">{formatKoboToNaira(totalAmountKobo)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 rounded-md shadow-xs transition-colors"
            >
              <span>{isSubmitting ? 'Generating PRN...' : 'Generate PRN & Continue'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
