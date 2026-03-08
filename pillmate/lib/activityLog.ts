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

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export async function addLogEntry(type: LogEventType, details: LogEntry['details'] = {}): Promise<void> {
  const token = getToken();
  if (!token) return;
  
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: new Date().toISOString(),
    details,
  };
  
  try {
    await fetch('/api/vault', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(entry)
    });
  } catch (error) {
    console.error('Failed to add log entry', error);
  }
}

export async function getLogEntries(): Promise<LogEntry[]> {
  const token = getToken();
  if (!token) return [];
  
  try {
    const res = await fetch('/api/vault', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Failed to fetch logs', error);
    return [];
  }
}

export async function clearLogEntries(): Promise<void> {
  const token = getToken();
  if (!token) return;
  
  try {
    await fetch('/api/vault', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Failed to clear logs', error);
  }
}
