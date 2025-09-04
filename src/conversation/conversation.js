import React, {useEffect, useState} from 'react';
import {Bubble, Prompts, Sender} from '@ant-design/x';
import {
    CommentOutlined,
    CopyOutlined,
    FireOutlined,
    SmileOutlined,
    SyncOutlined,
    UserOutlined
} from '@ant-design/icons';
import {
    App,
    Breadcrumb,
    Button,
    Drawer,
    Flex,
    Layout,
    message,
    Space,
    Splitter,
    Table,
    theme,
    Tree,
    Typography
} from "antd";
import {useLocation} from "react-router-dom";
import markdownit from 'markdown-it';
import {Content} from "antd/es/layout/layout";

const fooAvatar = {
    // color: '#f56a00',
    // backgroundColor: '#fde3cf',
};

const groupLeaderAgentAvatar = {
    size: { xs: 24, sm: 32, md: 40, lg: 64, xl: 80, xxl: 100 },
    src:"https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png",
        style: fooAvatar }

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
    const [openDraw, setOpenDraw] = useState(false);
    const [example, setExample] = useState({});

    const [response, setResponse] = useState('');
    const [newAiBubble, setNewAiBubble] = useState({})
    const [showNewAiBubble, setShowNewAiBubble] = useState(false);
    const [showConfirmBubble, setShowConfirmBubble] = useState(false);
    const [confirmContent, setConfirmContent] = useState('')
    const [confirmTaskName, setConfirmTaskName] = useState('')
    const [confirmOptionList, setConfirmOptionList] = useState([])
    const [confirmType, setConfirmType] = useState('')
    const [prompts, setPrompts] = useState([])
    const [showPrompts, setShowPrompts] = useState(false)

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
        try {
            const response = await fetch(`/agentApi/v1/agent/welcome?workplaceCode=${workplaceCode}&workGroupCode=${workGroupCode}&sessionId=${sessionId}`);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            setConversationList([{
                avatar:aiAvatar,
                placement:"start",
                content:data.data,
                type:"ai",
            }])

            getFrequentlyAndUsuallyTasks(workplaceCode, workGroupCode)
        } catch (error) {
            console.error('获取架构树失败:', error);
        }
    }

    const submitQuestion_ = async (question) => {
        setValue('');
        setLoading(true);

        const postData = {
            workplaceCode,
            workGroupCode,
            sessionId,
            question,
        }

        conversationList.push({
            avatar:userAvatar,
            placement:"end",
            content:question,
            type:'human',
        });

        setConversationList(conversationList)

        try {
            fetch('/agentApi/v1/agent/question', {
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
                    const {
                        messageId,
                        content,
                        lastHumanMessageId,
                    } = data.data
                    const lastConversation = conversationList[conversationList.length - 1];
                    lastConversation.id = lastHumanMessageId

                    conversationList.push({
                        avatar:aiAvatar,
                        placement:"start",
                        content:content,
                        type:'ai',
                        id: messageId,
                    });

                    setConversationList(conversationList)
                    setLoading(false)
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

    const cancelResume = (otherFun) => {
        // 隐藏确认提示框
        setShowConfirmBubble(false)
        setConfirmContent('')
        setConfirmTaskName('')

        // 归档AI最新对话
        const currentResponse = response
        setResponse(''); // 清空旧响应

        if (currentResponse) {
            const newConversationList = [...conversationList, {
                avatar:aiAvatar,
                placement:"start",
                content:currentResponse,
                type:'ai',
            }]

            setConversationList(newConversationList)
            // 掩藏AI最新对话框
            setShowNewAiBubble(false)
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
                <a href="javascript:void(0);" onClick={() => confirmResume(option.resumeType, option.resumeDesc, option.resumeMode)} >【{option.resumeDesc}】</a>
            ))
        }
        myConfirmOptionList.push((
            <a href="javascript:void(0);" onClick={() => cancelResume(undefined)}>【取消】</a>
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

    const onCopy = async textToCopy => {
        if (!textToCopy) return
        try {
            await navigator.clipboard.writeText(textToCopy);
            message.success('已复制到剪贴板');
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

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
                                    key: 'taskName',
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
                            key: '0',
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



    const submitQuestion = async (question) => {
        const streamQuestion = () => {
            setShowNewAiBubble(false)
            setLoading(true);

            const currentResponse = response
            setResponse(''); // 清空旧响应
            setValue('')

            if (currentResponse) {
                conversationList.push({
                    avatar:aiAvatar,
                    placement:"start",
                    content:currentResponse,
                    type:'ai',
                });
            }

            // 用户提示直接显示
            conversationList.push({
                avatar:userAvatar,
                placement:"end",
                content:question,
                type:'human',
            });

            setConversationList(conversationList)

            // 建立SSE连接
            const eventSource = new EventSource(`/agentApi/v1/agent/stream?question=${encodeURIComponent(question)}&workplaceCode=${workplaceCode}&sessionId=${sessionId}&workGroupCode=${workGroupCode}`);

            let showCurrentNewAiBubble = false
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


        // 如果当前处于中断中，首先恢复流程
        if (showConfirmBubble) {
            setValue('')
            setLoading(true);
            cancelResume(streamQuestion)
        } else {
            streamQuestion()
        }
    };


    // 初始化数据
    useEffect(() => {
        if (workplaceCode) {
            initTree(workplaceCode)
        }
        getSessionId()
    }, []);

    const agentContentBubble = []
    for (const i in conversationList) {
        const conversation = conversationList[i]
        let bubble
        if (conversation.type === 'ai') {
            bubble = (
                <Bubble content={conversation.content} messageRender={renderMarkdown}
                        avatar={{ icon: <UserOutlined />, style: conversation.avatar }} placement={conversation.placement}
                        header={"AI数据员"}
                        footer={messageContext => {
                            if (i === "0") {
                                return
                            }
                            return (
                                <Space size={token.paddingXXS}>
                                    <Button
                                        color="default"
                                        variant="text"
                                        size="small"
                                        onClick={() => onCopy(messageContext)}
                                        icon={<CopyOutlined />}
                                    />
                                </Space>
                            )
                        }
                    }
                />
            )
        } else {
            bubble = (
                <Bubble content={conversation.content}
                              avatar={{ icon: <UserOutlined />, style: conversation.avatar }} placement={conversation.placement} />
            )
        }
        agentContentBubble.push(bubble)
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
                    <Splitter.Panel>
                        <Flex vertical gap="middle">
                            {agentContentBubble}
                            <Bubble content={response} messageRender={renderMarkdown} style={showNewAiBubble?{}:{visibility: 'hidden'}}
                                    avatar={{ icon: <UserOutlined />, style: aiAvatar }} placement={"start"}
                                    header={"AI数据员"}
                            />
                            <Bubble content={confirmContent} messageRender={renderConfirm} style={showConfirmBubble?{}:{visibility: 'hidden'}}
                                    avatar={{ icon: <UserOutlined />, style: aiAvatar }} placement={"start"}
                                    header={"AI数据员"}
                            />
                            {contextHolder}
                            <Prompts title="🤔 你是不是想问:" items={prompts} hidden={!showPrompts} onItemClick={info => {
                                if (info.data.type === 'advice') {
                                    setValue(info.data.description)
                                } else if (info.data.type === 'executeTask') {
                                    submitQuestion(info.data.description);
                                }
                            }}/>
                            <Sender
                                loading={loading}
                                value={value}
                                onChange={(v) => {
                                    setValue(v);
                                }}
                                onSubmit={submitQuestion}
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