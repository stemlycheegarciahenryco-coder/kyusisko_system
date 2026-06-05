import React, { useState, useEffect, useRef } from 'react';
import { Search, GraduationCap, Building2, X, DollarSign, Award, Mail, Phone } from 'lucide-react';
import api from '../api';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); // 'all' | 'scholarships' | 'organizations'
  const [searchResults, setSearchResults] = useState({ scholarships: [], organizations: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Modal Details States
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null); // 'scholarship' or 'organization'

  const searchRef = useRef(null);
  const BASE_URL = 'http://localhost:5000';

  // Debounced API fetch for search entries
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults({ scholarships: [], organizations: [] });
        return;
      }

      setIsSearching(true);
      try {
        const res = await api.get(`/search/global-search?q=${searchQuery}&type=${searchFilter}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error("Error conducting global search:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, searchFilter]);

  // Click Outside hooks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasResults = (searchResults.scholarships?.length > 0) || (searchResults.organizations?.length > 0);

  return (
    <>
      <div className="relative flex-1 max-w-md hidden md:block" ref={searchRef}>
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 text-black/30 pointer-events-none" />
          <input
            type="text"
            placeholder="Search scholarships or providers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full bg-black/5 border border-transparent focus:border-[#093fb4]/20 focus:bg-white text-xs font-bold text-slate-800 placeholder-black/30 pl-10 pr-4 py-2.5 rounded-xl transition-all outline-none"
          />
        </div>

        {/* Dropdown Overlay Results */}
        {showSearchResults && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-black/5 p-3 z-50 max-h-96 overflow-y-auto scrollbar-thin">
            
            {/* 🎛️ Filter Switch Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl mb-3 text-[10px] font-black uppercase tracking-wider">
              <button 
                onClick={() => setSearchFilter('all')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${searchFilter === 'all' ? 'bg-white text-[#093fb4] shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
              >
                All
              </button>
              <button 
                onClick={() => setSearchFilter('scholarships')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${searchFilter === 'scholarships' ? 'bg-white text-[#093fb4] shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Programs
              </button>
              <button 
                onClick={() => setSearchFilter('organizations')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${searchFilter === 'organizations' ? 'bg-white text-[#093fb4] shadow-xs' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Orgs
              </button>
            </div>

            {isSearching ? (
              <p className="text-[10px] font-black text-slate-400 text-center py-4 uppercase tracking-wider animate-pulse">Searching catalog...</p>
            ) : hasResults ? (
              <div className="space-y-4">
                {/* Scholarships Segment */}
                {searchResults.scholarships?.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-black/40 uppercase tracking-wider mb-1 px-1 flex items-center gap-1">
                      <GraduationCap size={12} /> Scholarships
                    </h4>
                    <div className="space-y-0.5">
                      {searchResults.scholarships.map(prog => (
                        <div
                          key={prog.id}
                          onClick={() => {
                            setSelectedItem(prog);
                            setModalType('scholarship');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors"
                        >
                          <p className="text-xs font-black text-slate-900 truncate">{prog.title}</p>
                          <p className="text-[11px] text-slate-500 font-medium truncate">{prog.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Organizations Segment */}
                {searchResults.organizations?.length > 0 && (
                  <div className="border-t border-slate-100 pt-2">
                    <h4 className="text-[10px] font-black text-black/40 uppercase tracking-wider mb-1 px-1 flex items-center gap-1">
                      <Building2 size={11} /> Organizations
                    </h4>
                    <div className="space-y-0.5">
                      {searchResults.organizations.map(org => (
                        <div
                          key={org.id}
                          onClick={() => {
                            setSelectedItem(org);
                            setModalType('organization');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 rounded-md bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {org.org_pic ? (
                                <img 
                                  src={`${BASE_URL}/${org.org_pic}`} 
                                  className="w-full h-full object-cover" 
                                  alt="" 
                                />
                              ) : (
                                <Building2 size={12} className="text-slate-400" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-900 truncate">{org.org_name}</p>
                              <p className="text-[11px] text-slate-400 font-medium truncate">{org.sub_email}</p>
                            </div>
                          </div>
                          <span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-md shrink-0">Partner</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[10px] font-black text-slate-400 text-center py-4 uppercase tracking-wider">No matches found</p>
            )}
          </div>
        )}
      </div>

      {/* 👤/🎓 SEARCH RESULT PROFILE INFORMATION MODAL */}
      {selectedItem && modalType && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[#FFFCFB] rounded-[2.5rem] max-w-lg w-full p-8 shadow-2xl border-4 border-white relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => { setSelectedItem(null); setModalType(null); }}
              className="absolute top-6 right-6 p-2 bg-black/5 hover:bg-black/10 rounded-full text-slate-600 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            {modalType === 'scholarship' ? (
              <>
                <div className="w-14 h-14 bg-blue-50 text-[#093fb4] rounded-2xl flex items-center justify-center mb-5 border border-blue-100">
                  <text><GraduationCap size={28} /></text>
                </div>
                <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight leading-none mb-1">
                  {selectedItem.title}
                </h3>
                <span className="text-[9px] font-black tracking-widest uppercase bg-blue-600 text-white px-2 py-0.5 rounded-md">Program Details</span>
                
                <div className="mt-6 space-y-4 text-left">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Description</h4>
                    <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed bg-black/5 p-3 rounded-xl">{selectedItem.description || 'No description provided.'}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3 rounded-xl border border-black/5">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><DollarSign size={12}/> Grant Amount</h4>
                      <p className="text-xs font-black text-slate-900 mt-1">{selectedItem.amount_range || 'Variable Allowance'}</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-black/5">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center gap-1"><Award size={12}/> Target Criteria</h4>
                      <p className="text-xs font-extrabold text-slate-900 mt-1 truncate">
                        {Array.isArray(selectedItem.criteria) ? selectedItem.criteria.join(', ') : selectedItem.criteria || 'General Academic'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 border border-emerald-100 overflow-hidden">
                  {selectedItem.org_pic ? (
                    <img 
                      src={`${BASE_URL}/${selectedItem.org_pic}`} 
                      className="w-full h-full object-cover" 
                      alt="Org Logo" 
                    />
                  ) : (
                    <Building2 size={28} />
                  )}
                </div>
                <h3 className="text-xl font-black text-slate-950 uppercase tracking-tight leading-none mb-1">
                  {selectedItem.org_name}
                </h3>
                <span className="text-[9px] font-black tracking-widest uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-md">Verified Organization</span>

                <div className="mt-6 space-y-4 text-left">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">About Provider</h4>
                    <p className="text-xs text-slate-700 font-medium mt-1 leading-relaxed bg-black/5 p-3 rounded-xl">
                      This organization is a registered scholarship funding partner platform administrator.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-black/5">
                      <Mail size={14} className="text-slate-400" />
                      <div>
                        <h5 className="text-[9px] font-black text-slate-400 uppercase leading-none">Email Address</h5>
                        <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedItem.sub_email}</p>
                      </div>
                    </div>
                    {selectedItem.contact_number && (
                      <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-black/5">
                        <Phone size={14} className="text-slate-400" />
                        <div>
                          <h5 className="text-[9px] font-black text-slate-400 uppercase leading-none">Contact Number</h5>
                          <p className="text-xs font-bold text-slate-900 mt-0.5">{selectedItem.contact_number}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <div className="mt-8">
              <button
                onClick={() => { setSelectedItem(null); setModalType(null); }}
                className="w-full bg-slate-900 text-white font-black py-3.5 rounded-xl hover:bg-slate-800 transition-colors uppercase text-[10px] tracking-[0.15em] cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}