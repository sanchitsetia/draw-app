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
        const url = new URL(request.url, `http://${request.headers.host}`);
        const authheader = url.searchParams.get('token');
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
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t;
            console.log('received: %s', data);
            console.log("current server state User before", Users);
            console.log("current server state Room before", Room);
            const parsedData = JSON.parse(data.toString());
            if (parsedData.type === "join_room") {
                try {
                    const roomId = parsedData.payload.roomId;
                    yield prisma.user.update({
                        where: { id: userId },
                        data: { roomId: roomId }
                    });
                    const user = Users.find(user => user.id === userId);
                    if (!(user === null || user === void 0 ? void 0 : user.room.includes(roomId))) {
                        user === null || user === void 0 ? void 0 : user.room.push(roomId);
                    }
                    if (Room[roomId]) {
                        if (!(Room[roomId]).includes(userId)) {
                            Room[roomId].push(userId);
                        }
                    }
                    else {
                        Room[roomId] = [userId];
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
                    const roomId = parsedData.payload.roomId;
                    yield prisma.user.update({
                        where: { id: userId, roomId: roomId },
                        data: { roomId: null }
                    });
                    const user = Users.find(user => user.id === userId);
                    user === null || user === void 0 ? void 0 : user.room.splice(user.room.indexOf(roomId));
                    if (Room[roomId] && (Room[roomId]).includes(userId)) {
                        Room[roomId].splice(Room[roomId].indexOf(userId));
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
                    const roomId = parsedData.payload.roomId;
                    yield prisma.room.delete({
                        where: { id: roomId }
                    });
                    yield prisma.user.update({
                        where: { id: userId },
                        data: { roomId: null }
                    });
                    const user = Users.find(user => user.id === userId);
                    user === null || user === void 0 ? void 0 : user.room.splice(user.room.indexOf(roomId));
                    delete Room[roomId];
                    ws.send(JSON.stringify({ "status": 200, "message": "Room deleted Successfully" }));
                }
                catch (error) {
                    console.log("error while deleting room", error);
                    ws.send(JSON.stringify({ "status": 500, "error": "Internal server error" }));
                }
            }
            if (parsedData.type === "message") {
                try {
                    const roomId = parsedData.payload.roomId;
                    const shapeType = (_a = parsedData.payload.message) === null || _a === void 0 ? void 0 : _a.type;
                    const userIdsInRoom = Room[roomId];
                    if (userIdsInRoom) {
                        userIdsInRoom.forEach((u) => {
                            var _a;
                            let userSocket = (_a = (Users.find((u1) => u1.id === u))) === null || _a === void 0 ? void 0 : _a.socket;
                            if (userSocket && userSocket !== ws)
                                userSocket.send(JSON.stringify(parsedData));
                        });
                    }
                    if (shapeType === "circle" || shapeType === "diamond" || shapeType === "line" || shapeType === "rect") {
                        if (((_b = parsedData.payload.message) === null || _b === void 0 ? void 0 : _b.operation) === "add") {
                            const shapeCreated = yield prisma.shape.create({
                                data: {
                                    color: (_c = parsedData.payload.message) === null || _c === void 0 ? void 0 : _c.color,
                                    currentx: (_d = parsedData.payload.message) === null || _d === void 0 ? void 0 : _d.currentx,
                                    currenty: (_e = parsedData.payload.message) === null || _e === void 0 ? void 0 : _e.currenty,
                                    fillColor: (_f = parsedData.payload.message) === null || _f === void 0 ? void 0 : _f.fillColor,
                                    startx: (_g = parsedData.payload.message) === null || _g === void 0 ? void 0 : _g.startx,
                                    starty: (_h = parsedData.payload.message) === null || _h === void 0 ? void 0 : _h.starty,
                                    type: shapeType,
                                    width: (_j = parsedData.payload.message) === null || _j === void 0 ? void 0 : _j.width,
                                }
                            });
                            yield prisma.message.create({
                                data: {
                                    isPath: false,
                                    createdBy: userId,
                                    roomId: roomId,
                                    shapeId: shapeCreated.id
                                }
                            });
                        }
                        else if (((_k = parsedData.payload.message) === null || _k === void 0 ? void 0 : _k.operation) === "delete") {
                            yield prisma.message.deleteMany({
                                where: {
                                    isPath: false,
                                    roomId: roomId,
                                    Shape: {
                                        currentx: (_l = parsedData.payload.message) === null || _l === void 0 ? void 0 : _l.currentx,
                                        currenty: (_m = parsedData.payload.message) === null || _m === void 0 ? void 0 : _m.currenty,
                                        startx: (_o = parsedData.payload.message) === null || _o === void 0 ? void 0 : _o.startx,
                                        starty: (_p = parsedData.payload.message) === null || _p === void 0 ? void 0 : _p.starty,
                                        type: shapeType,
                                    }
                                }
                            });
                        }
                    }
                    else if (shapeType === "pencil") {
                        if (((_q = parsedData.payload.message) === null || _q === void 0 ? void 0 : _q.operation) === "add") {
                            console.log("pencil pencil");
                            const messageCreated = yield prisma.message.create({
                                data: {
                                    isPath: true,
                                    createdBy: userId,
                                    roomId: roomId,
                                }
                            });
                            const pathCreated = yield prisma.path.create({
                                data: {
                                    messageId: messageCreated.id
                                }
                            });
                            const pointsTobeInserted = [];
                            (_s = (_r = parsedData.payload.message) === null || _r === void 0 ? void 0 : _r.points) === null || _s === void 0 ? void 0 : _s.forEach((items) => {
                                pointsTobeInserted.push({ pathId: pathCreated.id, pointNumber: items.pointNumber, x: items.x, y: items.y });
                            });
                            yield prisma.point.createMany({
                                data: pointsTobeInserted
                            });
                            yield prisma.message.update({
                                where: { id: messageCreated.id },
                                data: {
                                    pathId: pathCreated.id
                                }
                            });
                        }
                        else if (((_t = parsedData.payload.message) === null || _t === void 0 ? void 0 : _t.operation) === "delete") {
                            yield prisma.message.deleteMany({
                                where: {
                                    isPath: true,
                                    roomId: roomId
                                }
                            });
                        }
                    }
                }
                catch (error) {
                    console.log("error while deleting room", error);
                    ws.send(JSON.stringify({ "status": 500, "error": "Internal server error" }));
                }
            }
            console.log("current server state User after", Users);
            console.log("current server state Room after", Room);
        });
    });
});
server.listen(8080, () => {
    console.log("WebSocket server is running on ws://localhost:8080");
});
