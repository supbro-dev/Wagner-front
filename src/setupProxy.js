const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
    app.use(
        '/api/v1', // 你可以指定一个路径，只有这个路径开头的请求会被代理
        createProxyMiddleware({
            target: 'http://localhost:8080/api/v1', // 后端服务器地址
            changeOrigin: true,
            onProxyReq: (proxyReq, req, res) => {
                console.log(`Proxying: ${req.originalUrl} -> ${proxyReq.path}`);
            },
        })
    );
};