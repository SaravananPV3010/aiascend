'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';
import { getLogEntries, clearLogEntries, LogEntry } from '../../lib/activityLog';

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).toUpperCase();
}

const VaultPage = () => {
  const router = useRouter();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    getLogEntries().then(data => {
      setLogs(data);
      setIsLoaded(true);
    });
  }, []);

  const handleClear = async () => {
    await clearLogEntries();
    setLogs([]);
    setShowClearConfirm(false);
  };

  const prescriptions = logs.filter(l => l.type === 'prescription_analyzed');
  const manual = logs.filter(l => l.type === 'medication_added');

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#fcfcfc] py-16">
        <div className="max-w-[760px] mx-auto px-6">

          {/* ── Page Header ── */}
          <div className="mb-14 relative group">
            <h1 className="font-fraunces text-[64px] font-normal text-stone-900 mb-4 tracking-tight leading-none">
              Prescription Vault
            </h1>
            <p className="text-[17px] text-stone-500 font-jakarta font-light leading-relaxed">
              All your uploaded prescriptions and extracted analyses, stored securely.
            </p>
            {logs.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="absolute top-1 right-0 rounded-full border border-stone-200 bg-white text-stone-500 hover:text-red-500 hover:border-red-200 px-5 py-2.5 font-semibold font-jakarta text-[13px] shadow-sm transition-all duration-300 opacity-0 group-hover:opacity-100"
              >
                Clear Vault
              </button>
            )}
          </div>

          {/* ── Loading ── */}
          {!isLoaded ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-7 h-7 border-[2.5px] border-stone-200 border-t-stone-400 rounded-full animate-spin" />
            </div>

          /* ── Empty state ── */
          ) : prescriptions.length === 0 && manual.length === 0 ? (
            <div className="bg-white rounded-[28px] border border-stone-100 shadow-[0_4px_24px_rgb(0,0,0,0.04)] p-16 text-center">
              <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-stone-100">
                <svg className="w-7 h-7 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="font-fraunces text-2xl font-semibold text-stone-900 mb-2">Vault is empty</h3>
              <p className="text-stone-400 font-jakarta text-[15px] leading-relaxed">
                Upload a prescription to store it here along with its analysis.
              </p>
              <button
                onClick={() => router.push('/upload')}
                className="mt-6 rounded-full bg-sage text-white px-7 py-3 font-semibold font-jakarta text-[14px] hover:bg-sage-dark transition-colors duration-200 shadow-sm"
              >
                Upload Prescription
              </button>
            </div>

          /* ── Content ── */
          ) : (
            <div className="space-y-14">

              {/* Prescriptions section */}
              {prescriptions.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-8">
                    <h2 className="font-fraunces text-[28px] font-bold text-stone-900">Prescriptions</h2>
                    <span className="bg-stone-100 text-stone-400 text-[12px] font-bold font-jakarta w-[22px] h-[22px] flex items-center justify-center rounded-full">
                      {prescriptions.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-7">
                    {prescriptions.map((entry) => (
                      <div
                        key={entry.id}
                        onClick={() => router.push(`/vault/${entry.id}`)}
                        className="group bg-white rounded-[22px] border border-stone-100/70 shadow-[0_4px_20px_rgb(0,0,0,0.06)] hover:shadow-[0_8px_36px_rgb(0,0,0,0.1)] transition-all duration-300 overflow-hidden cursor-pointer flex flex-col"
                      >
                        {/* Prescription image */}
                        <div className="relative h-[190px] w-full bg-stone-100 overflow-hidden flex-shrink-0">
                          {entry.details.imageThumbnail ? (
                            <img
                              src={entry.details.imageThumbnail}
                              alt="Prescription"
                              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <svg className="w-10 h-10 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                          )}

                          {/* Language badge */}
                          {entry.details.language && (
                            <span className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-stone-800 text-[13px] font-medium font-jakarta px-3 py-[5px] rounded-full shadow-sm">
                              {entry.details.language}
                            </span>
                          )}

                          {/* Navigation arrow */}
                          <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-black/15 group-hover:bg-black/25 backdrop-blur-sm flex items-center justify-center transition-colors duration-200">
                            <svg className="w-[15px] h-[15px] text-white ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>

                        {/* Card info */}
                        <div className="px-5 pt-4 pb-5 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold tracking-[0.12em] text-stone-400 font-jakarta">
                              {formatDateShort(entry.timestamp)}
                            </span>
                            <span className="bg-[#eef5ef] text-[#4e7e62] text-[12px] font-semibold font-jakarta px-3 py-[3px] rounded-full">
                              {entry.details.count ?? 0} meds
                            </span>
                          </div>
                          {entry.details.medicationNames && entry.details.medicationNames.length > 0 ? (
                            <p className="text-stone-400 font-jakarta text-[13px] truncate leading-snug">
                              {entry.details.medicationNames.join(' · ')}
                            </p>
                          ) : (
                            <p className="text-stone-300 font-jakarta text-[13px] italic leading-snug">No medications found</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Manual additions section */}
              {manual.length > 0 && (
                <section>
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="font-fraunces text-[28px] font-bold text-stone-900">Manual Additions</h2>
                    <span className="bg-stone-100 text-stone-400 text-[12px] font-bold font-jakarta w-[22px] h-[22px] flex items-center justify-center rounded-full">
                      {manual.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {manual.map((entry) => (
                      <div key={entry.id} className="flex items-center gap-4 bg-white rounded-2xl border border-stone-100 px-5 py-3.5 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-[15px] h-[15px] text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </div>
                        <span className="font-jakarta text-stone-600 text-[15px] flex-1">{entry.details.medicationName}</span>
                        <time className="text-[11px] uppercase tracking-widest text-stone-400 font-jakarta font-bold flex-shrink-0">
                          {formatDateShort(entry.timestamp)}
                        </time>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            </div>
          )}
        </div>
      </div>

      {/* ── Clear Vault modal ── */}
      {showClearConfirm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowClearConfirm(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.15)] max-w-sm w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="font-fraunces text-2xl font-semibold text-stone-900 text-center mb-2">Clear Vault?</h3>
            <p className="text-stone-500 font-jakarta text-[14px] text-center mb-7 leading-relaxed">
              All prescriptions and activity records will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-full border border-stone-200 bg-white text-stone-700 px-6 py-3 font-semibold font-jakarta text-[13px] hover:bg-stone-50 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleClear}
                className="flex-1 rounded-full bg-red-500 text-white px-6 py-3 font-semibold font-jakarta text-[13px] hover:bg-red-600 shadow-md hover:shadow-lg transition-all duration-200"
              >
                Clear Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
};

export default VaultPage;
