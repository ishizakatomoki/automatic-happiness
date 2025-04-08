import { useState, useEffect, useCallback, useRef } from 'react';

// ローカルストレージのキー
const TIMER_START_KEY = 'timer_start_time';
const TIMER_RUNNING_KEY = 'timer_is_running';
const TIMER_LAST_TIME_KEY = 'timer_last_time';
const TIMER_CURRENT_KEY = 'timer_current_time';
const TIMER_BACKGROUND_TIME_KEY = 'timer_background_time'; // バックグラウンドに移行した時刻

export function useTimer() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [lastTime, setLastTime] = useState(0);
  
  // 無音オーディオ用の参照
  const audioContextRef = useRef<AudioContext | null>(null);
  const silentAudioRef = useRef<OscillatorNode | null>(null);
  const timeRef = useRef(0);
  
  // 現在の状態を参照に反映
  useEffect(() => {
    timeRef.current = time;
  }, [time]);

  // 初期化時にローカルストレージから状態を復元
  useEffect(() => {
    try {
      console.log('初期化: タイマー状態の復元を試みます');
      const savedStartTimeStr = localStorage.getItem(TIMER_START_KEY);
      const savedIsRunningStr = localStorage.getItem(TIMER_RUNNING_KEY);
      const savedLastTimeStr = localStorage.getItem(TIMER_LAST_TIME_KEY);
      const savedCurrentTimeStr = localStorage.getItem(TIMER_CURRENT_KEY);
      const savedBackgroundTimeStr = localStorage.getItem(TIMER_BACKGROUND_TIME_KEY);

      // 保存された値の検証を強化
      const savedIsRunning = savedIsRunningStr === 'true';
      
      const parsedLastTime = savedLastTimeStr ? parseInt(savedLastTimeStr, 10) : NaN;
      const savedLastTime = !isNaN(parsedLastTime) && Number.isFinite(parsedLastTime) ? parsedLastTime : 0;
      
      const parsedCurrentTime = savedCurrentTimeStr ? parseInt(savedCurrentTimeStr, 10) : NaN;
      const savedCurrentTime = !isNaN(parsedCurrentTime) && Number.isFinite(parsedCurrentTime) ? parsedCurrentTime : 0;
      
      console.log('初期化: 検証後の保存された状態', { savedIsRunning, savedLastTime, savedCurrentTime });
      
      if (savedIsRunning) {
        // バックグラウンド中の経過時間を計算
        let updatedTime = savedCurrentTime;
        
        if (savedBackgroundTimeStr) {
          const backgroundTime = new Date(savedBackgroundTimeStr);
          // backgroundTimeが有効な日付かチェック
          if (!isNaN(backgroundTime.getTime())) {
            const now = new Date();
            const backgroundElapsedSeconds = Math.floor((now.getTime() - backgroundTime.getTime()) / 1000);
            // 経過時間は負にならないようにする
            if (backgroundElapsedSeconds > 0) {
              updatedTime = savedCurrentTime + backgroundElapsedSeconds;
              console.log('初期化: バックグラウンド中の経過時間を加算', { backgroundElapsedSeconds, updatedTime });
            }
          } else {
            console.warn('初期化: 無効なbackgroundTimeが保存されていました:', savedBackgroundTimeStr);
          }
        }
        
        // 現在の時刻からスタート時間を逆算するのではなく、フォアグラウンド復帰時と同じロジックで再開
        const now = new Date();
        // setStartTime(new Date(now.getTime() - 1000)); // 古いロジック
        setStartTime(now); // 新しいロジック: 現在時刻を開始時刻とする
        setLastTime(updatedTime); // 新しいロジック: これまでの合計時間をlastTimeとする
        setTime(updatedTime);
        setIsRunning(true);
        
        // ローカルストレージも更新 (特にstartTime)
        localStorage.setItem(TIMER_START_KEY, now.toISOString());
        localStorage.setItem(TIMER_RUNNING_KEY, 'true');
        localStorage.setItem(TIMER_LAST_TIME_KEY, String(updatedTime));
        localStorage.setItem(TIMER_CURRENT_KEY, String(updatedTime));
        localStorage.removeItem(TIMER_BACKGROUND_TIME_KEY); // 復帰したので削除

        console.log('初期化: タイマーを再開しました', { time: updatedTime, isRunning: true });
      } else if (savedLastTime > 0) {
        console.log('初期化: 停止中のタイマー状態を復元', { lastTime: savedLastTime });
        setTime(savedLastTime);
        setLastTime(savedLastTime);
      }
    } catch (error) {
      console.error('初期化エラー:', error);
    }
  }, []);
  
  // バックグラウンド用の無音オーディオを開始
  const startSilentAudio = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      if (silentAudioRef.current) {
        silentAudioRef.current.stop();
        silentAudioRef.current.disconnect();
      }
      
      const oscillator = audioContextRef.current.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = 1;
      
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0.001;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      oscillator.start();
      
      silentAudioRef.current = oscillator;
      console.log('無音オーディオ開始');
    } catch (error) {
      console.error('無音オーディオ開始エラー:', error);
    }
  }, []);
  
  const stopSilentAudio = useCallback(() => {
    try {
      if (silentAudioRef.current) {
        silentAudioRef.current.stop();
        silentAudioRef.current.disconnect();
        silentAudioRef.current = null;
        console.log('無音オーディオ停止');
      }
    } catch (error) {
      console.error('無音オーディオ停止エラー:', error);
    }
  }, []);

  // ページの表示状態の変化を検知
  useEffect(() => {
    const handleVisibilityChange = () => {
      console.log('可視性変更:', document.hidden ? 'バックグラウンド' : 'フォアグラウンド');
      
      if (document.hidden) {
        // バックグラウンドに移行した時刻を保存
        const now = new Date();
        localStorage.setItem(TIMER_BACKGROUND_TIME_KEY, now.toISOString());
        console.log('バックグラウンドに移行:', { isRunning, time: timeRef.current, backgroundTime: now });
        
        if (isRunning && startTime) {
          // 現在の状態を保存
          localStorage.setItem(TIMER_START_KEY, startTime.toISOString());
          localStorage.setItem(TIMER_RUNNING_KEY, String(isRunning));
          localStorage.setItem(TIMER_LAST_TIME_KEY, String(lastTime));
          localStorage.setItem(TIMER_CURRENT_KEY, String(timeRef.current));
          console.log('タイマー状態を保存しました');
        }
      } else {
        // フォアグラウンドに復帰
        console.log('フォアグラウンドに復帰');
        
        try {
          const savedStartTimeStr = localStorage.getItem(TIMER_START_KEY);
          const savedIsRunningStr = localStorage.getItem(TIMER_RUNNING_KEY);
          const savedLastTimeStr = localStorage.getItem(TIMER_LAST_TIME_KEY);
          const savedCurrentTimeStr = localStorage.getItem(TIMER_CURRENT_KEY);
          const savedBackgroundTimeStr = localStorage.getItem(TIMER_BACKGROUND_TIME_KEY);
          
          // 保存された値の検証を強化
          const savedIsRunning = savedIsRunningStr === 'true';
          
          const parsedLastTime = savedLastTimeStr ? parseInt(savedLastTimeStr, 10) : NaN;
          const savedLastTime = !isNaN(parsedLastTime) && Number.isFinite(parsedLastTime) ? parsedLastTime : 0;
          
          const parsedCurrentTime = savedCurrentTimeStr ? parseInt(savedCurrentTimeStr, 10) : NaN;
          const savedCurrentTime = !isNaN(parsedCurrentTime) && Number.isFinite(parsedCurrentTime) ? parsedCurrentTime : 0;
          
          console.log('復帰時: 検証後の保存された状態:', { 
            savedIsRunning, 
            savedLastTime, 
            savedCurrentTime, 
            savedBackgroundTime: savedBackgroundTimeStr 
          });
          
          if (savedIsRunning) {
            console.log('タイマー実行中の状態を復元');
            
            // バックグラウンド中の経過時間を計算
            let updatedTime = savedCurrentTime;
            
            if (savedBackgroundTimeStr) {
              const backgroundTime = new Date(savedBackgroundTimeStr);
              // backgroundTimeが有効な日付かチェック
              if (!isNaN(backgroundTime.getTime())) {
                const now = new Date();
                const backgroundElapsedSeconds = Math.floor((now.getTime() - backgroundTime.getTime()) / 1000);
                // 経過時間は負にならないようにする
                if (backgroundElapsedSeconds > 0) {
                    updatedTime = savedCurrentTime + backgroundElapsedSeconds;
                    console.log('バックグラウンド中の経過時間を加算', { backgroundElapsedSeconds, updatedTime });
                }
              } else {
                 console.warn('復帰時: 無効なbackgroundTimeが保存されていました:', savedBackgroundTimeStr);
              }
            }
            
            // 新しい開始時間を設定（現在時刻からの逆算）
            const now = new Date();
            setStartTime(now);
            setLastTime(updatedTime);
            setTime(updatedTime);
            setIsRunning(true);
            
            // ローカルストレージを更新
            localStorage.setItem(TIMER_START_KEY, now.toISOString());
            localStorage.setItem(TIMER_RUNNING_KEY, 'true');
            localStorage.setItem(TIMER_LAST_TIME_KEY, String(updatedTime));
            localStorage.setItem(TIMER_CURRENT_KEY, String(updatedTime));
            localStorage.removeItem(TIMER_BACKGROUND_TIME_KEY); // 復帰したので削除
            
            // オーディオを再開
            if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
              audioContextRef.current.resume().catch(console.error);
            } else {
              startSilentAudio();
            }
            
            console.log('タイマーを再開しました', { time: updatedTime, isRunning: true });
          }
        } catch (error) {
          console.error('バックグラウンドからの復帰エラー:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning, startTime, lastTime, startSilentAudio]);

  // タイマーの実行
  useEffect(() => {
    let intervalId: number;

    if (isRunning) {
      console.log('タイマー実行開始', { startTime, lastTime });
      startSilentAudio();
      
      if (startTime) {
        localStorage.setItem(TIMER_START_KEY, startTime.toISOString());
        localStorage.setItem(TIMER_RUNNING_KEY, String(isRunning));
        localStorage.setItem(TIMER_LAST_TIME_KEY, String(lastTime));
        localStorage.setItem(TIMER_CURRENT_KEY, String(timeRef.current));
      }
      
      intervalId = window.setInterval(() => {
        try {
          if (startTime) {
            const now = new Date();
            const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            const newTime = elapsedSeconds + lastTime;
            setTime(newTime);
            timeRef.current = newTime;
            
            if (newTime % 10 === 0) {
              localStorage.setItem(TIMER_CURRENT_KEY, String(newTime));
              console.log('タイマー状態を定期保存:', newTime);
            }
          }
        } catch (error) {
          console.error('タイマー更新エラー:', error);
        }
      }, 1000);
    } else {
      console.log('タイマー停止');
      stopSilentAudio();
      
      localStorage.removeItem(TIMER_START_KEY);
      localStorage.removeItem(TIMER_BACKGROUND_TIME_KEY);
      localStorage.setItem(TIMER_RUNNING_KEY, 'false');
      localStorage.setItem(TIMER_LAST_TIME_KEY, String(timeRef.current));
      localStorage.setItem(TIMER_CURRENT_KEY, String(timeRef.current));
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log('タイマーインターバル停止');
      }
    };
  }, [isRunning, startTime, lastTime, startSilentAudio, stopSilentAudio]);

  // コンポーネントのアンマウント時に無音オーディオを確実に停止
  useEffect(() => {
    return () => {
      try {
        console.log('コンポーネントアンマウント: 片付け処理');
        stopSilentAudio();
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(console.error);
        }
        
        if (isRunning && startTime) {
          localStorage.setItem(TIMER_START_KEY, startTime.toISOString());
          localStorage.setItem(TIMER_RUNNING_KEY, String(isRunning));
          localStorage.setItem(TIMER_LAST_TIME_KEY, String(lastTime));
          localStorage.setItem(TIMER_CURRENT_KEY, String(timeRef.current));
          console.log('アンマウント時のタイマー状態を保存:', timeRef.current);
        }
      } catch (error) {
        console.error('アンマウント時のエラー:', error);
      }
    };
  }, [stopSilentAudio, isRunning, startTime, lastTime]);

  const start = useCallback(() => {
    try {
      console.log('タイマー開始');
      const now = new Date();
      setIsRunning(true);
      setStartTime(now);
      
      localStorage.setItem(TIMER_START_KEY, now.toISOString());
      localStorage.setItem(TIMER_RUNNING_KEY, 'true');
      localStorage.setItem(TIMER_LAST_TIME_KEY, String(lastTime));
      localStorage.setItem(TIMER_CURRENT_KEY, String(timeRef.current));
      localStorage.removeItem(TIMER_BACKGROUND_TIME_KEY);
      
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(console.error);
      }
    } catch (error) {
      console.error('タイマー開始エラー:', error);
    }
  }, [lastTime]);

  const pause = useCallback(() => {
    try {
      console.log('タイマー一時停止');
      setIsRunning(false);
      setLastTime(timeRef.current);
      
      localStorage.removeItem(TIMER_START_KEY);
      localStorage.removeItem(TIMER_BACKGROUND_TIME_KEY);
      localStorage.setItem(TIMER_RUNNING_KEY, 'false');
      localStorage.setItem(TIMER_LAST_TIME_KEY, String(timeRef.current));
      localStorage.setItem(TIMER_CURRENT_KEY, String(timeRef.current));
    } catch (error) {
      console.error('タイマー一時停止エラー:', error);
    }
  }, []);

  const reset = useCallback(() => {
    try {
      console.log('タイマーリセット');
      setTime(0);
      setLastTime(0);
      setIsRunning(false);
      setStartTime(null);
      timeRef.current = 0;
      stopSilentAudio();
      
      localStorage.removeItem(TIMER_START_KEY);
      localStorage.removeItem(TIMER_BACKGROUND_TIME_KEY);
      localStorage.setItem(TIMER_RUNNING_KEY, 'false');
      localStorage.setItem(TIMER_LAST_TIME_KEY, '0');
      localStorage.setItem(TIMER_CURRENT_KEY, '0');
    } catch (error) {
      console.error('タイマーリセットエラー:', error);
    }
  }, [stopSilentAudio]);

  const formatTime = useCallback((seconds: number) => {
    try {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const remainingSeconds = seconds % 60;

      return [hours, minutes, remainingSeconds]
        .map(val => val.toString().padStart(2, '0'))
        .join(':');
    } catch (error) {
      console.error('時間フォーマットエラー:', error);
      return '00:00:00';
    }
  }, []);

  return {
    time,
    isRunning,
    startTime,
    start,
    pause,
    reset,
    formatTime,
  };
} 