import React, {useState} from 'react';
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
    Radio, Select
} from 'antd';
import {Content} from "antd/es/layout/layout";
import locale from "antd/locale/zh_CN";

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
    const [baseInfoForm] = Form.useForm();

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

    const submitBaseInfo  =  async (values) => {

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
                                initialValues={{
                                    // operateDay: dayjs('2025-05-28'),
                                    // employeeNumber: 'A1001',
                                }}
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
                                <Form.Item>
                                    <Button type="primary">Submit</Button>
                                </Form.Item>
                            </Form>
                        </Flex>
                    </div>
                    <div hidden={!processManagementShow}>
                        <Splitter style={{height: 200, boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)'}}>
                            <Splitter.Panel defaultSize="40%" min="20%" max="70%">

                            </Splitter.Panel>
                            <Splitter.Panel>

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
            </Layout>
        </>
    )
}

export default ProcessCreate;