"use client";

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
type Shape = {
  tool: Tool;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  width: number;
};

export default function Room() {
  const { roomId } = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTool, setSelectedTool] = useState<Tool>("pencil");
  const [isDrawing, setIsDrawing] = useState(false);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [lastX, setLastX] = useState(0);
  const [lastY, setLastY] = useState(0);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(2);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [currentShape, setCurrentShape] = useState<Shape | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 64;
      const context = canvas.getContext("2d");
      if (context) {
        context.strokeStyle = color;
        context.lineWidth = lineWidth;
        context.lineCap = "round";
        setCtx(context);
      }
    }
  }, []);

  const clearCanvas = () => {
    if (ctx && canvasRef.current) {
      ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.setTransform(1, 0, 0, 1, panOffset.x, panOffset.y); // Reapply pan
    }
  };

  const drawShape = (shape: Shape) => {
    if (!ctx) return;

    ctx.beginPath();
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.width;

    switch (shape.tool) {
      case "line":
        ctx.moveTo(shape.startX, shape.startY);
        ctx.lineTo(shape.endX, shape.endY);
        break;
      case "circle":
        const radius = Math.sqrt(
          Math.pow(shape.endX - shape.startX, 2) +
            Math.pow(shape.endY - shape.startY, 2)
        );
        ctx.arc(shape.startX, shape.startY, radius, 0, 2 * Math.PI);
        break;
      case "square":
        const width = shape.endX - shape.startX;
        const height = shape.endY - shape.startY;
        ctx.rect(shape.startX, shape.startY, width, height);
        break;
    }
    ctx.stroke();
  };

  const redrawCanvas = () => {
    clearCanvas();
    shapes.forEach(drawShape);
  };

  const getCanvasPoint = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left - panOffset.x,
      y: e.clientY - rect.top - panOffset.y,
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    if (!ctx || !canvasRef.current) return;

    if (selectedTool === "hand") {
      setIsPanning(true);
      return;
    }

    const point = getCanvasPoint(e);
    setIsDrawing(true);
    setLastX(point.x);
    setLastY(point.y);

    if (selectedTool !== "pencil" && selectedTool !== "eraser") {
      setCurrentShape({
        tool: selectedTool,
        startX: point.x,
        startY: point.y,
        endX: point.x,
        endY: point.y,
        color: color,
        width: lineWidth,
      });
    }

    if (selectedTool === "pencil" || selectedTool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
      ctx.strokeStyle = selectedTool === "eraser" ? "#ffffff" : color;
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!ctx || !canvasRef.current) return;

    if (isPanning && selectedTool === "hand") {
      setPanOffset((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
      ctx.setTransform(
        1,
        0,
        0,
        1,
        panOffset.x + e.movementX,
        panOffset.y + e.movementY
      );
      redrawCanvas();
      return;
    }

    if (!isDrawing) return;

    const point = getCanvasPoint(e);

    if (selectedTool === "pencil" || selectedTool === "eraser") {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else if (currentShape) {
      redrawCanvas();
      setCurrentShape({
        ...currentShape,
        endX: point.x,
        endY: point.y,
      });
      drawShape({
        ...currentShape,
        endX: point.x,
        endY: point.y,
      });
    }
  };

  const stopDrawing = () => {
    if (currentShape) {
      setShapes([...shapes, currentShape]);
      setCurrentShape(null);
    }
    setIsDrawing(false);
    setIsPanning(false);
  };

  const tools = [
    { icon: Pencil, name: "pencil" as Tool },
    { icon: Eraser, name: "eraser" as Tool },
    { icon: Hand, name: "hand" as Tool },
    { icon: Minus, name: "line" as Tool },
    { icon: Circle, name: "circle" as Tool },
    { icon: Square, name: "square" as Tool },
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
                onClick={() => setSelectedTool(tool.name)}
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (shapes.length > 0) {
                setShapes(shapes.slice(0, -1));
                redrawCanvas();
              }
            }}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="flex-1 bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />
    </div>
  );
}
