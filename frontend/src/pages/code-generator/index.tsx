import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Select,
  Button,
  Table,
  message,
  Space,
  Tabs,
  Spin,
  Typography,
  Tag,
  Alert,
  Empty,
  Modal,
  Form,
  Input,
  InputNumber,
  List,
  Checkbox,
  Row,
  Col,
  Divider,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { codeGeneratorService, type TableInfo, type GeneratedFile, type CreateTableField } from '../../services/code-generator.service';
import { codeToHtml } from 'shiki';
import { 
  FileOutlined, 
  CopyOutlined, 
  CheckOutlined, 
  CodeOutlined, 
  DatabaseOutlined, 
  AppstoreOutlined, 
  DownloadOutlined, 
  MenuOutlined, 
  FileAddOutlined,
  PlusOutlined,
  DeleteOutlined,
  TableOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface ColumnSelection {
  key: string;
  columnName: string;
  dataType: string;
  columnComment?: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
}

// 字段类型选项
const FIELD_TYPE_OPTIONS = [
  { value: 'serial', label: 'SERIAL (自增整数)' },
  { value: 'bigserial', label: 'BIGSERIAL (自增大整数)' },
  { value: 'integer', label: 'INTEGER (整数)' },
  { value: 'bigint', label: 'BIGINT (大整数)' },
  { value: 'smallint', label: 'SMALLINT (小整数)' },
  { value: 'varchar', label: 'VARCHAR(255) (字符串)' },
  { value: 'text', label: 'TEXT (长文本)' },
  { value: 'decimal', label: 'DECIMAL(10,2) (小数)' },
  { value: 'boolean', label: 'BOOLEAN (布尔)' },
  { value: 'timestamp', label: 'TIMESTAMP (时间戳)' },
  { value: 'timestamptz', label: 'TIMESTAMP WITH TIME ZONE (带时区时间戳)' },
  { value: 'date', label: 'DATE (日期)' },
  { value: 'time', label: 'TIME (时间)' },
  { value: 'uuid', label: 'UUID (UUID)' },
  { value: 'json', label: 'JSON (JSON)' },
  { value: 'jsonb', label: 'JSONB (二进制JSON)' },
];

export default function CodeGenerator() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [columns, setColumns] = useState<ColumnSelection[]>([]);
  const [loadingColumns, setLoadingColumns] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<React.Key[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');
  const [highlightedCode, setHighlightedCode] = useState<Record<string, string>>({});
  const [copiedMap, setCopiedMap] = useState<Record<string, boolean>>({});
  
  // 第1步tab切换
  const [step1ActiveTab, setStep1ActiveTab] = useState<string>('existing');
  
  // 创建新表相关
  const [newTableName, setNewTableName] = useState<string>('');
  const [newTableComment, setNewTableComment] = useState<string>('');
  const [newTableFields, setNewTableFields] = useState<CreateTableField[]>([]);
  const [creatingTable, setCreatingTable] = useState(false);
  const [tableNameExists, setTableNameExists] = useState<boolean | null>(null);
  const [checkingTableName, setCheckingTableName] = useState(false);
  const [tableNameError, setTableNameError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<number, string>>({});
  
  // AI生成字段相关
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [generatingFields, setGeneratingFields] = useState(false);
  
  // 下载代码相关
  const [downloadModalVisible, setDownloadModalVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [writeFiles, setWriteFiles] = useState(false);
  const [downloadResult, setDownloadResult] = useState<{ files: string[]; success: boolean; message: string } | null>(null);
  
  // 创建菜单相关
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [creatingMenu, setCreatingMenu] = useState(false);
  const [menuForm] = Form.useForm();

  // 删除代码相关
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ files: string[]; success: boolean; message: string } | null>(null);

  // 加载表列表
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setLoadingTables(true);
    try {
      const response = await codeGeneratorService.getTables();
      if (response.code === 200) {
        setTables(response.data);
      }
    } catch (error) {
      message.error('获取表列表失败');
    } finally {
      setLoadingTables(false);
    }
  };

  // 验证名称格式（表名和字段名通用）
  const validateName = (name: string, type: 'table' | 'field'): string | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    
    // 只能包含小写字母、数字和下划线
    if (!/^[a-z0-9_]+$/.test(trimmed)) {
      return `${type === 'table' ? '表名称' : '字段名'}只能包含小写字母、数字和下划线`;
    }
    
    // 首位不能是数字
    if (/^[0-9]/.test(trimmed)) {
      return `${type === 'table' ? '表名称' : '字段名'}首位不能是数字`;
    }
    
    // 首位不能是下划线
    if (/^_/.test(trimmed)) {
      return `${type === 'table' ? '表名称' : '字段名'}首位不能是下划线`;
    }
    
    // 末位不能是下划线
    if (/_$/.test(trimmed)) {
      return `${type === 'table' ? '表名称' : '字段名'}末位不能是下划线`;
    }
    
    // 不能连续下划线
    if (/__/.test(trimmed)) {
      return `${type === 'table' ? '表名称' : '字段名'}不能包含连续下划线`;
    }
    
    // 至少包含一个字母
    if (!/[a-z]/.test(trimmed)) {
      return `${type === 'table' ? '表名称' : '字段名'}必须包含至少一个字母`;
    }
    
    // 长度检查
    if (trimmed.length < 2) {
      return `${type === 'table' ? '表名称' : '字段名'}至少需要2个字符`;
    }
    
    if (trimmed.length > 63) {
      return `${type === 'table' ? '表名称' : '字段名'}不能超过63个字符`;
    }
    
    return null;
  };

  // 检查表名是否存在
  const checkTableName = async (value: string) => {
    // 先进行格式验证
    const formatError = validateName(value, 'table');
    setTableNameError(formatError);
    
    if (!value || value.trim().length < 2 || formatError) {
      setTableNameExists(null);
      return;
    }
    setCheckingTableName(true);
    try {
      const response = await codeGeneratorService.checkTableExists(value.trim());
      if (response.code === 200) {
        setTableNameExists(response.data.exists);
      }
    } catch (error) {
      // 忽略错误
    } finally {
      setCheckingTableName(false);
    }
  };

  // 加载表字段
  const fetchColumns = async (tableName: string) => {
    setLoadingColumns(true);
    try {
      const response = await codeGeneratorService.getColumns(tableName);
      if (response.code === 200) {
        const cols = response.data.map((col) => ({
          key: col.columnName,
          columnName: col.columnName,
          dataType: col.dataType,
          columnComment: col.columnComment,
          isNullable: col.isNullable,
          isPrimaryKey: col.isPrimaryKey,
        }));
        setColumns(cols);
        // 默认全选（除了主键）
        setSelectedColumns(cols.filter((c) => !c.isPrimaryKey).map((col) => col.key));
      }
    } catch (error) {
      message.error('获取表字段失败');
    } finally {
      setLoadingColumns(false);
    }
  };

  // 表选择变化
  const handleTableChange = (value: string) => {
    setSelectedTable(value);
    setSelectedColumns([]);
    setGeneratedFiles([]);
    setHighlightedCode({});
    setActiveTab('');
    setDownloadResult(null);
    if (value) {
      fetchColumns(value);
    } else {
      setColumns([]);
    }
  };

  // 列选择变化
  const handleColumnSelect = (selectedRowKeys: React.Key[]) => {
    setSelectedColumns(selectedRowKeys);
  };

  // 生成代码
  const handleGenerate = async () => {
    const targetTableName = step1ActiveTab === 'existing' ? selectedTable : newTableName;
    
    if (!targetTableName) {
      message.warning(step1ActiveTab === 'existing' ? '请先选择数据表' : '请先创建数据表');
      return;
    }
    if (selectedColumns.length === 0) {
      message.warning('请至少选择一个字段');
      return;
    }

    setGenerating(true);
    try {
      const response = await codeGeneratorService.generateCode({
        tableName: targetTableName,
        columns: selectedColumns as string[],
      });
      if (response.code === 200) {
        setGeneratedFiles(response.data);
        if (response.data.length > 0) {
          setActiveTab(response.data[0].name);
        }
        message.success('代码生成成功');
      }
    } catch (error) {
      message.error('代码生成失败');
    } finally {
      setGenerating(false);
    }
  };

  // 添加新字段
  const handleAddField = () => {
    const newField: CreateTableField = {
      name: '',
      type: 'varchar',
      comment: '',
      isNullable: true,
      isPrimaryKey: false,
    };
    setNewTableFields([...newTableFields, newField]);
  };

  // AI生成字段
  const handleGenerateFields = async () => {
    if (!aiPrompt.trim()) {
      message.warning('请输入字段生成提示词');
      return;
    }
    
    setGeneratingFields(true);
    try {
      const response = await codeGeneratorService.generateFields({
        prompt: aiPrompt.trim(),
        tableName: newTableName || undefined,
        tableComment: newTableComment || undefined,
      });
      
      if (response.code === 200 && response.data.fields) {
        // 转换生成的字段并填充到列表（覆盖原有字段）
        const generatedFields: CreateTableField[] = response.data.fields.map(field => ({
          name: field.name,
          type: field.type,
          comment: field.comment || '',
          isNullable: field.isNullable !== false,
          isPrimaryKey: field.isPrimaryKey === true,
        }));
        
        setNewTableFields(generatedFields);
        setFieldErrors({});
        message.success(`成功生成 ${generatedFields.length} 个字段`);
      }
    } catch (error: any) {
      message.error(error?.message || 'AI生成字段失败');
    } finally {
      setGeneratingFields(false);
    }
  };

  // 删除字段
  const handleRemoveField = (index: number) => {
    const updated = newTableFields.filter((_, i) => i !== index);
    setNewTableFields(updated);
    // 清理对应字段的错误状态，并重新索引其他错误
    const newErrors: Record<number, string> = {};
    Object.entries(fieldErrors).forEach(([i, error]) => {
      const idx = parseInt(i);
      if (idx < index) {
        newErrors[idx] = error;
      } else if (idx > index) {
        newErrors[idx - 1] = error;
      }
    });
    setFieldErrors(newErrors);
  };

  // 更新字段
  const handleUpdateField = (index: number, field: Partial<CreateTableField>) => {
    const updated = [...newTableFields];
    updated[index] = { ...updated[index], ...field };
    
    // 如果更新的是字段名，进行格式验证
    if (field.name !== undefined) {
      const error = field.name ? validateName(field.name, 'field') : null;
      setFieldErrors(prev => ({
        ...prev,
        [index]: error || ''
      }));
    }
    
    // 如果设置为主键，其他字段取消主键
    if (field.isPrimaryKey && field.isPrimaryKey === true) {
      updated.forEach((f, i) => {
        if (i !== index) {
          f.isPrimaryKey = false;
        }
      });
    }
    
    setNewTableFields(updated);
  };

  // 创建数据表
  const handleCreateTable = async () => {
    if (!newTableName || newTableName.trim().length < 2) {
      message.error('请输入有效的表名称');
      return;
    }
    
    if (newTableFields.length === 0) {
      message.error('请至少添加一个字段');
      return;
    }
    
    // 验证字段
    const invalidFields = newTableFields.filter(f => !f.name || f.name.trim() === '');
    if (invalidFields.length > 0) {
      message.error('存在未填写字段名的字段');
      return;
    }
    
    // 验证字段名格式
    const fieldFormatErrors: Record<number, string> = {};
    let hasFieldError = false;
    newTableFields.forEach((f, index) => {
      const error = validateName(f.name, 'field');
      if (error) {
        fieldFormatErrors[index] = error;
        hasFieldError = true;
      }
    });
    if (hasFieldError) {
      setFieldErrors(fieldFormatErrors);
      message.error('存在格式错误的字段名');
      return;
    }
    
    // 检查是否有主键
    const hasPrimaryKey = newTableFields.some(f => f.isPrimaryKey);
    if (!hasPrimaryKey) {
      message.error('必须指定一个主键字段');
      return;
    }
    
    // 检查表名是否存在
    if (tableNameExists === true) {
      message.error('表名已存在，请更换');
      return;
    }
    
    // 检查表名格式
    if (tableNameError) {
      message.error(tableNameError);
      return;
    }

    setCreatingTable(true);
    try {
      const response = await codeGeneratorService.createTable({
        tableName: newTableName.trim(),
        tableComment: newTableComment.trim() || undefined,
        fields: newTableFields.map(f => ({
          ...f,
          name: f.name.trim(),
        })),
      });
      
      if (response.code === 200) {
        message.success(response.data.message);
        // 刷新表列表
        await fetchTables();
        // 加载新表的字段
        setSelectedTable(newTableName.trim());
        await fetchColumns(newTableName.trim());
        // 切换到已有表tab
        setStep1ActiveTab('existing');
      }
    } catch (error: any) {
      message.error(error?.message || '创建表失败');
    } finally {
      setCreatingTable(false);
    }
  };

  // 使用 Shiki 高亮代码
  const highlightCode = useCallback(async (code: string, language: string) => {
    try {
      const html = await codeToHtml(code, {
        lang: language,
        theme: 'github-dark',
      });
      return html;
    } catch (error) {
      // 如果语言不支持，使用纯文本
      const html = await codeToHtml(code, {
        lang: 'text',
        theme: 'github-dark',
      });
      return html;
    }
  }, []);

  // 高亮所有生成的代码
  useEffect(() => {
    const highlightAll = async () => {
      const highlighted: Record<string, string> = {};
      for (const file of generatedFiles) {
        highlighted[file.name] = await highlightCode(file.code, file.language);
      }
      setHighlightedCode(highlighted);
    };

    if (generatedFiles.length > 0) {
      highlightAll();
    }
  }, [generatedFiles, highlightCode]);

  // 复制代码
  const handleCopy = async (fileName: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedMap({ ...copiedMap, [fileName]: true });
      setTimeout(() => {
        setCopiedMap((prev) => ({ ...prev, [fileName]: false }));
      }, 2000);
      message.success('复制成功');
    } catch (error) {
      message.error('复制失败');
    }
  };

  // 打开下载弹窗
  const handleOpenDownload = () => {
    if (generatedFiles.length === 0) {
      message.warning('请先生成代码');
      return;
    }
    setDownloadModalVisible(true);
    setDownloadResult(null);
    setWriteFiles(false);
  };

  // 下载代码
  const handleDownload = async () => {
    const targetTableName = step1ActiveTab === 'existing' ? selectedTable : newTableName;
    
    setDownloading(true);
    try {
      const response = await codeGeneratorService.downloadCode({
        tableName: targetTableName,
        columns: selectedColumns as string[],
        writeFiles,
      });
      if (response.code === 200) {
        setDownloadResult(response.data);
        if (response.data.success) {
          message.success(response.data.message);
        } else {
          message.warning(response.data.message);
        }
      }
    } catch (error: any) {
      message.error(error?.message || '下载失败');
    } finally {
      setDownloading(false);
    }
  };

  // 打开创建菜单弹窗
  const handleOpenCreateMenu = () => {
    const targetTableName = step1ActiveTab === 'existing' ? selectedTable : newTableName;
    
    if (!targetTableName) {
      message.warning(step1ActiveTab === 'existing' ? '请先选择数据表' : '请先创建数据表');
      return;
    }
    // 自动填充菜单名称
    const tableComment = tables.find(t => t.tableName === targetTableName)?.tableComment;
    const defaultName = tableComment || targetTableName.replace(/^sys_/, '').replace(/_/g, '');
    menuForm.setFieldsValue({
      menuName: defaultName,
      parentCode: 'system',
      sort: 0,
    });
    setMenuModalVisible(true);
  };

  // 创建菜单
  const handleCreateMenu = async () => {
    const targetTableName = step1ActiveTab === 'existing' ? selectedTable : newTableName;
    
    try {
      const values = await menuForm.validateFields();
      setCreatingMenu(true);
      const response = await codeGeneratorService.createMenu({
        tableName: targetTableName,
        menuName: values.menuName,
        parentCode: values.parentCode,
        sort: values.sort,
      });
      if (response.code === 200) {
        message.success(response.data.message);
        setMenuModalVisible(false);
      }
    } catch (error: any) {
      message.error(error?.message || '创建菜单失败');
    } finally {
      setCreatingMenu(false);
    }
  };

  // 删除全部代码
  const handleDeleteCode = async () => {
    const targetTableName = step1ActiveTab === 'existing' ? selectedTable : newTableName;
    
    if (!targetTableName) {
      message.warning('请先选择数据表');
      return;
    }

    setDeleting(true);
    try {
      const response = await codeGeneratorService.deleteCode({
        tableName: targetTableName,
      });
      if (response.code === 200) {
        setDeleteResult(response.data);
        if (response.data.success) {
          message.success(response.data.message);
          // 重置相关状态
          setSelectedTable('');
          setColumns([]);
          setSelectedColumns([]);
          setGeneratedFiles([]);
          setActiveTab('');
        } else {
          message.warning(response.data.message);
        }
      }
    } catch (error: any) {
      message.error(error?.message || '删除代码失败');
    } finally {
      setDeleting(false);
    }
  };

  // 表格列定义
  const columnTableColumns: ColumnsType<ColumnSelection> = [
    {
      title: '字段名',
      dataIndex: 'columnName',
      key: 'columnName',
      render: (text: string, record: ColumnSelection) => (
        <Space>
          <Text strong={record.isPrimaryKey}>{text}</Text>
          {record.isPrimaryKey && <Tag color="red">主键</Tag>}
        </Space>
      ),
    },
    {
      title: '数据类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 150,
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: '可空',
      dataIndex: 'isNullable',
      key: 'isNullable',
      width: 80,
      render: (isNullable: boolean) => (isNullable ? '是' : '否'),
    },
    {
      title: '注释',
      dataIndex: 'columnComment',
      key: 'columnComment',
      ellipsis: true,
    },
  ];

  // 行选择配置
  const rowSelection = {
    selectedRowKeys: selectedColumns,
    onChange: handleColumnSelect,
    getCheckboxProps: (record: ColumnSelection) => ({
      disabled: record.isPrimaryKey,
      name: record.columnName,
    }),
  };

  // 自定义 Tab 渲染
  const renderTabLabel = (file: GeneratedFile) => (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 8,
      padding: '4px 0',
    }}>
      <FileOutlined style={{ fontSize: 14, color: '#1890ff' }} />
      <span 
        style={{ 
          maxWidth: 180, 
          overflow: 'hidden', 
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: 13,
        }}
        title={file.name}
      >
        {file.name}
      </span>
    </div>
  );

  // 新表字段表格列
  const newFieldColumns: ColumnsType<CreateTableField & { index: number }> = [
    {
      title: '字段名',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (_: any, record) => (
        <Tooltip title={fieldErrors[record.index] || ''} open={!!fieldErrors[record.index]}>
          <Input
            placeholder="字段名"
            value={record.name}
            onChange={(e) => handleUpdateField(record.index, { name: e.target.value })}
            size="small"
            status={!record.name || fieldErrors[record.index] ? 'error' : ''}
          />
        </Tooltip>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 200,
      render: (_: any, record) => (
        <Select
          value={record.type}
          onChange={(value) => handleUpdateField(record.index, { type: value })}
          options={FIELD_TYPE_OPTIONS}
          size="small"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '注释',
      dataIndex: 'comment',
      key: 'comment',
      render: (_: any, record) => (
        <Input
          placeholder="字段注释"
          value={record.comment}
          onChange={(e) => handleUpdateField(record.index, { comment: e.target.value })}
          size="small"
        />
      ),
    },
    {
      title: '可空',
      dataIndex: 'isNullable',
      key: 'isNullable',
      width: 70,
      align: 'center',
      render: (_: any, record) => (
        <Checkbox
          checked={record.isNullable}
          onChange={(e) => handleUpdateField(record.index, { isNullable: e.target.checked })}
          disabled={record.isPrimaryKey}
        />
      ),
    },
    {
      title: '主键',
      dataIndex: 'isPrimaryKey',
      key: 'isPrimaryKey',
      width: 70,
      align: 'center',
      render: (_: any, record) => (
        <Checkbox
          checked={record.isPrimaryKey}
          onChange={(e) => {
            handleUpdateField(record.index, { 
              isPrimaryKey: e.target.checked,
              isNullable: !e.target.checked,
            });
          }}
        />
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 70,
      align: 'center',
      render: (_: any, record) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveField(record.index)}
        />
      ),
    },
  ];

  // 是否有可生成的表
  const hasSelectedTable = step1ActiveTab === 'existing' 
    ? !!selectedTable 
    : (!!newTableName && columns.length > 0);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <CodeOutlined /> 代码生成器
      </Title>

      {/* 第1步：选择/创建数据表 */}
      <Card 
        title={
          <Space>
            <DatabaseOutlined />
            <span>第1步：选择或创建数据表</span>
          </Space>
        } 
        style={{ marginBottom: 24 }}
      >
        <Tabs activeKey={step1ActiveTab} onChange={setStep1ActiveTab}>
          {/* 已有表 Tab */}
          <TabPane 
            tab={<span><TableOutlined /> 已有表</span>} 
            key="existing"
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Select
                showSearch
                placeholder="请选择数据表"
                style={{ width: '100%', maxWidth: 500 }}
                loading={loadingTables}
                value={selectedTable || undefined}
                onChange={handleTableChange}
                optionFilterProp="label"
                options={tables.map((table) => ({
                  value: table.tableName,
                  label: table.tableComment
                    ? `${table.tableName} (${table.tableComment})`
                    : table.tableName,
                }))}
              />
              {selectedTable && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => {
                    setDeleteModalVisible(true);
                    setDeleteResult(null);
                  }}
                >
                  删除全部代码
                </Button>
              )}
            </Space>
          </TabPane>
          
          {/* 创建新表 Tab */}
          <TabPane 
            tab={<span><EditOutlined /> 创建新表</span>} 
            key="new"
          >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {/* 表名和表备注输入 */}
              <Row align="middle" gutter={16}>
                <Col>
                  <Text strong>表名称：</Text>
                </Col>
                <Col flex="auto" style={{ maxWidth: 300 }}>
                  <Input
                    placeholder="请输入表名称，如：sys_user_log"
                    value={newTableName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setNewTableName(value);
                      checkTableName(value);
                    }}
                    status={tableNameExists === true || tableNameError ? 'error' : tableNameExists === false ? 'warning' : ''}
                    suffix={
                      checkingTableName ? (
                        <Spin size="small" />
                      ) : tableNameExists === true ? (
                        <Tag color="red">已存在</Tag>
                      ) : tableNameExists === false ? (
                        <Tag color="green">可用</Tag>
                      ) : null
                    }
                  />
                </Col>
                <Col>
                  <Text strong>表备注：</Text>
                </Col>
                <Col flex="auto" style={{ maxWidth: 300 }}>
                  <Input
                    placeholder="请输入表备注，如：用户操作日志表"
                    value={newTableComment}
                    onChange={(e) => setNewTableComment(e.target.value)}
                  />
                </Col>
              </Row>
              
              {(tableNameExists === true || tableNameError) && (
                <Alert 
                  title={tableNameError || "表名已存在，请更换其他名称"} 
                  type="error" 
                  showIcon 
                />
              )}
              
              {/* 字段列表 */}
              <Divider style={{ margin: '8px 0' }} />
              
              <div style={{ marginBottom: 8 }}>
                <Space>
                  <Text strong>字段定义</Text>
                  <Text type="secondary">（至少需要一个字段，且必须指定一个主键）</Text>
                </Space>
              </div>
              
              {/* AI生成字段 */}
              <div style={{ marginBottom: 16, padding: 12, background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
                <Space direction="vertical" style={{ width: '100%' }} size="small">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    <ThunderboltOutlined style={{ marginRight: 4 }} />
                    AI智能生成字段（输入表用途描述，AI将自动生成合适的字段定义）
                  </Text>
                  <Space.Compact style={{ width: '100%' }}>
                    <Input
                      placeholder="例如：用户订单表，包含订单号、用户信息、商品详情、金额、状态等字段"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onPressEnter={handleGenerateFields}
                      disabled={generatingFields}
                    />
                    <Button
                      type="primary"
                      icon={<ThunderboltOutlined />}
                      loading={generatingFields}
                      onClick={handleGenerateFields}
                      style={{ background: '#52c41a', borderColor: '#52c41a' }}
                    >
                      AI生成字段
                    </Button>
                  </Space.Compact>
                </Space>
              </div>
              
              <Table
                columns={newFieldColumns}
                dataSource={newTableFields.map((f, i) => ({ ...f, index: i, key: i }))}
                pagination={false}
                size="small"
                scroll={{ y: 300 }}
                locale={{ emptyText: '暂无字段，请点击下方按钮添加' }}
              />
              
              <Button 
                type="dashed" 
                icon={<PlusOutlined />}
                onClick={handleAddField}
                style={{ width: '100%' }}
              >
                添加字段
              </Button>
              
              {/* 创建表按钮 */}
              <Button
                type="primary"
                icon={<DatabaseOutlined />}
                loading={creatingTable}
                disabled={!newTableName || newTableFields.length === 0 || tableNameExists === true || !!tableNameError || Object.values(fieldErrors).some(e => !!e)}
                onClick={handleCreateTable}
                style={{ width: '100%', marginTop: 16 }}
              >
                创建数据表
              </Button>
            </Space>
          </TabPane>
        </Tabs>
      </Card>

      {/* 第2步：选择字段 */}
      {hasSelectedTable && (
        <Card
          title={
            <Space>
              <AppstoreOutlined />
              <span>第2步：选择字段（可多选）</span>
            </Space>
          }
          style={{ marginBottom: 24 }}
          extra={
            <Space>
              <Button
                type="link"
                size="small"
                onClick={() => setSelectedColumns(columns.filter((c) => !c.isPrimaryKey).map((c) => c.key))}
              >
                全选
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => setSelectedColumns([])}
              >
                清空
              </Button>
              <Text type="secondary">已选 {selectedColumns.length} 个字段</Text>
              <Button
                type="primary"
                icon={<CodeOutlined />}
                loading={generating}
                disabled={selectedColumns.length === 0}
                onClick={handleGenerate}
              >
                生成源码
              </Button>
            </Space>
          }
        >
          <Table
            rowSelection={rowSelection}
            columns={columnTableColumns}
            dataSource={columns}
            loading={loadingColumns}
            pagination={false}
            size="small"
            scroll={{ y: 350 }}
            rowKey="key"
          />
        </Card>
      )}

      {/* 第3步：代码预览 */}
      {generatedFiles.length > 0 && (
        <Card
          title={
            <Space>
              <CodeOutlined />
              <span>第3步：代码预览</span>
            </Space>
          }
          extra={
            <Space>
              <Text type="secondary">共 {generatedFiles.length} 个文件</Text>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleOpenDownload}
              >
                下载代码
              </Button>
            </Space>
          }
          style={{ marginBottom: 24 }}
        >
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            tabPosition="left"
            style={{ minHeight: 600 }}
            items={generatedFiles.map((file) => ({
              key: file.name,
              label: renderTabLabel(file),
              children: (
                <div style={{ paddingLeft: 8 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: '#f5f5f5',
                      borderRadius: '6px 6px 0 0',
                      borderBottom: '1px solid #e8e8e8',
                    }}
                  >
                    <Text type="secondary" copyable={{ text: file.path }} style={{ fontSize: 13 }}>
                      {file.path}
                    </Text>
                    <Button
                      type="primary"
                      ghost
                      size="small"
                      icon={copiedMap[file.name] ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => handleCopy(file.name, file.code)}
                    >
                      {copiedMap[file.name] ? '已复制' : '复制代码'}
                    </Button>
                  </div>
                  <div
                    style={{
                      maxHeight: '650px',
                      overflow: 'auto',
                      background: '#0d1117',
                      borderRadius: '0 0 6px 6px',
                    }}
                  >
                    {highlightedCode[file.name] ? (
                      <div
                        dangerouslySetInnerHTML={{ __html: highlightedCode[file.name] }}
                        style={{
                          fontSize: '13px',
                          lineHeight: '1.6',
                        }}
                      />
                    ) : (
                      <div style={{ padding: 40, textAlign: 'center' }}>
                        <Spin tip="代码高亮中..." />
                      </div>
                    )}
                  </div>
                </div>
              ),
            }))}
          />
        </Card>
      )}

      {/* 第4步：生成菜单 */}
      {generatedFiles.length > 0 && (
        <Card
          title={
            <Space>
              <MenuOutlined />
              <span>第4步：生成侧边栏菜单</span>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<FileAddOutlined />}
              onClick={handleOpenCreateMenu}
            >
              创建菜单
            </Button>
          }
        >
          <Alert
            title="菜单创建说明"
            description={
              <div>
                <p>点击「创建菜单」按钮，将自动在数据库中插入菜单和按钮权限：</p>
                <ul style={{ marginLeft: 20 }}>
                  <li>菜单：显示在侧边栏的导航项</li>
                  <li>按钮权限：新增、编辑、删除权限</li>
                </ul>
                <p>创建后需要给管理员组分配权限才能在菜单中看到。</p>
              </div>
            }
            type="info"
            showIcon
          />
        </Card>
      )}

      {/* 空状态 */}
      {!hasSelectedTable && (
        <Card>
          <Empty
            image={<CodeOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
            description="选择数据表或创建新表后开始生成代码"
          />
        </Card>
      )}

      {/* 下载代码弹窗 */}
      <Modal
        title="下载代码"
        open={downloadModalVisible}
        onCancel={() => setDownloadModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDownloadModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            loading={downloading}
            onClick={handleDownload}
          >
            {writeFiles ? '写入文件' : '预览文件'}
          </Button>,
        ]}
        width={700}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Checkbox
              checked={writeFiles}
              onChange={(e) => setWriteFiles(e.target.checked)}
            >
              直接写入项目文件夹（不勾选则仅预览）
            </Checkbox>
            {writeFiles && (
              <Alert
                message={
                  <div>
                    <div>⚠️ 警告：勾选后将直接写入项目源码目录，请确保已备份代码！</div>
                    <div style={{ marginTop: 4, color: '#52c41a' }}>
                      ✨ 自动注册：写入后会自动添加前端路由到 App.tsx 和后端模块到 app.module.ts
                    </div>
                  </div>
                }
                type="warning"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
          </div>

          {downloadResult && (
            <div>
              <Alert
                message={downloadResult.message}
                type={downloadResult.success ? 'success' : 'warning'}
                showIcon
                style={{ marginBottom: 16 }}
              />
              {downloadResult.files.length > 0 && (
                <div>
                  <Text strong>文件列表：</Text>
                  <List
                    size="small"
                    bordered
                    dataSource={downloadResult.files}
                    renderItem={(item) => (
                      <List.Item>
                        <Text code style={{ fontSize: 12 }}>{item}</Text>
                      </List.Item>
                    )}
                    style={{ marginTop: 8, maxHeight: 300, overflow: 'auto' }}
                  />
                </div>
              )}
            </div>
          )}
        </Space>
      </Modal>

      {/* 创建菜单弹窗 */}
      <Modal
        title="创建侧边栏菜单"
        open={menuModalVisible}
        onCancel={() => setMenuModalVisible(false)}
        onOk={handleCreateMenu}
        confirmLoading={creatingMenu}
        width={500}
      >
        <Form form={menuForm} layout="vertical">
          <Form.Item
            name="menuName"
            label="菜单名称"
            rules={[{ required: true, message: '请输入菜单名称' }]}
          >
            <Input placeholder="如：用户管理" />
          </Form.Item>
          <Form.Item
            name="parentCode"
            label="父菜单代码"
            rules={[{ required: true, message: '请输入父菜单代码' }]}
            initialValue="system"
          >
            <Input placeholder="如：system, user, log" />
          </Form.Item>
          <Form.Item
            name="sort"
            label="排序"
            rules={[{ required: true, message: '请输入排序' }]}
            initialValue={0}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除代码确认弹窗 */}
      <Modal
        title={
          <Space>
            <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
            <span style={{ color: '#ff4d4f' }}>危险操作确认</span>
          </Space>
        }
        open={deleteModalVisible}
        onCancel={() => setDeleteModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setDeleteModalVisible(false)}>
            取消
          </Button>,
          <Button
            key="delete"
            danger
            type="primary"
            icon={<DeleteOutlined />}
            loading={deleting}
            onClick={handleDeleteCode}
          >
            确认删除
          </Button>,
        ]}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Alert
            message="⚠️ 此操作将永久删除以下代码文件及相关菜单，不可恢复！"
            description={
              <div>
                <p><strong>表名：</strong>{step1ActiveTab === 'existing' ? selectedTable : newTableName}</p>
                <p>将被删除的文件包括：</p>
                <ul style={{ marginLeft: 20, color: '#ff4d4f' }}>
                  <li>后端 Entity 实体文件</li>
                  <li>后端 DTO 文件（Create/Update/Query）</li>
                  <li>后端 Service 服务文件</li>
                  <li>后端 Controller 控制器文件</li>
                  <li>后端 Module 模块文件</li>
                  <li>前端页面文件（index.tsx）</li>
                  <li>前端服务文件（service.ts）</li>
                </ul>
                <p>同时会自动移除以下内容：</p>
                <ul style={{ marginLeft: 20 }}>
                  <li>frontend/src/App.tsx（路由）</li>
                  <li>backend/src/app.module.ts（模块导入）</li>
                  <li>数据库中的菜单及按钮权限（如果存在）</li>
                </ul>
              </div>
            }
            type="error"
            showIcon
          />

          {deleteResult && (
            <Alert
              message={deleteResult.message}
              type={deleteResult.success ? 'success' : 'warning'}
              showIcon
            />
          )}

          {deleteResult?.files && deleteResult.files.length > 0 && (
            <div>
              <Text strong>已删除的文件列表：</Text>
              <List
                size="small"
                bordered
                dataSource={deleteResult.files}
                renderItem={(item) => (
                  <List.Item>
                    <Text code style={{ fontSize: 12 }}>{item}</Text>
                  </List.Item>
                )}
                style={{ marginTop: 8, maxHeight: 200, overflow: 'auto' }}
              />
            </div>
          )}
        </Space>
      </Modal>
    </div>
  );
}
