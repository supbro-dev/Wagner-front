import React, {useEffect, useState} from 'react';
import {
    Breadcrumb,
    Button,
    Card,
    Col, ConfigProvider, DatePicker,
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
import dayjs from "dayjs";
import locale from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';

const { RangePicker } = DatePicker;

dayjs.locale('zh-cn');


const dateFormat = 'YYYY-MM-DD'
const customFormat = value => `${value.format(dateFormat)}`;


function App() {
    const [loading, setLoading] = useState(false);

    const [form] = Form.useForm();
    const [isSearching, setIsSearching] = useState(false);
    const [workplaces, setWorkplaces] = useState([]);
    const [efficiencyData, setEfficiencyData] = useState([]);
    const [columns, setColumns] = useState([])

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
                employeeNumber,
                dateRange,
                aggregateDimension,
                isCrossPosition,
            } = values

            // setEfficiencyData([{employeeName:"abc", properties:{itemNum:123}}])

            const response = await fetch(`/api/v1/efficiency/employee?workplaceCode=${workplaceCode}&employeeNumber=${employeeNumber ? employeeNumber : ''}&startDate=${dateRange[0].format(dateFormat)}&endDate=${dateRange[1].format(dateFormat)}&aggregateDimension=${aggregateDimension}&isCrossPosition=${isCrossPosition}`);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            debugger

            setEfficiencyData(data.data.tableDataList)
            setColumns(data.data.columns)

            console.log('后端返回数据:', data);
        } catch (error) {
            console.error('请求出错:', error);
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
                            // layout="inline"
                            onFinish={fetchData}

                            size={'middle'}
                            autoComplete="off"
                            initialValues={{
                                dateRange: [ // 这里的字段名对应RangePicker的name
                                    dayjs(dayjs().add(-3, 'day'), dateFormat), dayjs(dayjs(), dateFormat)
                                ],
                                aggregateDimension: 'process',
                                isCrossPosition: 'all',
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
                                    <Form.Item label="时间段" name="dateRange" rules={[{ required: true, message: '时间段必选' }]}>
                                            <RangePicker
                                                placeholder="请选择时间段"
                                                format={customFormat}
                                            />
                                    </Form.Item>
                                    </ConfigProvider>
                                </Col>

                                <Col xs={12} sm={6} md={4} lg={4}>
                                    <ConfigProvider locale={locale}>
                                        <Form.Item label="聚合方式" name="aggregateDimension" rules={[{ required: true, message: '聚合方式必选' }]}>
                                            <Select
                                                placeholder="请选择聚合方式"
                                                allowClear
                                                options={[
                                                    {label:'员工+作业环节', value:'process'},
                                                    {label:'员工+作业岗位', value:'position'},
                                                ]}
                                            >
                                            </Select>
                                        </Form.Item>
                                    </ConfigProvider>
                                </Col>

                                <Col xs={12} sm={6} md={4} lg={2}>
                                    <ConfigProvider locale={locale}>
                                        <Form.Item label="是否跨岗支援" name="isCrossPosition" rules={[{ required: true, message: '是否跨岗支援必选' }]}>
                                            <Select
                                                placeholder="请选择"
                                                allowClear
                                                options={[
                                                    {label:'是', value:"cross"},
                                                    {label:'否', value:"noCross"},
                                                    {label:'都包括', value:'all'},
                                                ]}
                                            >
                                            </Select>
                                        </Form.Item>
                                    </ConfigProvider>
                                </Col>

                                <Col xs={12} sm={6} md={4} lg={4}>
                                    <ConfigProvider locale={locale}>
                                        <Form.Item label="员工工号" name="employeeNumber" >

                                            <Input
                                                placeholder="请输入员工工号"
                                                allowClear
                                            />
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
                                <h3 style={{ margin: 0 }}>个人人效列表</h3>
                            </div>
                        </div>

                        <Spin spinning={loading} tip="数据加载中...">
                            <Table
                                columns={columns}
                                dataSource={efficiencyData}
                                pagination={{
                                    pageSize: 20,
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
