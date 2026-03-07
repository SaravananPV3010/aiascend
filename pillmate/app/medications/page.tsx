'use client'

import React, { useState } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { addLogEntry } from '../../lib/activityLog';


const MedicationsPage = () => {
  const [medications, setMedications] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [checkingContraindications, setCheckingContraindications] = useState(false);
  const [contraindicationResult, setContraindicationResult] = useState<any>(null);
  const [editingMed, setEditingMed] = useState<{
    id: string; name: string; dosage: string; frequency: string;
    timing: string[]; before_food: boolean; after_food: boolean;
  } | null>(null);
  
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingFDA, setIsSearchingFDA] = useState(false);
  const suggestionRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [filterTiming, setFilterTiming] = useState('all');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load medications from localStorage on mount
  React.useEffect(() => {
    const savedMeds = localStorage.getItem('pillmate_medications');
    if (savedMeds) {
      try {
        setMedications(JSON.parse(savedMeds));
      } catch (e) {
        console.error('Failed to parse saved medications', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save medications to localStorage whenever they change
  React.useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('pillmate_medications', JSON.stringify(medications));
    }
  }, [medications, isLoaded]);

  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: '',
    timing: [] as string[],
    before_food: false,
    after_food: false
  });

  React.useEffect(() => {
    const fetchSuggestions = async () => {
      // Only fetch if we are actively showing suggestions (meaning user is typing)
      if (!showSuggestions || !newMed.name || newMed.name.length < 2) {
        setSuggestions([]);
        return;
      }
      
      setIsSearchingFDA(true);
      try {
        const query = encodeURIComponent(newMed.name.trim().toLowerCase());
        const res = await fetch(`https://api.fda.gov/drug/ndc.json?search=brand_name:${query}*+generic_name:${query}*&limit=15`);
        if (res.ok) {
          const data = await res.json();
          if (data.results) {
            const unique = new Map();
            data.results.forEach((r: any) => {
              if (r.brand_name) {
                const bName = r.brand_name.toUpperCase();
                if (!unique.has(bName)) {
                  unique.set(bName, { name: r.brand_name, type: 'Brand', generic: r.generic_name });
                }
              }
              if (r.generic_name) {
                const gName = r.generic_name.toUpperCase();
                if (!unique.has(gName)) {
                  unique.set(gName, { name: r.generic_name, type: 'Generic' });
                }
              }
            });
            // Limit to top 5 unique suggestions
            setSuggestions(Array.from(unique.values()).slice(0, 5));
          } else {
            setSuggestions([]);
          }
        } else {
           setSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching FDA data:', error);
      } finally {
        setIsSearchingFDA(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [newMed.name, showSuggestions]);



  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMed.name || !newMed.dosage || !newMed.frequency || (!newMed.before_food && !newMed.after_food)) {
      alert('Please fill in all required fields, including food timing (Before/After food)');
      return;
    }

    setLoading(true);
    try {
      // Simulate adding medication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add medication to local state
      const newMedication = {
        ...newMed,
        id: Date.now().toString(),
        plain_language_explanation: 'This medication helps manage your condition.',
        why_timing_matters: 'Taking it at consistent times maintains stable levels in your body.',
        warnings: newMed.before_food || newMed.after_food
          ? [newMed.before_food ? 'Take before food' : 'Take after food']
          : []
      };
      
      setMedications([...medications, newMedication]);
      addLogEntry('medication_added', { medicationName: newMedication.name });
      console.log('Medication added successfully!');
      setNewMed({
        name: '',
        dosage: '',
        frequency: '',
        timing: [],
        before_food: false,
        after_food: false
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding medication:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed) return;
    setMedications(prev =>
      prev.map(m => m.id === editingMed.id ? { ...m, ...editingMed } : m)
    );
    setEditingMed(null);
  };

  const checkContraindications = async (medicationName: string) => {
    const currentMedNames = [
      ...medications.map((m: any) => m.name),
      ...prescriptions.flatMap((p: any) => p.medications.map((m: any) => m.name))
    ].filter(name => name !== medicationName);

    if (currentMedNames.length === 0) {
      console.log('No other medications to check against');
      return;
    }

    setCheckingContraindications(true);
    try {
      // Simulate contraindication check
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock result
      const mockResult = {
        has_contraindications: false,
        warnings: [],
        recommendations: `No known contraindications found between ${medicationName} and your current medications. Always consult your doctor for professional medical advice.`
      };
      
      setContraindicationResult({ medication: medicationName, ...mockResult });
    } catch (error) {
      console.error('Error checking contraindications:', error);
    } finally {
      setCheckingContraindications(false);
    }
  };

  const allMedications = [
    ...medications,
    ...prescriptions.flatMap(p => p.medications)
  ];

  const filteredMedications = allMedications
    .filter((med) => {
      if (searchQuery && !med.name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterTiming !== 'all' && !(med.timing || []).includes(filterTiming)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':  return (a.name || '').localeCompare(b.name || '');
        case 'name-desc': return (b.name || '').localeCompare(a.name || '');
        case 'dosage':    return (a.dosage || '').localeCompare(b.dosage || '');
        case 'food-first': return ((b.before_food || b.after_food) ? 1 : 0) - ((a.before_food || a.after_food) ? 1 : 0);
        default: return 0;
      }
    });

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-paper py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-fraunces text-5xl md:text-7xl font-light leading-[0.95] text-stone-900 mb-4">
                My Medications
              </h1>
              <p className="text-lg md:text-xl leading-relaxed text-stone-600 font-jakarta">
                 Manage medications from prescriptions in any language
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="rounded-full bg-sage text-white px-6 py-3 font-semibold font-jakarta shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap"
                data-testid="add-medication-button"
              >
                {showAddForm ? 'Cancel' : '+ Add Medication'}
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 mb-12" data-testid="add-medication-form">
              <h2 className="font-fraunces text-3xl font-semibold text-stone-900 mb-6">
                Add Medication Manually
              </h2>
              <form onSubmit={handleAddMedication} className="space-y-4">
                <div className="relative" ref={suggestionRef}>
                  <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 font-jakarta mb-2">
                    Medication Name *
                  </label>
                  <input
                    type="text"
                    value={newMed.name}
                    onChange={(e) => {
                      setNewMed({...newMed, name: e.target.value});
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    className="w-full h-14 rounded-2xl border-stone-200 bg-stone-50 px-4 focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all text-lg font-jakarta"
                    placeholder="e.g., Metformin"
                    data-testid="medication-name-input"
                  />
                  {/* Suggestions Dropdown */}
                  {showSuggestions && (suggestions.length > 0 || isSearchingFDA) && (
                    <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-stone-100 overflow-hidden">
                      {isSearchingFDA && suggestions.length === 0 ? (
                        <div className="p-4 text-sm text-stone-500 font-jakarta text-center">
                          Searching OpenFDA...
                        </div>
                      ) : (
                        <ul className="max-h-60 overflow-y-auto">
                          {suggestions.map((item, index) => (
                            <li 
                              key={index}
                              onClick={() => {
                                setNewMed({...newMed, name: item.name});
                                setShowSuggestions(false);
                              }}
                              className="px-4 py-3 hover:bg-stone-50 cursor-pointer border-b border-stone-50 last:border-0 transition-colors"
                            >
                              <div className="font-semibold text-stone-800 flex items-center gap-2">
                                {item.name}
                                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-400">
                                  {item.type}
                                </span>
                              </div>
                              {item.generic && item.type === 'Brand' && (
                                <div className="text-xs text-stone-500 mt-1">Generic: {item.generic}</div>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 font-jakarta mb-2">
                      Dosage *
                    </label>
                    <input
                      type="text"
                      value={newMed.dosage}
                      onChange={(e) => setNewMed({...newMed, dosage: e.target.value})}
                      className="w-full h-14 rounded-2xl border-stone-200 bg-stone-50 px-4 focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all text-lg font-jakarta"
                      placeholder="e.g., 500mg"
                      data-testid="medication-dosage-input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 font-jakarta mb-2">
                      Frequency *
                    </label>
                    <input
                      type="text"
                      value={newMed.frequency}
                      onChange={(e) => setNewMed({...newMed, frequency: e.target.value})}
                      className="w-full h-14 rounded-2xl border-stone-200 bg-stone-50 px-4 focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all text-lg font-jakarta"
                      placeholder="e.g., Twice daily"
                      data-testid="medication-frequency-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 font-jakarta mb-2">
                    Timing
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {['morning', 'afternoon', 'night'].map((time) => (
                      <label key={time} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newMed.timing.includes(time)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewMed({...newMed, timing: [...newMed.timing, time]});
                            } else {
                              setNewMed({...newMed, timing: newMed.timing.filter(t => t !== time)});
                            }
                          }}
                          className="w-5 h-5 rounded border-stone-300 text-sage focus:ring-sage"
                        />
                        <span className="text-stone-700 font-jakarta capitalize">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 font-jakarta mb-2">
                    Food Timing *
                  </label>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="before-food"
                        checked={newMed.before_food}
                        onChange={(e) => setNewMed({...newMed, before_food: e.target.checked, after_food: e.target.checked ? false : newMed.after_food})}
                        className="w-5 h-5 rounded border-stone-300 text-sage focus:ring-sage"
                        data-testid="before-food-checkbox"
                      />
                      <label htmlFor="before-food" className="text-stone-700 font-jakarta cursor-pointer">
                        Before food
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="after-food"
                        checked={newMed.after_food}
                        onChange={(e) => setNewMed({...newMed, after_food: e.target.checked, before_food: e.target.checked ? false : newMed.before_food})}
                        className="w-5 h-5 rounded border-stone-300 text-sage focus:ring-sage"
                        data-testid="after-food-checkbox"
                      />
                      <label htmlFor="after-food" className="text-stone-700 font-jakarta cursor-pointer">
                        After food
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-sage text-white px-8 py-4 font-semibold font-jakarta shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                  data-testid="submit-medication-button"
                >
                  {loading ? 'Adding...' : 'Add Medication'}
                </button>
              </form>
            </div>
          )}

          {allMedications.length > 0 && (
            <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-6 mb-6" data-testid="medications-filters">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 font-jakarta mb-1.5">Search</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name…"
                      className="w-full h-11 pl-10 pr-4 rounded-xl border-stone-200 bg-stone-50 focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all font-jakarta text-sm"
                      data-testid="medication-search"
                    />
                  </div>
                </div>

                {/* Sort */}
                <div className="min-w-[160px]">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 font-jakarta mb-1.5">Sort by</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full h-11 rounded-xl border-stone-200 bg-stone-50 px-3 focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all font-jakarta text-sm"
                    data-testid="medication-sort"
                  >
                    <option value="name-asc">Name A → Z</option>
                    <option value="name-desc">Name Z → A</option>
                    <option value="dosage">Dosage</option>
                  </select>
                </div>

                {/* Filter by timing */}
                <div className="min-w-[160px]">
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-400 font-jakarta mb-1.5">Timing</label>
                  <select
                    value={filterTiming}
                    onChange={(e) => setFilterTiming(e.target.value)}
                    className="w-full h-11 rounded-xl border-stone-200 bg-stone-50 px-3 focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all font-jakarta text-sm"
                    data-testid="medication-filter-timing"
                  >
                    <option value="all">All timings</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="night">Night</option>
                  </select>
                </div>

              </div>

              {/* Active filter summary */}
              {(searchQuery || filterTiming !== 'all') && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-stone-100">
                  <span className="text-xs text-stone-400 font-jakarta">Showing {filteredMedications.length} of {allMedications.length}</span>
                  <button
                    onClick={() => { setSearchQuery(''); setFilterTiming('all'); setSortBy('name-asc'); }}
                    className="text-xs text-sage hover:text-sage/80 font-jakarta font-semibold ml-auto"
                    data-testid="clear-filters"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}

          {!isLoaded ? (
            <div className="text-center py-12">
              <p className="text-stone-600 font-jakarta">Loading medications...</p>
            </div>
          ) : allMedications.length === 0 ? (
            <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-12 text-center">
              <div className="w-20 h-20 bg-sage/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">💊</span>
              </div>
              <h3 className="font-fraunces text-2xl font-semibold text-stone-900 mb-2">
                No medications yet
              </h3>
              <p className="text-stone-600 font-jakarta">
                Upload a prescription or add medications manually to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4" data-testid="medications-list">
              {filteredMedications.length === 0 && allMedications.length > 0 && (
                <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-12 text-center">
                  <p className="text-stone-600 font-jakarta">No medications match your filters.</p>
                </div>
              )}
              {filteredMedications.map((medication, index) => (
                <div
                  key={medication.id || index}
                  className="bg-white rounded-3xl border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow duration-300"
                  data-testid={`medication-item-${index}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-fraunces text-2xl md:text-3xl font-semibold text-stone-900">
                        {medication.name}
                      </h3>
                      <p className="text-stone-600 font-jakarta mt-1">
                        {medication.dosage} • {medication.frequency}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {medication.before_food && (
                        <span className="bg-clay/10 text-clay px-4 py-2 rounded-full text-sm font-jakarta font-medium">
                          🍽️ Before food
                        </span>
                      )}
                      {medication.after_food && (
                        <span className="bg-clay/10 text-clay px-4 py-2 rounded-full text-sm font-jakarta font-medium">
                          🍽️ After food
                        </span>
                      )}
                      <button
                        onClick={() => setEditingMed({
                          id: medication.id,
                          name: medication.name || '',
                          dosage: medication.dosage || '',
                          frequency: medication.frequency || '',
                          timing: medication.timing || [],
                          before_food: medication.before_food || false,
                          after_food: medication.after_food || false,
                        })}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-full text-sm font-jakarta font-medium transition-colors duration-300"
                        data-testid={`edit-medication-${index}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => checkContraindications(medication.name)}
                        disabled={checkingContraindications}
                        className="bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2 rounded-full text-sm font-jakarta font-medium transition-colors duration-300"
                        data-testid={`check-contraindications-${index}`}
                      >
                        Check Safety
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-stone-500 font-jakarta mb-2">
                        💊 What it does
                      </h4>
                      <p className="text-stone-700 font-jakarta leading-relaxed">
                        {medication.plain_language_explanation}
                      </p>
                    </div>

                    <div className="bg-sage/5 p-4 rounded-2xl">
                      <h4 className="text-sm font-bold uppercase tracking-widest text-sage font-jakarta mb-2">
                        ⏰ Why timing matters
                      </h4>
                      <p className="text-stone-700 font-jakarta leading-relaxed">
                        {medication.why_timing_matters}
                      </p>
                    </div>

                    {medication.warnings && medication.warnings.length > 0 && medication.warnings[0] && (
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-2xl">
                        <h4 className="text-sm font-bold uppercase tracking-widest text-yellow-700 font-jakarta mb-2">
                          ⚠️ Important Safety
                        </h4>
                        {medication.warnings.map((warning: string, idx: number) => (
                          warning && <p key={idx} className="text-stone-700 font-jakarta">{warning}</p>
                        ))}
                      </div>
                    )}

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
          )}

          {editingMed && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="edit-medication-modal">
              <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-6">
                  <h3 className="font-fraunces text-3xl font-semibold text-stone-900">Edit Medication</h3>
                  <button onClick={() => setEditingMed(null)} className="text-stone-500 hover:text-stone-700">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 font-jakarta mb-2">Medication Name *</label>
                    <input
                      type="text"
                      value={editingMed.name}
                      onChange={(e) => setEditingMed({ ...editingMed, name: e.target.value })}
                      className="w-full h-14 rounded-2xl border-stone-200 bg-stone-50 px-4 focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all text-lg font-jakarta"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 font-jakarta mb-2">Dosage *</label>
                      <input
                        type="text"
                        value={editingMed.dosage}
                        onChange={(e) => setEditingMed({ ...editingMed, dosage: e.target.value })}
                        className="w-full h-14 rounded-2xl border-stone-200 bg-stone-50 px-4 focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all text-lg font-jakarta"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 font-jakarta mb-2">Frequency *</label>
                      <input
                        type="text"
                        value={editingMed.frequency}
                        onChange={(e) => setEditingMed({ ...editingMed, frequency: e.target.value })}
                        className="w-full h-14 rounded-2xl border-stone-200 bg-stone-50 px-4 focus:ring-2 focus:ring-sage/20 focus:border-sage transition-all text-lg font-jakarta"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 font-jakarta mb-2">Timing</label>
                    <div className="flex flex-wrap gap-3">
                      {['morning', 'afternoon', 'night'].map((time) => (
                        <label key={time} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingMed.timing.includes(time)}
                            onChange={(e) => {
                              const next = e.target.checked
                                ? [...editingMed.timing, time]
                                : editingMed.timing.filter(t => t !== time);
                              setEditingMed({ ...editingMed, timing: next });
                            }}
                            className="w-5 h-5 rounded border-stone-300 text-sage focus:ring-sage"
                          />
                          <span className="text-stone-700 font-jakarta capitalize">{time}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold uppercase tracking-widest text-stone-500 font-jakarta mb-2">Food Timing</label>
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingMed.before_food}
                          onChange={(e) => setEditingMed({ ...editingMed, before_food: e.target.checked, after_food: e.target.checked ? false : editingMed.after_food })}
                          className="w-5 h-5 rounded border-stone-300 text-sage focus:ring-sage"
                        />
                        <span className="text-stone-700 font-jakarta">Before food</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingMed.after_food}
                          onChange={(e) => setEditingMed({ ...editingMed, after_food: e.target.checked, before_food: e.target.checked ? false : editingMed.before_food })}
                          className="w-5 h-5 rounded border-stone-300 text-sage focus:ring-sage"
                        />
                        <span className="text-stone-700 font-jakarta">After food</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 rounded-full bg-sage text-white px-8 py-4 font-semibold font-jakarta shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0"
                    >
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingMed(null)}
                      className="flex-1 rounded-full border border-stone-200 bg-white text-stone-700 px-8 py-4 font-semibold font-jakarta hover:bg-stone-50 transition-all duration-300"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {contraindicationResult && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" data-testid="contraindication-modal">
              <div className="bg-white rounded-3xl border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-6">
                  <h3 className="font-fraunces text-3xl font-semibold text-stone-900">
                    Safety Check: {contraindicationResult.medication}
                  </h3>
                  <button
                    onClick={() => setContraindicationResult(null)}
                    className="text-stone-500 hover:text-stone-700"
                    data-testid="close-modal-button"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {contraindicationResult.has_contraindications ? (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-2xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-2xl">⚠️</span>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-red-700 font-jakarta">
                          Potential Contraindications Found
                        </h4>
                      </div>
                      <ul className="space-y-2 mt-3">
                        {contraindicationResult.warnings.map((warning: string, idx: number) => (
                          <li key={idx} className="text-stone-700 font-jakarta flex items-start space-x-2">
                            <span className="text-red-500 mt-1">•</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-2xl">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">✅</span>
                        <h4 className="text-sm font-bold uppercase tracking-widest text-green-700 font-jakarta">
                          No Contraindications Found
                        </h4>
                      </div>
                    </div>
                  )}

                  <div className="bg-stone-50 p-4 rounded-2xl">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-stone-500 font-jakarta mb-2">
                      Recommendations
                    </h4>
                    <p className="text-stone-700 font-jakarta leading-relaxed">
                      {contraindicationResult.recommendations}
                    </p>
                  </div>

                  <p className="text-sm text-stone-500 font-jakarta italic">
                    Note: This is a basic check. Always consult your doctor or pharmacist for professional medical advice.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default MedicationsPage;
