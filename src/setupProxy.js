const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    // 代理规则1: 将以 '/api' 开头的请求代理到 http://localhost:8080
    app.use(
        '/api',
        createProxyMiddleware({
            target: 'http://localhost:8080/api',
            changeOrigin: true,
        })
    );

    // 代理规则2: 将以 '/api1' 开头的请求代理到 http://localhost:9000
    app.use(
        '/agentApi',
        createProxyMiddleware({
            target: 'http://127.0.0.1:5000/agentApi',
            changeOrigin: true,
        })
    );
};
