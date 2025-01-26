import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
dotenv.config();

const wss = new WebSocketServer({ noServer: true });
const server = http.createServer();
const prisma = new PrismaClient()

type User = {
  id: string,
  name: string,
  socket: WebSocket,
  room: number[]
}

type point = {
  x: number,
  y: number,
  pointNumber: number
}

type Message = {
  type: "rect"|"circle"|"line"| "diamond" | "pencil",
  startx?: number,
  starty?: number,
  currentx?: number,
  currenty?: number,
  color: string,
  width: number,
  fillColor: string
  points?: point[]
}

type Room = {
  name: string,
  messages: Message[]
}

type parsedData = {
  type: "join_room" | "delete_room" | "leave_room" | "message",
  payload: {
    roomName: string,
    message: Message,
  }
}
const Users: User[] = []
const Rooms: Room[] = []

server.on("upgrade", (request, socket, head) => {
  try {
    const authheader = request.headers.authorization;
    if (!authheader) {
      console.log("Invalid or missing Authorization header");
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return
    }
    const decoded = jwt.verify(authheader, process.env.JWT_SECRET!);
    // @ts-ignore
    const userId = decoded["id"];
    wss.handleUpgrade(request, socket, head, (ws) => {
      // @ts-ignore
      ws.userid = userId;
      wss.emit("connection", ws, request);    
    })
  } catch (error) {
    console.log("Invalid or missing Authorization header");
    socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
    socket.destroy();
  }
})

wss.on('connection', function connection(ws) {
  // @ts-ignore
  const userId = ws.userid
  console.log(`Client connected userid - ${userId}`);

  const user = Users.find(user => user.id === userId)
  if(!user){
    Users.push({
      id: userId,
      name: "",
      socket: ws,
      room: []
    })
  }

  ws.on('close', function close() {
    console.log('Client disconnected');
    const user = Users.find(user => user.id === userId)
    if(user){
      Users.splice(Users.indexOf(user),1)
    }
  });
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
    const parsedData:parsedData = JSON.parse(data.toString());
    if(parsedData.type === "join_room"){
      const room = Rooms.find(room => room.name === parsedData.payload.roomName)
      if(!room){
        const room = await prisma.room.findUnique({
          where: {
            name: parsedData.payload.roomName
          }
        })
        Rooms.push({
          name: parsedData.payload.roomName,
          messages: []
        })
      }
      const user = Users.find(user => user.id === userId)
      if(user){
        user.room.push(parsedData.payload.roomName)
      }
    }
    if(parsedData.type === "message"){
      const room = Rooms.find(room => room.id === parsedData.payload.roomName)
      if(room){
        room.messages.push(parsedData.payload.message)
      }
    }

  });

  ws.send('something');
});



server.listen(8080, () => {
  console.log("WebSocket server is running on ws://localhost:8080");
});