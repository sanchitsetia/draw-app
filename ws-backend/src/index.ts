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

type parsedData = {
  type: "join_room" | "delete_room" | "leave_room" | "message",
  payload: {
    roomName: string,
    message?: Message,
  }
}
const Users: User[] = [];
const Room:{[roomName:string]:string[]} = {}

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

  ws.on('message', async function message(data) {
    console.log('received: %s', data);
    console.log("current server state User before",Users)
    console.log("current server state Room before",Room)
    const parsedData:parsedData = JSON.parse(data.toString());
    if(parsedData.type === "join_room"){
      try {
        const roomName = parsedData.payload.roomName
        const roomfromdb = await prisma.room.findUnique({
            where: {
              name: parsedData.payload.roomName
            }
          });
            await prisma.user.update({
              where: { id: userId },
              data: { roomId: roomfromdb!.id }
            })  
        const user = Users.find(user => user.id === userId)
        if(!user?.room.includes(roomfromdb?.id!))
        {
          user?.room.push(roomfromdb?.id!)
        }
        if(Room[roomName])
        {
          if(!(Room[roomName]).includes(userId))
          {
            Room[roomName].push(userId)
          }
        }
        else
        {
          Room[roomName] = [userId];
        }
        ws.send(JSON.stringify({"status": 200, "message" : "Room Joined Successfully"}))
        
      } catch (error) {
        console.log("error while joining room", error)
        ws.send(JSON.stringify({"status":500, "error": "Internal server error"}))
      }
    }
    if(parsedData.type === "leave_room"){
      try {
        const roomName = parsedData.payload.roomName
        const roomfromdb = await prisma.room.findUnique({
          where:{name:parsedData.payload.roomName}
        })
        await prisma.user.update({
          where:{id: userId, roomId: roomfromdb?.id },
          data: {roomId: null}
        })
        const user = Users.find(user=> user.id === userId)
        user?.room.splice(user.room.indexOf(roomfromdb?.id!))
        if(Room[roomName] && (Room[roomName]).includes(userId))
          {
              Room[roomName].splice(Room[roomName].indexOf(userId))
          }
        ws.send(JSON.stringify({"status": 200, "message" : "Room Left Successfully"}))
      } catch (error) {
        console.log("error while leaving room", error)
        ws.send(JSON.stringify({"status":500, "error": "Internal server error"}))        
      }
    }
    if(parsedData.type === "delete_room"){
      try {
        const roomName = parsedData.payload.roomName
        const roomFromdb = await prisma.room.findUnique({
          where: {name: parsedData.payload.roomName}
        })
        await prisma.room.delete({
          where: {id: roomFromdb?.id}
        })
        await prisma.user.update({
          where: {id: userId},
          data: {roomId: null}
        })
        const user = Users.find(user=> user.id === userId)
        user?.room.splice(user.room.indexOf(roomFromdb?.id!));
        delete Room[roomName]
        ws.send(JSON.stringify({"status": 200, "message" : "Room deleted Successfully"}))
      } catch (error) {
        console.log("error while deleting room", error)
        ws.send(JSON.stringify({"status":500, "error": "Internal server error"}))   
      }
    }
    if(parsedData.type === "message") {
      try {
        const roomName = parsedData.payload.roomName
        const shapeType = parsedData.payload.message?.type
        const userIdsInRoom = Room[roomName]
        if(userIdsInRoom)
        {
          userIdsInRoom.forEach((u)=>{
            let userSocket = (Users.find((u1)=> u1.id === u))?.socket
            if(userSocket)
              userSocket.send(JSON.stringify(parsedData.payload.message))
          })
        }

        const roomFromdb = await prisma.room.findUnique({
          where: {name: parsedData.payload.roomName}
        })
        
        if(shapeType === "circle" || shapeType === "diamond" || shapeType === "line" || shapeType === "rect")
        {
          const shapeCreated = await prisma.shape.create({
            data: {
              color:parsedData.payload.message?.color!,
              currentx:parsedData.payload.message?.currentx!,
              currenty:parsedData.payload.message?.currenty!,
              fillColor:parsedData.payload.message?.fillColor!,
              startx: parsedData.payload.message?.startx!,
              starty: parsedData.payload.message?.starty!,
              type: shapeType,
              width: parsedData.payload.message?.width!,
          }})

          await prisma.message.create({
            data: {
              isPath: false,
              createdBy: userId,
              roomId: roomFromdb?.id!,
              shapeId: shapeCreated.id
            }
          })
        }
        else if(shapeType === "pencil")
        {
          const messageCreated = await prisma.message.create({
            data: {
              isPath: true,
              createdBy: userId,
              roomId: roomFromdb?.id!,
            }
          });
          const pathCreated = await prisma.path.create({
            data: {
              messageId:messageCreated.id
            }
          });
          const pointsTobeInserted:({pathId:number,pointNumber:number,x:number,y:number}[]) = [];
          parsedData.payload.message?.points?.forEach((items)=>{
            pointsTobeInserted.push({pathId:pathCreated.id,pointNumber:items.pointNumber,x:items.x,y:items.y})
          })
          await prisma.point.createMany({
            data: pointsTobeInserted
          })
          await prisma.message.update({
            where: {id: messageCreated.id},
            data: {
              pathId: pathCreated.id
            }
          })
        }
        
      } catch (error) {
        console.log("error while deleting room", error)
        ws.send(JSON.stringify({"status":500, "error": "Internal server error"}))    
      }
    }
    console.log("current server state User after",Users)
    console.log("current server state Room after",Room)
  });

  ws.send('something');
});



server.listen(8080, () => {
  console.log("WebSocket server is running on ws://localhost:8080");
});