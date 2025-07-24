const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3003;
// const TARGET = 'https://jsonplaceholder.typicode.com';
const TARGET = 'http://localhost:1337';

app.use(createProxyMiddleware({
    target: TARGET,
    changeOrigin: true,
    logLevel: 'debug',
    onProxyReq: (proxyReq, req, res) => {
        console.log(`>>> Proxying: ${req.method} ${req.originalUrl}`);
    },
    onProxyRes: (proxyRes, req, res) => {
        console.log(`<<< Response: ${proxyRes.statusCode} for ${req.method} ${req.originalUrl}`);
    },
    onError: (err, req, res) => {
        console.error(`!!! Error: "${err.message}" while proxying ${req.method} ${req.originalUrl}`);
    }
}));

app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT} and forwarding to ${TARGET}`);
});