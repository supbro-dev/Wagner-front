import React, {useEffect, useState} from 'react';
import {Bubble, Sender} from '@ant-design/x';
import {App, Flex, message, Splitter, Tree} from "antd";
import {useLocation} from "react-router-dom";
import {UserOutlined} from "@ant-design/icons";

const fooAvatar = {
    // color: '#f56a00',
    // backgroundColor: '#fde3cf',
};

const groupLeaderAgentAvatar = {
    size: { xs: 24, sm: 32, md: 40, lg: 64, xl: 80, xxl: 100 },
    src:"https://zos.alipayobjects.com/rmsportal/ODTLcjxAfvqbxHnVXCYX.png",
        style: fooAvatar }


const Conversation = () => {
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [treeData, setTreeData] = useState([]);
    const [agentContentList, setAgentContentList] = useState([]);
    const [workGroupCode, setWorkGroupCode] = useState('');
    const [messageApi, contextHolder] = message.useMessage();

    const location = useLocation();
    // 使用 URLSearchParams 解析查询字符串
    const queryParams = new URLSearchParams(location.search);
    const workplaceCode = queryParams.get('workplaceCode');

    const error = (msg) => {
        messageApi.error(msg);
    };


    const onSelectTreeNode = (nodes) => {
        if (nodes.length === 0) {
            return
        }

        const workGroupCode = nodes[0];
        setWorkGroupCode(workGroupCode)

        if (agentContentList.length === 0) {
            welcome(workplaceCode, workGroupCode);
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

    const welcome = async (workplaceCode, workGroupCode) => {
        try {
            const response = await fetch(`/agentApi/v1/agent/welcome?workplaceCode=${workplaceCode}&workGroupCode=${workGroupCode}`);
            if (!response.ok) {
                throw new Error(`请求失败: ${response.status}`);
            }
            const data = await response.json();

            setAgentContentList([data.data])
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
            question,
        }

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
                    setAgentContentList(prev => {
                        prev.push(data.data)
                        return prev
                    });
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

    // 初始化数据
    useEffect(() => {
        if (workplaceCode) {
            initTree(workplaceCode)
        }
    }, []);

    const agentContentBubble = []
    for (const i in agentContentList) {
        agentContentBubble.push((<Bubble content={agentContentList[i]} avatar={groupLeaderAgentAvatar} />))
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