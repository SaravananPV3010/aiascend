'use client'

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../components/ProtectedRoute';
import { addLogEntry } from '../../lib/activityLog';

const UploadPage = () => {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);


  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      console.error('Please select an image file');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      processFile(file);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (reader.result && typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const createThumbnail = (file: File, maxWidth = 420): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(''); };
      img.src = url;
    });
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      console.error('Please select a prescription image first');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const base64Image = await convertToBase64(selectedFile);
      
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageBase64: base64Image }),
      });

      const data = await response.json();
      console.log('API Response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.apiError || 'Failed to analyze prescription');
      }
      
      setResult(data);
      console.log('📋 Analysis result:', data);
      const thumbnail = await createThumbnail(selectedFile);
      addLogEntry('prescription_analyzed', {
        count: data.medications?.length ?? 0,
        medicationNames: data.medications?.map((m: any) => m.name_english).filter(Boolean) ?? [],
        language: data.detected_language_name,
        medications: data.medications ?? [],
        imageThumbnail: thumbnail,
      });
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze prescription';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveToMedications = () => {
    if (!result || !result.medications) return;

    try {
      const existingSaved = localStorage.getItem('pillmate_medications');
      const medications = existingSaved ? JSON.parse(existingSaved) : [];

      const newMedications = result.medications.map((med: any) => ({
        id: `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: med.name_english,
        dosage: med.dosage || 'As prescribed',
        frequency: med.frequency || 'Daily',
        timing: med.timing || [],
        before_food: med.with_food?.toLowerCase().includes('before'),
        after_food: med.with_food?.toLowerCase().includes('after'),
        plain_language_explanation: med.dicription,
        why_timing_matters: med.megication_importance,
        warnings: [med.with_food].filter(Boolean)
      }));

      const updatedMeds = [...medications, ...newMedications];
      localStorage.setItem('pillmate_medications', JSON.stringify(updatedMeds));
      addLogEntry('medications_saved', {
        count: newMedications.length,
        medicationNames: newMedications.map((m: any) => m.name).filter(Boolean),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save medications:', err);
      setError('Failed to save medications to your list');
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-paper py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="font-fraunces text-5xl md:text-7xl font-light leading-[0.95] text-stone-900 mb-4">
            Upload Your Prescription
          </h1>
          <p className="text-lg md:text-xl leading-relaxed text-stone-600 font-jakarta">
            Take a clear photo in <strong>any language</strong>. Our AI will extract and translate all medications.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 mb-6">

          <div className="space-y-6">
            <div>
              <label
                htmlFor="file-upload"
                className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-stone-300 rounded-2xl cursor-pointer bg-stone-50 hover:bg-stone-100 transition-colors duration-300"
                data-testid="file-upload-area"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-full object-contain rounded-2xl" />
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-16 h-16 mb-4 text-sage" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-stone-700 font-jakarta">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-stone-500 font-jakarta">PNG, JPG, JPEG, or WEBP</p>
                    <p className="text-xs text-sage font-jakarta font-semibold mt-2">✨ Supports prescriptions in any language</p>
                  </div>
                )}
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileSelect}
                  data-testid="file-input"
                />
              </label>
            </div>

            {selectedFile && (
              <div className="flex items-center justify-between bg-sage/5 p-4 rounded-2xl">
                <span className="text-sm text-stone-700 font-jakarta truncate">{selectedFile?.name || ''}</span>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setResult(null);
                  }}
                  className="text-stone-500 hover:text-stone-700"
                  data-testid="clear-file-button"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || loading}
              className="w-full rounded-full bg-sage text-white px-8 py-4 font-semibold font-jakarta shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="analyze-button"
            >
              {loading ? 'Analyzing & Translating...' : 'Analyze Prescription'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3" data-testid="error-message">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700 font-jakarta">Analysis Failed</p>
              <p className="text-sm text-red-600 font-jakarta mt-1">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-12 space-y-6" data-testid="analysis-results">
            <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8">
              <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-4">
                <h2 className="font-fraunces text-3xl font-semibold text-stone-900">
                  Analysis Results
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-stone-100 text-stone-700 px-4 py-2 rounded-full text-sm font-jakarta font-medium">
                    📄 Detected: {result.detected_language?.toUpperCase() || 'Unknown'} ({result.detected_language_name || 'Unknown'})
                  </span>
                  <button
                    onClick={saveToMedications}
                    disabled={saveSuccess}
                    className={`rounded-full px-6 py-2.5 font-semibold font-jakarta shadow-md transition-all duration-300 ${
                      saveSuccess 
                        ? 'bg-green-100 text-green-700 cursor-default' 
                        : 'bg-clay text-white hover:bg-clay/90 hover:-translate-y-0.5'
                    }`}
                  >
                    {saveSuccess ? '✓ Saved to List' : 'Add to My Medications'}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-fraunces text-3xl font-semibold text-stone-900 mb-6">
                Your Medications ({result?.medications?.length || 0})
              </h2>
              <div className="space-y-4">
                {result?.medications?.map((medication: any, index: number) => (
                  <div
                    key={medication.id || index}
                    className="bg-white rounded-3xl border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8"
                    data-testid={`medication-card-${index}`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-fraunces text-2xl font-semibold text-stone-900">
                          {medication.name_english}
                        </h3>
                      </div>
                      {medication.with_food && (
                        <span className="bg-clay/10 text-clay px-4 py-2 rounded-full text-sm font-jakarta font-medium">
                          🍽️ {medication.with_food}
                        </span>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-stone-500 font-jakarta mb-2">
                          💊 Description
                        </h4>
                        <p className="text-stone-700 font-jakarta leading-relaxed">
                          {medication.dicription}
                        </p>
                      </div>

                      <div className="bg-sage/5 p-4 rounded-2xl">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-sage font-jakarta mb-2">
                          ⚕️ Importance
                        </h4>
                        <p className="text-stone-700 font-jakarta leading-relaxed">
                          {medication.megication_importance}
                        </p>
                      </div>

                      {medication.timing && medication.timing.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm font-bold uppercase tracking-widest text-stone-500 font-jakarta mr-2">
                            Timing:
                          </span>
                          {medication.timing.map((time: string, idx: number) => (
                            <span
                              key={idx}
                              className="bg-stone-100 text-stone-700 px-3 py-1 rounded-full text-sm font-jakarta"
                            >
                              {time}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center pt-6">
              <button
                onClick={() => router.push('/medications')}
                className="rounded-full bg-clay text-white px-8 py-4 font-semibold font-jakarta shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                data-testid="view-all-medications-button"
              >
                View All My Medications
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
    </ProtectedRoute>
  );
};

export default UploadPage;
