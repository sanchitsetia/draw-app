"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const wss = new ws_1.WebSocketServer({ noServer: true });
const server = http_1.default.createServer();
server.on("upgrade", (request, socket, head) => {
    try {
        const authheader = request.headers.authorization;
        if (!authheader) {
            console.log("Invalid or missing Authorization header");
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            socket.destroy();
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(authheader, process.env.JWT_SECRET);
        // @ts-ignore
        const userId = decoded["id"];
        wss.handleUpgrade(request, socket, head, (ws) => {
            // @ts-ignore
            ws.userid = userId;
            wss.emit("connection", ws, request);
        });
    }
    catch (error) {
        console.log("Invalid or missing Authorization header");
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
    }
});
wss.on('connection', function connection(ws) {
    // @ts-ignore
    const userId = ws.userid;
    console.log(`Client connected userid - ${userId}`);
    ws.on('error', console.error);
    ws.on('message', function message(data) {
        console.log('received: %s', data);
    });
    ws.send('something');
});
server.listen(8080, () => {
    console.log("WebSocket server is running on ws://localhost:8080");
});
