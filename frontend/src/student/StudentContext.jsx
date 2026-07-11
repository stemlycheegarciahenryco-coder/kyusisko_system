import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api'; // Adjust path if necessary to find your axios instance

export const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const studentId = localStorage.getItem('studentId');
      if (!studentId) return;
      const res = await api.get(`/students/profile-full/${studentId}`);
      setStudent(res.data);
    } catch (err) {
      console.error("Context Profile Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <StudentContext.Provider value={{ student, loading, refreshProfile: fetchProfile }}>
      {children}
    </StudentContext.Provider>
  );
}

export const useStudent = () => {
  const context = useContext(StudentContext);
  if (!context) {
    return { student: null, loading: false, refreshProfile: () => {} };
  }
  return context;
};