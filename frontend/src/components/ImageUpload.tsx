import { useState } from 'react';
import { Upload, Modal, Image as ImageAnt, message } from 'antd';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { PlusOutlined } from '@ant-design/icons';
import { uploadService } from '../services/upload.service';
import type { SysUpload } from '../types/entities';

interface ImageUploadProps {
  value?: string[];
  onChange?: (urls: string[], files?: SysUpload[]) => void;
  category?: string;
  maxCount?: number;
  disabled?: boolean;
}

export function ImageUpload({
  value = [],
  onChange,
  category = 'image',
  maxCount = 9,
  disabled,
}: ImageUploadProps) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [uploading, setUploading] = useState(false);

  const fileList: UploadFile[] = value.map((url, index) => ({
    uid: String(index),
    name: url.split('/').pop() || 'image',
    status: 'done',
    url,
  }));

  const uploadProps: UploadProps = {
    name: 'file',
    listType: 'picture-card',
    fileList: disabled ? fileList : undefined,
    disabled,
    accept: 'image/*',
    maxCount,
    beforeUpload: async (file) => {
      if (value.length >= maxCount) {
        message.warning(`最多只能上传 ${maxCount} 个文件`);
        return false;
      }
      setUploading(true);
      try {
        const result = await uploadService.upload(file, category);
        const newUrls = [...value, result.data.url];
        const newFiles = result.data;
        onChange?.(newUrls, [newFiles]);
        message.success('上传成功');
      } catch (error) {
        message.error('上传失败');
      } finally {
        setUploading(false);
      }
      return false;
    },
    onRemove: () => {
      return true;
    },
  };

  const handlePreview = async (file: UploadFile) => {
    setPreviewImage(file.url || '');
    setPreviewOpen(true);
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    if (disabled) return;
    const urls = newFileList
      .filter((f) => f.status === 'done')
      .map((f) => f.url || '')
      .filter(Boolean);
    onChange?.(urls);
  };

  const uploadButton = !disabled && (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>上传</div>
    </div>
  );

  return (
    <>
      <Upload
        {...uploadProps}
        fileList={disabled ? [] : fileList}
        onPreview={handlePreview}
        onChange={handleChange}
      >
        {!disabled && fileList.length < maxCount && !uploading && uploadButton}
      </Upload>
      <Modal open={previewOpen} footer={null} onCancel={() => setPreviewOpen(false)}>
        <ImageAnt src={previewImage} style={{ width: '100%' }} />
      </Modal>
    </>
  );
}
