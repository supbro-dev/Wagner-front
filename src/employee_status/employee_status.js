import React, {useEffect, useState} from 'react';
import {AntDesignOutlined, UserOutlined} from '@ant-design/icons';
import {
    Avatar,
    Breadcrumb, Button,
    Card,
    Col,
    ConfigProvider,
    DatePicker,
    Divider,
    Form,
    Input,
    Layout, message,
    Row, Select, Table, Tag,
    Tooltip
} from 'antd';
import {Content} from "antd/es/layout/layout";
import dayjs from "dayjs";
import locale from "antd/locale/zh_CN";
const dateFormat = 'YYYY-MM-DD'

const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss'
const timeFormat = 'HH:mm'
const customFormat = value => `${value.format(dateFormat)}`;

const columns = [
    { title: '工作组名称', dataIndex: 'groupName', key: 'groupName' },
    { title: '工作组编码', dataIndex: 'groupCode', key: 'groupCode' },
    { title: '工作组状态',  key: 'groupStatus', render: (record) => {
        return <span>直接作业<Tag color={"#3b9a3c"} key={record.groupStatusNum.directWorkingNum}>{record.groupStatusNum.directWorkingNum}人</Tag>，间接作业<Tag color={"#d6b221"} key={record.groupStatusNum.indirectWorkingNum}>{record.groupStatusNum.indirectWorkingNum}人</Tag>，闲置<Tag color={"black"} key={record.groupStatusNum.idleNum}>{record.groupStatusNum.idleNum}人</Tag>，休息中<Tag color={"#d7dabe"} key={record.groupStatusNum.restNum}>{record.groupStatusNum.restNum}人</Tag>，已下班<Tag color={"#47abb8"} key={record.groupStatusNum.offDutyNum}>{record.groupStatusNum.offDutyNum}人</Tag>，下班未打卡<Tag color={"#d17979"} key={record.groupStatusNum.offDutyWithoutEndTimeNum}>{record.groupStatusNum.offDutyWithoutEndTimeNum}人</Tag></span>
        }  },
];

const expandColumns = [
    { title: '工号', dataIndex: 'employeeNumber', key: 'employeeNumber', width:'120'},
    { title: '姓名', dataIndex: 'employeeName', key: 'employeeName' , width:'120'},
    { title: '员工状态', dataIndex: 'statusDesc', key: 'statusDesc',  width:'120'},
    { title: '最近一次行动', dataIndex: 'lastActionDesc', key: 'lastActionDesc',  width:'240' },
]



function EmployeeStatus() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [workplaces, setWorkplaces] = useState([]);
    const [dataSource, setDataSource] = useState([]);
    const [expandDataSource, setExpandDataSource] = useState({});

    const handleReset = () => {
        form.resetFields();
        message.info('已重置筛选条件');
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

    const fetchData =  async (values) => {
        setLoading(true);
        try {
            const {
                workplaceCode,
                operateDay,
            } = values

            const response = await fetch(`/api/v1/efficiency/employeeStatus?workplaceCode=${workplaceCode}&operateDay=${operateDay.format(dateFormat)}`);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            if (data.data.groupStatus) {
                setDataSource(data.data.groupStatus)

                const theExpandDataSource = {}
                for (const i in data.data.groupStatus) {
                    let groupStatus = data.data.groupStatus[i]
                    theExpandDataSource[groupStatus.groupCode] = groupStatus.employeeStatusList
                }

                setExpandDataSource(theExpandDataSource);
            }

            console.log('后端返回数据:', data);
        } catch (error) {
            console.error('请求出错:', error);
        } finally {
            setLoading(false);
        }
    };

    const getExpandDataSource = (groupCode) => {
        return expandDataSource[groupCode];
    }

    const expandedRowRender = (record) => (
        <Table columns={expandColumns} dataSource={getExpandDataSource(record.groupCode)} pagination={false} />
    );


    // 初始化数据
    // 初始化工作点下拉选
    // 在组件挂载时获取工作点数据
    useEffect(() => {
        fetchWorkplace();
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
                            <span>人效管理</span>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <strong>员工状态监控</strong>
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
                            initialValues={{
                                // operateDay: dayjs('2025-05-28'),
                                // employeeNumber: 'A1001',
                            }}
                        >
                            <Row gutter={24}>
                                <Col xs={12} sm={6} md={4} lg={4}>
                                    <ConfigProvider locale={locale}>
                                        <Form.Item label="工作点" name="workplaceCode" rules={[{ required: true, message: '工作点必选' }]}>

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
                                        <Form.Item label="日期" name="operateDay"
                                                   rules={[{required: true, message: '日期必选'}]}>
                                            <DatePicker
                                                placeholder="请选择日期"
                                                format={customFormat}
                                            />
                                        </Form.Item>
                                    </ConfigProvider>
                                </Col>

                                <Col xs={24} sm={24} md={24} lg={6} style={{display: 'flex', alignItems: 'flex-end'}}>
                                    <Form.Item>
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
                    <Card>
                        <Table
                            columns={columns}
                            expandable={{ expandedRowRender}}
                            dataSource={dataSource}
                            pagination={{ position: ["none"] }}
                        />
                    </Card>
                </Content>
            </Layout>
        </div>
    )
}



export default EmployeeStatus;