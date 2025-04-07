import React, { useState } from 'react';
import { WeeklyChart } from '../components/history/WeeklyChart';
import { StudyTable } from '../components/history/StudyTable';
import { useAppContext } from '../contexts/AppContext';
import { NavigationBar } from '../components/common/NavigationBar';
import { useDarkMode } from '../hooks/useDarkMode';

export default function HistoryScreen() {
  const { state } = useAppContext();
  const { subjects, studyRecords } = state;
  const isDarkMode = useDarkMode(); // ダークモード検出
  
  // 現在表示している週のオフセット（0:今週、-1:先週、-2:先々週...）
  const [weekOffset, setWeekOffset] = useState(0);
  
  // WeeklyChartから週が変更された時のハンドラー
  const handleWeekChange = (offset: number) => {
    setWeekOffset(offset);
  };

  return (
    <div className="app-screen">
      <div className={`${isDarkMode ? 'bg-gray-900' : 'bg-white'} h-full`}>
        <div className="px-3 py-6">
          <h1 className={`text-5xl font-bold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>History</h1>
          
          <div className="max-w-full mb-6">
            <WeeklyChart 
              records={studyRecords} 
              subjects={subjects} 
              weekOffset={weekOffset}
              onWeekChange={handleWeekChange}
            />
          </div>
          
          <div className="max-w-full mb-20">
            <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>詳細データ</h3>
            <StudyTable 
              records={studyRecords} 
              subjects={subjects} 
              weekOffset={weekOffset}
            />
          </div>
        </div>
      </div>
      
      <NavigationBar />
    </div>
  );
} 