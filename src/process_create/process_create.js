import React, {useEffect, useState} from 'react';
import {
    Breadcrumb, Button,
    Col,
    ConfigProvider,
    DatePicker,
    Flex,
    Form,
    Input,
    Layout,
    Row,
    Splitter,
    Steps,
    Typography,
    Radio, Select, message, Tree, Table, Space, Modal, Popconfirm, Divider
} from 'antd';
import {Content, Footer} from "antd/es/layout/layout";
import locale from "antd/locale/zh_CN";
import {Link, useLocation} from "react-router-dom";


const stepItems = [
    {
        title: '基本信息',
    },
    {
        title: '环节管理',
    },
    {
        title: '默认配置',
    },
]

const boxStyle = {
    width: '100%',
    height: '100%',
};


function ProcessCreate() {
    const [baseInfoForm] = Form.useForm();
    const [positionForm] = Form.useForm()
    const [processForm] = Form.useForm()
    const [otherParamForm] = Form.useForm()

    const [processImpl, setProcessImpl] = useState({})

    const [messageApi, contextHolder] = message.useMessage();
    const [baseInfoShow, setBaseInfoShow] = useState(true);
    const [processManagementShow, setProcessManagementShow] = useState(false);
    const [otherParamsShow, setOtherParamsShow] = useState(false);
    const [finishShow, setFinishShow] = useState(false);
    const [currentStep, setCurrentStep] = useState(0)
    const [workplaces, setWorkplaces] = useState([])
    const [industries, setIndustries] = useState([])
    const [subIndustries, setSubIndustries] = useState([])
    const [positions, setPositions] = useState([])
    const [showWorkplace, setShowWorkplace] = useState(false)
    const [showIndustry, setShowIndustry] = useState(false)
    const [showSubIndustry, setShowSubIndustry] = useState(false)
    const [treeData, setTreeData] = useState([])

    const [selectTreeNodeKey, setSelectTreeNodeKey] = useState(null)
    const [processTableData, setProcessTableData] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [isPositionModalOpen, setIsPositionModalOpen] = useState(false)
    const [isCreatePosition, setIsCreatePosition] = useState(true)
    const [showPosition, setShowPosition] = useState(false)

    const [isCreateProcess, setIsCreateProcess] = useState(false)
    const [isProcessModelOpen, setIsProcessModelOpen] = useState(false)
    const [isFinishModelOpen, setIsFinishModelOpen] = useState(false)

    const location = useLocation();
    // 使用 URLSearchParams 解析查询字符串
    const queryParams = new URLSearchParams(location.search);
    let id = queryParams.get('id');



    const error = (msg) => {
        messageApi.error(msg);
    };

    const success = (msg, duration) => {
        messageApi.success(msg, duration);
    };


    const hideAll = () => {
        setBaseInfoShow(false)
        setProcessManagementShow(false)
        setOtherParamsShow(false)
        setFinishShow(false)
    }

    const onChangeStep = (current) => {
        setCurrentStep(current)
        hideAll()
        switch (current) {
            case 0:
                setBaseInfoShow(true)
                break
            case 1:
                setProcessManagementShow(true)
                break
            case 2:
                setOtherParamsShow(true)
                fetchCalcParam()
                break
            case 3:
                setFinishShow(true)
                break
            default:
                hideAll()
        }
    }

    const initProcessPositionTree = async (id) => {
        try {
            const response = await fetch('/api/v1/process/getProcessPositionTree?id=' + id);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            setTreeData([data.data])

        } catch (error) {
            console.error('获取环节组织架构树失败:', error);
        }
    }

    const submitBaseInfo  =  () => {
        baseInfoForm.validateFields()
            .then(values => {
                const postData = {
                    ...values,
                }

                if (id) {
                    postData.id = id
                }
                fetch('/api/v1/process/save', {
                    method: 'POST', // 指定请求方法为POST
                    headers: {
                        'Content-Type': 'application/json', // 设置内容类型为JSON
                    },
                    body: JSON.stringify(postData),
                })
                    .then(response => response.json()) // 将响应解析为JSON
                    .then(data => {
                        if (data.code != 0) {
                            error(data.msg)
                        } else {
                            id = data.data
                            onChangeStep(1)
                            initProcessPositionTree(id)
                        }
                    })
                    .catch((error) => {
                        error(error)
                        console.error('Error:', error);
                    });
            })
            .catch(errorInfo => {
                console.log('验证失败:', errorInfo);
            });
    }

    const changeTargetType = (targetType) => {
        switch (targetType) {
            case 'workplace':
                setShowWorkplace(true)
                setShowIndustry(false)
                setShowSubIndustry(false)
                break;
            case 'industry' :
                setShowWorkplace(false)
                setShowIndustry(true)
                setShowSubIndustry(false)
                break;
            case 'subIndustry' :
                setShowWorkplace(false)
                setShowIndustry(true)
                setShowSubIndustry(true)
                break;
            default:
                setShowWorkplace(false)
                setShowIndustry(false)
                setShowSubIndustry(false)
        }
    }

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
            console.error('获取行业失败:', error);
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
            console.error('获取子行业失败:', error);
        }
    }

    const fetchPosition = async () => {
        try {
            const response = await fetch('/api/v1/position/findAll');
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            setPositions(data.data)
        } catch (error) {
            console.error('获取岗位失败:', error);
        }
    }

    const fetchCalcParam = async () => {
        try {
            const response = await fetch('/api/v1/efficiency/findCalcParamByImplementationId?id=' + id);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();
            otherParamForm.setFieldsValue(data.data)
        } catch (error) {
            console.error('获取岗位失败:', error);
        }
    }

    const getProcessImpl = async (id) => {
        try {
            const response = await fetch('/api/v1/process/getImplementationById?id=' + id);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            setProcessImpl(data.data)
            changeTargetType(data.data.targetType)
            baseInfoForm.setFieldsValue(data.data)
        } catch (error) {
            console.error('获取环节实施失败:', error);
        }
    }


    const next = () => {
        const current = currentStep
        if (current === 0){
            submitBaseInfo()
            onChangeStep(1)
        } else if (current === 1) {
            onChangeStep(2)
        } else if (current === 2) {
            submitOtherParam()
        }
    }

    const prev = () => {

    }

    const createProcess = (value) => {
        processForm.resetFields()
        processForm.setFieldsValue({
            parentPositionName:value.title,
            parentPositionCode:value.key,
        })
        setIsCreateProcess(true)
        setIsProcessModelOpen(true)
    }

    const importProcess = () => {

    }

    const onSelectTreeNode = async (selectedKeys, e) => {
        if (selectedKeys && selectedKeys.length > 0) {
            setSelectTreeNodeKey(selectedKeys)
        } else {
            selectedKeys = selectTreeNodeKey
        }
        try {
            const response = await fetch(`/api/v1/process/findProcessByParentProcessCode?processCode=${selectedKeys}&processImplId=${id}`);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            setProcessTableData(data.data)
        } catch (error) {
            console.error('查询环节列表失败:', error);
        }
    }

    const submitPosition = async () => {
        positionForm.validateFields()
            .then(values => {
                const postData = values
                if (id) {
                    postData.processImplId = parseInt(id)
                }

                // 手动设置岗位名称到form
                if (values.type === 'POSITION') {
                    for (const i in positions) {
                        if (positions[i].value === postData.code) {
                            postData.name = positions[i].label
                        }
                    }
                }

                fetch('/api/v1/process/saveProcessPosition', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // 设置内容类型为JSON
                    },
                    body: JSON.stringify(postData),
                })
                    .then(response => response.json()) // 将响应解析为JSON
                    .then(data => {
                        if (data.code != 0) {
                            error(data.msg)
                        } else {
                            // 清空表单
                            positionForm.resetFields()
                            setIsPositionModalOpen(false)
                            initProcessPositionTree(id)
                        }
                    })
                    .catch((err) => {
                        error(err)
                        console.error('Error:', err);
                    });
            })
            .catch(errorInfo => {
                console.log('验证失败:', errorInfo);
            });
    }

    const operateAddLevel = (parent, addLevelType) => {
        positionForm.resetFields()
        setIsPositionModalOpen(true)
        setIsCreatePosition(true)
        const levelFormData = {
            parentPositionName:parent.title,
            parentPositionCode:parent.key,
            addLevelType:addLevelType,
            type:'DEPT',
        }
        positionForm.setFieldsValue(levelFormData)
    }

    const operateEditLevel = (self, addLevelType) => {
        positionForm.resetFields()
        setIsPositionModalOpen(true)
        setIsCreatePosition(false)
        if (self.type === 'POSITION') {
            setShowPosition(true)
        } else {
            setShowPosition(false)
        }
        const levelFormData = {
            ...self,
            addLevelType:addLevelType,
            processName:self.title,
            processCode:self.key,
            parentPositionName:self.parentName,
            parentPositionCode:self.parentCode,
        }
        positionForm.setFieldsValue(levelFormData)
    }

    const deletePosition = async (values) => {
        fetch('/api/v1/process/deleteProcessPosition', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // 设置内容类型为JSON
            },
            body: JSON.stringify({
                id: values.id,
            }),
        })
            .then(response => response.json()) // 将响应解析为JSON
            .then(data => {
                if (data.code != 0) {
                    error(data.msg)
                } else {
                    initProcessPositionTree(id)
                    onSelectTreeNode([])
                }
            })
            .catch((err) => {
                error(err)
                console.error('Error:', err);
            });
    }

    const onGenerateCode = async (form, propName, propCode) => {
        const name = form.getFieldValue(propName)
        try {
            const response = await fetch(`/api/v1/process/generateProcessCode?processName=${name}&processImplId=${id}`);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            form.setFieldValue(propCode, data.data)
        } catch (error) {
            console.error('生成环节编码失败:', error);
        }
    }

    const renderTreeNode = (value) => {
        const showAddSameLevel = value.type !== 'ROOT'
        const showAddNextLevel = value.type !== 'POSITION'
        const showDelete = value.type !== 'ROOT'
        const showEdit = value.type !== 'ROOT'
        const showCreateProcess = value.type === 'POSITION'

        return (
            <div >
                <Space>
                    <span>{value.title}</span>
                    <Typography.Link hidden={!showAddNextLevel} onClick={() => {operateAddLevel(value, 'nextLevel')}}>添加下级</Typography.Link>
                    <Typography.Link hidden={!showAddSameLevel} onClick={() => {operateAddLevel(value, 'sameLevel')}}>添加同级</Typography.Link>
                    <Typography.Link hidden={!showEdit} onClick={() => {operateEditLevel(value, 'nextLevel')}}>编辑</Typography.Link>
                    <Typography.Link hidden={!showCreateProcess} onClick={() => {createProcess(value)}}>新增环节</Typography.Link>
                    <Popconfirm
                        title="请确认"
                        description={value.type === 'POSITION' ? "确认删除此岗位吗?" : "确认删除该部门吗?"}
                        onConfirm={() =>{deletePosition(value)}}
                        okText="确定"
                        cancelText="取消"
                    >
                        <Typography.Link hidden={!showDelete} >删除</Typography.Link>
                    </Popconfirm>

                </Space>
            </div>
        )
    };

    const submitProcess = async (values) => {
        processForm.validateFields()
            .then(values => {
                const postData = values
                if (id) {
                    postData.processImplId = parseInt(id)
                }

                fetch('/api/v1/process/saveProcess', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // 设置内容类型为JSON
                    },
                    body: JSON.stringify(postData),
                })
                    .then(response => response.json()) // 将响应解析为JSON
                    .then(data => {
                        if (data.code != 0) {
                            error(data.msg)
                        } else {
                            // 清空表单
                            processForm.resetFields()
                            setIsProcessModelOpen(false)
                            onSelectTreeNode(selectTreeNodeKey)
                        }
                    })
                    .catch((err) => {
                        error(err)
                        console.error('Error:', err);
                    });
            })
            .catch(errorInfo => {
                console.log('验证失败:', errorInfo);
            });

    }

    const editProcess = (values) => {
        processForm.setFieldsValue({
            ...values,
            parentPositionCode: values.parentCode,
        })
        setIsCreateProcess(false)
        setIsProcessModelOpen(true)
    }

    const processTableColumns = [
        {title:"id", dataIndex: "id", key: "id", hidden:true},
        { title: '环节名称', dataIndex: 'name', key: 'name' },
        { title: '环节编码', dataIndex: 'code', key: 'code' },
        { title: '环节类型', dataIndex: 'typeDesc', key: 'typeDesc' },
        { title: '匹配脚本', dataIndex: 'script', key: 'script' },
        { title: '作业最长时间(分钟)', dataIndex: 'maxTimeInMinuteDesc', key: 'maxTimeInMinuteDesc' },
        { title: '作业最小空闲时间(分钟)', dataIndex: 'minIdleTimeInMinuteDesc', key: 'minIdleTimeInMinuteDesc' },
        { title: '是否向上汇总', dataIndex: 'workLoadRollUpDesc', key: 'workLoadRollUpDesc' },
        { title: '操作', dataIndex: 'operation', key: 'operation', render: (value,record) => {
                return (
                    <Space>
                        <Typography.Link onClick={() => {editProcess(record)}}>编辑</Typography.Link>
                        <Popconfirm
                            title="请确认"
                            description={"确定删除该环节吗？"}
                            onConfirm={() =>{deletePosition(record)}}
                            okText="确定"
                            cancelText="取消"
                        >
                            <Typography.Link>删除</Typography.Link>
                        </Popconfirm>
                    </Space>
                )
            },},
    ]
    const submitOtherParam = async () => {
        otherParamForm.validateFields()
            .then(values => {
                const postData = values
                if (id) {
                    postData.processImplId = parseInt(id)
                }

                fetch('/api/v1/efficiency/saveOtherParams', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // 设置内容类型为JSON
                    },
                    body: JSON.stringify(postData),
                })
                    .then(response => response.json()) // 将响应解析为JSON
                    .then(data => {
                        if (data.code != 0) {
                            error(data.msg)
                        } else {
                            setIsFinishModelOpen(true)
                        }
                    })
                    .catch((err) => {
                        error(err)
                        console.error('Error:', err);
                    });
            })
            .catch(errorInfo => {
                console.log('验证失败:', errorInfo);
            });
    }


    // 初始化数据
    useEffect(() => {
        getProcessImpl(id)
        fetchWorkplace();
        fetchIndustry()
        fetchSubIndustry()
        fetchPosition()
    }, []);


    return (
        <>
            <Layout >
                <Content style={{ padding: '0 48px' }}>
                    {/* 面包屑导航 */}
                    <Breadcrumb>
                        <Breadcrumb.Item>
                            <span>首页</span>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <span>环节实施</span>
                        </Breadcrumb.Item>
                        <Breadcrumb.Item>
                            <strong>环节管理</strong>
                        </Breadcrumb.Item>
                    </Breadcrumb>
                    <Steps
                        current={currentStep}
                        items={stepItems}
                        onChange={onChangeStep}
                    />
                    <div hidden={!baseInfoShow}>
                        <Flex style={boxStyle} justify={'center'} align={'flex-start'}>
                            <Form
                                form={baseInfoForm}
                                layout="horizontal"
                                onFinish={submitBaseInfo}
                                size='middle'
                                style={{ maxWidth: 600 }}
                                autoComplete="off"
                            >
                                <ConfigProvider locale={locale}>
                                <Form.Item label="实施名称" name="name" rules={[{ required: true, message: '实施名称必填' }]}>
                                    <Input
                                        placeholder="请输入名称"
                                        allowClear
                                    />
                                </Form.Item>
                                </ConfigProvider>
                                <ConfigProvider locale={locale}>
                                    <Form.Item label="实施编码" name="code" rules={[{ required: true, message: '实施编码必填' }]}>
                                        <Input
                                            placeholder="请输入唯一实施编码"
                                            allowClear
                                        />
                                    </Form.Item>
                                </ConfigProvider>
                                <ConfigProvider locale={locale}>
                                    <Form.Item label="实施目标类型" name="targetType" rules={[{ required: true, message: '实施目标类型必选' }]}>
                                        <Select
                                            placeholder="请选择工作点"
                                            allowClear
                                            options={[
                                                {label:'行业', value:'industry'},
                                                {label:'子行业', value:'subIndustry'},
                                                {label:'工作点', value:'workplace'},
                                            ]}
                                            onChange={changeTargetType}
                                        />
                                    </Form.Item>
                                </ConfigProvider>
                                <ConfigProvider locale={locale}>
                                    <Form.Item label="行业" name="targetCode" hidden={!showIndustry} rules={[{ required: true, message: '行业必选' }]}>
                                        <Select
                                            placeholder="请选择行业"
                                            allowClear
                                            options={industries}
                                        />
                                    </Form.Item>
                                </ConfigProvider>
                                <ConfigProvider locale={locale}>
                                    <Form.Item label="子行业" name="targetCode" hidden={!showSubIndustry} rules={[{ required: true, message: '子行业必选' }]}>
                                        <Select
                                            placeholder="请选择子行业"
                                            allowClear
                                            options={subIndustries}
                                        />
                                    </Form.Item>
                                </ConfigProvider>
                                <ConfigProvider locale={locale}>
                                    <Form.Item label="工作点" name="targetCode" hidden={!showWorkplace} rules={[{ required: true, message: '工作点必选' }]}>
                                        <Select
                                            placeholder="请选择工作点"
                                            allowClear
                                            options={workplaces}
                                        />
                                    </Form.Item>
                                </ConfigProvider>
                            </Form>
                        </Flex>
                    </div>
                    <div hidden={!processManagementShow}>
                        <Splitter style={{boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'}}>
                            <Splitter.Panel defaultSize="25%" min="20%" max="70%">
                                <Tree
                                    defaultExpandAll={true}
                                    onSelect={onSelectTreeNode}
                                    treeData={treeData}
                                    titleRender={renderTreeNode}
                                />
                            </Splitter.Panel>
                            <Splitter.Panel>
                                <Flex justify={'flex-end'} align={'center'}>
                                    <Button type="primary" onClick={importProcess}>导入</Button>
                                </Flex>
                                <ConfigProvider locale={locale}>
                                    <Table
                                        columns={processTableColumns}
                                        dataSource={processTableData}
                                        rowKey="key"
                                        locale={{
                                            emptyText: isSearching ? '没有找到匹配的数据' : '暂无数据'
                                        }}
                                    />
                                </ConfigProvider>
                            </Splitter.Panel>
                        </Splitter>
                    </div>
                    <div hidden={!otherParamsShow}>
                        <Flex style={boxStyle} justify={'center'} align={'flex-start'}>
                            <Form
                                form={otherParamForm}
                                layout="horizontal"
                                onFinish={submitOtherParam}
                                size='middle'
                                style={{ maxWidth: 600 }}
                                autoComplete="off"
                            >
                                <Form.Item label="processImplId" name="processImplId" hidden={true}>
                                    <Input

                                    />
                                </Form.Item>
                                <Typography.Title level={3} style={{ margin: 0 }}>
                                    考勤配置
                                </Typography.Title>
                                <ConfigProvider locale={locale}>
                                    <Form.Item label="考勤缺卡惩罚时长(小时)" name="attendanceAbsencePenaltyHour" rules={[{ required: true, message: '考勤缺卡惩罚时长必填' }]} tooltip={"考勤缺卡时当天最长的出勤时长限制"}>
                                        <Input
                                            placeholder="请输入考勤缺卡惩罚时长(小时)"
                                            allowClear
                                        />
                                    </Form.Item>
                                </ConfigProvider>
                                <ConfigProvider locale={locale}>
                                    <Form.Item label="最大开班时长(分钟)" name="maxRunUpTimeInMinute" rules={[{ required: true, message: '最大开班时长必填' }]} tooltip={"上班打卡到第一次作业开始允许的最长时间，超过该时长则认为是闲置"}>
                                        <Input
                                            placeholder="请输入最大开班时长(分钟)"
                                            allowClear
                                        />
                                    </Form.Item>
                                </ConfigProvider>
                                <Typography.Title level={3} style={{ margin: 0 }}>
                                    作业配置
                                </Typography.Title>
                                <ConfigProvider locale={locale}>
                                    <Form.Item label="工作量统计单位" name="workLoadUnits" rules={[{ required: true, message: '工作量统计单位必填' }]} tooltip={"请填写直接作业中工作量的名称(中文:英文)，需要与直接作业数据中记录的单位保持一致。例如：件数:itemNum,SKU数:skuNum"}>
                                        <Input
                                            placeholder="请输入工作量统计单位"
                                            allowClear
                                        />
                                    </Form.Item>
                                </ConfigProvider>
                                <ConfigProvider locale={locale}>
                                    <Form.Item label="数据回溯天数" name="lookBackDays" rules={[{ required: true, message: '回溯数据天数必填' }]} tooltip={"在当天完成的作业数据，如果时x天前开始的，则直接舍弃"}>
                                        <Input
                                            placeholder="请输入数据回溯天数"
                                            allowClear
                                        />
                                    </Form.Item>
                                </ConfigProvider>
                                <ConfigProvider locale={locale}>
                                    <Form.Item label="作业的默认最长时间(分钟)" name="defaultMaxTimeInMinute" rules={[{ required: true, message: '作业的默认最长时间必填' }]} tooltip={"直接/间接作业如果超过x分钟，则进行截断"}>
                                        <Input
                                            placeholder="请输入作业的默认最长时间"
                                            allowClear
                                        />
                                    </Form.Item>
                                </ConfigProvider>
                                <ConfigProvider locale={locale}>
                                    <Form.Item label="作业的默认最小空闲时间(分钟)" name="defaultMinIdleTimeInMinute" rules={[{ required: true, message: '作业的默认最小空闲时间必填' }]} tooltip={"两个作业之间如果有小于x分钟的空闲，则归属为前一个完成的作业时长"}>
                                        <Input
                                            placeholder="请输入作业的默认最小空闲时间"
                                            allowClear
                                        />
                                    </Form.Item>
                                </ConfigProvider>
                                <Typography.Title level={3} style={{ margin: 0 }}>
                                    聚合计算配置
                                </Typography.Title>
                                <ConfigProvider locale={locale}>
                                    <Form.Item label="跨小时作业的工作量记录方式" name="workLoadAggregateType" rules={[{ required: true, message: '跨小时作业的工作量记录方式必选' }]} tooltip={"一个作业时长超过一个小时，选择【结束小时】则工作量全部记录到作业结束的小时，选择【比例分摊】则工作量会按工作时长分摊到不同的小时中"}>
                                        <Select
                                            placeholder="请选择跨小时作业的工作量记录方式"
                                            allowClear
                                            options={[
                                                {label:'结束小时', value:'end'},
                                                {label:'比例分摊', value:'proportion'},
                                            ]}
                                        />
                                    </Form.Item>
                                </ConfigProvider>
                            </Form>
                        </Flex>
                    </div>
                </Content>

                <Footer>
                    <ConfigProvider locale={locale}>
                        {contextHolder}
                        <Flex style={boxStyle} justify={'flex-end'} align={'center'} gap={'small'}>
                            <Button type="default" onClick={prev}>上一步</Button>
                            <Button type="primary" onClick={next}>下一步</Button>
                        </Flex>
                    </ConfigProvider>
                </Footer>
            </Layout>

            <Modal
                title={isCreatePosition ? "新增组织层级" : "编辑组织层级"}
                closable={{ 'aria-label': 'Custom Close Button' }}
                open={isPositionModalOpen}
                footer={null}
            >
                <Form
                    form={positionForm}
                    layout="horizontal"
                    onFinish={submitPosition}
                    size='middle'
                    autoComplete="off"
                >
                    <Form.Item label="id" name="id" hidden={true}>
                        <Input
                            disabled={true}
                        />
                    </Form.Item>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="当前层级名称" name="parentPositionName" >
                            <Input
                                disabled={true}
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="当前层级编码" name="parentPositionCode" hidden={true}>
                            <Input
                                disabled={true}
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="添加位置" name="addLevelType" >
                            <Select
                                disabled={true}
                                options={[
                                    {label:'同级', value:'sameLevel'},
                                    {label:'下级', value:'nextLevel'},
                                ]}
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="类型" name="type" rules={[{ required: true, message: '类型必选' }]}>
                            <Select
                                disabled={!isCreatePosition}
                                allowClear
                                options={[
                                    {label:'部门', value:'DEPT'},
                                    {label:'岗位', value:'POSITION'},
                                ]}
                                onChange={(value) => {
                                    if (value === 'POSITION') {
                                        setShowPosition(true)
                                    } else {
                                        setShowPosition(false)
                                    }
                                }}
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="层级名称" name="name" rules={showPosition?[]:[{ required: true, message: '层级名称必填' }]} hidden={showPosition}>
                            <Input
                                placeholder="请输入唯一的层级名称"
                                allowClear
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="层级编码" name="code" rules={showPosition?[]:[{ required: true, message: '层级编码必填' }]} hidden={showPosition}>
                            <Input
                                disabled={!isCreatePosition}
                                placeholder="请输入唯一的层级编码"
                                allowClear
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="岗位" name="code" rules={!showPosition?[]:[{ required: true, message: '岗位必填' }]} hidden={!showPosition}>
                            <Select
                                placeholder="请选择岗位"
                                allowClear
                                options={positions}
                            />
                        </Form.Item>
                    </ConfigProvider>

                    <ConfigProvider locale={locale}>
                        <Form.Item label="排序" name="sortIndex" rules={[{ required: true, message: '排序必选' }]}>
                            <Select
                                placeholder="请选择顺序"
                                allowClear
                                options={[
                                    {label:'1', value:1},
                                    {label:'2', value:2},
                                    {label:'3', value:3},
                                    {label:'4', value:4},
                                    {label:'5', value:5},
                                    {label:'6', value:6},
                                    {label:'7', value:7},
                                    {label:'8', value:8},
                                    {label:'9', value:9},
                                    {label:'10', value:10},
                                ]}
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="是否向上汇总" name="workLoadRollUp" >
                            <Radio.Group
                                options={[
                                    {label:'是', value:'true'},
                                    {label:'否', value:'false'},
                                ]}
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                    <Form.Item label={null}>
                        <Flex justify={'flex-end'} align={'center'} gap={'small'}>
                            <Button htmlType="button" onClick={() => {onGenerateCode(positionForm, 'name', 'code')}}>
                                自动生成编码
                            </Button>
                            <Button type="primary" htmlType="submit" >
                                提交
                            </Button>
                            <Button htmlType="button" onClick={() => {
                                positionForm.resetFields()
                                setIsPositionModalOpen(false)
                            }}>
                                取消
                            </Button>
                        </Flex>
                    </Form.Item>
                    </ConfigProvider>
                </Form>
            </Modal>

            <Modal
                title={isCreateProcess ? "新增环节" : "编辑环节"}
                closable={{ 'aria-label': 'Custom Close Button' }}
                open={isProcessModelOpen}
                footer={null}
            >
                <Form
                    form={processForm}
                    layout="horizontal"
                    onFinish={submitProcess}
                    size='middle'
                    autoComplete="off"
                >
                    <Form.Item label="id" name="id" hidden={true}>
                        <Input
                            disabled={true}
                        />
                    </Form.Item>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="归属岗位编码" name="parentPositionCode" hidden={true}>
                            <Select
                                options={positions}
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="环节名称" name="name" rules={[{ required: true, message: '环节名称必填' }]}>
                            <Input
                                placeholder="请输入唯一的环节名称"
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="环节编码" name="code" rules={[{ required: true, message: '环节编码必填' }]}>
                            <Input
                                placeholder="请输入唯一的环节编码"
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="环节类型" name="type" rules={[{ required: true, message: '环节类型必选' }]}>
                            <Select
                                placeholder="请选择环节类型"
                                options={[
                                    {label:'直接作业', value:'DIRECT_PROCESS'},
                                    {label:'间接作业', value:'INDIRECT_PROCESS'},
                                ]}
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="匹配脚本" name="script"  rules={[{ required: true, message: '匹配脚本必填' }]}>
                            <Input
                                placeholder="请输入匹配脚本，需自行验证能否运行"
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="排序" name="sortIndex" rules={[{ required: true, message: '排序必选' }]}>
                            <Select
                                placeholder="请选择顺序"
                                allowClear
                                options={[
                                    {label:'1', value:1},
                                    {label:'2', value:2},
                                    {label:'3', value:3},
                                    {label:'4', value:4},
                                    {label:'5', value:5},
                                    {label:'6', value:6},
                                    {label:'7', value:7},
                                    {label:'8', value:8},
                                    {label:'9', value:9},
                                    {label:'10', value:10},
                                ]}
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <Divider />
                    <ConfigProvider locale={locale}>
                        <Form.Item label="作业最长时间(分钟)" name="maxTimeInMinute">
                            <Input
                                placeholder="请输入分钟数"
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="作业最小空闲时间(分钟)" name="minIdleTimeInMinute">
                            <Input
                                placeholder="请输入分钟数"
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="是否向上汇总" name="workLoadRollUp" >
                            <Radio.Group
                                options={[
                                    {label:'是', value:'true'},
                                    {label:'否', value:'false'},
                                ]}
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label={null}>
                            <Flex justify={'flex-end'} align={'center'} gap={'small'}>
                                <Button htmlType="button" onClick={() => {onGenerateCode(processForm, 'name', 'code')}}>
                                    自动生成编码
                                </Button>
                                <Button type="primary" htmlType="submit" >
                                    提交
                                </Button>
                                <Button htmlType="button" onClick={() => {
                                    processForm.resetFields()
                                    setIsProcessModelOpen(false)
                                }}>
                                    取消
                                </Button>
                            </Flex>
                        </Form.Item>
                    </ConfigProvider>
                </Form>
            </Modal>
            <Modal
                title={"环节实施完成"}
                closable={{ 'aria-label': 'Custom Close Button' }}
                open={isFinishModelOpen}
                footer={null}
            >
                点击跳转到<Link to="/processImplementation">环节实施列表</Link>
            </Modal>
        </>
    )
}

export default ProcessCreate;