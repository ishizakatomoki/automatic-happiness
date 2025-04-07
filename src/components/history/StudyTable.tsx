import React from 'react';
import { StudyRecord, Subject } from '../../types';
import { format, parseISO, startOfWeek, addDays, isWithinInterval, addWeeks, subWeeks } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useDarkMode } from '../../hooks/useDarkMode';

interface StudyTableProps {
  records: StudyRecord[];
  subjects: Subject[];
  weekOffset?: number; // 週のオフセット（0:今週、-1:先週、...)
}

export function StudyTable({ records, subjects, weekOffset = 0 }: StudyTableProps) {
  const isDarkMode = useDarkMode();
  
  // 週の日付を取得
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const today = new Date();
    // 週のオフセットを適用
    const baseDate = weekOffset === 0 ? today : 
                    weekOffset > 0 ? addWeeks(today, weekOffset) : 
                    subWeeks(today, Math.abs(weekOffset));
    const startDay = startOfWeek(baseDate, { weekStartsOn: 1 }); // 月曜始まり
    const day = addDays(startDay, i);
    return {
      date: day,
      label: format(day, 'M/d', { locale: ja }),
      dayOfWeek: format(day, 'E', { locale: ja }),
    };
  });

  // 科目ごとの日別学習時間データを計算
  const subjectDailyData = subjects.map(subject => {
    const dailyTimes = weekDays.map(day => {
      const dayStart = new Date(day.date);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(day.date);
      dayEnd.setHours(23, 59, 59, 999);
      
      // その日のこの科目の合計時間（秒）を計算
      const totalSeconds = records
        .filter(record => 
          record.subjectId === subject.id && 
          isWithinInterval(parseISO(record.endTime), { 
            start: dayStart, 
            end: dayEnd 
          })
        )
        .reduce((sum, record) => sum + record.duration, 0);
      
      return {
        seconds: totalSeconds,
        formatted: formatDuration(totalSeconds)
      };
    });

    // 合計時間も計算
    const totalSeconds = dailyTimes.reduce((sum, data) => sum + data.seconds, 0);

    return {
      subject,
      dailyTimes,
      totalSeconds,
      totalFormatted: formatDuration(totalSeconds)
    };
  });

  // 秒数を時間:分形式に変換する関数
  function formatDuration(seconds: number): string {
    if (seconds === 0) return '-';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours === 0) {
      return `${minutes}分`;
    }
    
    return `${hours}h${minutes > 0 ? `${minutes}m` : ''}`;
  }

  // 表示する週の期間表示
  const getWeekRangeLabel = () => {
    const today = new Date();
    const baseDate = weekOffset === 0 ? today : 
                    weekOffset > 0 ? addWeeks(today, weekOffset) : 
                    subWeeks(today, Math.abs(weekOffset));
    const startDay = startOfWeek(baseDate, { weekStartsOn: 1 });
    const endDay = addDays(startDay, 6);
    
    return `${format(startDay, 'M月d日', { locale: ja })} 〜 ${format(endDay, 'M月d日', { locale: ja })}`;
  };

  return (
    <div className={`rounded-lg shadow ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="px-3 py-2 border-b flex justify-between items-center">
        <h4 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200 border-gray-700' : 'text-gray-700 border-gray-200'}`}>
          Details
        </h4>
        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {getWeekRangeLabel()}
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse table-fixed">
          <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
            <tr>
              <th className={`px-1 py-2 text-left font-medium text-xs w-[80px] ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                Subject
              </th>
              {weekDays.map((day, index) => (
                <th 
                  key={index}
                  className={`px-0 py-2 text-center font-medium text-xs w-[30px] ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  <div className="text-xs">{day.dayOfWeek}</div>
                  <div className={`text-[10px] ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>{day.label}</div>
                </th>
              ))}
              <th className={`px-0 py-2 text-center font-medium text-xs w-[40px] ${
                isDarkMode ? 'text-gray-300' : 'text-gray-500'
              }`}>
                合計
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${
            isDarkMode ? 'bg-gray-800 divide-gray-700' : 'bg-white divide-gray-200'
          }`}>
            {subjectDailyData.map(({ subject, dailyTimes, totalFormatted }) => (
              <tr key={subject.id} className={
                isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
              }>
                <td className={`px-1 py-2 text-left ${isDarkMode ? 'text-gray-200' : ''}`}>
                  <div className="flex items-start space-x-1">
                    <div className="h-5 w-5 flex-shrink-0 rounded-full overflow-hidden mt-0.5">
                      <img 
                        src={subject.imageUrl} 
                        alt={subject.name} 
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-subject.png';
                        }}
                      />
                    </div>
                    <div className="text-xs leading-tight min-h-[2.5em] max-h-[2.5em] overflow-hidden break-words line-clamp-2" title={subject.name}>
                      {subject.name}
                    </div>
                  </div>
                </td>
                {dailyTimes.map((data, index) => (
                  <td 
                    key={index} 
                    className="px-0 py-2 text-center text-[10px]"
                  >
                    <span className={data.seconds > 0 
                      ? (isDarkMode ? 'text-blue-400 font-medium' : 'text-blue-600 font-medium') 
                      : (isDarkMode ? 'text-gray-500' : 'text-gray-400')
                    }>
                      {data.formatted}
                    </span>
                  </td>
                ))}
                <td className={`px-0 py-2 text-center font-medium text-[10px] ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  {totalFormatted}
                </td>
              </tr>
            ))}
            {subjectDailyData.length === 0 && (
              <tr>
                <td colSpan={9} className={`px-3 py-6 text-center ${
                  isDarkMode ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  学習記録がありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 