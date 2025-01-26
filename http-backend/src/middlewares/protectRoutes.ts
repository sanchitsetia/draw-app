import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";


export const protectRoutes = (req:Request, res:Response, next:NextFunction)=> {
  if (!req.headers.authorization) {
    console.log("here 1")
    res.status(401).json({ message: "Unauthorized" });
  }

  const token = req.headers.authorization;
  if(!token){
    console.log("here 2")
    res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const decoded = jwt.verify(token!, process.env.JWT_SECRET!);
    if (!decoded) {
      console.log("here 3")
      res.status(401).json({ message: "Unauthorized" });
    }
      // @ts-ignore
      req.userid = decoded?.id;
      next();
  } catch (error) {
    console.log("here 4",error)
    res.status(401).json({ message: "Unauthorized" });
  }
}