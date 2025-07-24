const http = require('http');
const { request: httpRequest } = require('http');
const { URL } = require('url');

const PORT = process.env.PORT || 3003;
const TARGET = new URL('http://localhost:1337'); // Change to your real target

const server = http.createServer((clientReq, clientRes) => {
    
    const url = new URL(clientReq.url, TARGET.origin);

    const options = {
        protocol: TARGET.protocol,
        hostname: TARGET.hostname,
        port: TARGET.port,
        method: clientReq.method,
        path: url.pathname + url.search,
        headers: {
            ...clientReq.headers,
            host: TARGET.hostname, // simulate changeOrigin
        },
    };

    console.log(`>>> Proxying: ${clientReq.method} ${clientReq.url}`);

    const proxyReq = httpRequest(options, (proxyRes) => {
        clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(clientRes, { end: true });

        console.log(`<<< Response: ${proxyRes.statusCode} for ${clientReq.method} ${clientReq.url}`);
    });

    proxyReq.on('error', (err) => {
        console.error(`!!! Error: "${err.message}" while proxying ${clientReq.method} ${clientReq.url}`);
        clientRes.writeHead(500);
        clientRes.end('Proxy error');
    });

    clientReq.pipe(proxyReq, { end: true });
});


server.on('error', (req, socket, head) => {
    console.log(`Handling ERROR for: ${req.url}`);
});

server.on('upgrade', function (req, socket, head) {
    console.log(`Handling UPGRADE for: ${req.url}`);
});

server.on('connect', (req, socket, head) => {
    console.log(`Handling CONNECT for: ${req.url}`);
});

server.on('end', (req, socket, head) => {
    console.log(`Handling END for: ${req.url}`);
});

server.on('close', (req, socket, head) => {
    console.log(`Handling CLOSE for: ${req.url}`);
});

server.on('data', (req, socket, head) => {
    console.log(`Handling DATA for: ${req.url}`);
});

server.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT} and forwarding to ${TARGET.href}`);
});