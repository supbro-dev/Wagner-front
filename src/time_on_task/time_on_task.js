import {
    Breadcrumb,
    Button,
    Card,
    Col,
    ConfigProvider,
    DatePicker,
    Form,
    Input,
    Layout,
    message,
    Row,
    Statistic
} from "antd";
import "dhtmlx-gantt/codebase/dhtmlxgantt.css";
import {Content} from "antd/es/layout/layout";
import {gantt} from 'dhtmlx-gantt';
import dayjs from "dayjs";
import locale from "antd/locale/zh_CN";
import React, {useEffect, useRef, useState} from "react";

const dateFormat = 'YYYY-MM-DD'
const dateTimeFormat = 'YYYY-MM-DD HH:mm:ss'
const timeFormat = 'HH:mm'
const customFormat = value => `${value.format(dateFormat)}`;

const statisticFormat = value => {
    if (!value) {
        return ""
    } else {
        return value
    }
};

function getMinutes(time1, time2) {
    return (time2 - time1) / (1000 * 60)
}

function initGantt(ganttContainer, isGanttInitialized, operateDay, ganttContainer2) {
    if (isGanttInitialized) {
        gantt.clearAll()
    }

    gantt.setSkin("meadow");
    window.gantt.templates.task_class = function(start, end, task) {
        switch (task.actionType) {
            case "排班":
                return 'scheduling-row'
            case "考勤":
                return 'attendance-row'
            case "直接作业":
                return 'direct-work-row'
            case "间接作业":
                return 'indirect-work-row'
            case "闲置":
                return 'idle-row'
            default:
                return 'default-row'
        }
    };

    // window.gantt.templates.task_row_class = function(start, end, task) {
    //     switch (task.actionType) {
    //         case "排班":
    //             return 'scheduling-row'
    //         default:
    //             return 'default-row'
    //     }
    // };

    gantt.config.start_date = new Date(operateDay);
    gantt.config.end_date = new Date(operateDay).setDate(gantt.config.start_date.getDate() + 1);

    // 设置时间轴为小时单位
    gantt.config.scales = [
        {unit: "day", format: "%m-%d"},
        {unit: "hour", step: 1, format: "%G"}
    ];

    gantt.config.date_format = "%Y-%m-%d %H:%i:%s";

    gantt.config.columns = [
        {name: "processName", label: "环节", tree: false, width: "*"},
        {name: "actionType", label: "类型", tree: false, width: "*"},
        {name: "workplaceName", label: "工作点", tree: false, width: "120"},
        {name: "startTime", label: "开始时间", align: "center", width: "120"},
        {name: "endTime", label: "结束时间", align: "center", width: "120"},

    ];

    const secondGridColumns = {
        columns: [
            {name: "duration", label: "持续时间(分钟)", min_width: "120", align: "center"},
            {name: "workLoadDesc", label: "工作量", min_width: "120", align: "center"},
        ]
    };

    gantt.config.layout = {
        css: "gantt_container",
        rows: [
            {
                cols: [
                    {view: "grid", width: 400, scrollY: "scrollVer"},
                    {resizer: true, width: 1},
                    {view: "timeline", scrollX: "scrollHor", scrollY: "scrollVer"},
                    {resizer: true, width: 1},
                    {view: "grid", width: 240, bind: "task", scrollY: "scrollVer", config: secondGridColumns},
                    {view: "scrollbar", id: "scrollVer"}
                ]

            },
            {view: "scrollbar", id: "scrollHor", height: 20}
        ]
    };
    gantt.config.duration_unit = "minute"; // 设置持续时间为小时

    if (!isGanttInitialized) {
        gantt.init(ganttContainer.current);
    }

}

function convertActionType(actionType) {
    switch (actionType) {
        case "DirectWork":
            return "直接作业"
        case "IndirectWork":
            return "间接作业"
        case "Attendance":
            return "考勤"
        case "Scheduling":
            return "排班"
        case "Rest":
            return "休息"
        case "Idle":
            return "闲置"
        default:
            return "未知"
    }
}

function initData(data) {
    var ganttData = [];
    // 初始化排班
    if (data.scheduling) {
        ganttData.push(
            {
                processName: '排班',
                text: "",
                actionType: convertActionType(data.scheduling.actionType),
                workplaceName: data.workplaceName,
                startTime: dayjs(new Date(data.scheduling.startTime)).format(timeFormat),
                endTime: dayjs(new Date(data.scheduling.endTime)).format(timeFormat),
                start_date: dayjs(new Date(data.scheduling.startTime)).format(dateTimeFormat),
                duration: getMinutes(new Date(data.scheduling.startTime), new Date(data.scheduling.endTime)),
                open: true,
            })
    }


    // 初始化考勤
    if (data.attendance) {
        ganttData.push(
            {
                processName: '考勤',
                text: "",
                actionType: convertActionType(data.attendance.actionType),
                workplaceName: data.workplaceName,
                startTime: dayjs(new Date(data.attendance.startTime)).format(timeFormat),
                endTime: dayjs(new Date(data.attendance.endTime)).format(timeFormat),
                start_date: dayjs(new Date(data.attendance.startTime)).format(dateTimeFormat),
                duration: getMinutes(new Date(data.attendance.startTime), new Date(data.attendance.endTime)),
                open: true,
            })
    }

    if (data.processDurationList && data.processDurationList.length > 0) {
        for (let i = 0; i < data.processDurationList.length; i++) {
            var processDuration = data.processDurationList[i];
            ganttData.push(
                {
                    processName: processDuration.processName,
                    text: "",
                    actionType: convertActionType(processDuration.actionType),
                    workplaceName: processDuration.workplaceName,
                    startTime: dayjs(new Date(processDuration.startTime)).format(timeFormat),
                    endTime: dayjs(new Date(processDuration.endTime)).format(timeFormat),
                    start_date: dayjs(new Date(processDuration.startTime)).format(dateTimeFormat),
                    duration: processDuration.duration,
                    open: true,
                }
            )
        }
    }

    return ganttData
}


function App() {
    const [employee, setEmployee] = useState({});
    const ganttContainer = useRef(null);
    const ganttContainer2 = useRef(null);
    const [isGanttInitialized, setIsGanttInitialized] = useState(false);

    const [loading, setLoading] = useState(false);

    const [form] = Form.useForm();

    const fetchData =  async (values) => {
        setLoading(true);
        try {
            const {
                employeeNumber,
                operateDay,
            } = values

            const response = await fetch(`/api/v1/efficiency/timeOnTask?employeeNumber=${employeeNumber}&operateDay=${operateDay.format(dateFormat)}`);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();
            const workplaceName = data.data.workplaceName

            setEmployee({
                employeeNumber : data.data.employeeNumber,
                employeeName : data.data.employeeName,
                workplaceName :workplaceName,
                regionCode : data.data.regionCode,
                operateDay: dayjs(new Date(data.data.operateDay)).format(dateFormat),
            })

            // 初始化甘特图
            initGantt(ganttContainer, isGanttInitialized, data.data.operateDay, ganttContainer2);
            // 初始化数据
            var ganttData = initData(data.data)

            // 解析数据
            gantt.parse({
                data: ganttData,
            });

            setIsGanttInitialized(true)


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
                    <Card>
                        <Form
                            form={form}
                            // layout="inline"
                            onFinish={fetchData}

                            size={'middle'}
                            autoComplete="off"
                            initialValues={{
                                operateDay: dayjs('2025-05-28'),
                                employeeNumber: 'A1001',
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
                                        <Form.Item label="日期" name="operateDay" rules={[{ required: true, message: '日期必选' }]}>
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
                    <Card>
                        <Row gutter={20}>
                            <Col span={4}>
                                <Statistic title="员工姓名" value={employee.employeeName} formatter={statisticFormat}/>
                            </Col>
                            <Col span={4}>
                                <Statistic title="员工工号" value={employee.employeeNumber} />
                            </Col>
                            <Col span={4}>
                                <Statistic title="工作点" value={employee.workplaceName} />
                            </Col>
                            <Col span={4}>
                                <Statistic title="区域" value={employee.regionCode} />
                            </Col>
                            <Col span={4}>
                                <Statistic title="作业日期" value={employee.operateDay} />
                            </Col>
                        </Row>
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