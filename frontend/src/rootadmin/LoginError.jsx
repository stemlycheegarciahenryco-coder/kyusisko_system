import { useState, useEffect } from 'react';
import api from '../api';

export default function LoginError() {
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const res = await api.get('/auth/login-attempts');
        setAttempts(res.data);
      } catch (err) {
        console.error("Failed to fetch attempts:", err);
      }
    };

    fetchAttempts();
    const interval = setInterval(fetchAttempts, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-slate-800 font-bold text-base">🚨 Suspicious Login Attempts</h3>
        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Last 24 hours</span>
      </div>

      {attempts.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">✅ No suspicious activity detected.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-slate-600">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider">
                <th className="text-left pb-2 font-bold">Email</th>
                <th className="text-left pb-2 font-bold">IP Address</th>
                <th className="text-left pb-2 font-bold">Failed Attempts</th>
                <th className="text-left pb-2 font-bold">Last Attempt</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-red-50 transition-colors">
                  <td className="py-2 font-medium text-slate-800">{a.email}</td>
                  <td className="py-2 text-slate-500">{a.ip_address}</td>
                  <td className="py-2">
                    <span className="bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full">
                      {a.failed_count}x
                    </span>
                  </td>
                  <td className="py-2 text-slate-400">{new Date(a.last_attempt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
