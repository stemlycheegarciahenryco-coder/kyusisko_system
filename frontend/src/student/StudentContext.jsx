import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../api'; // Adjust path if necessary to find your axios instance

export const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tracks any fields we've optimistically applied but haven't yet seen
  // confirmed by the server, so a stale/cached fetch can never quietly
  // wipe out a change the user just made.
  const pendingPatchRef = useRef(null);

  const fetchProfile = async () => {
    try {
      const res = await api.get(`/students/profile-full/me`, {
        // Bust any browser/proxy caching of this GET with a unique query
        // param so "refresh" always hits the server for fresh data.
        // (Deliberately no custom headers here — that would turn this into
        // a non-simple request and trigger a CORS preflight your backend
        // doesn't allow, which is the "blocked by CORS policy" error.)
        params: { _ts: Date.now() }
      });

      const fresh = res.data;
      const pending = pendingPatchRef.current;

      if (pending) {
        const stillPending = Object.keys(pending).some(
          key => String(fresh?.[key] ?? '') !== String(pending[key] ?? '')
        );
        setStudent(stillPending ? { ...fresh, ...pending } : fresh);
        if (!stillPending) pendingPatchRef.current = null;
      } else {
        setStudent(fresh);
      }
      return fresh;
    } catch (err) {
      console.error("Context Profile Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Merge a partial update into state immediately (e.g. right after a save
  // succeeds), so the UI reflects it instantly instead of waiting on a
  // refetch. Call refreshProfile() afterwards to reconcile with the server.
  const updateStudent = (patch) => {
    if (!patch) return;
    pendingPatchRef.current = { ...(pendingPatchRef.current || {}), ...patch };
    setStudent(prev => (prev ? { ...prev, ...patch } : prev));
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <StudentContext.Provider value={{ student, loading, refreshProfile: fetchProfile, updateStudent }}>
      {children}
    </StudentContext.Provider>
  );
}

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    return { student: null, loading: false, refreshProfile: () => {}, updateStudent: () => {} };
  }
  return context;
};