import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const StudentRecommendations = () => {
  const [scholarships, setScholarships] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchRecommendations = async () => {
    try {
      // 1. Grab the flat key directly from Local Storage
      const studentId = localStorage.getItem('studentId');
      console.log('studentId directly from localStorage:', studentId);

      // 2. Safeguard checks if it's missing
      if (!studentId) {
        console.warn('No studentId found — widget will be hidden');
        return;
      }

      // 3. Make your API request with the correct ID
      const res = await api.get(`/recommendations/${studentId}`);
      console.log('API response:', res.data);               
      
      const data = res.data.recommendations || [];
      console.log('Scholarships loaded:', data.length, data);
      setScholarships(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    }
  };
  
  fetchRecommendations();
}, []);

  const topMatches = scholarships.filter(s => s.match_score >= 50);
const goodMatches = scholarships.filter(s => s.match_score >= 10 && s.match_score < 50);

  const visibleTop = showAll ? topMatches : topMatches.slice(0, 5);
  const visibleGood = showAll ? goodMatches : goodMatches.slice(0, 5);

  const getInitials = (name) =>
    name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() || '??';

  const ScholItem = ({ scholarship }) => (
    <div
      onClick={() => navigate(`/apply/${scholarship.id}`)}
      className="flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer border border-transparent hover:bg-slate-50 hover:border-black/5 transition-all"
    >
      <div className="w-9 h-9 rounded-full bg-slate-100 border border-black/5 shrink-0 overflow-hidden flex items-center justify-center">
        {scholarship.donor_photo ? (
          <img
            src={`http://localhost:5000/${scholarship.donor_photo}`}
            alt={scholarship.org_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-[10px] font-bold text-black/40">
            {getInitials(scholarship.org_name)}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-black truncate leading-tight">
          {scholarship.title}
        </p>
        <p className="text-[11px] text-black/50 truncate">
          {scholarship.org_name}
        </p>
      </div>

      {scholarship.match_score >= 40 ? (
        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
          Top match
        </span>
      ) : (
        <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
          Good match
        </span>
      )}
    </div>
  );

  if (scholarships.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-black/8 shadow-sm p-5 w-full">
      <h2 className="text-[11px] font-black text-black/60 mb-3 uppercase tracking-widest">
        Other Scholarships
      </h2>

      <div className="flex flex-col gap-0.5">
        {visibleTop.map(s => <ScholItem key={s.id} scholarship={s} />)}

        {(visibleGood.length > 0) && (
          <>
            {visibleTop.length > 0 && (
              <hr className="border-none border-t border-black/5 my-1.5" />
            )}
            {visibleGood.map(s => <ScholItem key={s.id} scholarship={s} />)}
          </>
        )}
      </div>

      {(topMatches.length + goodMatches.length > 4) && (
        <button
          onClick={() => setShowAll(prev => !prev)}
          className="mt-3 w-full text-[11px] font-semibold text-black/40 hover:text-black/60 py-1.5 rounded-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5"
        >
          {showAll
            ? '↑ Show less'
            : `See all ${topMatches.length + goodMatches.length} matched scholarships`}
        </button>
      )}
    </div>
  );
};

export default StudentRecommendations;