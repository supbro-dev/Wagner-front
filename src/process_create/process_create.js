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
    Radio, Select, message, Tree, Table
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
    const [baseInfoForm] = Form.useForm();
    const [processTableData, setProcessTableData] = useState([])
    const [isSearching, setIsSearching] = useState(false)

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

    const onSelectTreeNode = async (selectedKeys) => {

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
                                />
                            </Splitter.Panel>
                            <Splitter.Panel>
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
                        <Flex style={boxStyle} justify={'flex-end'} align={'center'}>
                            <Button type="default" onClick={prev}>上一步</Button>
                            <Button type="primary" onClick={next}>下一步</Button>
                        </Flex>
                    </ConfigProvider>
                </Footer>
            </Layout>
        </>
    )
}

export default ProcessCreate;