import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, HistoryOutlined } from '@ant-design/icons';
import { useDarkMode } from '../../hooks/useDarkMode';

export function NavigationBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useDarkMode();

  const iconStyle = { fontSize: '24px' };
  
  const isActive = (path: string) => location.pathname === path || 
    (path === '/' && location.pathname.startsWith('/timer/'));

  const getTabStyle = (path: string) => {
    const active = isActive(path);
    return {
      color: active 
        ? (isDarkMode ? '#1890ff' : '#1890ff') 
        : (isDarkMode ? '#d9d9d9' : '#595959'),
    };
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 ${
      isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
    } border-t flex justify-around items-center z-50`}
    style={{
      paddingBottom: `calc(0.75rem + env(safe-area-inset-bottom, 0px))`,
      paddingTop: '0.75rem',
    }}>
      <div 
        className="flex-1 flex flex-col items-center justify-center cursor-pointer"
        style={getTabStyle('/')}
        onClick={() => navigate('/')}
      >
        <HomeOutlined style={iconStyle} />
        <span className="text-xs mt-1">Home</span>
      </div>
      
      <div 
        className="flex-1 flex flex-col items-center justify-center cursor-pointer"
        style={getTabStyle('/history')}
        onClick={() => navigate('history')}
      >
        <HistoryOutlined style={iconStyle} />
        <span className="text-xs mt-1">History</span>
      </div>
    </nav>
  );
} 