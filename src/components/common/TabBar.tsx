import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, HistoryOutlined, SettingOutlined } from '@ant-design/icons';
import { useDarkMode } from '../../hooks/useDarkMode';

interface TabBarProps {
  showTabBar?: boolean;
}

const TabBar: React.FC<TabBarProps> = ({ showTabBar = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDarkMode = useDarkMode();

  if (!showTabBar) return null;

  const iconStyle = { fontSize: '24px' };
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getTabStyle = (path: string) => {
    const active = isActive(path);
    return {
      color: active 
        ? (isDarkMode ? '#1890ff' : '#1890ff') 
        : (isDarkMode ? '#d9d9d9' : '#595959'),
      background: active 
        ? (isDarkMode ? 'rgba(24, 144, 255, 0.1)' : 'rgba(24, 144, 255, 0.1)') 
        : 'transparent'
    };
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-around items-center h-16 border-t z-10"
      style={{
        borderColor: isDarkMode ? '#333' : '#f0f0f0',
        background: isDarkMode ? '#141414' : '#ffffff',
      }}>
      <div 
        className="flex-1 flex flex-col items-center justify-center h-full cursor-pointer"
        style={getTabStyle('/')}
        onClick={() => navigate('/')}
      >
        <HomeOutlined style={iconStyle} />
        <span className="text-xs mt-1">ホーム</span>
      </div>
      <div 
        className="flex-1 flex flex-col items-center justify-center h-full cursor-pointer"
        style={getTabStyle('/history')}
        onClick={() => navigate('history')}
      >
        <HistoryOutlined style={iconStyle} />
        <span className="text-xs mt-1">履歴</span>
      </div>
      <div 
        className="flex-1 flex flex-col items-center justify-center h-full cursor-pointer"
        style={getTabStyle('/settings')}
        onClick={() => navigate('/settings')}
      >
        <SettingOutlined style={iconStyle} />
        <span className="text-xs mt-1">設定</span>
      </div>
    </div>
  );
};

export default TabBar; 