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
const client_1 = require("@prisma/client");
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const protectRoutes_1 = require("./middlewares/protectRoutes");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const prisma = new client_1.PrismaClient();
app.post("/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, name } = req.body;
        if (!username || !password || !name) {
            res.status(400).json({ error: "Missing fields" });
        }
        if (password.length < 8) {
            res.status(400).json({ error: "Password must be at least 8 characters" });
        }
        if (name.length < 3) {
            res.status(400).json({ error: "Name must be at least 3 characters" });
        }
        const user = yield prisma.user.findUnique({
            where: { username }
        });
        if (user) {
            res.status(400).json({ error: "User already exists" });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        yield prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                name
            }
        });
        res.status(201).json({ "message": "Signup Successful" });
    }
    catch (error) {
        console.log("error while signing up", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, password } = req.body;
    if (!username || !password) {
        res.status(400).json({ error: "Missing fields" });
    }
    const user = yield prisma.user.findUnique({
        where: { username }
    });
    if (!user) {
        res.status(400).json({ error: "User not found" });
    }
    const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        res.status(400).json({ error: "Invalid password" });
    }
    const token = jsonwebtoken_1.default.sign({ id: user.id }, process.env.JWT_SECRET);
    res.status(200).json({ message: "Signin successful", "token": token });
}));
app.post("/room", protectRoutes_1.protectRoutes, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        console.log(req.userid);
        const { roomName } = req.body;
        const room = yield prisma.room.create({
            data: {
                name: roomName
            }
        });
        yield prisma.user.update({
            //@ts-ignore
            where: { id: req.userid },
            data: { roomId: room.id }
        });
        res.status(201).json({ message: "Room created successfully", "roomId": room.id });
    }
    catch (error) {
        console.log("error while creating room", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.get("/existingShapes", protectRoutes_1.protectRoutes, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //@ts-ignore
        const userId = req.userid;
        const user = yield prisma.user.findUnique({
            where: { id: userId, roomId: Number(req.query.roomId) },
        });
        if (!user) {
            res.status(200).json({ messages: [] });
        }
        const messages = yield prisma.message.findMany({
            where: {
                roomId: Number(req.query.roomId),
            },
            include: {
                Path: {
                    include: {
                        Point: true,
                    },
                },
                Shape: true,
            }
        });
        res.status(200).json({ messages });
    }
    catch (error) {
        console.log("error while fetching existing shapes", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}));
app.listen(3000, () => {
    console.log("Server listening on port 3000");
});
