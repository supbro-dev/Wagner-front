import React, {useEffect, useState} from 'react';
import {Bubble, Sender} from '@ant-design/x';
import {App, Flex, message, Splitter, Tree} from "antd";
import {useLocation} from "react-router-dom";
import {UserOutlined} from "@ant-design/icons";
import {GPTVis} from "@antv/gpt-vis";

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

const text = `
**GPT-Vis**, Components for GPTs, generative AI, and LLM projects. Not only UI Components. [more...](https://github.com/antvis/GPT-Vis) \n\n

Here’s a visualization of Haidilao's food delivery revenue from 2013 to 2022. You can see a steady increase over the years, with notable *growth* particularly in recent years.

\`\`\`vis-chart
{
  "type": "line",
  "data": [{"time":2013,"value":59.3},{"time":2014,"value":64.4},{"time":2015,"value":68.9},{"time":2016,"value":74.4},{"time":2017,"value":82.7},{"time":2018,"value":91.9},{"time":2019,"value":99.1},{"time":2020,"value":101.6},{"time":2021,"value":114.4},{"time":2022,"value":121}],
  "axisXTitle": "year",
  "axisYTitle": "sale"
}
\`\`\`
`;

const RenderMarkdown = content => <GPTVis>{content}</GPTVis>;




const Conversation = () => {
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [treeData, setTreeData] = useState([]);
    const [conversationList, setConversationList] = useState([]);
    const [workGroupCode, setWorkGroupCode] = useState('');
    const [messageApi, contextHolder] = message.useMessage();
    const [sessionId, setSessionId] = useState('');

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
                content:data.data
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
                    conversationList.push({
                        avatar:aiAvatar,
                        placement:"start",
                        content:data.data,
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
            console.error('获取架构树失败:', error);
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
        agentContentBubble.push((<Bubble content={conversation.content} avatar={{ icon: <UserOutlined />, style: conversation.avatar }} placement={conversation.placement} />))
    }

    return (
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
                    <Bubble
                        typing={{ step: 20, interval: 150 }}
                        content={text}
                        messageRender={RenderMarkdown}
                        avatar={{
                            src: 'https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*2Q5LRJ3LFPUAAAAAAAAAAAAADmJ7AQ/fmt.webp',
                        }}
                        variant="outlined"
                    />
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
    )

}

export default Conversation;