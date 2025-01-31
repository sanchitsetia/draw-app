interface shape {
  startx: number;
  starty: number;
  currentx: number;
  currenty: number;
  type: "rect" | "circle" | "line" | "diamond";
}

interface point {
  x: number;
  y: number;
}

interface path {
  points: point[];
  color: string;
  width: number;
}

export class Canvas2D{
  private static instance:Canvas2D|null = null;
  private canvas: HTMLCanvasElement|null=null;
  private shapes: shape[] = [];
  private isDrawing = false;
  private startx = 0;
  private starty = 0;
  private currentx = 0;
  private currenty = 0;
  private currentSelectedShape: "rect" | "circle" | null | "selector" | "line" | "diamond" | "pencil" | "eraser" = null;
  private isSelected = false;
  private selectedIndex = 0;
  private isDraggable = false;
  private currentStrokeColor = "black";
  private currentFillColor = "transparent";
  private handleIndex: number|null = null;
  private isPanning = false;
  private offset = { x: 0, y: 0 };
  private paths: path[] = [];
  private currentPath: path = { points: [], color: "black", width: 2 };
  private isErasing = false;
  private socket: WebSocket | null = null;
  private roomId: number | null = null;

  private constructor() {}

  public static getInstance():Canvas2D{
    if(!Canvas2D.instance){
      Canvas2D.instance = new Canvas2D();
    }
    return Canvas2D.instance
  }

  public static initialize(canvas: HTMLCanvasElement,currentSelectedShape: "rect" | "circle" | null | "selector" | "line" | "diamond"|"pencil" | "eraser",socket?:WebSocket,roomId?:number):void {
    if(!Canvas2D.instance || Canvas2D.instance.canvas !== canvas){
      Canvas2D.instance!.canvas = canvas
    }
    if(socket)
      Canvas2D.instance!.socket = socket
    if(roomId)
      Canvas2D.instance!.roomId = roomId

    Canvas2D.instance?.detachEvents();    
    Canvas2D.instance!.currentSelectedShape = currentSelectedShape;
    Canvas2D.instance!.attachEvents();
    Canvas2D.instance!.isSelected = false;
    Canvas2D.instance!.clearCanvas();
  }

  private detachEvents() {
    if (!this.canvas) return;
    console.log("removing events")
    this.canvas.removeEventListener("mousedown", this.onMouseDownSelector);
    this.canvas.removeEventListener("mousemove", this.onMouseMoveSelector);
    this.canvas.removeEventListener("mouseup", this.onMouseUpSelector);
    this.canvas.removeEventListener("mousedown", this.onMouseDownPencil);
    this.canvas.removeEventListener("mousemove", this.onMouseMovePencil);
    this.canvas.removeEventListener("mouseup", this.onMouseUpPencil);
    this.canvas.removeEventListener("mousedown", this.onMouseDownEraser);
    this.canvas.removeEventListener("mousemove", this.onMouseMoveEraser);
    this.canvas.removeEventListener("mouseup", this.onMouseUpEraser);
    this.canvas.removeEventListener("mousedown", this.onMouseDownShape);
    this.canvas.removeEventListener("mousemove", this.onMouseMoveShape);
    this.canvas.removeEventListener("mouseup", this.onMouseUpShape);
    this.canvas.removeEventListener("wheel", this.onMouseMovePanning)
  }

  private attachEvents() {
    if(!this.canvas) return;
    if(this.currentSelectedShape === null) 
      this.PanningEventHandler();
    if(this.currentSelectedShape === "rect" || this.currentSelectedShape === "circle" || this.currentSelectedShape === "line" || this.currentSelectedShape === "diamond")
      this.ShapeEventHandler();
    else if(this.currentSelectedShape === "selector")
      this.SelectorEventHandler();
    else if(this.currentSelectedShape === "pencil")
      this.PencilEventHandler();
    else if (this.currentSelectedShape === "eraser")
      this.EraserEventHandler();
  }

  private getCanvasPoint = (e: MouseEvent) => {
    const rect = this.canvas?.getBoundingClientRect();
    return {
      x: e.clientX - rect!.left,
      y: e.clientY - rect!.top
    };
  };

  private drawBoundingBox(ctx: CanvasRenderingContext2D, shape: shape) {
    const { startx, starty, currentx, currenty } = shape;
  
    // Calculate the bounding box
    const minX = Math.min(startx, currentx);
    const minY = Math.min(starty, currenty);
    const maxX = Math.max(startx, currentx);
    const maxY = Math.max(starty, currenty);
  
    // Draw bounding box
    ctx.strokeStyle = "blue";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]); // Dashed line for the bounding box
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
  
    // Reset line dash
    ctx.setLineDash([]);
  
    // Draw resize handles (small squares)
    this.drawResizeHandle(ctx, minX, minY); // Top-left
    this.drawResizeHandle(ctx, maxX, minY); // Top-right
    this.drawResizeHandle(ctx, minX, maxY); // Bottom-left
    this.drawResizeHandle(ctx, maxX, maxY); // Bottom-right
  }
  
  private drawResizeHandle(ctx: CanvasRenderingContext2D, x: number, y: number) {
    const size = 6; 
    ctx.fillStyle = "red";
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
  }

  private getResizeHandleIndex(x: number, y: number, shape: shape): number | null {
    const { startx, starty, currentx, currenty } = shape;
    console.log("aaunnn")
  
    const handles = [
      { x: Math.min(startx, currentx), y: Math.min(starty, currenty) }, // Top-left
      { x: Math.max(startx, currentx), y: Math.min(starty, currenty) }, // Top-right
      { x: Math.min(startx, currentx), y: Math.max(starty, currenty) }, // Bottom-left
      { x: Math.max(startx, currentx), y: Math.max(starty, currenty) }, // Bottom-right
    ];
  
    for (let i = 0; i < handles.length; i++) {
      const handle = handles[i];
      const size = 6;
      if (x >= handle.x - size && x <= handle.x + size && y >= handle.y - size && y <= handle.y + size) {
        return i; // Return the index of the handle being clicked
      }
    }
    return null;
  }

   public clearCanvas() {
    console.log("shapes in clean canvas func", this.shapes)
    const ctx = this.canvas?.getContext("2d");
    if(ctx)
    {
    ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
    this.drawPaths();
    console.log(this.shapes)
    this.shapes.forEach((shape,index)=>{
      if(shape.type === "rect")
        this.drawRectangle(ctx,shape.startx,shape.starty,shape.currentx,shape.currenty);  
      else if(shape.type === "circle")
        this.drawCircle(ctx,shape.startx,shape.starty,shape.currentx,shape.currenty);
      else if(shape.type === "line")
        this.drawLine(ctx,shape.startx,shape.starty,shape.currentx,shape.currenty);
      else if(shape.type === "diamond")
        this.drawDiamond(ctx,shape.startx,shape.starty,shape.currentx,shape.currenty);
      if (this.isSelected && index === this.selectedIndex) {
        this.drawBoundingBox(ctx, shape);
      }
    })

    }
  }

  private drawDynamic = (type: "rect"|"circle"|"line"|"diamond") => {
    const ctx = this.canvas?.getContext("2d");
    if(!ctx) return;
    this.clearCanvas();
    if(type === "rect")
      this.drawRectangle(ctx,this.startx,this.starty,this.currentx,this.currenty);
    else if(type === "circle")
      this.drawCircle(ctx,this.startx,this.starty,this.currentx,this.currenty);
    else if(type === "line")
      this.drawLine(ctx,this.startx,this.starty,this.currentx,this.currenty);
    else if(type === "diamond")
      this.drawDiamond(ctx,this.startx,this.starty,this.currentx,this.currenty);
  
  }

  private drawRectangle = (ctx:CanvasRenderingContext2D,sx:number,sy:number,cx:number,cy:number,fillColor:string="transparent",strokeColor:string="black")=>{
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx?.strokeRect(sx,sy,cx-sx,cy-sy);
  }

  private drawLine = (ctx:CanvasRenderingContext2D,sx:number,sy:number,cx:number,cy:number,fillColor:string="transparent",strokeColor:string="black")=>{
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx?.beginPath();
    ctx.moveTo(sx,sy);
    ctx.lineTo(cx,cy);
    ctx.stroke();
  }

  private drawDiamond = (ctx:CanvasRenderingContext2D,sx:number,sy:number,cx:number,cy:number,fillColor:string="transparent",strokeColor:string="black")=>{
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx?.beginPath();
    let xdiv2 = sx + (cx - sx) / 2;
    let ydiv2 = sy + (cy - sy) / 2;
    ctx.moveTo(xdiv2,sy);
    ctx.lineTo(sx,ydiv2);
    ctx.lineTo(xdiv2,cy);
    ctx.lineTo(cx,ydiv2);
    ctx.lineTo(xdiv2,sy);
    ctx.stroke();
  }
  
  private drawCircle = (ctx:CanvasRenderingContext2D,sx:number,sy:number,cx:number,cy:number,fillColor:string="transparent",strokeColor:string="black")=>{
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    let radiusX = (cx - sx) / 2;
    let radiusY = (cy - sy) / 2;
    ctx?.beginPath()
    ctx?.ellipse(sx + radiusX,sy+radiusY,Math.abs(radiusX),Math.abs(radiusY),0,0,2*Math.PI);
    ctx?.stroke();
  }

private ShapeEventHandler = ()=>{
  this.isDrawing = false;
  this.canvas?.addEventListener("mousedown",this.onMouseDownShape)
  this.canvas?.addEventListener("mousemove",this.onMouseMoveShape)
  this.canvas?.addEventListener("mouseup",this.onMouseUpShape)
}

private SelectorEventHandler = ()=>{
  this.startx = 0;
  this.starty = 0;
  this.isSelected = false;
  this.canvas?.addEventListener("mousedown",this.onMouseDownSelector)
  this.canvas?.addEventListener("mousemove",this.onMouseMoveSelector)
  this.canvas?.addEventListener("mouseup",this.onMouseUpSelector)
}

private EraserEventHandler = ()=>{
  this.startx = 0;
  this.starty = 0;
  this.isSelected = false;
  this.canvas?.addEventListener("mousedown",this.onMouseDownEraser)
  this.canvas?.addEventListener("mousemove",this.onMouseMoveEraser)
  this.canvas?.addEventListener("mouseup",this.onMouseUpEraser)
}
private removeShapeOrPathSelected(x:number,y:number){
  for(let [index,s] of this.shapes.entries()) {
    if(this.isShapeSelected(x,y,s.startx,s.starty,s.currentx,s.currenty))
      {
        this.shapes.splice(index,1);
        this.sendOverSocket(s,undefined,"delete");
        break;
      }
  }
  for(let [index,p] of this.paths.entries()) {
    if(this.isPathSelected(x,y,p.points))
      {
        this.paths.splice(index,1);
        this.sendOverSocket(undefined,p,"delete");
        break;
      }
  }
}

private isPathSelected(x:number,y:number,points:point[]){
  for(let [index,p] of points.entries()) {
    if(index === points.length-1)
      break;
    if(x >= Math.min(p.x,points[index+1].x) && x <= Math.max(p.x,points[index+1].x) && y >= Math.min(p.y,points[index+1].y) && y <= Math.max(p.y,points[index+1].y))
      return true;
  }
  return false
}

private onMouseDownEraser = (e:MouseEvent)=>{
  this.isErasing = true;
  const currentPoint = this.getCanvasPoint(e)
  this.startx = currentPoint.x;
  this.starty = currentPoint.y;
  this.removeShapeOrPathSelected(this.startx,this.starty);
}

private onMouseMoveEraser = (e:MouseEvent)=>{
  if(!this.isErasing)
    return;
  const currentPoint = this.getCanvasPoint(e)
  this.currentx = currentPoint.x
  this.currenty = currentPoint.y
  this.removeShapeOrPathSelected(this.currentx,this.currenty);
  this.clearCanvas();
}

private onMouseUpEraser = (e:MouseEvent)=>{
  this.isErasing = false;
  this.clearCanvas()
}

private drawPaths=()=>{
  const ctx = this.canvas?.getContext("2d");
  if(ctx){
    this.paths.forEach((path)=>{
      ctx.beginPath();
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      path.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    })
    if(this.isDrawing && this.currentPath.points.length > 0){
      ctx.beginPath();
      ctx.strokeStyle = this.currentPath.color;
      ctx.lineWidth = this.currentPath.width;
      this.currentPath.points.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    }
  }
}

private PencilEventHandler = ()=>{
  this.startx = 0;
  this.starty = 0;
  this.isSelected = false;
  this.canvas?.addEventListener("mousedown",this.onMouseDownPencil)
  this.canvas?.addEventListener("mousemove",this.onMouseMovePencil)
  this.canvas?.addEventListener("mouseup",this.onMouseUpPencil)
}

private onMouseDownPencil = (event:MouseEvent)=>{
  this.isDrawing = true;
  const currentPoint = this.getCanvasPoint(event)
  this.startx = currentPoint.x;
  this.starty = currentPoint.y;
  this.currentPath.points.push({x:this.startx,y:this.starty})
}

private onMouseMovePencil = (event:MouseEvent)=>{
  if(this.isDrawing){
    const currentPoint = this.getCanvasPoint(event)
    this.currentx = currentPoint.x
    this.currenty = currentPoint.y
    this.currentPath.points.push({x:this.currentx,y:this.currenty})
    this.clearCanvas()
  }
}

private onMouseUpPencil = (event:MouseEvent)=>{
  if(this.isDrawing){
    this.isDrawing = false;
    this.addPath(this.currentPath);
    this.sendOverSocket(undefined,this.currentPath);
    this.currentPath = { points: [], color: "black", width: 2 };  
  }

}

private isShapeSelected = (cx:number,cy:number, ssx:number, ssy:number, scx:number, scy:number) => {
  if((cx> ssx && cx< scx && cy>ssy && cy < scy) || (cx< ssx && cx> scx && cy>ssy && cy < scy) || 
  (cx< ssx && cx> scx && cy<ssy && cy > scy) || (cx> ssx && cx< scx && cy<ssy && cy > scy) )
  return true;
  return false;
}

private PanningEventHandler = ()=>{
  this.isDrawing = false;
  this.canvas?.addEventListener("wheel",this.onMouseMovePanning)
}

private onMouseMovePanning = (event:WheelEvent)=>{
  event.preventDefault();
  this.currentx = event.clientX;
  this.currenty = event.clientY;

    const ctx = this.canvas?.getContext("2d");
    if(ctx){
      console.log("panning")
      ctx.clearRect(0,0,this.canvas?.width!,this.canvas?.height!)
      ctx.save()
      this.offset.x += event.deltaX;
      this.offset.y += event.deltaY;
      ctx.translate(this.offset.x, this.offset.y);
      this.clearCanvas()
      ctx.restore()
    }
  }

    private onMouseDownSelector = (event:MouseEvent)=>{
      this.startx = event.clientX;
      this.starty = event.clientY;
      this.currentx = event.clientX;
      this.currenty = event.clientY;
      console.log("currentx,currenty",this.currentx,this.currenty)

      if(this.isSelected)
      {
          // Check if mouse is on a resize handle
          console.log("Aaaaaaaaa")
        const selectedShape = this.shapes[this.selectedIndex];
        console.log("sssssss",this.shapes);
        console.log("iiii",this.selectedIndex)
        console.log(selectedShape)
        const handleIndex = this.getResizeHandleIndex(this.currentx, this.currenty, selectedShape);
        if (handleIndex !== null) {
          console.log("aaaaabbbbbb")
          this.handleIndex = handleIndex;
          this.isSelected = true;
          return;
        }
      }

      for(let [index,s] of this.shapes.entries()) {
        if(this.isShapeSelected(this.currentx,this.currenty,s.startx,s.starty,s.currentx,s.currenty))
          {
            this.isDraggable = true
            this.isSelected = true;
            this.selectedIndex = index;
            console.log(s)
            console.log(this.shapes)
            console.log(index)
            break;
          }
      }
    }

    private onMouseMoveSelector = (event:MouseEvent)=>{
      this.currentx = event.clientX;
      this.currenty = event.clientY;

      if(this.isSelected && this.handleIndex !== null) {
        const shape = this.shapes[this.selectedIndex];
        switch (this.handleIndex) {
          case 0: // Top-left
            shape.startx = this.currentx;
            shape.starty = this.currenty;
            break;
          case 1: // Top-right
            shape.currentx = this.currentx;
            shape.starty = this.currenty;
            break;
          case 2: // Bottom-left
            shape.startx = this.currentx;
            shape.currenty = this.currenty;
            break;
          case 3: // Bottom-right
            shape.currentx = this.currentx;
            shape.currenty = this.currenty;
            break;
        }
        this.clearCanvas();
        return;
      }
      if(this.isSelected && this.isDraggable)
      {
        this.currentx = event.clientX
        this.currenty = event.clientY;
        let dx = this.currentx - this.startx;
        let dy = this.currenty - this.starty
        let currentShape = this.shapes[this.selectedIndex]
        let newShape:shape  = {
          startx: currentShape.startx + dx,
          currentx: currentShape.currentx + dx,
          currenty: currentShape.currenty + dy,
          starty: currentShape.starty + dy,
          type: currentShape.type
        }
        this.shapes[this.selectedIndex] = newShape
        this.clearCanvas()
        this.startx = this.currentx;
        this.starty = this.currenty
      }
    }

    private onMouseUpSelector = (event:MouseEvent)=>{
      if(this.isDraggable)
      {
        this.isDraggable = false
        this.clearCanvas();

      }
      if(this.isSelected)
      {
        if(!this.isShapeSelected(this.currentx,this.currenty,this.shapes[this.selectedIndex].startx,this.shapes[this.selectedIndex].starty,this.shapes[this.selectedIndex].currentx,this.shapes[this.selectedIndex].currenty))
        {
          this.isSelected = false
          this.isDraggable = false
          this.clearCanvas();
        }
      }
      this.handleIndex = null
    }

    private onMouseDownShape = (event:MouseEvent)=>{
      const currentPoint = this.getCanvasPoint(event)
      this.startx = currentPoint.x;
      this.starty = currentPoint.y;
      this.currentx = currentPoint.x;
      this.currenty = currentPoint.y;
      this.isDrawing = true;
    }

    private onMouseMoveShape = (event:MouseEvent)=>{
      if(this.isDrawing)
        {
          const currentPoint = this.getCanvasPoint(event)
          this.currentx = currentPoint.x;
          this.currenty = currentPoint.y;
          if (this.currentSelectedShape === "selector") return;
          this.drawDynamic(this.currentSelectedShape!)
        }
    }

    private onMouseUpShape = (event:MouseEvent)=>{
      if (this.currentSelectedShape === "selector") return;
      if(this.isDrawing)
      {
        const currentPoint = this.getCanvasPoint(event)
        this.currentx = currentPoint.x;
        this.currenty = currentPoint.y;
        const s:shape = {startx:this.startx,starty:this.starty,currentx:this.currentx,currenty:this.currenty,type:this.currentSelectedShape!}
        this.addShape(s);
        this.sendOverSocket(s);
      }
      this.isDrawing = false
    }

    public addShape(shape:shape){
      this.shapes.push(shape)
      this.clearCanvas();
    }

    public removeShape(shape:shape){
      this.shapes = this.shapes.filter((s) => s.startx !== shape.startx && s.starty !== shape.starty && s.currentx !== shape.currentx && s.currenty !== shape.currenty)
      this.clearCanvas();
    }

    public removePath(path:path){
      this.paths = this.paths.filter((p)=> JSON.stringify(p.points) !== JSON.stringify(path.points))
      this.clearCanvas();
    }

    public addPath(path:path){
      this.paths.push(path);
      this.clearCanvas(); 
    }

    private sendOverSocket(shape?:shape, path?:path,operation: "add"|"delete" = "add") {
      console.log("here");
      if(shape)
      this.socket?.send(JSON.stringify({
        "type" : "message",
        "payload": {
            "roomId" : this.roomId,
            "message" : {
              "type" : shape.type,
              "operation" : operation,
              "startx": shape.startx,
              "starty": shape.starty,
              "currentx": shape.currentx,
              "currenty": shape.currenty,
              "color" : "black",
              "width" : 10,
              "fillColor": "red"
          }
        }
      
    }));
    else if(path) {
      this.socket?.send(JSON.stringify({
        "type" : "message",
        "payload": {
            "roomId" : this.roomId,
            "message" : {
              "type" : "pencil",
              "operation" : operation,
              "points": path.points.map((p,index)=>{
                return {pointNumber:index+1,x:p.x,y:p.y}
              }),
              "color" : path.color,
              "width" : path.width,
              "fillColor": "red"
          }
        }
      
    }));
        
    }
    console.log("sent over socket");
    }
    public setShapes(shapes:shape[]){
      this.shapes = shapes
      this.clearCanvas();
    }
    public setPaths(paths:path[]){
      this.paths = paths
      this.clearCanvas();
    }
}



