import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop, convertToPixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Modal, Button, message } from 'antd';
import { useDarkMode } from '../../hooks/useDarkMode';

interface ImageCropperProps {
  image: string;
  onCropComplete: (croppedImageUrl: string) => void;
  onCancel: () => void;
  aspectRatio?: number;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export const ImageCropper: React.FC<ImageCropperProps> = ({
  image,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
}) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [isModalVisible, setIsModalVisible] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const isDarkMode = useDarkMode(); // ダークモード検出

  // 画像の読み込み完了時に呼ばれる
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    console.log('トリミング元画像の読み込み完了:', width, 'x', height);
    
    // アスペクト比に合わせた初期クロップ領域を設定
    const initialCrop = centerAspectCrop(width, height, aspectRatio);
    setCrop(initialCrop);
    
    // PercentCropからPixelCropへの正しい変換
    if (imgRef.current) {
      const pixelCrop = convertToPixelCrop(
        initialCrop,
        imgRef.current.width,
        imgRef.current.height
      );
      setCompletedCrop(pixelCrop);
    }
  }, [aspectRatio]);

  // 最終的なトリミング処理（完全に書き直し）
  const cropImage = useCallback(async (): Promise<string | null> => {
    try {
      // バリデーション
      if (!imgRef.current || !completedCrop) {
        throw new Error('画像またはトリミング領域が選択されていません');
      }
      
      // 元画像の参照
      const img = imgRef.current;
      
      // スケール率を計算
      const scaleX = img.naturalWidth / img.width;
      const scaleY = img.naturalHeight / img.height;
      
      // キャンバスサイズを設定（実際のトリミングサイズを計算）
      const cropWidth = Math.round(completedCrop.width);
      const cropHeight = Math.round(completedCrop.height);
      
      // 画面に表示されたサイズと実際の画像サイズを考慮
      const naturalCropX = Math.round(completedCrop.x * scaleX);
      const naturalCropY = Math.round(completedCrop.y * scaleY);
      const naturalCropWidth = Math.round(completedCrop.width * scaleX);
      const naturalCropHeight = Math.round(completedCrop.height * scaleY);
      
      console.log('トリミング処理開始', { 
        表示サイズ: `${img.width}x${img.height}`,
        実際のサイズ: `${img.naturalWidth}x${img.naturalHeight}`,
        トリミング座標: `(${completedCrop.x}, ${completedCrop.y})`,
        トリミングサイズ: `${cropWidth}x${cropHeight}`,
        実トリミング座標: `(${naturalCropX}, ${naturalCropY})`,
        実トリミングサイズ: `${naturalCropWidth}x${naturalCropHeight}` 
      });
      
      // キャンバスを作成して描画
      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('キャンバスコンテキストを取得できませんでした');
      }
      
      // 背景を白にする（透明対策）
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // オフスクリーンキャンバスを利用して描画（品質改善）
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = naturalCropWidth;
      offscreenCanvas.height = naturalCropHeight;
      
      const offscreenCtx = offscreenCanvas.getContext('2d');
      if (!offscreenCtx) {
        throw new Error('オフスクリーンキャンバスコンテキストを取得できませんでした');
      }
      
      // 元画像からトリミング部分を切り出し
      offscreenCtx.drawImage(
        img,
        naturalCropX, naturalCropY, naturalCropWidth, naturalCropHeight,
        0, 0, naturalCropWidth, naturalCropHeight
      );
      
      // 切り出した画像をメインキャンバスに描画
      ctx.drawImage(
        offscreenCanvas,
        0, 0, naturalCropWidth, naturalCropHeight,
        0, 0, cropWidth, cropHeight
      );
      
      // Base64形式に変換
      const quality = 0.9; // 高品質
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      
      // 結果のサイズを確認
      const sizeKB = Math.round(dataUrl.length / 1024);
      console.log(`トリミング完了: ${sizeKB}KB`);
      
      return dataUrl;
    } catch (error) {
      console.error('画像のトリミング処理中にエラーが発生しました:', error);
      return null;
    }
  }, [completedCrop]);

  // 完了ボタンクリック時の処理
  const handleComplete = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // トリミング領域チェック
      if (!completedCrop || !completedCrop.width || !completedCrop.height) {
        alert('トリミング領域を選択してください');
        setIsLoading(false);
        return;
      }
      
      console.log('トリミング実行中...');
      const croppedImageUrl = await cropImage();
      
      if (!croppedImageUrl) {
        throw new Error('トリミング処理に失敗しました');
      }
      
      // 成功したら親コンポーネントに通知
      console.log('トリミング成功、親コンポーネントに通知します');
      onCropComplete(croppedImageUrl);
    } catch (error) {
      console.error('トリミング完了処理エラー:', error);
      alert(`画像処理中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    } finally {
      setIsLoading(false);
    }
  }, [completedCrop, cropImage, onCropComplete]);

  // キャンセルボタンクリック時の処理
  const handleCancel = () => {
    setIsModalVisible(false);
    onCancel();
  };

  // モーダルが閉じられたときの処理
  useEffect(() => {
    return () => {
      if (imgRef.current) {
        imgRef.current = null;
      }
    };
  }, []);

  // ダークモード用のモーダルスタイル
  const getModalStyle = () => {
    return {
      bodyStyle: {
        padding: '20px',
        background: isDarkMode ? '#1f1f1f' : '#fff',
        color: isDarkMode ? '#f0f0f0' : undefined,
      },
      style: { top: 20 },
      maskStyle: {
        background: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : undefined
      },
      headStyle: {
        background: isDarkMode ? '#1f1f1f' : undefined,
        color: isDarkMode ? '#f0f0f0' : undefined,
        borderBottom: isDarkMode ? '1px solid #333' : undefined
      },
      footerStyle: {
        background: isDarkMode ? '#1f1f1f' : undefined,
        borderTop: isDarkMode ? '1px solid #333' : undefined
      },
      className: isDarkMode ? 'dark-mode-modal' : undefined
    };
  };

  return (
    <Modal
      title="画像をトリミング"
      open={isModalVisible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button 
          key="back" 
          onClick={handleCancel}
          style={{
            background: isDarkMode ? '#333' : undefined,
            color: isDarkMode ? '#f0f0f0' : undefined,
            borderColor: isDarkMode ? '#555' : undefined
          }}
        >
          キャンセル
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          onClick={handleComplete} 
          loading={isLoading}
        >
          トリミングして使用
        </Button>,
      ]}
      {...getModalStyle()}
    >
      <div style={{ textAlign: 'center' }}>
        <div 
          style={{ 
            marginBottom: 16, 
            color: isDarkMode ? '#d9d9d9' : undefined,
            fontSize: '0.9rem'
          }}
        >
          ドラッグして範囲を選択し、「トリミングして使用」をクリックしてください
        </div>
        <div style={{ maxHeight: '60vh', overflow: 'auto', margin: '0 auto' }}>
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => {
              console.log('トリミング領域選択:', c);
              setCompletedCrop(c);
            }}
            aspect={aspectRatio}
            className={isDarkMode ? 'dark-mode-crop' : ''}
          >
            <img
              ref={imgRef}
              src={image}
              alt="トリミング対象"
              onLoad={onImageLoad}
              style={{ maxWidth: '100%' }}
            />
          </ReactCrop>
        </div>
        <div 
          style={{ 
            marginTop: 16, 
            fontSize: '0.8rem', 
            color: isDarkMode ? '#aaa' : 'gray' 
          }}
        >
          ※ 四角い枠の中が保存される領域です<br />
          枠のサイズを調整するには、枠の端をドラッグしてください
        </div>
      </div>
    </Modal>
  );
}; 