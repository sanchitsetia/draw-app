import { PrismaClient } from "@prisma/client";
import express from "express";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";

const app = express();
const prisma = new PrismaClient();

app.post("/signup",async (req:Request,res:Response)=>{
  try {
    const {username,password,name} = req.body;
    if(!username || !password || !name){
      res.status(400).json({error:"Missing fields"});
    }
    if(password.length < 8){
      res.status(400).json({error:"Password must be at least 8 characters"});
    }
    if(name.length < 3){
      res.status(400).json({error:"Name must be at least 3 characters"});
    }
    const hashedPassword = await bcrypt.hash(password,10);
    await prisma.user.create({
      data:{
        username,
        password:hashedPassword,
        name
      }
    });
    res.status(201).json({"message": "Signup Successful"}); 
  } catch (error) {
    console.log("error while signing up",error);
    res.status(500).json({error:"Internal Server Error"});
  }
})

app.post("signin",async (req:Request,res:Response)=>{
  const {username,password} = req.body;
  if(!username || !password){
    res.status(400).json({error:"Missing fields"});
  }
  const user = await prisma.user.findUnique({
    where:{username}
  });
  if(!user){
    res.status(400).json({error:"User not found"});
  }
  const isPasswordValid = await bcrypt.compare(password,user!.password);
  if(!isPasswordValid){
    res.status(400).json({error:"Invalid password"});
  }
  res.status(200).json({message:"Signin successful"});
})