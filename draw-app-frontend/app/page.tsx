"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Canvas2D } from "./canvas/canvas";

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const canvasInstance = Canvas2D.getInstance();
      Canvas2D.initialize(canvas, "rectangle");
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);
  const onClickRect = () => {
    const canvasInstance = Canvas2D.getInstance();
    console.log(canvasRef.current);
    if (canvasRef.current) Canvas2D.initialize(canvasRef.current, "rectangle");
  };
  const onClickCircle = () => {
    const canvasInstance = Canvas2D.getInstance();
    if (canvasRef.current) Canvas2D.initialize(canvasRef.current, "circle");
  };
  const onClickSelector = () => {
    const canvasInstance = Canvas2D.getInstance();
    if (canvasRef.current) Canvas2D.initialize(canvasRef.current, "selector");
  };
  const onClickLine = () => {
    const canvasInstance = Canvas2D.getInstance();
    if (canvasRef.current) Canvas2D.initialize(canvasRef.current, "line");
  };
  const onClickDiamond = () => {
    const canvasInstance = Canvas2D.getInstance();
    if (canvasRef.current) Canvas2D.initialize(canvasRef.current, "diamond");
  };

  const onClickPan = () => {
    const canvasInstance = Canvas2D.getInstance();
    if (canvasRef.current) Canvas2D.initialize(canvasRef.current, null);
  };

  return (
    <div className="overflow-hidden h-screen m-0 p-0">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="bg-slate-300"
      />
      <div className="fixed top-2 left-2 flex gap-2">
        <button className="bg-black text-white p-2" onClick={onClickCircle}>
          circle
        </button>
        <button className="bg-black text-white p-2" onClick={onClickRect}>
          rectangle
        </button>
        <button className="bg-black text-white p-2" onClick={onClickSelector}>
          selector
        </button>
        <button className="bg-black text-white p-2" onClick={onClickLine}>
          line
        </button>
        <button className="bg-black text-white p-2" onClick={onClickDiamond}>
          diamond
        </button>
        <button className="bg-black text-white p-2" onClick={onClickPan}>
          Pan
        </button>
      </div>
    </div>
  );
}
