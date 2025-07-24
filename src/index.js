const http = require('http');
const { request: httpRequest } = require('http');
const { URL } = require('url');
const net = require('net');

const PORT = process.env.PORT || 3003;
const TARGET = new URL('http://localhost:1337'); // Your target server

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
            host: TARGET.hostname, // Simulate changeOrigin
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

// Handle CONNECT requests
server.on('connect', (req, clientSocket, head) => {

    console.log(`Handling CONNECT for: ${req.url}`);

    const { port, hostname } = new URL(`http://${req.url}`); // Parse the requested host and port

    console.log(`Connecting to ${hostname}:${port}...`);

    const serverSocket = net.connect(port || 80, hostname, () => {

        console.log('Connected');

        clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n'); // Signal success to client

        serverSocket.write(head); // Forward any initial data

        serverSocket.pipe(clientSocket); // Pipe data from target to client
        clientSocket.pipe(serverSocket); // Pipe data from client to target

    });

    serverSocket.on('error', (err) => {

        console.error(`Server socket error: ${err.message}`);

        clientSocket.end('HTTP/1.1 500 Internal Server Error\r\n\r\n');

    });

    clientSocket.on('error', (err) => {

        console.error(`Client socket error: ${err.message}`);

        serverSocket.end();

    });
});

server.on('error', (err) => {
    console.log(`Server error: ${err.message}`);
});

server.on('upgrade', (req, socket, head) => {
    console.log(`Handling UPGRADE for: ${req.url}`);
    // Add WebSocket handling here if needed
});

server.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT} and forwarding to ${TARGET.href}`);
});