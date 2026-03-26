import { useState } from 'react';
import { Upload, message } from 'antd';
import type { UploadProps } from 'antd/es/upload/interface';
import { uploadService } from '../services/upload.service';
import type { SysUpload } from '../types/entities';

interface AvatarUploadProps {
  value?: string;
  onChange?: (url: string, file?: SysUpload) => void;
  disabled?: boolean;
}

export function AvatarUpload({ value, onChange, disabled }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false);

  const uploadProps: UploadProps = {
    name: 'file',
    showUploadList: false,
    disabled: disabled || uploading,
    accept: 'image/*',
    beforeUpload: async (file) => {
      setUploading(true);
      try {
        const result = await uploadService.upload(file, 'avatar');
        onChange?.(result.data.url, result.data);
        message.success('上传成功');
      } catch (error) {
        message.error('上传失败');
      } finally {
        setUploading(false);
      }
      return false;
    },
  };

  return (
    <Upload {...uploadProps}>
      <span style={{ color: '#1890ff', cursor: 'pointer' }}>
        {uploading ? '上传中...' : (value ? '更换头像' : '上传头像')}
      </span>
    </Upload>
  );
}
