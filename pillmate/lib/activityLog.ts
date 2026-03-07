const LOG_KEY = 'pillmate_activity_log';

export type LogEventType =
  | 'prescription_analyzed'
  | 'medications_saved'
  | 'medication_added';

export interface MedicationDetail {
  name_english: string;
  dosage?: string;
  frequency?: string;
  dicription?: string;
  megication_importance?: string;
  timing?: string[];
  with_food?: string;
}

export interface LogEntry {
  id: string;
  type: LogEventType;
  timestamp: string;
  details: {
    count?: number;
    medicationNames?: string[];
    medicationName?: string;
    language?: string;
    medications?: MedicationDetail[];
    imageThumbnail?: string; // base64 data-URI JPEG thumbnail
  };
}

export function addLogEntry(type: LogEventType, details: LogEntry['details'] = {}): void {
  if (typeof window === 'undefined') return;
  const existing = getLogEntries();
  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: new Date().toISOString(),
    details,
  };
  const updated = [entry, ...existing].slice(0, 200);
  localStorage.setItem(LOG_KEY, JSON.stringify(updated));
}

export function getLogEntries(): LogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearLogEntries(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(LOG_KEY);
}
