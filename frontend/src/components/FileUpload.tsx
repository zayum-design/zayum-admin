import { useState } from 'react';
import { Upload, message } from 'antd';
import type { UploadProps } from 'antd/es/upload/interface';
import { uploadService } from '../services/upload.service';
import type { SysUpload } from '../types/entities';

interface FileUploadProps {
  value?: string;
  onChange?: (url: string, file?: SysUpload) => void;
  category?: string;
  disabled?: boolean;
}

export function FileUpload({ value, onChange, category = 'attachment', disabled }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);

  const uploadProps: UploadProps = {
    name: 'file',
    showUploadList: false,
    disabled: disabled || uploading,
    beforeUpload: async (file) => {
      setUploading(true);
      try {
        const result = await uploadService.upload(file, category);
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
      <span style={{ color: value ? '#52c41a' : '#1890ff', cursor: 'pointer' }}>
        {value || (disabled ? '已上传' : '点击上传')}
      </span>
    </Upload>
  );
}
