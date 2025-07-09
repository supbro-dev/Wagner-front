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
    Radio, Select, message, Tree, Table, Space, Modal
} from 'antd';
import {Content, Footer} from "antd/es/layout/layout";
import locale from "antd/locale/zh_CN";
import {useLocation} from "react-router-dom";

const processTableColumns = [
    {title:"id", dataIndex: "id", key: "id", hidden:true},
    { title: '环节名称', dataIndex: 'processName', key: 'processName' },
    { title: '环节编码', dataIndex: 'processCode', key: 'processCode' },
    { title: '环节类型', dataIndex: 'typeDesc', key: 'typeDesc' },
    { title: '作业最长时间(分钟)', dataIndex: 'maxTimeInMinute', key: 'maxTimeInMinute' },
    { title: '作业最小空闲时间(分钟)', dataIndex: 'minIdleTimeInMinute', key: 'minIdleTimeInMinute' },
    { title: '匹配脚本', dataIndex: 'script', key: 'script' },
    { title: '是否向上汇总', dataIndex: 'workLoadRollUpDesc', key: 'workLoadRollUpDesc' },
    { title: '操作', dataIndex: 'operation', key: 'operation', render: (record) => {
            return (
                <Space>
                    <Typography.Link>编辑</Typography.Link>
                    <Typography.Link>删除</Typography.Link>
                </Space>
            )
        },},
]

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
    {
        title: '完成',
    },
]

const boxStyle = {
    width: '100%',
    height: '100%',
};


function ProcessCreate() {
    const [baseInfoForm] = Form.useForm();
    const [levelForm] = Form.useForm()

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
    const [showWorkplace, setShowWorkplace] = useState(false)
    const [showIndustry, setShowIndustry] = useState(false)
    const [showSubIndustry, setShowSubIndustry] = useState(false)
    const [treeData, setTreeData] = useState([])

    const [processTableData, setProcessTableData] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [editCode, setEditCode] = useState(true)

    const location = useLocation();
    // 使用 URLSearchParams 解析查询字符串
    const queryParams = new URLSearchParams(location.search);
    let id = queryParams.get('id');



    const error = (msg) => {
        messageApi.error(msg);
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
        if (current == 0){
            submitBaseInfo()
        }
    }

    const prev = () => {

    }

    const createProcess = () => {

    }

    const importProcess = () => {

    }

    const onSelectTreeNode = async (selectedKeys, e) => {
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

    const submitLevel = async () => {
        levelForm.validateFields()
            .then(values => {
                const postData = values
                if (id) {
                    postData.processImplId = parseInt(id)
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
                            levelForm.setFieldsValue({})
                            setIsCreateModalOpen(false)
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
        setIsCreateModalOpen(true)
        const levelFormData = {
            parentProcessName:parent.title,
            parentProcessCode:parent.key,
            addLevelType:addLevelType,
        }
        if (id) {
            levelFormData.id = id
        }
        levelForm.setFieldsValue(levelFormData)
    }

    const operateEditLevel = (self, addLevelType) => {
        setIsCreateModalOpen(true)
        setEditCode(false)
        const levelFormData = {
            ...self,
            addLevelType:addLevelType,
            processName:self.title,
            processCode:self.key,
            parentProcessName:self.parentName,
            parentProcessCode:self.parentCode,
        }
        levelForm.setFieldsValue(levelFormData)
    }

    const onGenerateCode = async () => {
        const name = levelForm.getFieldValue("processName")
        try {
            const response = await fetch(`/api/v1/process/generateProcessCode?processName=${name}&processImplId=${id}`);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            levelForm.setFieldValue("processCode", data.data)
        } catch (error) {
            console.error('生成环节编码失败:', error);
        }
    }

    const renderTreeNode = (value) => {
        const showAddSameLevel = value.type !== 'ROOT'
        const showAddNextLevel = value.type !== 'POSITION'
        const showDelete = value.type !== 'ROOT'
        const showEdit = value.type !== 'ROOT'

        return (
            <div >
                <Space>
                    <span>{value.title}</span>
                    <Typography.Link hidden={!showAddNextLevel} onClick={() => {operateAddLevel(value, 'nextLevel')}}>添加下级</Typography.Link>
                    <Typography.Link hidden={!showAddSameLevel} onClick={() => {operateAddLevel(value, 'sameLevel')}}>添加同级</Typography.Link>
                    <Typography.Link hidden={!showEdit} onClick={() => {operateEditLevel(value, 'nextLevel')}}>编辑</Typography.Link>
                    <Typography.Link hidden={!showDelete}>删除</Typography.Link>
                </Space>
            </div>
        )
    };

    // 初始化数据
    useEffect(() => {
        getProcessImpl(id)
        fetchWorkplace();
        fetchIndustry()
        fetchSubIndustry()
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
                                    <Button type="primary" onClick={createProcess}>新增环节</Button>
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
                        otherParamsShow
                    </div>
                    <div hidden={!finishShow}>
                        finishShow
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
                title="新增组织层级"
                closable={{ 'aria-label': 'Custom Close Button' }}
                open={isCreateModalOpen}
                footer={null}
            >
                <Form
                    form={levelForm}
                    layout="horizontal"
                    onFinish={submitLevel}
                    size='middle'
                    autoComplete="off"
                >
                    <Form.Item label="id" name="id" hidden={true}>
                        <Input
                            disabled={true}
                        />
                    </Form.Item>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="当前层级名称" name="parentProcessName" >
                            <Input
                                disabled={true}
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="当前层级编码" name="parentProcessCode" hidden={true}>
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
                        <Form.Item label="层级名称" name="processName" rules={[{ required: true, message: '层级名称必填' }]}>
                            <Input
                                placeholder="请输入唯一的层级名称"
                                allowClear
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="层级编码" name="processCode" rules={[{ required: true, message: '层级编码必填' }]}>
                            <Input
                                disabled={!editCode}
                                placeholder="请输入唯一的层级编码"
                                allowClear
                            />
                        </Form.Item>
                    </ConfigProvider>
                    <ConfigProvider locale={locale}>
                        <Form.Item label="类型" name="type" rules={[{ required: true, message: '类型必选' }]}>
                            <Select
                                disabled={!editCode}
                                allowClear
                                options={[
                                    {label:'部门', value:'dept'},
                                    {label:'岗位', value:'position'},
                                ]}
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
                            <Button htmlType="button" onClick={onGenerateCode}>
                                自动生成编码
                            </Button>
                            <Button type="primary" htmlType="submit" >
                                提交
                            </Button>
                            <Button htmlType="button" onClick={() => {
                                levelForm.setFieldsValue({})
                                setIsCreateModalOpen(false)
                            }}>
                                取消
                            </Button>
                        </Flex>
                    </Form.Item>
                    </ConfigProvider>
                </Form>
            </Modal>
        </>
    )
}

export default ProcessCreate;