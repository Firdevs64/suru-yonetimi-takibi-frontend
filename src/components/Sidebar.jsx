import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, MessageSquare, X, Activity, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { path: '/', label: 'Sürü Özeti', icon: LayoutDashboard },
  { path: '/animals', label: 'Hayvanlar', icon: Users },
  { path: '/reminders', label: 'Hatırlatıcılar', icon: Bell },
  { path: '/ai-chat', label: 'AI Asistan', icon: MessageSquare },
];

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobil ortamda arkaplan kararması */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar text-gray-300 transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static flex flex-col shadow-xl`}>
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-800 bg-[#151c2c]">
          <h1 className="text-xl font-bold text-white tracking-wide">
            Sürü<span className="text-primary-500">Yönetim</span>
          </h1>
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setIsOpen(false)}>
             <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2">
          {/* Sadece Çiftçilerin Göreceği Menüler */}
          {user?.role !== 'Sistem Yöneticisi' && navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-primary-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-gray-100'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}

          {/* Admin Menüsü (Sadece Sistem Yöneticisi görebilir) */}
          {user?.role === 'Sistem Yöneticisi' && (
            <div className="mt-8">
              <h3 className="px-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Yönetim Paneli</h3>
              
              <div className="space-y-2">
                <NavLink
                  to="/admin/dashboard"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-primary-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-gray-100'
                    }`
                  }
                >
                  <Activity className="w-5 h-5" />
                  <span className="font-medium">Sistem Özeti</span>
                </NavLink>

                <NavLink
                  to="/admin/users"
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive ? 'bg-primary-600 text-white shadow-md' : 'hover:bg-gray-800 hover:text-gray-100'
                    }`
                  }
                >
                  <Users className="w-5 h-5" />
                  <span className="font-medium">Kullanıcılar</span>
                </NavLink>
              </div>
            </div>
          )}
        </nav>
        
        {/* Alt Bilgi / Çıkış */}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Çıkış Yap</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
