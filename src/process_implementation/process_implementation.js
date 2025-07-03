import {
    Breadcrumb,
    Button,
    Card,
    Col,
    ConfigProvider,
    Form,
    Input,
    Layout, message,
    Progress,
    Row,
    Select, Space,
    Spin,
    Table,
    Typography
} from "antd";
import {Content} from "antd/es/layout/layout";
import dayjs from "dayjs";
import locale from "antd/locale/zh_CN";
import React, {useEffect, useState} from "react";

const showTotal = total => `共 ${total} 条`;

const columns = [
    { title: '实施名称', dataIndex: 'name', key: 'name', width: 150 },
    { title: '实施目标类型', dataIndex: 'targetTypeDesc', key: 'targetTypeDesc' , width: 150},
    { title: '实施目标名称', dataIndex: 'targetName', key: 'targetName' , width: 150},
    { title: '状态', dataIndex: 'statusDesc', key: 'statusDesc' , width: 150},
    { title: '操作', key:'operation', fixed: 'right', width: 150, render: (record) => {
        if (record.status === 'online') {
            return (
                <Space>
                    <Typography.Link>下线</Typography.Link>
                </Space>
            )
        } else {
            return (
                <Space>
                    <Typography.Link>上线</Typography.Link>
                    <Typography.Link>编辑</Typography.Link>
                </Space>
            )
        }

        },},
]


function ProcessImplementation() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false)
    const [implData, setImplData] = useState([])
    const [workplaces, setWorkplaces] = useState([])
    const [industries, setIndustries] = useState([])
    const [subIndustries, setSubIndustries] = useState([])
    const [isSearching, setIsSearching] = useState(false);


    const onChange = async (pageNumber, pageSize) => {
        setLoading(true);
        try {
            const {
                workplaceCode,
                industryCode,
                subIndustryCode,
                targetType,
            } = form.getFieldsValue()

            const response = await fetch(`/api/v1/process/implementation?workplaceCode=${workplaceCode || ''}&industryCode=${industryCode || ''}&subIndustryCode=${subIndustryCode || ''}&targetType=${targetType}&currentPage=${pageNumber}&pageSize=${pageSize}`);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();


            setImplData(data.data.tableDataList)

            setPage(prev => ({ ...prev, current: data.data.page.currentPage,
                pageSize: data.data.page.pageSize,
                total: data.data.page.total, }));
        } catch (error) {
            console.error('请求出错:', error);
        } finally {
            setLoading(false);
        }
    }

    const onShowSizeChange = onChange

    const [page, setPage] = useState({
        current: 1,
        pageSize: 20,
        total: 0,
        showTotal: showTotal,
        onChange: onChange,
        showSizeChanger: true,
        pageSizeOptions: [20, 50, 100],
        onShowSizeChange: onShowSizeChange,
    });

    const fetchData = async (values) => {
        setLoading(true);
        try {
            const {
                workplaceCode,
                industryCode,
                subIndustryCode,
                targetType,
            } = values

            const response = await fetch(`/api/v1/process/implementation?workplaceCode=${workplaceCode || ''}&industryCode=${industryCode || ''}&subIndustryCode=${subIndustryCode || ''}&targetType=${targetType}&currentPage=${page.current}&pageSize=${page.pageSize}`);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();


            setImplData(data.data.tableDataList)

            setPage(prev => ({ ...prev, current: data.data.page.currentPage,
                pageSize: data.data.page.pageSize,
                total: data.data.page.total, }));

        } catch (error) {
            console.error('请求出错:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWorkplace = async () => {
        try {
            const response = await fetch('/api/v1/workplace/all');
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            setWorkplaces(data.data)
        } catch (error) {
            console.error('获取工作点失败:', error);
        }
    }

    const fetchIndustry = async () => {
        try {
            const response = await fetch('/api/v1/workplace/allIndustry');
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            setIndustries(data.data)
        } catch (error) {
            console.error('获取工作点失败:', error);
        }
    }

    const fetchSubIndustry = async () => {
        try {
            const response = await fetch('/api/v1/workplace/allSubIndustry');
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            setSubIndustries(data.data)
        } catch (error) {
            console.error('获取工作点失败:', error);
        }
    }


    const handleReset = () => {
        form.resetFields();
        // setData(initialData);
        setIsSearching(false);
        message.info('已重置筛选条件');
    };

    // 初始化数据
    // 初始化工作点下拉选
    // 在组件挂载时获取工作点数据
    useEffect(() => {
        fetchWorkplace()
        fetchIndustry()
        fetchSubIndustry()
    }, []);

    return (
        <div className="App">
            <Layout>
                <Content>
                    {/* 面包屑导航 */}
                    <Breadcrumb>
                        <Breadcrumb.Item>
                            <span>首页</span>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <span>环节实施</span>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <strong>环节实施</strong>
                        </Breadcrumb.Item>
                    </Breadcrumb>

                    {/* 查询条件卡片 */}
                    <Card>
                        <Form
                            form={form}
                            // layout="inline"
                            onFinish={fetchData}

                            size={'middle'}
                            autoComplete="off"
                        >
                            <Row gutter={24}>
                                <Col xs={12} sm={6} md={4} lg={4}>
                                    <ConfigProvider locale={locale}>
                                        <Form.Item label="实施粒度" name="targetType" rules={[{ required: true, message: '实施粒度必选' }]}>

                                            <Select
                                                placeholder="请选择实施粒度"
                                                allowClear
                                                options={[
                                                    {label:'工作点',value:'workplace'},
                                                    {label:'行业',value:'industry'},
                                                    {label:'子行业',value:'subIndustry'},
                                                ]}
                                            >
                                            </Select>
                                        </Form.Item>
                                    </ConfigProvider>
                                </Col>

                                <Col xs={12} sm={6} md={4} lg={4}>
                                    <ConfigProvider locale={locale}>
                                        <Form.Item label="工作点" name="workplaceCode" >

                                            <Select
                                                placeholder="请选择工作点"
                                                allowClear
                                                options={workplaces}
                                            >
                                            </Select>
                                        </Form.Item>
                                    </ConfigProvider>
                                </Col>

                                <Col xs={12} sm={6} md={4} lg={4}>
                                    <ConfigProvider locale={locale}>
                                        <Form.Item label="行业" name="industryCode" >

                                            <Select
                                                placeholder="请选择行业"
                                                allowClear
                                                options={industries}
                                            >
                                            </Select>
                                        </Form.Item>
                                    </ConfigProvider>
                                </Col>

                                <Col xs={12} sm={6} md={4} lg={4}>
                                    <ConfigProvider locale={locale}>
                                        <Form.Item label="子行业" name="subIndustryCode" >

                                            <Select
                                                placeholder="请选择子行业"
                                                allowClear
                                                options={subIndustries}
                                            >
                                            </Select>
                                        </Form.Item>
                                    </ConfigProvider>
                                </Col>



                                <Col xs={24} sm={24} md={24} lg={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <Form.Item >
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            loading={loading}
                                        >
                                            查询
                                        </Button>
                                        <Button
                                            onClick={handleReset}
                                        >
                                            重置
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Form>
                    </Card>

                    {/* 数据表格 */}
                    <Card>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h3 style={{ margin: 0 }}>环节实施列表</h3>
                            </div>
                        </div>

                        <Spin spinning={loading} tip="数据加载中...">
                            <ConfigProvider locale={locale}>
                                <Table
                                    columns={columns}
                                    dataSource={implData}
                                    pagination={page}
                                    rowKey="key"
                                    locale={{
                                        emptyText: isSearching ? '没有找到匹配的数据' : '暂无数据'
                                    }}
                                />
                            </ConfigProvider>
                        </Spin>
                    </Card>
                </Content>
            </Layout>
        </div>
    );
}

export default ProcessImplementation;