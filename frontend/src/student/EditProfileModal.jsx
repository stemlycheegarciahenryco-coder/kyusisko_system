import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import api from '../api';

export default function EditProfileModal({ onClose, studentData, setBioState }) {
  const [form, setForm] = useState({
    bio: studentData?.bio || '',
    college_id: studentData?.college_id || '',
    course_id: studentData?.course_id || '',
    other_school: studentData?.other_school || '',
    other_degree_program: studentData?.other_degree_program || '',
    sports_interests: Array.isArray(studentData?.sports_interests) 
      ? studentData.sports_interests.join(', ') 
      : studentData?.sports_interests || '',
  });

  const [colleges, setColleges] = useState([]);
  const [courses, setCourses] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [collegeRes, courseRes] = await Promise.all([
          api.get('/lookup/colleges'),
          api.get('/lookup/courses')
        ]);
        setColleges(collegeRes.data);
        setCourses(courseRes.data);
      } catch (err) {
        console.error("Error loading dropdown data inside modal:", err);
      }
    };
    fetchLookups();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    const formData = new FormData();
    formData.append('student_id', localStorage.getItem('studentId'));
    formData.append('bio', form.bio);
    formData.append('college_id', form.college_id);
    formData.append('course_id', form.course_id);
    formData.append('other_school', form.other_school);
    formData.append('other_degree_program', form.other_degree_program);
    formData.append('sports_interests', form.sports_interests);

    try {
      await api.patch('/students/update-portfolio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (setBioState) setBioState(form.bio);
      setShowSuccess(true);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Failed to update profile.");
    } finally {
      setUploading(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    window.location.reload(); // Refresh to catch lookup changes dynamically
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-auto transition-all">
        
        {showSuccess ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#093fb4]/10 rounded-full flex items-center justify-center text-[#093fb4] mb-5 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-xl font-black text-black uppercase tracking-tight mb-2">Profile Updated!</h3>
            <p className="text-sm text-slate-500 font-medium max-w-xs leading-relaxed mb-6">
              Your academic information and biography summary details have been updated.
            </p>
            <button
              onClick={handleSuccessClose}
              className="w-full max-w-xs bg-[#093fb4] text-white py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#093fb4]/90 transition-all shadow-md active:scale-95"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="h-1 bg-[#093fb4]" />

            <div className="p-7 max-h-[85vh] overflow-y-auto scrollbar-thin">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-black uppercase tracking-tight">Edit Academic Profile</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Keep your account context up to date</p>
                </div>
                <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#093fb4] hover:border-[#093fb4] transition-all">
                  <X size={14} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#093fb4] tracking-widest mb-1.5">About Yourself (Bio)</label>
                  <textarea
                    placeholder="Write a short summary about yourself..."
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#093fb4] outline-none text-sm text-black font-medium transition-all resize-none min-h-[80px]"
                    value={form.bio}
                    onChange={e => setForm({ ...form, bio: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#093fb4] tracking-widest mb-1.5">Current College / University</label>
                  <select
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#093fb4] outline-none text-sm font-medium text-slate-800 cursor-pointer transition-all"
                    value={form.college_id}
                    onChange={e => setForm({ ...form, college_id: e.target.value, other_school: e.target.value === 'Others' ? form.other_school : '' })}
                  >
                    <option value="">Select your school</option>
                    {colleges.map((col) => (
                      <option key={col.id} value={col.id}>{col.name}</option>
                    ))}
                    <option value="Others">Others (Specify below)</option>
                  </select>
                  {form.college_id === 'Others' && (
                    <input
                      type="text"
                      placeholder="Enter school name..."
                      className="w-full mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#093fb4] outline-none text-sm font-medium text-black transition-all"
                      value={form.other_school}
                      onChange={e => setForm({ ...form, other_school: e.target.value })}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#093fb4] tracking-widest mb-1.5">Degree Program / Course</label>
                  <select
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#093fb4] outline-none text-sm font-medium text-slate-800 cursor-pointer transition-all"
                    value={form.course_id}
                    onChange={e => setForm({ ...form, course_id: e.target.value, other_degree_program: e.target.value === 'Others' ? form.other_degree_program : '' })}
                  >
                    <option value="">Select your course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.name}</option>
                    ))}
                    <option value="Others">Others (Specify below)</option>
                  </select>
                  {form.course_id === 'Others' && (
                    <input
                      type="text"
                      placeholder="Enter course name..."
                      className="w-full mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#093fb4] outline-none text-sm font-medium text-black transition-all"
                      value={form.other_degree_program}
                      onChange={e => setForm({ ...form, other_degree_program: e.target.value })}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#093fb4] tracking-widest mb-1.5">Sports Interests</label>
                  <input
                    type="text"
                    placeholder="Basketball, Volleyball, Chess (Comma separated)"
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 focus:border-[#093fb4] outline-none text-sm font-medium text-black transition-all"
                    value={form.sports_interests}
                    onChange={e => setForm({ ...form, sports_interests: e.target.value })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-[#093fb4] text-white py-3 rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-[#093fb4]/90 transition-all shadow-lg active:scale-95 disabled:opacity-60"
                >
                  {uploading ? "Saving..." : "Save Changes"}
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}