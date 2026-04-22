import React, { useState, useEffect } from 'react';
import api from '../api'; // Adjust path

const EditProgramDetail = ({ scholarship, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ ...scholarship });

  // Update internal state if the scholarship prop changes
  useEffect(() => {
    setFormData({ ...scholarship });
  }, [scholarship]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.put(`/scholarships/${formData.id}`, formData);
      onSuccess(response.data.data); // Update the list in the parent
      onClose();
      alert("Scholarship updated successfully!");
    } catch (err) {
      console.error("Update error", err);
      alert("Server Error: " + (err.response?.data?.error || "Check console"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-10 shadow-2xl border border-blue-50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-slate-800">Edit Program</h2>
          <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-md font-bold">
            ID: {formData.id}
          </span>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Scholarship Title</label>
            <input
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 focus:border-blue-500 outline-none transition-all"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Description</label>
            <textarea
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 focus:border-blue-500 outline-none transition-all h-32"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 ml-2 uppercase">Deadline</label>
              <input
                type="date"
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 focus:border-blue-500 outline-none"
                value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 font-bold text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProgramDetail;