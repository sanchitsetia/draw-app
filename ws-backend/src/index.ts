import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

const wss = new WebSocketServer({ noServer: true });
const server = http.createServer();

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
  ws.on('error', console.error);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
});

server.listen(8080, () => {
  console.log("WebSocket server is running on ws://localhost:8080");
});