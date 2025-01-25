interface shape {
  startx: number;
  starty: number;
  currentx: number;
  currenty: number;
  type: "rectangle" | "circle" | "line" | "diamond";
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
  private currentSelectedShape: "rectangle" | "circle" | null | "selector" | "line" | "diamond" = null;
  private isSelected = false;
  private selectedIndex = 0;
  private isDraggable = false;
  private currentStrokeColor = "black";
  private currentFillColor = "transparent";
  private handleIndex: number|null = null;
  private isPanning = false;
  private offset = { x: 0, y: 0 };

  private constructor() {}

  public static getInstance():Canvas2D{
    if(!Canvas2D.instance){
      Canvas2D.instance = new Canvas2D();
    }
    return Canvas2D.instance
  }

  public static initialize(canvas: HTMLCanvasElement,currentSelectedShape: "rectangle" | "circle" | null | "selector" | "line" | "diamond"):void {
    if(!Canvas2D.instance || Canvas2D.instance.canvas !== canvas){
      Canvas2D.instance!.canvas = canvas
    }
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
    this.canvas.removeEventListener("mousedown", this.onMouseDownShape);
    this.canvas.removeEventListener("mousemove", this.onMouseMoveShape);
    this.canvas.removeEventListener("mouseup", this.onMouseUpShape);
    this.canvas.removeEventListener("wheel", this.onMouseMovePanning)
  }

  private attachEvents() {
    if(!this.canvas) return;
    if(this.currentSelectedShape === null) 
      this.PanningEventHandler();
    if(this.currentSelectedShape === "rectangle" || this.currentSelectedShape === "circle" || this.currentSelectedShape === "line" || this.currentSelectedShape === "diamond")
      this.ShapeEventHandler();
    else if(this.currentSelectedShape === "selector")
      this.SelectorEventHandler();
  }

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

   private clearCanvas() {
    const ctx = this.canvas?.getContext("2d");
    if(ctx)
    {
    ctx.clearRect(0, 0, this.canvas!.width, this.canvas!.height);
    console.log(this.shapes)
    this.shapes.forEach((shape,index)=>{
      if(shape.type === "rectangle")
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

  private drawDynamic = (type: "rectangle"|"circle"|"line"|"diamond") => {
    const ctx = this.canvas?.getContext("2d");
    if(!ctx) return;
    this.clearCanvas();
    if(type === "rectangle")
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
      this.startx = event.clientX;
      this.starty = event.clientY;
      this.currentx = event.clientX;
      this.currenty = event.clientY;
      this.isDrawing = true;
    }

    private onMouseMoveShape = (event:MouseEvent)=>{
      if(this.isDrawing)
        {
          this.currentx = event.clientX;
          this.currenty = event.clientY;
          if (this.currentSelectedShape === "selector") return;
          this.drawDynamic(this.currentSelectedShape!)
        }
    }

    private onMouseUpShape = (event:MouseEvent)=>{
      if (this.currentSelectedShape === "selector") return;
      if(this.isDrawing)
      {
        this.currentx = event.clientX;
        this.currenty = event.clientY;
        this.shapes.push({startx:this.startx,starty:this.starty,currentx:this.currentx,currenty:this.currenty,type:this.currentSelectedShape!})
        this.clearCanvas();
      }
      this.isDrawing = false
    }
}

