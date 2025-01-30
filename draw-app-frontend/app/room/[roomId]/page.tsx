"use client";

import { Canvas2D } from "@/app/canvas/canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Circle,
  Eraser,
  Hand,
  Minus,
  Pencil,
  Redo2,
  Square,
  Undo2,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Tool = "pencil" | "eraser" | "hand" | "line" | "circle" | "square";

import axios from "axios";

export default function Room() {
  const { roomId } = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [roomJoined, setRoomJoined] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool>("pencil");

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const socket = new WebSocket(
      `ws://localhost:8080/?token=${encodeURIComponent(token as string)}`
    );
    socket.onopen = () => {
      setSocket(socket);
      console.log("Connected to WebSocket server");
      socket.send(
        JSON.stringify({
          type: "join_room",
          payload: {
            roomId: Number(roomId),
          },
        })
      );
    };
  }, []);

  useEffect(() => {
    if (socket) {
      console.log("inside useEffect for socket on message");

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log(data);
        if (data.message === "Room Joined Successfully") {
          setRoomJoined(true);
        }
        if (data.type === "message") {
          const canvasInstance = Canvas2D.getInstance();
          if (data.payload.message.type !== "pencil")
            canvasInstance.addShape({
              currentx: data.payload.message.currentx,
              currenty: data.payload.message.currenty,
              startx: data.payload.message.startx,
              starty: data.payload.message.starty,
              type: data.payload.message.type,
            });
          else {
            canvasInstance.addPath({
              color: data.payload.message.color,
              width: data.payload.message.width,
              points: data.payload.message.points,
            });
          }
        }
      };
      return () => {
        console.log("closing socket");
        socket.close();
      };
    }
  }, [socket]);

  useEffect(() => {
    if (roomJoined && canvasRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const getShapes = async () => {
        const res = await axios.get(
          `http://localhost:3000/existingShapes?roomId=${roomId}`,
          {
            headers: {
              Authorization: `${localStorage.getItem("authToken")}`,
            },
          }
        );
        if (res.status === 200) {
          console.log(res.data.messages);
          const canvasInstance = Canvas2D.getInstance();
          let shapes = [];
          let paths = [];
          const shapesData = res.data.messages.filter((m) => !m.isPath);
          const pathsData = res.data.messages.filter((m) => m.isPath);
          console.log(shapesData);
          shapesData.forEach((s) => {
            shapes.push({
              currentx: s.Shape.currentx,
              currenty: s.Shape.currenty,
              startx: s.Shape.startx,
              starty: s.Shape.starty,
              type: s.Shape.type,
            });
          });
          pathsData.forEach((p) => {
            paths.push({
              color: "black",
              width: 2,
              points: p.Path.Point.map((i) => {
                return { x: i.x, y: i.y };
              }),
            });
          });
          canvasInstance.setShapes(shapes);
          canvasInstance.setPaths(paths);
        }
      };
      getShapes();

      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 64;
        const canvasInstance = Canvas2D.getInstance();
        Canvas2D.initialize(canvas, "rect", socket);
        setSelectedTool("rect" as Tool);
      };

      window.addEventListener("resize", resizeCanvas);
      resizeCanvas();

      return () => {
        window.removeEventListener("resize", resizeCanvas);
      };
    }
  }, [roomJoined]);

  const clearCanvas = () => {
    if (ctx && canvasRef.current) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.setTransform(1, 0, 0, 1, panOffset.x, panOffset.y); // Reapply pan
    }
  };

  const tools = [
    { icon: Pencil, name: "pencil" as Tool },
    { icon: Eraser, name: "eraser" as Tool },
    { icon: Hand, name: "selector" as Tool },
    { icon: Minus, name: "line" as Tool },
    { icon: Circle, name: "circle" as Tool },
    { icon: Square, name: "rect" as Tool },
  ];

  return (
    <div className="h-screen flex flex-col">
      {/* Toolbar */}
      <div className="h-16 border-b px-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-secondary rounded-lg p-1">
            {tools.map((tool) => (
              <Button
                key={tool.name}
                variant={selectedTool === tool.name ? "secondary" : "ghost"}
                size="icon"
                onClick={() => {
                  setSelectedTool(tool.name);
                  Canvas2D.initialize(canvasRef.current!, tool.name, socket);
                }}
                className="h-8 w-8"
              >
                <tool.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="flex items-center space-x-2">
            <Input
              type="color"
              value={color}
              className="w-8 h-8 p-0 border-0"
              onChange={(e) => {
                setColor(e.target.value);
                if (ctx) ctx.strokeStyle = e.target.value;
              }}
            />
            <Input
              type="number"
              className="w-20"
              min="1"
              max="50"
              value={lineWidth}
              onChange={(e) => {
                const width = Number(e.target.value);
                setLineWidth(width);
                if (ctx) ctx.lineWidth = width;
              }}
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" onClick={() => {}}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <canvas ref={canvasRef} className="flex-1 bg-white" />
    </div>
  );
}
