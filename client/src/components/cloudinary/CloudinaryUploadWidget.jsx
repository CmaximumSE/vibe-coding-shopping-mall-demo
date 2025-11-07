import { useEffect, useRef } from 'react';
import { CLOUDINARY_CONFIG } from '../../config/cloudinary';

const CloudinaryUploadWidget = ({ onUpload, multiple = true, maxFiles = 5 }) => {
  const cloudinaryRef = useRef();
  const widgetRef = useRef();
  const onUploadRef = useRef(onUpload);

  useEffect(() => {
    onUploadRef.current = onUpload;
  }, [onUpload]);

  useEffect(() => {
    // Cloudinary 스크립트 로드
    const script = document.createElement('script');
    script.src = 'https://upload-widget.cloudinary.com/global/all.js';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      cloudinaryRef.current = window.cloudinary;
      
      // 설정 값 확인을 위한 로그
      console.log('Cloudinary Config:', CLOUDINARY_CONFIG);
      console.log('Cloud Name:', CLOUDINARY_CONFIG.cloudName);
      console.log('Upload Preset:', CLOUDINARY_CONFIG.uploadPreset);
      
      // 위젯 설정
      const options = {
        cloudName: CLOUDINARY_CONFIG.cloudName,
        uploadPreset: CLOUDINARY_CONFIG.uploadPreset,
        sources: ['local', 'url', 'camera'],
        multiple: multiple,
        maxFiles: Math.min(maxFiles, CLOUDINARY_CONFIG.maxFiles),
        cropping: true,
        croppingAspectRatio: 1,
        croppingShowDimensions: true,
        folder: CLOUDINARY_CONFIG.folder,
        resourceType: 'image',
        clientAllowedFormats: CLOUDINARY_CONFIG.allowedFormats,
        maxImageFileSize: CLOUDINARY_CONFIG.maxFileSize,
        theme: 'minimal',
        text: {
          en: {
            menu: {
              files: '파일',
              web: '웹',
              camera: '카메라',
              dropbox: 'Dropbox',
              gdrive: 'Google Drive'
            },
            buttons: {
              cancel: '취소',
              upload: '업로드',
              close: '닫기'
            },
            dragAndDrop: {
              dragAndDrop: '이미지를 여기에 드래그하거나',
              or: '또는',
              browse: '클릭하여 선택',
              dropPasteBoth: '이미지를 여기에 드래그하거나 붙여넣기',
              dropPasteFiles: '파일을 여기에 드래그하거나 붙여넣기',
              dropPasteImportBoth: '이미지를 여기에 드래그하거나, 붙여넣기, 또는 가져오기',
              dropPasteImportFiles: '파일을 여기에 드래그하거나, 붙여넣기, 또는 가져오기'
            },
            errors: {
              fileSize: '파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.',
              fileType: '지원되지 않는 파일 형식입니다. JPG, PNG, GIF, WebP만 지원됩니다.',
              maxFiles: `최대 ${maxFiles}개의 파일만 업로드할 수 있습니다.`
            }
          }
        }
      };

      // 위젯 생성
      const previousActiveElement = document.activeElement;

      widgetRef.current = cloudinaryRef.current.createUploadWidget(
        options,
        (error, result) => {
          console.log('Upload result:', { error, result });
          
          if (error) {
            console.error('Upload error:', error);
            alert(`업로드 실패: ${error.message || '알 수 없는 오류가 발생했습니다.'}`);
            return;
          }
          
          if (result && result.event === 'success' && onUploadRef.current) {
            const uploadedImage = result.info.secure_url;
            console.log('Upload successful:', uploadedImage);
            onUploadRef.current(uploadedImage);
          } else if (result && result.event === 'error') {
            console.error('Upload failed:', result);
            alert(`업로드 실패: ${result.error?.message || '알 수 없는 오류가 발생했습니다.'}`);
          }
        }
      );

      if (previousActiveElement?.focus) {
        setTimeout(() => {
          previousActiveElement.focus();
          if (previousActiveElement instanceof HTMLInputElement || previousActiveElement instanceof HTMLTextAreaElement) {
            const length = previousActiveElement.value?.length ?? 0;
            previousActiveElement.setSelectionRange?.(length, length);
          }
        }, 0);
      }
    };

    return () => {
      // 컴포넌트 언마운트 시 정리
      if (widgetRef.current) {
        widgetRef.current.close();
      }
    };
  }, [multiple, maxFiles]);

  const openWidget = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    }
  };

  return (
    <button
      type="button"
      onClick={openWidget}
      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center text-gray-600"
    >
      <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
      </svg>
      <span className="text-sm font-medium">이미지 업로드</span>
      <span className="text-xs text-gray-500 mt-1">
        클릭하여 이미지를 선택하거나 드래그하여 업로드
      </span>
    </button>
  );
};

export default CloudinaryUploadWidget;
