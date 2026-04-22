import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { ChevronRight, GraduationCap } from 'lucide-react';

export default function ScholarshipSelector() {
  const [scholarships, setScholarships] = useState([]);
  const { mode } = useParams(); // 'applicants' or 'fields'
  const navigate = useNavigate();

  useEffect(() => {
    const fetchScholarships = async () => {
      try {
        const res = await api.get('/scholarships');
        setScholarships(res.data.data);
      } catch (err) {
        console.error("Error loading programs", err);
      }
    };
    fetchScholarships();
  }, []);

  return (
    <div className="p-8 bg-blue-50/30 min-h-screen">
      <h1 className="text-2xl font-black text-slate-900 mb-2">Select a Program</h1>
      <p className="text-slate-500 mb-8 font-medium">Which scholarship would you like to manage?</p>

      <div className="grid gap-4 max-w-3xl">
        {scholarships.map((s) => (
          <button
            key={s.id}
            onClick={() => navigate(`/scholarship/${s.id}/${mode}`)}
            className="flex items-center justify-between p-6 bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition-all group"
          >
            <div className="flex items-center gap-4 text-left">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">{s.title}</h3>
                <p className="text-sm text-slate-400">View and manage responses</p>
              </div>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-blue-600" />
          </button>
        ))}
      </div>
    </div>
  );
}