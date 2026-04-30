import React, { useState, useEffect, useRef } from 'react';
import { Menu, Search, UserCircle, Bell, Clock, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Topbar = ({ setIsOpen }) => {
  const [searchText, setSearchText] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isFarmer = user && user.role === 'Çiftçi';

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (isFarmer) {
          const response = await api.get(`/notifications/unread?userId=${user.userId}`);
          if (response.data) {
            setUnreadNotifications(response.data);
          }
        }
      } catch (error) {
        console.error('Bildirimler çekilemedi:', error);
      }
    };

    if (isFarmer) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [user, isFarmer]);

  // Dışarı tıklayınca menüyü kapat
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setUnreadNotifications(unreadNotifications.filter(n => n.notificationId !== id));
      setIsDropdownOpen(false);
      navigate('/reminders');
    } catch (error) {
      console.error('Hata:', error);
    }
  };

  const showSearch = location.pathname === '/' || location.pathname === '/animals';

  return (
    <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 z-20 sticky top-0">
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 text-gray-500 hover:text-primary-600 bg-gray-50 hover:bg-primary-50 rounded-lg transition-colors"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>

        {showSearch && (
          <div className="hidden sm:flex items-center bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-100 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-300 transition-all">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Hayvan ara..."
              className="bg-transparent border-none outline-none text-sm ml-2 w-64 text-gray-700 placeholder-gray-400"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Akıllı Bildirim Dropdown */}
        {isFarmer && (
          <div className="relative" ref={dropdownRef}>
            <button 
              className={`p-2.5 rounded-full transition-all relative border ${
                isDropdownOpen ? 'text-[#4ca02e] bg-green-50 border-green-100' : 'text-gray-400 bg-gray-50 border-gray-100'
              }`}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {/* Açılır Menü */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-[350px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200 origin-top-right">
                <div className="p-5 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-black text-gray-900 tracking-tight">Bildirimler</h3>
                  <span className="text-[10px] font-black bg-[#4ca02e]/10 text-[#4ca02e] px-2 py-1 rounded-lg uppercase">
                    {unreadNotifications.length} YENİ
                  </span>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                  {unreadNotifications.length === 0 ? (
                    <div className="p-10 text-center">
                      <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                      <p className="text-sm text-gray-400 font-bold">Her şey yolunda!</p>
                    </div>
                  ) : (
                    unreadNotifications.map((notif) => (
                      <button
                        key={notif.notificationId}
                        onClick={() => handleNotificationClick(notif.notificationId)}
                        className="w-full text-left p-5 hover:bg-gray-50 transition-colors border-b border-gray-50 flex gap-4 group"
                      >
                        <div className="w-10 h-10 bg-[#4ca02e]/10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <Clock className="w-5 h-5 text-[#4ca02e]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm mb-0.5 line-clamp-1">{notif.title}</p>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-2">{notif.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[9px] text-[#4ca02e] font-black flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              DETAYA GİT <ChevronRight className="w-3 h-3" />
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                
                <button 
                  onClick={() => navigate('/reminders')}
                  className="w-full py-4 text-center text-xs font-black text-gray-400 hover:text-[#4ca02e] transition-colors bg-gray-50/30"
                >
                  TÜMÜNÜ GÖR
                </button>
              </div>
            )}
          </div>
        )}

        {/* Profil */}
        <Link to="/profile" className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800">{user ? user.name : 'Kullanıcı'}</p>
            <p className="text-xs text-gray-500">{user ? user.role : 'Çiftçi'}</p>
          </div>
          <UserCircle className="w-9 h-9 text-gray-400" />
        </Link>
      </div>
    </header>
  );
};

export default Topbar;
