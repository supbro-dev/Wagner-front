import React, {useEffect, useState} from 'react';
import {Bubble, Sender} from '@ant-design/x';
import {CommentOutlined, CopyOutlined, SyncOutlined, UserOutlined} from '@ant-design/icons';
import {App, Button, Drawer, Flex, Layout, message, Space, Splitter, Table, theme, Tree, Typography} from "antd";
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
                isSelected:false,
                type:"ai",
            }])
        } catch (error) {
            console.error('获取架构树失败:', error);
        }
    }

    const submitQuestion = async (question) => {
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
            isSelected:false,
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
                        isSelected:false,
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
        console.log('content', content);
        return (
            <Typography>
                {/* biome-ignore lint/security/noDangerouslySetInnerHtml: used in demo */}
                <div dangerouslySetInnerHTML={{ __html: md.render(content) }} />
            </Typography>
        );
    };

    const clickConversation = (conversationId) => {
        let brotherId
        let needSelect = false
        const ai = {}
        const human = {}
        for (let i = 0; i < conversationList.length; i++) {
            let cvs = conversationList[i]
            if (cvs.id !== conversationId) {
                continue
            }
            if (cvs.isSelected) {
                needSelect = false
            } else {
                needSelect = true
            }

            if (cvs.type === 'ai') {
                // 如果点击的是AiMsg同时选中前一个HumanMsg
                if (i - 1 >= 0) {
                    conversationList[i - 1].isSelected = needSelect;
                    cvs.isSelected = needSelect;

                    const brother = conversationList[i - 1]
                    brotherId = brother.id

                    ai.content = cvs.content
                    ai.id = conversationId
                    human.content = brother.content
                    human.id = brother.id
                }
            } else if (cvs.type === 'human'){
                // 如果点击的是HumanMsg同时选中后一个AiMsg
                if (i + 1 <= conversationList.length - 1) {
                    conversationList[i + 1].isSelected = needSelect;
                    cvs.isSelected = needSelect;

                    const brother = conversationList[i + 1]
                    brotherId = brother.id

                    ai.content = brother.content
                    ai.id = brother.id
                    human.content = cvs.content
                    human.id = conversationId
                }
            }
        }

        // 取消选择所有
        for (let i = 0; i < conversationList.length; i++) {
            if (conversationList[i].id !== conversationId && (brotherId && conversationList[i].id !== brotherId)) {
                conversationList[i].isSelected = false;
            }
        }

        setConversationList([...conversationList]);

        if (needSelect && brotherId) {
            setOpenDraw(true)
            setExample({
                ai: ai,
                human:human,
            })
        }
    }

    const onCloseDraw = () => {
        setOpenDraw(false)
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

    const train = () => {
        const postData = {
            workplaceCode,
            workGroupCode,
            sessionId,
            humanId: example["human"].id,
            humanContent: example["human"].content,
            aiId:example["ai"].id,
            aiContent: example["ai"].content,
        }
        try {
            fetch('/agentApi/v1/agent/train', {
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

                    }
                })
                .catch((err) => {
                    error(err)
                    console.error('Error:', err);
                });

        } catch (error) {
            console.error('获取训练AI助手失败:', error);
        }

    }

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
                        style={conversation.isSelected?{backgroundColor:"#b3e3a3"}:{}}
                        avatar={{ icon: <UserOutlined />, style: conversation.avatar }} placement={conversation.placement}
                        header={"AI组长助理"}
                        footer={messageContext => {
                            if (i === "0") {
                                return
                            }
                            return (
                                <Space size={token.paddingXXS}>
                                    <Button color="default" variant="text" size="small" icon={<CommentOutlined />} onClick={() => {clickConversation(conversation.id)}} />
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
                              style={conversation.isSelected?{backgroundColor:"#b3e3a3"}:{}}
                                footer={messageContext => (
                                    <Space size={token.paddingXXS}>
                                        <Button color="default" variant="text" size="small" icon={<CommentOutlined />} onClick={() => {clickConversation(conversation.id)}} />
                                    </Space>
                                )}
                              avatar={{ icon: <UserOutlined />, style: conversation.avatar }} placement={conversation.placement} />
            )
        }
        agentContentBubble.push(bubble)
    }

    return (
        <Layout >
            <Content style={{ padding: '0 48px' }}>
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
                            {contextHolder}
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
                <Drawer
                    title="训练AI组长助理"
                    closable={{ 'aria-label': 'Close Button' }}
                    open={openDraw}
                    onClose={onCloseDraw}
                    size={'large'}
                >
                    <Flex vertical gap="middle">
                        <Bubble content={example["human"]?.content} messageRender={renderMarkdown}
                                avatar={{ icon: <UserOutlined />, style: userAvatar }} placement={"end"} />
                        <Bubble content={example["ai"]?.content}
                                avatar={{ icon: <UserOutlined />, style: aiAvatar }} placement={"start"} />
                    </Flex>
                    <Button type="primary" onClick={train}>训练</Button>
                </Drawer>
            </Content>
        </Layout>
    )

}

export default Conversation;