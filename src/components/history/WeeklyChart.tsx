import React, { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { StudyRecord, Subject } from '../../types';
import { format, startOfWeek, addDays, isWithinInterval, parseISO, addWeeks, subWeeks } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useDarkMode } from '../../hooks/useDarkMode';
import { useSwipeable } from 'react-swipeable';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface WeeklyChartProps {
  records: StudyRecord[];
  subjects: Subject[];
  weekOffset?: number; // 週のオフセット（0:今週、-1:先週、...)
  onWeekChange?: (offset: number) => void; // 週が変更されたときのコールバック
}

export function WeeklyChart({ records, subjects, weekOffset: propWeekOffset = 0, onWeekChange }: WeeklyChartProps) {
  const isDarkMode = useDarkMode();
  // 現在表示している週の基準日（今日から見て何週前/後か）
  const [localWeekOffset, setLocalWeekOffset] = useState(0);
  
  // 親から渡されたweekOffsetを使用するか、ローカルの状態を使用するか
  const weekOffset = onWeekChange ? propWeekOffset : localWeekOffset;
  
  // 表示中の週の開始日を取得
  const getWeekRangeLabel = () => {
    const today = new Date();
    const baseDate = weekOffset === 0 ? today : 
                    weekOffset > 0 ? addWeeks(today, weekOffset) : 
                    subWeeks(today, Math.abs(weekOffset));
    const startDay = startOfWeek(baseDate, { weekStartsOn: 1 });
    const endDay = addDays(startDay, 6);
    
    return `${format(startDay, 'M月d日', { locale: ja })} 〜 ${format(endDay, 'M月d日', { locale: ja })}`;
  };
  
  // 前の週に移動
  const goToPreviousWeek = () => {
    const newOffset = weekOffset - 1;
    if (onWeekChange) {
      onWeekChange(newOffset);
    } else {
      setLocalWeekOffset(newOffset);
    }
  };
  
  // 次の週に移動
  const goToNextWeek = () => {
    // 未来の週は現在の週までしか進めないようにする
    if (weekOffset < 0) {
      const newOffset = weekOffset + 1;
      if (onWeekChange) {
        onWeekChange(newOffset);
      } else {
        setLocalWeekOffset(newOffset);
      }
    }
  };
  
  // 現在の週に戻る
  const goToCurrentWeek = () => {
    if (onWeekChange) {
      onWeekChange(0);
    } else {
      setLocalWeekOffset(0);
    }
  };
  
  // スワイプハンドラー設定
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => goToNextWeek(),
    onSwipedRight: () => goToPreviousWeek(),
    trackMouse: true,
    preventScrollOnSwipe: true
  });
  
  const weekDays = useMemo(() => {
    const today = new Date();
    // 週のオフセットを適用
    const baseDate = weekOffset === 0 ? today : 
                    weekOffset > 0 ? addWeeks(today, weekOffset) : 
                    subWeeks(today, Math.abs(weekOffset));
    const startDay = startOfWeek(baseDate, { weekStartsOn: 1 }); // 月曜始まり
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(startDay, i);
      return {
        date: day,
        label: format(day, 'E', { locale: ja }), // 曜日の短縮形
        fullLabel: format(day, 'MM/dd (E)', { locale: ja }) // 完全な日付表示
      };
    });
  }, [weekOffset]);

  const chartData = useMemo(() => {
    // 科目ごとにデータセットを作成
    const datasets = subjects.map((subject, index) => {
      const data = weekDays.map(day => {
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
        
        // 時間に変換（秒数を3600で割る）
        return totalSeconds / 3600;
      });

      // 科目名が長い場合は省略
      const truncatedName = subject.name.length > 10 
        ? `${subject.name.substring(0, 10)}...` 
        : subject.name;

      return {
        label: truncatedName,
        fullName: subject.name, // ツールチップ用に元の名前を保持
        data,
        backgroundColor: getColorByIndex(index),
        borderColor: getBorderColorByIndex(index),
        borderWidth: 1,
        borderRadius: 4,
      };
    });

    return {
      labels: weekDays.map(day => day.label),
      datasets,
    };
  }, [records, subjects, weekDays]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11,
          },
          color: isDarkMode ? '#f0f0f0' : '#666666',
          // メイン科目を最大5つだけ表示
          filter: (legendItem: any, data: any) => {
            return data.datasets.indexOf(data.datasets.find((dataset: any) => 
              dataset.label === legendItem.text)) < 5;
          }
        }
      },
      tooltip: {
        callbacks: {
          title: (context: any) => {
            const index = context[0].dataIndex;
            return weekDays[index].fullLabel;
          },
          label: (context: any) => {
            const hours = context.parsed.y;
            const minutes = Math.round((hours % 1) * 60);
            const fullName = context.dataset.fullName || context.dataset.label;
            
            if (hours < 0.01) return `${fullName}: 記録なし`;
            if (hours < 1) return `${fullName}: ${minutes}分`;
            
            return `${fullName}: ${Math.floor(hours)}時間${minutes > 0 ? ` ${minutes}分` : ''}`;
          },
        },
        backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.9)' : 'rgba(0, 0, 0, 0.75)',
        padding: 10,
        cornerRadius: 6,
        titleFont: {
          size: 13,
          weight: 'bold' as const,
        },
        bodyFont: {
          size: 12
        },
        titleColor: isDarkMode ? '#f0f0f0' : '#ffffff',
        bodyColor: isDarkMode ? '#e0e0e0' : '#ffffff',
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: isDarkMode ? '#d1d1d1' : '#666666',
          callback: function(val: any, index: number) {
            return [weekDays[index].label, format(weekDays[index].date, 'M/d', { locale: ja })];
          }
        },
        border: {
          color: isDarkMode ? '#444444' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: (value: any) => {
            if (value === 0) return '0';
            if (value % 1 === 0) return `${value}h`;
            return null;
          },
          stepSize: 1,
          font: {
            size: 11,
          },
          color: isDarkMode ? '#d1d1d1' : '#666666'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        },
        border: {
          color: isDarkMode ? '#444444' : 'rgba(0, 0, 0, 0.1)'
        }
      },
    },
  }), [weekDays, isDarkMode]);

  // 科目ごとに色を割り当てる関数
  function getColorByIndex(index: number): string {
    const colors = [
      'rgba(59, 130, 246, 0.7)',  // blue
      'rgba(239, 68, 68, 0.7)',   // red
      'rgba(16, 185, 129, 0.7)',  // green
      'rgba(245, 158, 11, 0.7)',  // yellow
      'rgba(139, 92, 246, 0.7)',  // purple
      'rgba(251, 146, 60, 0.7)',  // orange
      'rgba(20, 184, 166, 0.7)',  // teal
      'rgba(217, 70, 239, 0.7)',  // fuchsia
    ];
    return colors[index % colors.length];
  }

  // 境界線の色
  function getBorderColorByIndex(index: number): string {
    const colors = [
      'rgba(59, 130, 246, 1)',  // blue
      'rgba(239, 68, 68, 1)',   // red
      'rgba(16, 185, 129, 1)',  // green
      'rgba(245, 158, 11, 1)',  // yellow
      'rgba(139, 92, 246, 1)',  // purple
      'rgba(251, 146, 60, 1)',  // orange
      'rgba(20, 184, 166, 1)',  // teal
      'rgba(217, 70, 239, 1)',  // fuchsia
    ];
    return colors[index % colors.length];
  }

  return (
    <div className={`rounded-lg shadow p-3 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Weekly Record</h3>
        <div className="text-sm font-medium">
          {weekOffset === 0 ? (
            <span className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              This Week
            </span>
          ) : (
            <button 
              onClick={goToCurrentWeek}
              className={`${isDarkMode ? 'text-blue-400' : 'text-blue-600'} underline`}
            >
              Back to This Week
            </button>
          )}
        </div>
      </div>
      
      {/* 週の表示と前後の週に移動するボタン */}
      <div className="flex justify-between items-center mb-2">
        <button 
          onClick={goToPreviousWeek}
          className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          aria-label="前の週"
        >
          <ChevronLeftIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        </button>
        
        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {getWeekRangeLabel()}
        </div>
        
        <button 
          onClick={goToNextWeek}
          className={`p-1 rounded-full ${weekOffset < 0 ? (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100') : (isDarkMode ? 'text-gray-700' : 'text-gray-300')} ${weekOffset < 0 ? '' : 'cursor-not-allowed opacity-50'}`}
          aria-label="次の週"
          disabled={weekOffset >= 0}
        >
          <ChevronRightIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
        </button>
      </div>
      
      {/* スワイプ可能なチャートエリア */}
      <div className="h-60 w-full" {...swipeHandlers}>
        <Bar options={options} data={chartData} />
      </div>
      
      {/* スワイプのヒント表示 */}
      <div className="text-center mt-2">
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          ← Swipe to Change Week →
        </p>
      </div>
    </div>
  );
} 