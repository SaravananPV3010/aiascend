'use client'

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LogEntry, MedicationDetail } from '../../../lib/activityLog';
import ProtectedRoute from '../../components/ProtectedRoute';

function formatDate(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function TimingPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center bg-stone-100 text-stone-600 text-[12px] font-medium font-jakarta px-2.5 py-1 rounded-full">
      {label}
    </span>
  );
}

export default function VaultDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [log, setLog] = useState<LogEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    fetch(`/api/vault/${params.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(res => {
        if (!res.ok) throw new Error('Prescription not found');
        return res.json();
      })
      .then(data => {
        setLog(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfcfc]">
        <div className="w-8 h-8 border-[2.5px] border-stone-200 border-t-stone-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !log) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcfcfc] gap-4">
        <p className="text-stone-500 font-jakarta text-[15px]">{error || 'Prescription not found'}</p>
        <button
          onClick={() => router.push('/vault')}
          className="rounded-full border border-stone-200 bg-white text-stone-600 px-5 py-2 font-jakarta text-[13px] font-semibold hover:bg-stone-50 transition-colors duration-200"
        >
          ← Back to Vault
        </button>
      </div>
    );
  }

  const medications: MedicationDetail[] = log.details.medications ?? [];

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-[#fcfcfc] py-12">
      <div className="max-w-[720px] mx-auto px-6">

        {/* Back link */}
        <button
          onClick={() => router.push('/vault')}
          className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-700 font-jakarta text-[13px] font-semibold mb-10 transition-colors duration-200 group"
        >
          <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          Vault
        </button>

        {/* Prescription image */}
        {log.details.imageThumbnail && (
          <div className="rounded-[22px] overflow-hidden mb-10 shadow-[0_4px_24px_rgb(0,0,0,0.08)] border border-stone-100">
            <img
              src={log.details.imageThumbnail}
              alt="Prescription"
              className="w-full h-auto object-cover max-h-[380px]"
            />
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-[11px] font-bold tracking-[0.12em] text-stone-400 font-jakarta uppercase mb-1">
              Analyzed
            </p>
            <p className="font-jakarta text-stone-700 text-[15px]">{formatDate(log.timestamp)}</p>
          </div>
          <div className="text-right">
            {log.details.language && (
              <span className="inline-block bg-stone-100 text-stone-600 text-[13px] font-medium font-jakarta px-3 py-1.5 rounded-full">
                {log.details.language}
              </span>
            )}
          </div>
        </div>

        {/* Section heading */}
        <div className="flex items-center gap-3 mb-7">
          <h2 className="font-fraunces text-[26px] font-bold text-stone-900">Medications</h2>
          <span className="bg-stone-100 text-stone-400 text-[12px] font-bold font-jakarta w-[22px] h-[22px] flex items-center justify-center rounded-full">
            {medications.length}
          </span>
        </div>

        {medications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 p-8 text-center shadow-sm">
            <p className="text-stone-400 font-jakarta text-[14px]">No medications were extracted for this prescription.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {medications.map((med, i) => (
              <div key={i} className="bg-white rounded-[20px] border border-stone-100 shadow-[0_2px_12px_rgb(0,0,0,0.04)] p-6">
                {/* Med name */}
                <h3 className="font-fraunces text-[20px] font-semibold text-stone-900 mb-4">
                  {med.name_english}
                </h3>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-4">
                  {med.dosage && (
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.1em] text-stone-400 font-jakarta uppercase mb-0.5">Dosage</p>
                      <p className="font-jakarta text-stone-700 text-[14px]">{med.dosage}</p>
                    </div>
                  )}
                  {med.frequency && (
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.1em] text-stone-400 font-jakarta uppercase mb-0.5">Frequency</p>
                      <p className="font-jakarta text-stone-700 text-[14px]">{med.frequency}</p>
                    </div>
                  )}
                  {med.with_food && (
                    <div>
                      <p className="text-[11px] font-bold tracking-[0.1em] text-stone-400 font-jakarta uppercase mb-0.5">With Food</p>
                      <p className="font-jakarta text-stone-700 text-[14px]">{med.with_food}</p>
                    </div>
                  )}
                </div>

                {/* Timing pills */}
                {med.timing && med.timing.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {med.timing.map((t, j) => <TimingPill key={j} label={t} />)}
                  </div>
                )}

                {/* Description */}
                {med.dicription && (
                  <div className="border-t border-stone-50 pt-4 mt-2">
                    <p className="text-[11px] font-bold tracking-[0.1em] text-stone-400 font-jakarta uppercase mb-1.5">About</p>
                    <p className="font-jakarta text-stone-500 text-[14px] leading-relaxed">{med.dicription}</p>
                  </div>
                )}

                {/* Importance */}
                {med.megication_importance && (
                  <div className="mt-3 bg-[#eef5ef] rounded-xl px-4 py-3">
                    <p className="text-[11px] font-bold tracking-[0.1em] text-[#4e7e62] font-jakarta uppercase mb-1">Why It Matters</p>
                    <p className="font-jakarta text-[#3d6352] text-[13px] leading-relaxed">{med.megication_importance}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
    </ProtectedRoute>
  );
}
