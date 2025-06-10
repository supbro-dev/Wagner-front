import React, { useState } from 'react';
import {
    Breadcrumb,
    Button,
    Card,
    Col,
    Form,
    Input,
    Layout,
    message,
    Pagination,
    Row,
    Select,
    Space, Spin,
    Table,
    Tag
} from 'antd';
import '../App.css';
import {Content, Header} from "antd/es/layout/layout";
import {Footer} from "antd/es/modal/shared";

const columns = [
    {
        title: 'Name',
        dataIndex: 'name',
        key: 'name',
        render: text => <a>{text}</a>,
    },
    {
        title: 'Age',
        dataIndex: 'age',
        key: 'age',
    },
    {
        title: 'Address',
        dataIndex: 'address',
        key: 'address',
    },
    {
        title: 'Tags',
        key: 'tags',
        dataIndex: 'tags',
        render: (_, { tags }) => (
            <>
                {tags.map(tag => {
                    let color = tag.length > 5 ? 'geekblue' : 'green';
                    if (tag === 'loser') {
                        color = 'volcano';
                    }
                    return (
                        <Tag color={color} key={tag}>
                            {tag.toUpperCase()}
                        </Tag>
                    );
                })}
            </>
        ),
    },
    {
        title: 'Action',
        key: 'action',
        render: (_, record) => (
            <Space size="middle">
                <a>Invite {record.name}</a>
                <a>Delete</a>
            </Space>
        ),
    },
];
const data = [
    {
        key: '1',
        name: 'John Brown',
        age: 32,
        address: 'New York No. 1 Lake Park',
        tags: ['nice', 'developer'],
    },
    {
        key: '2',
        name: 'Jim Green',
        age: 42,
        address: 'London No. 1 Lake Park',
        tags: ['loser'],
    },
    {
        key: '3',
        name: 'Joe Black',
        age: 32,
        address: 'Sydney No. 1 Lake Park',
        tags: ['cool', 'teacher'],
    },
];
const layoutStyle = {
    borderRadius: 8,
    overflow: 'hidden',
    width: 'calc(50% - 8px)',
    maxWidth: 'calc(50% - 8px)',
};

function App() {
    const [loading, setLoading] = useState(false);

    const [form] = Form.useForm();
    const [isSearching, setIsSearching] = useState(false);


    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/v1/efficiency/compute?employeeNumber=A1001&operateDay=2025-05-28');
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();
            message.success(`获取数据成功: ${JSON.stringify(data)}`);
            console.log('后端返回数据:', data);
        } catch (error) {
            console.error('请求出错:', error);
            message.error(`请求失败: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        form.resetFields();
        // setData(initialData);
        setIsSearching(false);
        message.info('已重置筛选条件');
    };



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
                            <span>人效管理</span>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <strong>个人人效</strong>
                        </Breadcrumb.Item>
                    </Breadcrumb>

                    {/* 查询条件卡片 */}
                    <Card
                        style={{ marginBottom: 24 }}
                        headStyle={{ background: '#fafafa', borderBottom: 'none' }}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={fetchData}
                        >
                            <Row gutter={24}>
                                <Col xs={24} sm={12} md={8} lg={6}>
                                    <Form.Item label="工作点" name="workPoint">
                                        <Select
                                            placeholder="请选择工作点"
                                            allowClear
                                        >

                                        </Select>
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12} md={8} lg={6}>
                                    <Form.Item label="员工工号" name="employeeId">
                                        <Input
                                            placeholder="请输入员工工号"
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={12} md={8} lg={6}>
                                    <Form.Item label="员工姓名" name="employeeName">
                                        <Input
                                            placeholder="请输入员工姓名"
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>

                                <Col xs={24} sm={24} md={24} lg={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
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
                                    </Space>
                                </Col>
                            </Row>
                        </Form>
                    </Card>

                    {/* 数据表格 */}
                    <Card>
                        <div style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h3 style={{ margin: 0 }}>个人人效列表</h3>
                            </div>
                        </div>

                        <Spin spinning={loading} tip="数据加载中...">
                            <Table
                                columns={columns}
                                dataSource={data}
                                pagination={{
                                    pageSize: 5,
                                    showSizeChanger: false,
                                    showTotal: total => `共 ${total} 条数据`,
                                }}
                                rowKey="key"
                                locale={{
                                    emptyText: isSearching ? '没有找到匹配的数据' : '暂无数据'
                                }}
                            />
                        </Spin>
                    </Card>
                </Content>
            </Layout>
        </div>
    );
}

export default App;
