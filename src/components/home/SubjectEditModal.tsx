import React, { useState, useEffect, useRef } from 'react';
import { Modal, Button, Input, Form, theme } from 'antd';
import { PlusOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { Subject } from '../../types';
import { storage } from '../../utils/storage';
import { useAppContext } from '../../contexts/AppContext';
import { ImageCropper } from '../common/ImageCropper';
import { useDarkMode } from '../../hooks/useDarkMode';

interface SubjectEditModalProps {
  open: boolean;
  onClose: () => void;
  subject?: Subject;
  isEdit?: boolean;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB制限

const SubjectEditModal: React.FC<SubjectEditModalProps> = ({
  open,
  onClose,
  subject,
  isEdit = false,
}) => {
  const { dispatch } = useAppContext();
  const [form] = Form.useForm();
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('/default-subject.png');
  const [isLoading, setIsLoading] = useState(false);
  const [imageKey, setImageKey] = useState<number>(0); // 画像再描画用
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const isDarkMode = useDarkMode(); // ダークモード検出
  const { token } = theme.useToken(); // Antdのテーマ
  
  console.log('SubjectEditModal レンダリング', { imageUrl: imageUrl?.substring(0, 30) + '...', imageKey });

  // 初期値の設定
  useEffect(() => {
    if (open && subject) {
      setName(subject.name);
      
      // 科目データが読み込まれたら、その画像URLを設定
      if (subject.imageUrl) {
        console.log(`科目「${subject.name}」の画像をセット:`, subject.imageUrl.substring(0, 30) + '...');
        setImageUrl(subject.imageUrl);
        setImageKey(prev => prev + 1); // 画像の再描画を強制
      } else {
        setImageUrl('/default-subject.png');
      }
    } else {
      // 新規作成の場合はリセット
      setName('');
      setImageUrl('/default-subject.png');
      setImageError(null);
    }
  }, [open, subject]);

  // 画像アップロード処理
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // ファイルサイズチェック
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError(`画像サイズが大きすぎます（${(file.size / 1024 / 1024).toFixed(2)}MB）。5MB以下にしてください。`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setImageError(null);
    
    // 画像ファイルを読み込んでトリミングモードへ
    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target?.result) {
        const result = event.target.result as string;
        console.log(`画像ファイル読み込み完了: ${(result.length / 1024).toFixed(2)}KB`);
        
        // トリミングモードに入る
        setCropImageSrc(result);
      } else {
        setImageError('画像の読み込みに失敗しました');
      }
    };
    
    reader.onerror = () => {
      console.error('画像の読み込み中にエラーが発生しました');
      setImageError('画像の読み込みに失敗しました。もう一度お試しください。');
    };
    
    reader.readAsDataURL(file);
  };

  // トリミング完了時の処理
  const handleCropComplete = (croppedImageUrl: string) => {
    console.log('トリミング完了: 画像サイズ', Math.round(croppedImageUrl.length / 1024), 'KB');
    
    // トリミングモードを終了
    setCropImageSrc(null);
    
    try {
      // 画像のサイズチェック（5MB以上の場合は警告）
      if (croppedImageUrl.length > MAX_IMAGE_SIZE) {
        setImageError(`トリミング後の画像サイズが大きすぎます（${Math.round(croppedImageUrl.length / 1024 / 1024)}MB）。もっと小さくトリミングしてください。`);
        return;
      }
      
      // 画像URLを更新して即時反映
      setImageUrl(croppedImageUrl);
      console.log('画像URL更新完了');
      
      // キーを更新して強制再描画
      setImageKey(prev => prev + 1);
    } catch (e) {
      console.error('トリミング画像の適用エラー:', e);
      setImageError('画像の処理中にエラーが発生しました。もう一度お試しください。');
    }
    
    // 入力フィールドをリセット
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // トリミングキャンセル時の処理
  const handleCropCancel = () => {
    setCropImageSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 画像削除時の処理
  const handleRemoveImage = () => {
    setImageUrl('/default-subject.png');
    setImageKey(k => k + 1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setImageError(null);
  };

  // 保存処理
  const saveSubject = async () => {
    if (!name.trim()) {
      Modal.error({ title: 'エラー', content: '科目名を入力してください' });
      return;
    }
    
    // トリミング中の場合は保存できないようにする
    if (cropImageSrc) {
      Modal.warning({ 
        title: '画像処理中', 
        content: '画像のトリミングを完了してから保存してください' 
      });
      return;
    }
    
    console.log('保存処理開始 - 画像URL:', imageUrl?.substring(0, 30) + '...');
    setIsLoading(true);
    
    try {
      // 科目データを作成
      const subjectData: Subject = {
        id: isEdit && subject ? subject.id : Date.now().toString(),
        name: name.trim(),
        // imageUrlを確実に処理
        imageUrl: imageUrl || '/default-subject.png',
      };
      
      console.log(`科目「${name}」を${isEdit ? '更新' : '作成'}します:`, {
        id: subjectData.id,
        name: subjectData.name,
        imageUrlSize: Math.round((subjectData.imageUrl || '').length / 1024) + 'KB'
      });
      
      // LocalStorageに保存
      if (isEdit && subject) {
        await storage.updateSubject(subjectData);
        console.log('updateSubject 完了');
        dispatch({ type: 'UPDATE_SUBJECT', payload: subjectData });
        console.log('dispatch 完了');
      } else {
        await storage.addSubject(subjectData);
        console.log('addSubject 完了');
        dispatch({ type: 'ADD_SUBJECT', payload: subjectData });
        console.log('dispatch 完了');
      }
      
      console.log('保存処理完了 - モーダルを閉じます');
      
      // 保存成功後にモーダルを閉じる
      onClose();
    } catch (error) {
      console.error('科目の保存中にエラーが発生しました:', error);
      Modal.error({ 
        title: '保存エラー', 
        content: `科目の保存中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 画像プレビュー用のコンポーネント
  const ImagePreview = () => (
    <div style={{ position: 'relative', marginBottom: 16, width: 150, height: 150 }}>
      <img
        key={`img-${imageKey}`}
        src={imageUrl}
        alt={name || '科目画像'}
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'cover',
          borderRadius: '8px',
          border: isDarkMode ? '1px solid #333' : '1px solid #eee'
        }}
        onError={(e) => {
          console.error('画像の表示エラー:', e);
          setImageError('画像の表示に失敗しました。デフォルト画像を使用します。');
          setImageUrl('/default-subject.png');
          setImageKey(prev => prev + 1);
        }}
      />
      {imageUrl !== '/default-subject.png' && (
        <Button
          icon={<CloseCircleOutlined />}
          style={{
            position: 'absolute',
            top: -10,
            right: -10,
            borderRadius: '50%',
            background: isDarkMode ? '#333' : '#fff',
            color: isDarkMode ? '#fff' : undefined
          }}
          size="small"
          onClick={handleRemoveImage}
        />
      )}
    </div>
  );

  // ダークモード用のモーダルスタイル
  const getModalStyle = () => {
    return {
      bodyStyle: {
        background: isDarkMode ? '#1f1f1f' : undefined,
        color: isDarkMode ? '#f0f0f0' : undefined,
      },
      style: { 
        top: 20,
      },
      maskStyle: {
        background: isDarkMode ? 'rgba(0, 0, 0, 0.8)' : undefined
      },
      // ヘッダーと外枠スタイルを追加
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
    <>
      <Modal
        title={isEdit ? '科目を編集' : '新しい科目'}
        open={open && !cropImageSrc}
        onCancel={onClose}
        footer={[
          <Button 
            key="cancel" 
            onClick={onClose}
            style={{
              background: isDarkMode ? '#333' : undefined,
              color: isDarkMode ? '#f0f0f0' : undefined,
              borderColor: isDarkMode ? '#555' : undefined
            }}
          >
            キャンセル
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={saveSubject} 
            loading={isLoading}
          >
            保存
          </Button>,
        ]}
        {...getModalStyle()}
      >
        <Form 
          form={form} 
          layout="vertical"
          style={{
            color: isDarkMode ? '#f0f0f0' : undefined
          }}
        >
          <Form.Item 
            label={<span style={{ color: isDarkMode ? '#d9d9d9' : undefined }}>科目名</span>} 
            required
          >
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="科目名を入力"
              style={{
                background: isDarkMode ? '#333' : undefined,
                color: isDarkMode ? '#f0f0f0' : undefined,
                borderColor: isDarkMode ? '#555' : undefined
              }}
            />
          </Form.Item>
          <Form.Item label={<span style={{ color: isDarkMode ? '#d9d9d9' : undefined }}>画像</span>}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ImagePreview />
              
              {imageError && (
                <div style={{ color: 'red', marginBottom: 8 }}>{imageError}</div>
              )}
              
              <Button
                icon={<PlusOutlined />}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: isDarkMode ? '#333' : undefined,
                  color: isDarkMode ? '#f0f0f0' : undefined,
                  borderColor: isDarkMode ? '#555' : undefined
                }}
              >
                画像を選択
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                accept="image/png, image/jpeg, image/gif"
              />
              <div style={{ 
                fontSize: '0.8rem', 
                color: isDarkMode ? '#aaa' : 'gray', 
                marginTop: 8, 
                textAlign: 'center' 
              }}>
                ※ PNG, JPEG, GIF形式、5MB以下の画像を選択してください<br />
                画像はトリミングして使用できます<br />
                何も選択しない場合はデフォルト画像が使用されます
              </div>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* トリミングモード */}
      {cropImageSrc && (
        <ImageCropper
          image={cropImageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspectRatio={1}
        />
      )}
    </>
  );
};

export default SubjectEditModal; 