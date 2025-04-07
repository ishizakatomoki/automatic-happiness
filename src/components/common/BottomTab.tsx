import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, ClockIcon } from '@heroicons/react/24/outline';

export function BottomTab() {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const isHistory = location.pathname === '/history';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe">
      <div className="flex justify-around items-center h-14 max-w-md mx-auto">
        <Link
          to="/"
          className="flex flex-col items-center justify-center w-full h-full pt-1"
          aria-label="Home"
        >
          <div className="mb-1">
            <HomeIcon 
              className="w-6 h-6" 
              style={{ 
                color: isHome ? '#000' : '#999',
                strokeWidth: 1.5
              }} 
            />
          </div>
          <span 
            className="text-xs" 
            style={{ 
              color: isHome ? '#000' : '#999',
              fontWeight: isHome ? 500 : 400
            }}
          >
            Home
          </span>
        </Link>
        <Link
          to="/history"
          className="flex flex-col items-center justify-center w-full h-full pt-1"
          aria-label="History"
        >
          <div className="mb-1">
            <ClockIcon 
              className="w-6 h-6" 
              style={{ 
                color: isHistory ? '#000' : '#999',
                strokeWidth: 1.5
              }} 
            />
          </div>
          <span 
            className="text-xs" 
            style={{ 
              color: isHistory ? '#000' : '#999',
              fontWeight: isHistory ? 500 : 400
            }}
          >
            History
          </span>
        </Link>
      </div>
    </nav>
  );
} 