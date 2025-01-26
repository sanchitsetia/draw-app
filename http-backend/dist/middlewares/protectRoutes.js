"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectRoutes = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const protectRoutes = (req, res, next) => {
    if (!req.headers.authorization) {
        console.log("here 1");
        res.status(401).json({ message: "Unauthorized" });
    }
    const token = req.headers.authorization;
    if (!token) {
        console.log("here 2");
        res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            console.log("here 3");
            res.status(401).json({ message: "Unauthorized" });
        }
        // @ts-ignore
        req.userid = decoded === null || decoded === void 0 ? void 0 : decoded.id;
        next();
    }
    catch (error) {
        console.log("here 4", error);
        res.status(401).json({ message: "Unauthorized" });
    }
};
exports.protectRoutes = protectRoutes;
