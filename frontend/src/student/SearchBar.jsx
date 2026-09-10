import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, GraduationCap, Building2, X, Phone, 
  ShieldCheck, BookOpen, Mail, Calendar, Users, MapPin, Globe, ExternalLink, Clock, Sparkles 
} from 'lucide-react';
import api, { backendURL } from '../api';

export default function SearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all'); 
  const [rawResults, setRawResults] = useState({ scholarships: [], organizations: [] });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null); 
  const [orgPrograms, setOrgPrograms] = useState([]);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);

  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length === 0) {
        setRawResults({ scholarships: [], organizations: [] });
        return;
      }

      setIsSearching(true);
      try {
        const res = await api.get(`/search/global-search?q=${encodeURIComponent(searchQuery)}&type=all`);
        setRawResults(res.data || { scholarships: [], organizations: [] });
      } catch (err) {
        console.error("Error conducting global search:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    if (selectedItem?.id && modalType === 'organization') {
      setIsLoadingPrograms(true);
      api.get(`/search/org-programs/${selectedItem.id}`)
        .then(res => setOrgPrograms(res.data?.data || []))
        .catch(err => console.error("Error fetching org programs:", err))
        .finally(() => setIsLoadingPrograms(false));
    } else {
      setOrgPrograms([]);
    }
  }, [selectedItem, modalType]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayedScholarships = (searchFilter === 'all' || searchFilter === 'scholarships') ? rawResults.scholarships || [] : [];
  const displayedOrganizations = (searchFilter === 'all' || searchFilter === 'organizations') ? rawResults.organizations || [] : [];
  const hasResults = displayedScholarships.length > 0 || displayedOrganizations.length > 0;

  const resolveImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return `${backendURL}/uploads/${path}`;
  };

  return (
    <>
      <div className="relative flex-1 max-w-lg hidden md:block" ref={searchRef}>
        <div className="relative flex items-center">
          <Search size={18} className="absolute left-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search scholarships or providers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full bg-slate-100/90 border border-slate-200/80 focus:border-[#093fb4] focus:bg-white text-xs font-bold text-slate-900 placeholder-slate-400 pl-11 pr-4 py-3 rounded-2xl transition-all outline-none shadow-xs"
          />
        </div>

        {showSearchResults && searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/80 p-3 z-50 max-h-96 overflow-y-auto scrollbar-thin">
            
            <div className="flex bg-slate-100 p-1 rounded-xl mb-3 text-[10px] font-black uppercase tracking-wider">
              <button 
                onClick={() => setSearchFilter('all')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${searchFilter === 'all' ? 'bg-white text-[#093fb4] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                All ({rawResults.scholarships.length + rawResults.organizations.length})
              </button>
              <button 
                onClick={() => setSearchFilter('scholarships')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${searchFilter === 'scholarships' ? 'bg-white text-[#093fb4] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Programs ({rawResults.scholarships.length})
              </button>
              <button 
                onClick={() => setSearchFilter('organizations')}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${searchFilter === 'organizations' ? 'bg-white text-[#093fb4] shadow-xs' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Orgs ({rawResults.organizations.length})
              </button>
            </div>

            {isSearching ? (
              <p className="text-[11px] font-extrabold text-slate-400 text-center py-6 uppercase tracking-widest animate-pulse">
                Searching catalog...
              </p>
            ) : hasResults ? (
              <div className="space-y-3">
                {displayedScholarships.length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-2 flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-[#093fb4]" /> Scholarships
                    </h4>
                    <div className="space-y-1">
                      {displayedScholarships.map(prog => (
                        <div
                          key={prog.id}
                          onClick={() => {
                            setShowSearchResults(false);
                            setSearchQuery('');
                            if (prog.existing_application_id) {
                              navigate(`/my-scholarships/${prog.existing_application_id}`);
                            } else {
                              navigate(`/apply/${prog.id}`);
                            }
                          }}
                          className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 border border-transparent hover:border-slate-200"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-black text-[#093fb4] truncate hover:underline">{prog.title}</p>
                            <p className="text-[10px] text-slate-500 font-semibold truncate mt-0.5">
                              {prog.org_name || 'Scholarship Grant'}
                              {prog.existing_application_id && (
                                <span className="ml-2 text-emerald-600 font-black">· Already Applied</span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {displayedOrganizations.length > 0 && (
                  <div className={displayedScholarships.length > 0 ? "border-t border-slate-100 pt-2.5" : ""}>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-2 flex items-center gap-1.5">
                      <Building2 size={14} className="text-[#093fb4]" /> Organizations / Providers
                    </h4>
                    <div className="space-y-1">
                      {displayedOrganizations.map(org => {
                        const imgUrl = resolveImageUrl(org.org_pic);
                        return (
                          <div
                            key={org.id}
                            onClick={() => {
                              setSelectedItem(org);
                              setModalType('organization');
                              setShowSearchResults(false);
                            }}
                            className="p-2.5 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 border border-transparent hover:border-slate-200"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {imgUrl ? (
                                  <img src={imgUrl} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <Building2 size={16} className="text-slate-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-black text-slate-900 truncate">{org.org_name}</p>
                                <p className="text-[10px] text-slate-400 font-semibold truncate">
                                  {org.provider_type || 'Verified Provider'}
                                </p>
                              </div>
                            </div>
                            <span className="text-[9px] font-black uppercase text-[#093fb4] bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md shrink-0">
                              Partner
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[11px] font-black text-slate-400 text-center py-6 uppercase tracking-widest">
                No matching results found
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── ORGANIZATION PROFILE MODAL (Unified Hero Style matching OrgProfile.jsx) ── */}
      {selectedItem && modalType === 'organization' && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 relative overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Close Button */}
            <button 
              onClick={() => { setSelectedItem(null); setModalType(null); }}
              className="absolute top-4 right-4 z-20 p-2.5 bg-black/30 hover:bg-black/50 backdrop-blur-md rounded-full text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Scrollable Modal Container */}
            <div className="overflow-y-auto scrollbar-thin">
              
              {/* Cover Banner Area */}
              <div className="h-44 sm:h-52 bg-slate-100 relative overflow-hidden">
                {resolveImageUrl(selectedItem.cover_pic) ? (
                  <img 
                    src={resolveImageUrl(selectedItem.cover_pic)} 
                    alt="Cover" 
                    className="absolute inset-0 w-full h-full object-cover" 
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#093fb4] to-indigo-800 opacity-95" />
                )}
              </div>

              {/* Profile Details Header */}
              <div className="px-6 sm:px-8 pb-6 relative z-10 bg-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-14 sm:-mt-16 mb-5">
                  
                  {/* Avatar Logo */}
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white shadow-xl overflow-hidden flex items-center justify-center border-4 border-white ring-1 ring-slate-200 shrink-0">
                    {resolveImageUrl(selectedItem.org_pic) ? (
                      <img src={resolveImageUrl(selectedItem.org_pic)} alt="Org Logo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-blue-50 flex items-center justify-center text-[#093fb4] font-black text-2xl">
                        {selectedItem.org_name ? selectedItem.org_name.charAt(0).toUpperCase() : 'O'}
                      </div>
                    )}
                  </div>

                  {/* Title & Type */}
                  <div className="pt-2 sm:pb-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight uppercase">
                        {selectedItem.org_name}
                      </h2>
                      <ShieldCheck size={18} className="text-[#093fb4] shrink-0" />
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase bg-blue-50 text-[#093fb4] border border-blue-100 px-2.5 py-0.5 rounded-md inline-block">
                      {selectedItem.provider_type || 'Educational Institution'}
                    </span>
                  </div>
                </div>

                {/* About Us / Mission statement */}
                {selectedItem.about_us && (
                  <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">About Organization</p>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      {selectedItem.about_us}
                    </p>
                  </div>
                )}

                {/* Overview Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {selectedItem.contact_number && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                      <Phone size={16} className="text-[#093fb4] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Telephone / Contact</p>
                        <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{selectedItem.contact_number}</p>
                      </div>
                    </div>
                  )}

                  {selectedItem.sub_email && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                      <Mail size={16} className="text-[#093fb4] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                        <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{selectedItem.sub_email}</p>
                      </div>
                    </div>
                  )}

                  {selectedItem.address && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3 sm:col-span-2">
                      <MapPin size={16} className="text-[#093fb4] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Office Address</p>
                        <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{selectedItem.address}</p>
                      </div>
                    </div>
                  )}

                  {selectedItem.website && (
                    <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3 sm:col-span-2">
                      <Globe size={16} className="text-[#093fb4] shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Website</p>
                        <a 
                          href={selectedItem.website.startsWith('http') ? selectedItem.website : `https://${selectedItem.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-[#093fb4] hover:underline flex items-center gap-1 truncate mt-0.5"
                        >
                          {selectedItem.website} <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Featured Programs Section */}
                <div>
                  <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <BookOpen size={14} className="text-[#093fb4]"/> Featured Programs & Active Scholars
                  </h4>
                  
                  <div className="space-y-2.5 max-h-56 overflow-y-auto scrollbar-thin pr-1">
                    {isLoadingPrograms ? (
                      <div className="text-center py-8 bg-slate-50 border border-slate-200 rounded-2xl animate-pulse">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading featured programs...</p>
                      </div>
                    ) : orgPrograms.length > 0 ? (
                      orgPrograms.map(prog => (
                        <div 
                          key={prog.id} 
                          className="border border-slate-200 rounded-2xl bg-white p-4 hover:border-[#093fb4] transition-all cursor-pointer shadow-xs" 
                          onClick={() => {
                            setSelectedItem(null);
                            setModalType(null);
                            navigate(`/scholarships/${prog.id}`);
                          }}
                        >
                          <p className="font-black text-xs text-[#093fb4] hover:underline line-clamp-1">{prog.title || prog.name}</p>
                          
                          <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100 text-[10px] font-bold text-slate-500">
                            <span className="flex items-center gap-1 text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                              <Users size={12} /> {prog.active_scholars ?? 0} Active Scholars
                            </span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Calendar size={12} /> Deadline: {prog.deadline ? new Date(prog.deadline).toLocaleDateString() : 'N/A'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center gap-2">
                        <BookOpen size={24} className="text-slate-300" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No featured programs listed</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 shrink-0">
              <button
                onClick={() => { setSelectedItem(null); setModalType(null); }}
                className="w-full bg-[#093fb4] hover:bg-[#0730a0] text-white font-black py-3.5 rounded-2xl transition-colors uppercase text-[10px] tracking-widest cursor-pointer shadow-md"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}