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
      <div className="relative flex-1 max-w-lg hidden md:block" ref={searchRef}>
        <div className="relative flex items-center">
          <Search size={20} className="absolute left-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search scholarships or providers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full bg-slate-100/80 border border-slate-200 focus:border-[#093fb4] focus:bg-white text-sm font-bold text-slate-900 placeholder-slate-500 pl-11 pr-4 py-3 rounded-2xl transition-all outline-none shadow-sm"
          />
        </div>

        {/* Dropdown Overlay Results */}
        {showSearchResults && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 z-50 max-h-96 overflow-y-auto scrollbar-thin">
            
            {/* 🎛️ Filter Switch Tabs */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl mb-3 text-xs font-black uppercase tracking-wider">
              <button 
                onClick={() => setSearchFilter('all')}
                className={`flex-1 py-2 rounded-lg text-center transition-all ${searchFilter === 'all' ? 'bg-white text-[#093fb4] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                All
              </button>
              <button 
                onClick={() => setSearchFilter('scholarships')}
                className={`flex-1 py-2 rounded-lg text-center transition-all ${searchFilter === 'scholarships' ? 'bg-white text-[#093fb4] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Programs
              </button>
              <button 
                onClick={() => setSearchFilter('organizations')}
                className={`flex-1 py-2 rounded-lg text-center transition-all ${searchFilter === 'organizations' ? 'bg-white text-[#093fb4] shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Orgs
              </button>
            </div>

            {isSearching ? (
              <p className="text-xs font-extrabold text-slate-600 text-center py-5 uppercase tracking-wider animate-pulse">Searching catalog...</p>
            ) : hasResults ? (
              <div className="space-y-4">
                {/* Scholarships Segment */}
                {searchResults.scholarships?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                      <GraduationCap size={16} className="text-[#093fb4]" /> Scholarships
                    </h4>
                    <div className="space-y-1">
                      {searchResults.scholarships.map(prog => (
                        <div
                          key={prog.id}
                          onClick={() => {
                            setSelectedItem(prog);
                            setModalType('scholarship');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="p-2.5 hover:bg-slate-100/80 rounded-xl cursor-pointer transition-colors"
                        >
                          <p className="text-sm font-black text-slate-900 truncate">{prog.title}</p>
                          <p className="text-xs text-slate-600 font-semibold truncate mt-0.5">{prog.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Organizations Segment */}
                {searchResults.organizations?.length > 0 && (
                  <div className="border-t border-slate-200 pt-3">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                      <Building2 size={15} className="text-[#093fb4]" /> Organizations
                    </h4>
                    <div className="space-y-1">
                      {searchResults.organizations.map(org => (
                        <div
                          key={org.id}
                          onClick={() => {
                            setSelectedItem(org);
                            setModalType('organization');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="p-2.5 hover:bg-slate-100/80 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                              {org.org_pic ? (
                                <img 
                                  src={org.org_pic} 
                                  className="w-full h-full object-cover" 
                                  alt="" 
                                />
                              ) : (
                                <Building2 size={16} className="text-slate-500" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 truncate">{org.org_name}</p>
                              <p className="text-xs text-slate-600 font-semibold truncate">{org.sub_email}</p>
                            </div>
                          </div>
                          <span className="text-xs font-black uppercase text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md shrink-0">Partner</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs font-black text-slate-600 text-center py-5 uppercase tracking-wider">No matches found</p>
            )}
          </div>
        )}
      </div>

      {/* 👤/🎓 SEARCH RESULT PROFILE INFORMATION MODAL */}
      {selectedItem && modalType && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#FFFCFB] rounded-[2.5rem] max-w-lg w-full p-8 shadow-2xl border-4 border-white relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Close Button */}
            <button 
              onClick={() => { setSelectedItem(null); setModalType(null); }}
              className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {modalType === 'scholarship' ? (
              <>
                <div className="w-16 h-16 bg-blue-50 text-[#093fb4] rounded-2xl flex items-center justify-center mb-5 border border-blue-100">
                  <GraduationCap size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tight leading-tight mb-2">
                  {selectedItem.title}
                </h3>
                <span className="text-xs font-black tracking-widest uppercase bg-blue-600 text-white px-2.5 py-1 rounded-md inline-block">Program Details</span>
                
                <div className="mt-6 space-y-4 text-left">
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">Description</h4>
                    <p className="text-sm text-slate-800 font-semibold mt-1 leading-relaxed bg-slate-100/70 border border-slate-200 p-3.5 rounded-xl">
                      {selectedItem.description || 'No description provided.'}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5"><DollarSign size={14} className="text-[#093fb4]"/> Grant Amount</h4>
                      <p className="text-sm font-black text-slate-900 mt-1">{selectedItem.amount_range || 'Variable Allowance'}</p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5"><Award size={14} className="text-[#093fb4]"/> Target Criteria</h4>
                      <p className="text-sm font-extrabold text-slate-900 mt-1 truncate">
                        {Array.isArray(selectedItem.criteria) ? selectedItem.criteria.join(', ') : selectedItem.criteria || 'General Academic'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 border border-emerald-100 overflow-hidden">
                  {selectedItem.org_pic ? (
                    <img 
                      src={`${BASE_URL}/${selectedItem.org_pic}`} 
                      className="w-full h-full object-cover" 
                      alt="Org Logo" 
                    />
                  ) : (
                    <Building2 size={32} />
                  )}
                </div>
                <h3 className="text-2xl font-black text-slate-950 uppercase tracking-tight leading-tight mb-2">
                  {selectedItem.org_name}
                </h3>
                <span className="text-xs font-black tracking-widest uppercase bg-emerald-600 text-white px-2.5 py-1 rounded-md inline-block">Verified Organization</span>

                <div className="mt-6 space-y-4 text-left">
                  <div>
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">About Provider</h4>
                    <p className="text-sm text-slate-800 font-semibold mt-1 leading-relaxed bg-slate-100/70 border border-slate-200 p-3.5 rounded-xl">
                      This organization is a registered scholarship funding partner platform administrator.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <Mail size={16} className="text-[#093fb4]" />
                      <div>
                        <h5 className="text-xs font-black text-slate-700 uppercase leading-none">Email Address</h5>
                        <p className="text-sm font-bold text-slate-900 mt-1">{selectedItem.sub_email}</p>
                      </div>
                    </div>
                    {selectedItem.contact_number && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <Phone size={16} className="text-[#093fb4]" />
                        <div>
                          <h5 className="text-xs font-black text-slate-700 uppercase leading-none">Contact Number</h5>
                          <p className="text-sm font-bold text-slate-900 mt-1">{selectedItem.contact_number}</p>
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
                className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-slate-800 transition-colors uppercase text-xs tracking-widest cursor-pointer"
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