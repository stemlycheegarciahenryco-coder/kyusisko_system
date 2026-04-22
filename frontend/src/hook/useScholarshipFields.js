import { useState, useEffect } from 'react';
import api from '../api'; // Adjust the path to your axios instance

export const useScholarshipFields = (scholarshipId) => {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFields = async () => {
    if (!scholarshipId || scholarshipId === 'undefined') return;
    
    setLoading(true);
    try {
      const response = await api.get(`/scholarships/${scholarshipId}/fields`);
      if (response.data.success) {
        setFields(response.data.data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [scholarshipId]);

  // We return the state AND the fetch function in case you want to "refresh" manually
  return { fields, setFields, loading, error, refetch: fetchFields };
};