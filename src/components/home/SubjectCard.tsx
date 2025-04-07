import React, { useState } from 'react';
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { Subject } from '../../types';
import { useDarkMode } from '../../hooks/useDarkMode';

interface SubjectCardProps {
  subject: Subject;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
}

export function SubjectCard({ subject, onEdit, onDelete, onStart }: SubjectCardProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const isDarkMode = useDarkMode();

  const handleClick = () => {
    onStart();
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div className="flex flex-col">
      {/* 画像エリア - 固定サイズと角丸 */}
      <div 
        className="rounded-card bg-card-bg aspect-square cursor-pointer relative overflow-hidden"
        onClick={handleClick}
      >
        <img 
          src={subject.imageUrl || '/default-subject.png'} 
          alt={subject.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/default-subject.png';
          }}
        />

        {/* メニューボタン */}
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={handleMenuClick}
            className={`p-2 rounded-full shadow-sm ${
              isDarkMode 
                ? 'bg-gray-200 bg-opacity-90 text-gray-900' 
                : 'bg-white bg-opacity-90 text-gray-800'
            }`}
            aria-label="メニューを開く"
          >
            <EllipsisHorizontalIcon className="w-6 h-6" />
          </button>
          
          {/* ドロップダウンメニュー */}
          {showMenu && (
            <div className={`absolute right-0 mt-2 w-36 rounded-lg shadow-lg py-1 z-20 ${
              isDarkMode 
                ? 'bg-gray-800 text-gray-100' 
                : 'bg-white text-gray-800'
            }`}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                  setShowMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm ${
                  isDarkMode 
                    ? 'text-gray-200 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                編集
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                  setShowMenu(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm ${
                  isDarkMode 
                    ? 'text-red-400 hover:bg-gray-700' 
                    : 'text-red-600 hover:bg-gray-50'
                }`}
              >
                削除
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* 科目名 - 画像の下にシンプルに配置 */}
      <h3 className={`text-2xl font-bold mt-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
        {subject.name}
      </h3>
    </div>
  );
} 