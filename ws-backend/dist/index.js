"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
const wss = new ws_1.WebSocketServer({ noServer: true });
const server = http_1.default.createServer();
const prisma = new client_1.PrismaClient();
const Users = [];
const Room = {};
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
    const user = Users.find(user => user.id === userId);
    if (!user) {
        Users.push({
            id: userId,
            name: "",
            socket: ws,
            room: []
        });
    }
    ws.on('close', function close() {
        console.log('Client disconnected');
        const user = Users.find(user => user.id === userId);
        if (user) {
            Users.splice(Users.indexOf(user), 1);
        }
    });
    ws.on('error', console.error);
    ws.on('message', function message(data) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('received: %s', data);
            console.log("current server state User before", Users);
            console.log("current server state Room before", Room);
            const parsedData = JSON.parse(data.toString());
            if (parsedData.type === "join_room") {
                try {
                    const roomfromdb = yield prisma.room.findUnique({
                        where: {
                            name: parsedData.payload.roomName
                        }
                    });
                    yield prisma.user.update({
                        where: { id: userId },
                        data: { roomId: roomfromdb.id }
                    });
                    const user = Users.find(user => user.id === userId);
                    if (!(user === null || user === void 0 ? void 0 : user.room.includes(roomfromdb === null || roomfromdb === void 0 ? void 0 : roomfromdb.id))) {
                        user === null || user === void 0 ? void 0 : user.room.push(roomfromdb === null || roomfromdb === void 0 ? void 0 : roomfromdb.id);
                    }
                    if (Room[roomfromdb === null || roomfromdb === void 0 ? void 0 : roomfromdb.id]) {
                        if (!(Room[roomfromdb === null || roomfromdb === void 0 ? void 0 : roomfromdb.id]).includes(userId)) {
                            Room[roomfromdb === null || roomfromdb === void 0 ? void 0 : roomfromdb.id].push(userId);
                        }
                    }
                    else {
                        Room[roomfromdb === null || roomfromdb === void 0 ? void 0 : roomfromdb.id] = [userId];
                    }
                    ws.send(JSON.stringify({ "status": 200, "message": "Room Joined Successfully" }));
                }
                catch (error) {
                    console.log("error while joining room", error);
                    ws.send(JSON.stringify({ "status": 500, "error": "Internal server error" }));
                }
            }
            if (parsedData.type === "leave_room") {
                try {
                    const roomfromdb = yield prisma.room.findUnique({
                        where: { name: parsedData.payload.roomName }
                    });
                    yield prisma.user.update({
                        where: { id: userId, roomId: roomfromdb === null || roomfromdb === void 0 ? void 0 : roomfromdb.id },
                        data: { roomId: null }
                    });
                    const user = Users.find(user => user.id === userId);
                    user === null || user === void 0 ? void 0 : user.room.splice(user.room.indexOf(roomfromdb === null || roomfromdb === void 0 ? void 0 : roomfromdb.id));
                    if (Room[roomfromdb === null || roomfromdb === void 0 ? void 0 : roomfromdb.id] && (Room[roomfromdb === null || roomfromdb === void 0 ? void 0 : roomfromdb.id]).includes(userId)) {
                        Room[roomfromdb === null || roomfromdb === void 0 ? void 0 : roomfromdb.id].splice(Room[roomfromdb === null || roomfromdb === void 0 ? void 0 : roomfromdb.id].indexOf(userId));
                    }
                    ws.send(JSON.stringify({ "status": 200, "message": "Room Left Successfully" }));
                }
                catch (error) {
                    console.log("error while leaving room", error);
                    ws.send(JSON.stringify({ "status": 500, "error": "Internal server error" }));
                }
            }
            if (parsedData.type === "delete_room") {
                try {
                    const roomFromdb = yield prisma.room.findUnique({
                        where: { name: parsedData.payload.roomName }
                    });
                    yield prisma.room.delete({
                        where: { id: roomFromdb === null || roomFromdb === void 0 ? void 0 : roomFromdb.id }
                    });
                    yield prisma.user.update({
                        where: { id: userId },
                        data: { roomId: null }
                    });
                    const user = Users.find(user => user.id === userId);
                    user === null || user === void 0 ? void 0 : user.room.splice(user.room.indexOf(roomFromdb === null || roomFromdb === void 0 ? void 0 : roomFromdb.id));
                    delete Room[roomFromdb === null || roomFromdb === void 0 ? void 0 : roomFromdb.id];
                    ws.send(JSON.stringify({ "status": 200, "message": "Room deleted Successfully" }));
                }
                catch (error) {
                    console.log("error while deleting room", error);
                    ws.send(JSON.stringify({ "status": 500, "error": "Internal server error" }));
                }
            }
            if (parsedData.type === "message") {
            }
            console.log("current server state User after", Users);
            console.log("current server state Room after", Room);
        });
    });
    ws.send('something');
});
server.listen(8080, () => {
    console.log("WebSocket server is running on ws://localhost:8080");
});
