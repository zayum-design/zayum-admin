import { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  message,
  Tag,
  Select,
  Input,
  Popconfirm,
} from 'antd';
import { DeleteOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { uploadService, type QueryUploadDto } from '../../../services/upload.service';
import type { SysUpload } from '../../../types/entities';

const { Option } = Select;

export default function FileManagement() {
  const [data, setData] = useState<SysUpload[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [query, setQuery] = useState<QueryUploadDto>({
    page: 1,
    pageSize: 10,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await uploadService.list(query);
      setData(result.data.list);
      setPagination({
        current: result.data.pagination.page,
        pageSize: result.data.pagination.pageSize,
        total: result.data.pagination.total,
      });
    } catch (error) {
      message.error('获取文件列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [query]);

  const handleTableChange = (pag: any) => {
    setQuery((prev) => ({
      ...prev,
      page: pag.current,
      pageSize: pag.pageSize,
    }));
  };

  const handleDelete = async (id: number) => {
    try {
      await uploadService.remove(id);
      message.success('删除成功');
      fetchData();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) return;
    try {
      await uploadService.batchRemove(selectedRowKeys as number[]);
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      fetchData();
    } catch (error) {
      message.error('批量删除失败');
    }
  };

  const formatFileSize = (size: number) => {
    if (size < 1024) return size + ' B';
    if (size < 1024 * 1024) return (size / 1024).toFixed(2) + ' KB';
    return (size / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getFileTypeColor = (ext: string) => {
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const docExts = ['doc', 'docx', 'pdf', 'xls', 'xlsx', 'ppt', 'pptx'];
    if (imageExts.includes(ext.toLowerCase())) return 'blue';
    if (docExts.includes(ext.toLowerCase())) return 'green';
    return 'default';
  };

  const getFileUrl = (record: SysUpload) => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    return baseURL + record.url;
  };

  const handlePreview = (record: SysUpload) => {
    const url = getFileUrl(record);
    window.open(url, '_blank');
  };

  const handleDownload = (record: SysUpload) => {
    const url = getFileUrl(record);
    const a = document.createElement('a');
    a.href = url;
    a.download = record.filename;
    a.click();
  };

  const columns: ColumnsType<SysUpload> = [
    {
      title: '文件名称',
      dataIndex: 'filename',
      key: 'filename',
      width: 200,
      ellipsis: true,
    },
    {
      title: '文件类型',
      dataIndex: 'fileExt',
      key: 'fileExt',
      width: 100,
      render: (ext: string) => <Tag color={getFileTypeColor(ext)}>{ext.toUpperCase()}</Tag>,
    },
    {
      title: '文件大小',
      dataIndex: 'filesize',
      key: 'filesize',
      width: 100,
      render: (size: number) => formatFileSize(size),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
    },
    {
      title: '上传者',
      dataIndex: 'userType',
      key: 'userType',
      width: 80,
      render: (type: string) => (type === 'admin' ? '管理员' : '用户'),
    },
    {
      title: 'MIME类型',
      dataIndex: 'mimetype',
      key: 'mimetype',
      width: 150,
      ellipsis: true,
    },
    {
      title: '上传时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => handlePreview(record)}
          >
            预览
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            size="small"
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
          <Popconfirm
            title="确认删除"
            description="删除后无法恢复，是否确认删除？"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="文件类型"
            allowClear
            style={{ width: 120 }}
            onChange={(val) => setQuery((prev) => ({ ...prev, extension: val }))}
          >
            <Option value="jpg">JPG</Option>
            <Option value="png">PNG</Option>
            <Option value="pdf">PDF</Option>
            <Option value="doc">DOC</Option>
            <Option value="xlsx">XLSX</Option>
          </Select>
          <Select
            placeholder="上传者"
            allowClear
            style={{ width: 100 }}
            onChange={(val) => setQuery((prev) => ({ ...prev, userType: val }))}
          >
            <Option value="admin">管理员</Option>
            <Option value="user">用户</Option>
          </Select>
          <Input.Search
            placeholder="搜索文件名"
            style={{ width: 200 }}
            onSearch={(val) => setQuery((prev) => ({ ...prev, filename: val || undefined }))}
          />
          <Popconfirm
            title="确认批量删除"
            description={`将删除选中的 ${selectedRowKeys.length} 个文件`}
            onConfirm={handleBatchDelete}
            okText="确认"
            cancelText="取消"
            disabled={selectedRowKeys.length === 0}
          >
            <Button danger icon={<DeleteOutlined />} disabled={selectedRowKeys.length === 0}>
              批量删除
            </Button>
          </Popconfirm>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        rowSelection={rowSelection}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />
    </div>
  );
}
