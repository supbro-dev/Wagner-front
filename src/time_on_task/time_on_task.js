import {
    Breadcrumb,
    Button,
    Card,
    Col,
    ConfigProvider, DatePicker,
    Form,
    Input,
    Layout,
    message,
    Row,
    Select,
    Spin,
    Table
} from "antd";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";
import {Content} from "antd/es/layout/layout";
import { gantt } from 'dhtmlx-gantt';
import dayjs from "dayjs";
import locale from "antd/locale/zh_CN";
import React, {useState, useRef, useEffect} from "react";

const dateFormat = 'YYYY-MM-DD'
const customFormat = value => `${value.format(dateFormat)}`;

function App() {
    const ganttContainer = useRef(null);

    const [loading, setLoading] = useState(false);

    const [form] = Form.useForm();

    const fetchData =  async (values) => {
        setLoading(true);
        try {
            const {
                employeeNumber,
                date,
            } = values

            const response = await fetch(`/api/v1/efficiency/timeOnTask?employeeNumber=${employeeNumber}&operateDay=${date.format(dateFormat)}`);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            console.log('后端返回数据:', data);
        } catch (error) {
            console.error('请求出错:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        form.resetFields();
        message.info('已重置筛选条件');
    };

    useEffect(() => {
        // 初始化甘特图
        gantt.init(ganttContainer.current);

        // 设置时间轴为小时单位
        gantt.config.scales = [
            {unit: "day", format: "%F %d"},
            {unit: "hour", step: 3, format: "%H:%i"}
        ];
        // gantt.config.scale_unit = "hour";
        // gantt.config.step = 1;
        // gantt.config.min_column_width = 30;
        // gantt.config.date_scale = "%H:%i";
        // gantt.config.duration_unit = "hour"; // 设置持续时间为小时

        // 设置时间轴范围（24小时）
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 从今天的00:00开始

        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 1); // 到明天的00:00（即24小时）

        gantt.config.start_date = today;
        gantt.config.end_date = endDate;


        // 解析数据
        gantt.parse({
            data: [
                {"id":2, "text":"Project #1", "start_date":"13-06-2025", "duration":"1",  "open": true},
                {"id":1, "text":"Project #2", "start_date":"13-06-2025", "duration":"18", "open": true},
            ],
        });

        // 组件卸载时销毁甘特图
        return () => {
            if (ganttContainer.current) {
                gantt.destroy();
            }
        };
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
                            <strong>TimeOnTask</strong>
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
                                        <Form.Item label="员工工号" name="employeeNumber" rules={[{ required: true, message: '员工工号必填' }]}>

                                            <Input
                                                placeholder="请输入员工工号"
                                                allowClear
                                            />
                                        </Form.Item>
                                    </ConfigProvider>
                                </Col>


                                <Col xs={12} sm={6} md={4} lg={4}>
                                    <ConfigProvider locale={locale}>
                                        <Form.Item label="日期" name="date" rules={[{ required: true, message: '日期必选' }]}>
                                            <DatePicker
                                                placeholder="请选择日期"
                                                format={customFormat}
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
                        <div
                            ref={ganttContainer}
                            style={{ width: '100%', height: '500px' }}
                        ></div>
                    </Card>
                </Content>
            </Layout>
        </div>
    );
}
export default App;