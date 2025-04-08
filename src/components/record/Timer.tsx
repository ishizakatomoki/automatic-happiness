import React, { useState } from 'react';
import { useTimer } from '../../hooks/useTimer';
import { useDarkMode } from '../../hooks/useDarkMode';

interface TimerProps {
  onRecordTime: (duration: number) => void;
}

// iOS風のアラートコンポーネント
interface AlertProps {
  title: string;
  message?: string;
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function IOSAlert({ title, message, cancelText = "キャンセル", confirmText = "はい", onCancel, onConfirm }: AlertProps) {
  const isDarkMode = useDarkMode();
  
  // 画面をタップした時にキャンセル処理
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };
  
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(5px)'
      }}
      onClick={handleBackdropClick}
    >
      <div 
        className="rounded-xl overflow-hidden shadow-xl"
        style={{
          backgroundColor: isDarkMode ? 'rgba(40, 40, 40, 0.85)' : 'rgba(250, 250, 250, 0.85)',
          width: '270px',
          backdropFilter: 'blur(10px)'
        }}
      >
        {/* アラートタイトルとメッセージ */}
        <div className="px-4 pt-4 pb-2 text-center">
          <h3 
            className="font-bold text-lg mb-1"
            style={{ color: isDarkMode ? 'white' : 'black' }}
          >
            {title}
          </h3>
          {message && (
            <p 
              className="text-sm"
              style={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)' }}
            >
              {message}
            </p>
          )}
        </div>
        
        {/* アラートボタン */}
        <div className="border-t" style={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)' }}>
          <div className="flex">
            <button
              className="flex-1 py-3 text-center font-medium border-r text-red-500"
              style={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)' }}
              onClick={onCancel}
            >
              {cancelText}
            </button>
            <button
              className="flex-1 py-3 text-center font-medium text-blue-500"
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 数字を個別に表示するコンポーネント
function DigitDisplay({ value, separator }: { value: string, separator?: boolean }) {
  const isDarkMode = useDarkMode();
  
  return (
    <div 
      style={{ 
        width: separator ? '10px' : '40px',  // ここで幅を調整
        textAlign: 'center',
        color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
      }}
    >
      {value}
    </div>
  );
}

export function Timer({ onRecordTime }: TimerProps) {
  const { time, isRunning, start, pause, reset, formatTime } = useTimer();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const isDarkMode = useDarkMode(); // ダークモード検出

  const handlePause = () => {
    pause();
  };

  const handleRecord = () => {
    console.log("Record button clicked. Time:", time, "isRunning:", isRunning);
    
    if (time > 0) {
      // タイマーが動作中なら停止
      if (isRunning) {
        pause();
      }
      
      // アラートを表示
      setShowAlert(true);
    }
  };
  
  // アラートの確認ボタンが押された時の処理
  const handleConfirmRecord = () => {
    try {
      // 時間を記録
      onRecordTime(time);
      
      // 記録後にタイマーをリセット
      console.log("タイマーをリセットします");
      reset();
      
      // アラートを閉じる
      setShowAlert(false);
    } catch (error) {
      console.error("Error recording time:", error);
    }
  };
  
  // アラートのキャンセルボタンが押された時の処理
  const handleCancelRecord = () => {
    setShowAlert(false);
  };

  // ダークモード対応のスタイル
  const getButtonStyle = (isActive: boolean, isPrimary: boolean) => {
    if (isDarkMode) {
      // ダークモード時のスタイル
      return isActive 
        ? (isPrimary ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200')
        : 'bg-gray-800 text-gray-500';
    } else {
      // ライトモード時のスタイル
      return isActive
        ? (isPrimary ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800')
        : 'bg-gray-200 text-gray-400';
    }
  };
  
  // タイマーの数字を分割して表示
  const renderDigits = () => {
    const timeStr = formatTime(time);
    
    // formatTimeの結果を検証し、不正な場合はデフォルト表示
    if (typeof timeStr !== 'string' || !/^[0-9]{2}:[0-9]{2}:[0-9]{2}$/.test(timeStr)) {
        console.warn('Invalid time format received:', timeStr);
        return (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center',
              width: '280px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
              fontWeight: 250,
              fontSize: '70px', 
              letterSpacing: '10px',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'
            }}>
             00:00:00
            </div>
        );
    }
    
    const parts = timeStr.split(':');
    // split結果の検証 (通常は上記regexで保証されるが一応)
    if (parts.length !== 3 || parts.some(part => part.length !== 2)) {
        console.error('Unexpected split result:', parts);
        // ここでもデフォルト表示を返す（またはエラー表示）
        return <div>Error</div>;
    }
    const [hours, minutes, seconds] = parts;
    
    return (
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'center',
          width: '280px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
          fontWeight: 250,
          fontSize: '70px', // フォントサイズを少し調整
          letterSpacing: '10px', // 文字間隔を少し詰める
        }}
      >
        {/* 時間の数字グループ */}
        <div style={{ display: 'flex', marginRight: '2px' }}>
          <DigitDisplay value={hours[0]} />
          <DigitDisplay value={hours[1]} />
        </div>
        
        <DigitDisplay value=":" separator />
        
        {/* 分の数字グループ */}
        <div style={{ display: 'flex', margin: '0 2px' }}>
          <DigitDisplay value={minutes[0]} />
          <DigitDisplay value={minutes[1]} />
        </div>
        
        <DigitDisplay value=":" separator />
        
        {/* 秒の数字グループ */}
        <div style={{ display: 'flex', marginLeft: '2px' }}>
          <DigitDisplay value={seconds[0]} />
          <DigitDisplay value={seconds[1]} />
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-10" style={{ width: '280px' }}>
        {/* タイマー数字 - 数字を個別に固定配置 */}
        <div 
          className="flex justify-center items-center"
          style={{ 
            width: '280px', 
            minHeight: '180px', 
            marginTop: '-20px', // 上部余白を追加
            marginBottom: '60px' // 下部余白を調整
          }}
        >
          {renderDigits()}
        </div>
        <div className="flex flex-col space-y-4 w-full px-0">
          <button
            onClick={isRunning ? handlePause : start}
            className={`w-full py-3 rounded-full font-medium text-lg transition-colors ${
              getButtonStyle(true, !isRunning)
            }`}
            style={{ width: '280px', minWidth: '280px' }}
          >
            {isRunning ? "Pause" : "Start"}
          </button>
          
          <button
            onClick={handleRecord}
            disabled={time === 0}
            className={`w-full py-3 rounded-full font-medium text-lg transition-colors ${
              getButtonStyle(time > 0, true)
            }`}
            style={{ width: '280px', minWidth: '280px' }}
          >
            Record
          </button>
        </div>
      </div>
      
      {/* iOS風アラート */}
      {showAlert && (
        <IOSAlert
          title="学習を終了しますか？"
          message="学習時間が記録されます。"
          onCancel={handleCancelRecord}
          onConfirm={handleConfirmRecord}
        />
      )}
    </>
  );
} 