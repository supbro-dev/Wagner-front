import {useEffect, useState} from 'react';
import {Bubble, Prompts, Sender} from '@ant-design/x';
import {CopyOutlined, FireOutlined, SmileOutlined, UserOutlined} from '@ant-design/icons';
import {Breadcrumb, Button, Flex, Layout, message, Space, Splitter, Table, theme, Tree, Typography} from "antd";
import {useLocation} from "react-router-dom";
import markdownit from 'markdown-it';
import {Content} from "antd/es/layout/layout";
import { Line } from '@ant-design/plots';
import LineChart from "@ant-design/plots/es/components/line";


const aiAvatar = {
    color: '#f56a00',
    backgroundColor: '#fde3cf',
};
const userAvatar = {
    color: '#fff',
    backgroundColor: '#87d068',
};

const md = markdownit({ html: true, breaks: true });


const Conversation = () => {
    const { token } = theme.useToken();
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [treeData, setTreeData] = useState([]);
    const [conversationList, setConversationList] = useState([]);
    const [workGroupCode, setWorkGroupCode] = useState('');
    const [messageApi, contextHolder] = message.useMessage();
    const [sessionId, setSessionId] = useState('');

    const [response, setResponse] = useState('');
    const [conversationId, setConversationId] = useState(null)

    // 临时窗口和标准数据
    const [showNewAiBubble, setShowNewAiBubble] = useState(false);
    const [showCurrentTable, setShowCurrentTable] = useState(false);
    const [showCurrentLineChart, setShowCurrentLineChart] = useState(false);

    const [tableDataSource, setTableDataSource] = useState([]);
    const [tableColumns, setTableColumns] = useState([]);

    const [lineChartConfig, setLineChartConfig] = useState({});

    const [showConfirmBubble, setShowConfirmBubble] = useState(false);
    const [confirmContent, setConfirmContent] = useState('')
    const [confirmTaskName, setConfirmTaskName] = useState('')
    const [confirmOptionList, setConfirmOptionList] = useState([])
    const [prompts, setPrompts] = useState([])
    const [showPrompts, setShowPrompts] = useState(false)

    // 标准化输出
    // 表格
    const [msgId2Data, setMsgId2Data] = useState({})

    const location = useLocation();
    // 使用 URLSearchParams 解析查询字符串
    const queryParams = new URLSearchParams(location.search);
    const workplaceCode = queryParams.get('workplaceCode');


    const error = (msg) => {
        messageApi.error(msg);
    };


    const onSelectTreeNode = (nodes, e) => {
        if (nodes.length === 0) {
            return
        }
        // 暂时只支持工作组触发Agent
        if (e.node.type !== 'WORK_GROUP') {
            return
        }

        const workGroupCode = nodes[0];
        setWorkGroupCode(workGroupCode)

        if (conversationList.length === 0) {
            welcome(workplaceCode, workGroupCode, sessionId);
        }
    }

    const initTree = async (workplaceCode) => {
        try {
            const response = await fetch(`/api/v1/process/getWorkplaceStructureTree?workplaceCode=${workplaceCode}`);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            setTreeData([data.data])
        } catch (error) {
            console.error('获取架构树失败:', error);
        }
    }

    const welcome = async (workplaceCode, workGroupCode, sessionId) => {
        setLoading(true);
        const showCurrentNewAiBubble = {current:false}
        const lastMsgId = {current:null}

        doStream(`/agentApi/v1/agent/welcome?workplaceCode=${workplaceCode}&sessionId=${sessionId}&workGroupCode=${workGroupCode}`,
            (event) => {
                // 注意：SSE的默认事件类型是'message'，数据在event.data中
                if (event.data) {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.token) {
                            if (!showCurrentNewAiBubble.current) {
                                setShowNewAiBubble(true)
                                showCurrentNewAiBubble.current = true
                            }
                            if (!lastMsgId.current && data.msgId) {
                                lastMsgId.current = data.msgId;
                                setConversationId(data.msgId)
                            }
                            setResponse(prev => prev + data.token); // 增量更新
                        }
                    } catch (e) {
                        console.error('解析错误', e);
                    }
                }
            },
            () => {
                setLoading(false);
                getFrequentlyAndUsuallyTasks(workplaceCode, workGroupCode)
            },
            () => {
                setLoading(false);
            })
    }

    const getSessionId = () => {
        // 生成或获取 sessionId
        let sessionId = sessionStorage.getItem('sessionId');

        if (!sessionId) {
            // 生成唯一 ID（使用时间戳和随机数）
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('sessionId', sessionId);
        }

        setSessionId(sessionId);
    }

    const renderMarkdown = content => {
        return (
            <Typography>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: used in demo */}
                <div dangerouslySetInnerHTML={{ __html: md.render(content)}} />
            </Typography>
        );
    };

    const confirmResume = (resumeType, resumeDesc, resume_mode) => {
        setLoading(true)

        const currentResponse = response
        setResponse(''); // 清空旧响应
        setValue('')

        // 把当前未添加到列表中的对话添加进列表
        const newConversationList = [...conversationList]
        if (currentResponse) {
            newConversationList.push({
                avatar:aiAvatar,
                placement:"start",
                content:currentResponse,
                type:'ai',
            });
        }

        const aiConfirm = {
            avatar:aiAvatar,
            placement:"start",
            content:confirmContent,
            type:'ai',
        }

        const humanAnswer = {
            avatar:userAvatar,
            placement:"end",
            content:resumeDesc+"任务:"+ confirmTaskName,
            type:'human',
        }
        const taskName = confirmTaskName

        newConversationList.push(aiConfirm, humanAnswer)
        setConversationList(newConversationList)

        // 隐藏最新AI回复框
        setShowNewAiBubble(false)
        // 隐藏确认提示框
        setShowConfirmBubble(false)
        setConfirmContent('')
        setConfirmTaskName('')

        // 使用调用方式resume
        if (resume_mode === "invoke") {
            const postData = {
                workplaceCode,
                workGroupCode,
                sessionId,
                resumeType:resumeType,
            }

            try {
                fetch('/agentApi/v1/agent/resumeInterrupt', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json', // 设置内容类型为JSON
                    },
                    body: JSON.stringify(postData),
                })
                    .then(response => response.json()) // 将响应解析为JSON
                    .then(data => {
                        setLoading(false)

                        if (data.code != 0) {
                            error(data.msg)
                        } else {
                            if (data.data) {
                                if (data.data.content != undefined) {
                                    if (data.data.content === true) {
                                        setConversationList([...newConversationList, {
                                            avatar:aiAvatar,
                                            placement:"start",
                                            content: "任务：" + taskName + " " + resumeDesc +"成功",
                                            type:'ai',
                                        }])
                                    } else {
                                        setConversationList([...newConversationList, {
                                            avatar:aiAvatar,
                                            placement:"start",
                                            content: data.data.content,
                                            type:'ai',
                                        }])
                                    }
                                } else if (data.data.interrupt){
                                    const interrupt = data.data.interrupt
                                    showConfirm(interrupt.description, interrupt.confirmOptionList, interrupt.taskName)
                                }
                            } else {
                                setConversationList([...newConversationList, {
                                    avatar:aiAvatar,
                                    placement:"start",
                                    content: "任务：" + taskName + " " + resumeDesc + "失败！",
                                    type:'ai',
                                }])
                            }
                        }
                    })
                    .catch((err) => {
                        error(err)
                        console.error('Error:', err);
                    });

            } catch (error) {
                console.error('跟AI助手对话失败:', error);
            }
        } else {
            // 使用流式方式resume
            // 建立SSE连接
            const eventSource = new EventSource(`/agentApi/v1/agent/resumeInterruptStream?resumeType=${resumeType}&workplaceCode=${workplaceCode}&sessionId=${sessionId}&workGroupCode=${workGroupCode}`);

            let showCurrentNewAiBubble = false
            let msgId = null
            eventSource.onmessage = (event) => {
                // 注意：SSE的默认事件类型是'message'，数据在event.data中
                if (event.data) {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.token) {
                            if (!showCurrentNewAiBubble) {
                                setShowNewAiBubble(true)
                                showCurrentNewAiBubble = true
                            }
                            if (msgId == null) {
                                msgId = data.msgId
                            }
                            setResponse(prev => prev + data.token); // 增量更新
                        } else if (data.interrupt) {
                            const interrupt = JSON.parse(data.interrupt)
                            showConfirm(interrupt.description, interrupt.confirmOptionList, interrupt.taskName)
                        }
                    } catch (e) {
                        console.error('解析错误', e);
                    }
                }
            };
            // 监听自定义的'done'事件
            eventSource.addEventListener('done', () => {
                eventSource.close();
                setLoading(false);
            });


            eventSource.onerror = () => {
                eventSource.close();
                setLoading(false);
            };
        }
    }

    const fetchGet = (url, successHandler) => {
        try {
            fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json', // 设置内容类型为JSON
                },
            })
                .then(response => response.json()) // 将响应解析为JSON
                .then(data => {
                    if (data.code != 0) {
                        error(data.msg)
                    } else {
                        if (successHandler) {
                            successHandler(data)
                        }
                    }
                })
                .catch((err) => {
                    error(err)
                    console.error('Error:', err);
                });

        } catch (error) {
            console.error('跟AI助手对话失败:', error);
        }
    }

    const fetchPost = (url, data, successHandler) => {
        try {
            fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // 设置内容类型为JSON
                },
                body: JSON.stringify(data),
            })
                .then(response => response.json()) // 将响应解析为JSON
                .then(data => {
                    if (data.code != 0) {
                        error(data.msg)
                    } else {
                        if (successHandler) {
                            successHandler()
                        }
                    }
                })
                .catch((err) => {
                    error(err)
                    console.error('Error:', err);
                });

        } catch (error) {
            console.error('跟AI助手对话失败:', error);
        }
    }

    const doStream = (url, onmessageHandler, finishHandler, errorHandler) => {
        // 建立SSE连接
        const eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
            // 注意：SSE的默认事件类型是'message'，数据在event.data中
            if (event.data) {
                if (onmessageHandler) {
                    onmessageHandler(event);
                }
            }
        };
        // 监听自定义的'done'事件
        eventSource.addEventListener('done', () => {
            eventSource.close();
            if (finishHandler) {
                finishHandler()
            }
        });

        eventSource.onerror = () => {
            eventSource.close();
            if (errorHandler) {
                errorHandler()
            }
        };
    }

    const confirmThis = (confirmType, confirmContent, question) => {
        if (confirmType === 'invoke') {

        } else if (confirmType === 'question') {
            clearConfirm()
            submitQuestionStream(question)
        }
    }

    const cancelResume = (otherFun) => {
        // 隐藏确认提示框
        clearConfirm()

        // 更新AI对话
        if (response) {
            // 更新实时bubble到list
            updateAiConversationList(response, conversationId)

            setResponse(''); // 清空旧响应
            setConversationId(null); // 清空旧响应

            clearCurrentStandardData()
        }

        const postData = {
            workplaceCode,
            workGroupCode,
            sessionId,
            resumeType:"cancel"
        }

        try {
            fetch('/agentApi/v1/agent/resumeInterrupt', {
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
                        // 如果cancel成功，执行回调
                        if (otherFun) {
                            otherFun()
                        }
                    }
                })
                .catch((err) => {
                    error(err)
                    console.error('Error:', err);
                });

        } catch (error) {
            console.error('跟AI助手对话失败:', error);
        }
    }

    const renderConfirm = content => {
        let myConfirmOptionList = []
        for (const i in confirmOptionList) {
            const option = confirmOptionList[i]
            myConfirmOptionList.push((
                <a href="#" onClick={() => confirmThis(option.confirmType, option.confirmDesc, option.question)} >【{option.confirmDesc}】</a>
            ))
        }
        myConfirmOptionList.push((
            <a href="#" onClick={() => cancelResume(undefined)}>【取消】</a>
        ))

        return (
            <div>
                <span>{content}</span>
                {myConfirmOptionList}
            </div>
        )
    }

    const showConfirm = (description, confirmOptionList, taskName) => {
        setShowConfirmBubble(true)
        setConfirmContent(description)
        setConfirmOptionList(confirmOptionList)
        setConfirmTaskName(taskName)
    }

    const clearConfirm = () => {
        setShowConfirmBubble(false)
        setConfirmContent('')
        setConfirmOptionList([])
        setConfirmTaskName('')
    }


    const getFrequentlyAndUsuallyTasks = (workplaceCode, workGroupCode) => {
        try {
            fetch(`/agentApi/v1/agent/getFrequentlyAndUsuallyExecuteTasks?workplaceCode=${workplaceCode}&workGroupCode=${workGroupCode}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json', // 设置内容类型为JSON
                },
            })
                .then(response => response.json()) // 将响应解析为JSON
                .then(data => {
                    if (data.code != 0) {
                        error(data.msg)
                    } else {
                        const items = []

                        for(const i in data.data.result) {
                            const taskName = data.data.result[i]
                            items.push(
                                {
                                    key: taskName,
                                    type: 'executeTask',
                                    icon: <FireOutlined style={{ color: '#FF4D4F' }} />,
                                    description: '执行任务: ' + taskName,
                                    disabled: false,
                                }
                            )
                        }

                        items.push({
                            key: '0',
                            type: 'advice',
                            icon: <SmileOutlined style={{ color: '#FAAD14' }} />,
                            description: '创建任务：请输入你想创建的任务名称',
                            disabled: false,
                        })
                        items.push({
                            key: '1',
                            type: 'advice',
                            icon: <SmileOutlined style={{ color: '#FAAD14' }} />,
                            description: '编辑任务：请输入你想编辑的任务名称',
                            disabled: false,
                        })
                        setPrompts(items)
                        setShowPrompts(true)
                    }
                })
                .catch((err) => {
                    error(err)
                    console.error('Error:', err);
                });

        } catch (error) {
            console.error('跟AI助手对话失败:', error);
        }
    }


    const checkConfirm =  async () => {
        try {
            fetch(`/agentApi/v1/agent/getStateProperties?workplaceCode=${workplaceCode}&workGroupCode=${workGroupCode}&sessionId=${sessionId}&statePropertyNames=intent_type,is_integrated,task_name`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json', // 设置内容类型为JSON
                },
            })
                .then(response => response.json()) // 将响应解析为JSON
                .then(data => {
                    if (data.code != 0) {
                        error(data.msg)
                    } else {
                        const {
                            intent_type,
                            is_integrated,
                            task_name,
                        } = data.data.result
                        if (is_integrated && ["CREATE", "EDIT", "TEST_RUN"].includes(intent_type)) {
                            // 只要任务完整，每次都提示试跑或保存
                            const myTaskName = task_name
                            const options = [
                                {confirmDesc:"试跑任务", confirmType:"question", question:"试跑任务:" + myTaskName},
                                {confirmDesc:"保存任务", confirmType:"question", question:"保存任务:" + myTaskName},
                            ]
                            showConfirm("任务模板已经填写完整，请确认下一步操作：", options,
                                myTaskName)
                        }
                    }
                })
                .catch((err) => {
                    error(err)
                    console.error('Error:', err);
                });

        } catch (error) {
            console.error('跟AI助手对话失败:', error);
        }
    }

    const renderStandardLineChart = (jsonObj, msgId) => {
        const xValues = jsonObj.x_axis
        const yValues = jsonObj.y_axis
        const xName = jsonObj.x_name
        const yName = jsonObj.y_name

        const data = []
        for (let i = 0; i < xValues.length; i++) {
            const x = xValues[i]
            const y = yValues[i]
            data.push({x:x, y:y})
        }

        const config = {
            width:800,
            height:600,
            data,
            xField: 'x',
            yField: 'y',
            point: {
                shapeField: 'square',
                sizeField: 4,
            },
            interaction: {
                tooltip: {
                    marker: false,
                },
            },
            style: {
                lineWidth: 2,
            },
            axis: {
                // 配置 x 轴
                x: {
                    title:xName,
                },
                y: {
                    title:yName,
                },
            }
        };

        setMsgId2Data(prev => {
            prev[msgId] = {
                config,
                type:'折线图',
            }
            return prev
        })

        setShowCurrentLineChart(true)
        setLineChartConfig(config)
    }

    const renderStandardTable = (jsonObj, msgId) => {
        const headerList = jsonObj.header_list
        const dataList = jsonObj.data_list

        const index2key = {}
        const columns = headerList.map((item, index) => {
            index2key[index] = item
            return {
                title: item,
                dataIndex: item,
                key: item
            }
        })

        const dataSource = dataList.map((itemList, index) => {
            const data = {
                key: index,
            }
            itemList.forEach((item, propIndex) => {
                const propName = index2key[propIndex]
                data[propName] = item
            })
            return data
        })

        setMsgId2Data(prev => {
            prev[msgId] = {
                columns,
                dataSource,
                type:'表格',
            }
            return prev
        })

        setShowCurrentTable(true)
        setTableDataSource(dataSource)
        setTableColumns(columns)
    }

    const checkShowStandardData = async (msgId) => {
        fetchGet(`/agentApi/v1/agent/getStateProperties?workplaceCode=${workplaceCode}&workGroupCode=${workGroupCode}&sessionId=${sessionId}&statePropertyNames=intent_type,last_run_msg_id,last_standard_data,task_detail`,
            (data) => {
                const {
                    intent_type,
                    last_run_msg_id,
                    last_standard_data,
                    task_detail
                } = data.data.result
                if (last_run_msg_id === msgId && last_standard_data && !["EXECUTE","DELETE"].includes(intent_type)) {
                    if (task_detail.dataFormat === "表格") {
                        renderStandardTable(JSON.parse(last_standard_data.replaceAll("'", "\"")), msgId)
                    } else if (task_detail.dataFormat === "折线图") {
                        renderStandardLineChart(JSON.parse(last_standard_data.replaceAll("'", "\"")), msgId)
                    }
                }
            })
    }

    const updateAiConversationList = (content, msgId) => {
        setShowNewAiBubble(false)

        const theList = conversationList
        theList.push({
            avatar: aiAvatar,
            placement: "start",
            content: content,
            type: 'ai',
            msgId: msgId,
        })
        setConversationList(theList)
    }

    const updateUserConversationList = (content) => {
        setShowNewAiBubble(false)

        const theList = conversationList
        theList.push({
            avatar:userAvatar,
            placement:"end",
            content:content,
            type:'human',
        })
        setConversationList(theList)
    }

    const clearCurrentStandardData = () => {
        setShowCurrentTable(false)
        setTableDataSource([])
        setTableColumns([])

        setShowCurrentLineChart(false)
        setLineChartConfig({})
    }


    const submitQuestionStream = async (question) => {
        setLoading(true);

        // 更新AI对话
        if (response) {
            // 更新实时bubble到list
            updateAiConversationList(response, conversationId)

            setResponse(''); // 清空旧响应
            setConversationId(null); // 清空旧响应

            clearCurrentStandardData()
        }

        // 更新用户对话
        if (question) {
            updateUserConversationList(question)
            setValue('')
        }

        const showCurrentNewAiBubble = {current:false}
        const lastMsgId = {current:null}

        doStream(`/agentApi/v1/agent/questionStream?question=${encodeURIComponent(question)}&workplaceCode=${workplaceCode}&sessionId=${sessionId}&workGroupCode=${workGroupCode}`,
            (event) => {
                if (event.data) {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.token) {
                            if (!showCurrentNewAiBubble.current) {
                                setShowNewAiBubble(true)
                                showCurrentNewAiBubble.current = true
                            }
                            setResponse(prev => prev + data.token); // 增量更新
                        } else if (data.interrupt) {
                            // 仅保存、删除时二次确认用到
                            const interrupt = JSON.parse(data.interrupt)
                            showConfirm(interrupt.description, interrupt.confirmOptionList, interrupt.taskName)
                        }

                        if (data.msgId) {
                            lastMsgId.current = data.msgId
                        }
                    } catch (e) {
                        console.error('解析错误', e);
                    }
                }
            },
            () => {
                setLoading(false);
                console.log(lastMsgId.current);
                setConversationId(lastMsgId.current)
                // 检查是否需要主动弹出确认
                checkConfirm()
                // 检查是否需要显示标准数据
                checkShowStandardData(lastMsgId.current)
            },
            () => {
                setLoading(false);
            }
        )
    };


    // 初始化数据
    useEffect(() => {
        if (workplaceCode) {
            initTree(workplaceCode)
        }
        getSessionId()
    }, []);

    // 性能优化一下
    // 显示对话框
    const agentContentBubble = []
    for (const i in conversationList) {
        const conversation = conversationList[i]
        if (conversation.type === 'ai') {
            const bubble = (
                <Bubble content={conversation.content} messageRender={renderMarkdown}
                        avatar={{ icon: <UserOutlined />, style: conversation.avatar }} placement={conversation.placement}
                        header={"AI数据员"}
                        footer={messageContext => {
                            if (i === "0") {
                                return
                            }
                            // return (
                            //     <Space size={token.paddingXXS}>
                            //         <Button
                            //             color="default"
                            //             variant="text"
                            //             size="small"
                            //             onClick={() => onCopy(messageContext)}
                            //             icon={<CopyOutlined />}
                            //         />
                            //     </Space>
                            // )
                        }
                        }
                />
            )

            agentContentBubble.push(bubble)
            const standardData = msgId2Data[conversation.msgId]
            if (standardData) {
                if (standardData.type === '表格') {
                    const {
                        dataSource,
                        columns,
                    } = standardData
                    const table = (
                        <Flex vertical={false} gap="middle" >
                            <Table dataSource={dataSource} columns={columns} style={{width: '55%'}} size={'small'}/>
                        </Flex>
                    )
                    agentContentBubble.push(table)
                } else if (standardData.type === '折线图') {
                    const {
                        config
                    } = standardData
                    const table = (
                        <Flex vertical={false} gap="middle" >
                            <Line {...config} />
                        </Flex>
                    )
                    agentContentBubble.push(table)
                }
            }
        } else {
            const bubble = (
                <Bubble content={conversation.content}
                        avatar={{ icon: <UserOutlined />, style: conversation.avatar }} placement={conversation.placement} />
            )

            agentContentBubble.push(bubble)
        }
    }

    // 显示临时标准化数据
    const standardDataContent = []
    if (showCurrentTable) {
        standardDataContent.push(<Table dataSource={tableDataSource} columns={tableColumns} style={{width: '55%'}} size={'small'}/>)
    }
    if (showCurrentLineChart) {
        standardDataContent.push(<Line {...lineChartConfig} />)
    }

    return (
        <Layout >
            <Content style={{ padding: '0 48px' }}>
                {/* 面包屑导航 */}
                <Breadcrumb>
                    <Breadcrumb.Item>
                        <span>首页</span>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <span>数据分析</span>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        <strong>AI数据员</strong>
                    </Breadcrumb.Item>
                </Breadcrumb>
                <Splitter style={{ height: '100%', boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)' }}>
                    <Splitter.Panel defaultSize="20%" min="20%" max="70%">
                        <Tree
                            defaultExpandAll={true}
                            onSelect={onSelectTreeNode}
                            treeData={treeData}
                        />
                    </Splitter.Panel>
                    <Splitter.Panel >
                        <Flex vertical gap="middle">
                            {agentContentBubble}
                            <Bubble content={response} messageRender={renderMarkdown} style={showNewAiBubble?{}:{visibility: 'hidden'}}
                                    avatar={{ icon: <UserOutlined />, style: aiAvatar }} placement={"start"}
                                    header={"AI数据员"}
                            />
                            <Flex vertical={false} gap="middle" >
                                {standardDataContent}
                            </Flex>

                            <Bubble content={confirmContent} messageRender={renderConfirm} style={showConfirmBubble?{}:{visibility: 'hidden'}}
                                    avatar={{ icon: <UserOutlined />, style: aiAvatar }} placement={"start"}
                                    header={"AI数据员"}
                            />
                            {contextHolder}

                            <Prompts title="🤔 你是不是想问:" items={prompts} hidden={!showPrompts} onItemClick={info => {
                                if (info.data.type === 'advice') {
                                    const description = info.data.description
                                    setValue(description.substring(0, description.indexOf("：")+ 1))
                                } else if (info.data.type === 'executeTask') {
                                    submitQuestionStream(info.data.description);
                                }
                            }}/>
                            <Sender
                                loading={loading}
                                value={value}
                                onChange={(v) => {
                                    setValue(v);
                                }}
                                onSubmit={submitQuestionStream}
                                onCancel={() => {
                                    setLoading(false);
                                }}
                                autoSize={{ minRows: 2, maxRows: 6 }}
                            />
                        </Flex>
                    </Splitter.Panel>
                </Splitter>
            </Content>
        </Layout>
    )

}

export default Conversation;