export default class Chart{
    constructor(params){
        this._LINE_TENSION = 0.2
        this._LINE_WIDTH_ORI = 2;
        this._LINE_WIDTH_FOCUS = 5;
        this._COLOR_GRAY = 'gray';
        this._COLOR_WHITE = 'white';
        
        this._id = params.id;
        this._matrix = params.matrix;
        this._radius = params.radius;
        this._dataSet = [];
        this._curveDataSet = [];
        
        this._canvas;
        this._canvasWidth;
        this._canvasHeight;
        this._ctx;
        this._preFocusPoint;

        this._Coordinate;
        
        this._init();
    }
    
    _init(){
        this._canvas = document.getElementById(this._id);
        if(!this._canvas.getContext){
            throw "can't get canvas context!";
        }
        this._canvasWidth = this._canvas.width;
        this._canvasHeight = this._canvas.height;
        this._ctx = this._canvas.getContext('2d');
        
        this._initCoordinate();
        this._initDataSet();
        this._initCurveLines();
        this._bindMouseEvent();
        this.draw();
    }

    _initCoordinate(){
        this._Coordinate = new Coordinate({
            canvas: this._canvas,
            matrix: this._matrix
        });
    }
    
    _initDataSet(){
        for(const [index, point] of this._matrix.entries()){
            var reverseY = this._canvasHeight - point[1];
            this._dataSet.push({
                index: index,
                x: point[0],
                y: reverseY,
                color: this._randomColor()
            });
        }
    }
    
    _initFrame(){
        const rect = this._Coordinate.getChartBoundingRect();
        this._drawRect({
            x: 0,
            y: 0,
            width: this._canvasWidth,
            height: this._canvasHeight,
            lineWidth: this._LINE_WIDTH_ORI,
            color: this._COLOR_GRAY
        });

        this._drawRect({
            x: 0,
            y: 0,
            width: this._canvasWidth,
            height: this._canvasHeight,
            lineWidth: this._LINE_WIDTH_ORI,
            color: this._COLOR_GRAY
        });
    }
    
    _initLines(){
        this._ctx.beginPath();
        const dataLength = this._dataSet.length;
        if(dataLength < 2) return;
        if(dataLength == 2){
            const firstPoint = this._dataSet[0];
            const secondPoint = this._dataSet[1];
            this._ctx.moveTo(firstPoint.x, firstPoint.y);
            this._ctx.lineTo(secondPoint.x, secondPoint.y);
            this._ctx.stroke();
            return;
        }

        for(const [index, point] of this._dataSet.entries()){
            if(index == 0){
                this._ctx.moveTo(point.x, point.y);
                continue;
            }
            const preControlPoint = this._curveDataSet[index - 1];
            const controlPoint = this._curveDataSet[index];
            this._ctx.bezierCurveTo(
                preControlPoint.next.x, preControlPoint.next.y, 
                controlPoint.pre.x, controlPoint.pre.y, 
                point.x, point.y
            );            
        }
        this._ctx.stroke();
    }

    _showControlPoint(){
        for(const [index, point] of this._dataSet.entries()){
            if(index == 0){
                continue;
            }
            const preControlPoint = this._curveDataSet[index - 1];
            const controlPoint = this._curveDataSet[index];
            
            this._drawCircle({x: preControlPoint.next.x, y: preControlPoint.next.y, radius: 2, lineWidth: 1, color: preControlPoint.oriPoint.color});
            this._drawCircle({x: controlPoint.pre.x,     y: controlPoint.pre.y,     radius: 2, lineWidth: 1, color: controlPoint.oriPoint.color});

            this._ctx.stroke();
        }
    }
    
    _initCircles(){
        const _self = this;
        this._dataSet.forEach((point) => {
            _self._drawCircle({
                x: point.x, 
                y: point.y, 
                radius: _self._radius, 
                lineWidth: _self._LINE_WIDTH_ORI,
                color: point.color
            });
        });
    }

    _initCurveLines(){
        const dataLength = this._dataSet.length;
        /*
            less than three points don't need to use curve
        */
        if(dataLength <= 2) return;
        for(let index=1; index<(dataLength-1); index++){
            const prePoint = this._dataSet[index - 1];
            const currentPoint = this._dataSet[index];
            const nextPoint = this._dataSet[index + 1];
            /*
                use pre point p(x0, y0) and next p(x2, y2) point to calc current point p(x1, y1) offset scale
            */
            const deltaX = nextPoint.x - prePoint.x;
            const deltaY = nextPoint.y - prePoint.y;
            const distance = this._distance(prePoint, nextPoint);
            const cos = deltaX / distance;
            const sin = deltaY / distance;
            /*
                calc current point distance between two points pre and next
            */
            const preRelativeDistance = this._distance(prePoint, currentPoint);
            const nextRelativeDistance = this._distance(currentPoint, nextPoint);
            /*
                calc actual offset by current point and pre point
                ps: actual offset = current point - (scale * two point distance * tension)
            */
            const preControlPointX = currentPoint.x - (cos * preRelativeDistance * this._LINE_TENSION);
            const preControlPointY = currentPoint.y - (sin * preRelativeDistance * this._LINE_TENSION);
            /*
                calc actual offset by current point and next point
            */
            const nextControlPointX = currentPoint.x + (cos * nextRelativeDistance * this._LINE_TENSION);
            const nextControlPointY = currentPoint.y + (sin * nextRelativeDistance * this._LINE_TENSION);
            /*
                
            */
            this._curveDataSet.push({
                oriPoint: currentPoint,
                pre: {x: preControlPointX, y: preControlPointY}, 
                next: {x: nextControlPointX, y: nextControlPointY},
            });
            
        }
        
        const firstPoint = this._dataSet[0];
        const secondCurvePoint = this._curveDataSet[1];
        this._curveDataSet.unshift({
            oriPoint: firstPoint,
            next: {
                x: (firstPoint.x + secondCurvePoint.pre.x) / 2,
                y: (firstPoint.y + secondCurvePoint.pre.y) / 2
            }
        });
        
        const lastPoint = this._dataSet[dataLength - 1];
        const secondLastCurvePoint = this._curveDataSet[dataLength - 2];
        this._curveDataSet.push({
            oriPoint: lastPoint,
            pre: {
                x: (lastPoint.x + secondLastCurvePoint.next.x) / 2, 
                y: (lastPoint.y + secondLastCurvePoint.next.y) / 2
            }
        });
    }
    
    _bindMouseEvent(){
        const _self = this;
        this._canvas.addEventListener("mousemove", (event) => {
            const rect = _self._canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            _self._findNearPointByMouse({x: x, y: y});
        });
    }
    
    _randomColor(){
        return '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
    }
    
    _drawRect(params){
        this._ctx.lineWidth = params.lineWidth;
        this._ctx.strokeStyle = params.color;
        this._ctx.beginPath();
        this._ctx.rect(params.x, params.y, params.width, params.height);
        this._ctx.stroke();
    }
    
    _drawLine(point1, point2){
        this._ctx.lineWidth = point2.lineWidth;
        this._ctx.strokeStyle = point2.color;
        this._ctx.beginPath();
        this._ctx.moveTo(point1.x, point1.y);
        this._ctx.lineTo(point2.x, point2.y);
        this._ctx.stroke();
    }
    
    _drawCircle(point){
        this._ctx.lineWidth = point.lineWidth;
        this._ctx.beginPath();
        this._ctx.arc(point.x, point.y, point.radius, 0, 2 * Math.PI);
        this._ctx.strokeStyle = point.color;
        this._ctx.fillStyle  = point.color;
        this._ctx.fill();
        this._ctx.stroke();
    }
    
    _drawFocusPoint(point){
        this._drawCircle({x: point.x, y: point.y, radius: this._radius, lineWidth: this._LINE_WIDTH_FOCUS, color: point.color});
    }
    
    _findNearPointByMouse(mousePos){
        let minDistancePoint;
        let minDistance = Number.MAX_VALUE;
        for(var index=0, size= this._dataSet.length; index<size; index++){
            const currentPos = this._dataSet[index];
            const distanceBetweenTwoPoints = this._distance(currentPos, mousePos);
            
            if(minDistance > distanceBetweenTwoPoints){
                minDistancePoint = currentPos;
                minDistance = Math.min(minDistance, distanceBetweenTwoPoints);
            }
        }
        if(!this._preFocusPoint){
            this._drawFocusPoint(minDistancePoint);
            this._preFocusPoint = minDistancePoint;
            return;
        }
        /*
            if pre point isn't self, it's need to render
        */
        if(this._preFocusPoint.index !== minDistancePoint.index){
            this.render();
            this._drawFocusPoint(minDistancePoint);
        }
        this._preFocusPoint = minDistancePoint;
    }
    
    _distance(point1, point2){
        return Math.sqrt(Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2));
    }
    
    _clear(){
        this._ctx.clearRect(0, 0, this._canvasWidth, this._canvasHeight);
    }
    
    /* public */
    draw(){
        this._initFrame();
        this._initLines();
        this._initCircles();
    }
    
    render(){
        this._clear();
        this.draw();
        console.log('render');
    }

    printDataSet(){
        console.log('dataSet', this._dataSet);
    }
}

class Coordinate{
    constructor(params){
        this._LEFT_OFFSET = 20;
        this._BOTTOM_OFFSET = 20;
        this._TOP_OFFSET = 10;
        this._RIGHT_OFFSET = 10;
        
        this._canvas = params.canvas;
        this._oriMatrix = params.matrix;
        
        this._chartBoundingRect;
        this._xAxis;
        this._yAxis;
        
        this._init();
    }
    
    _init(){
        this._initChartBoundingRect();
        this._initXAxisAndYAxis();
    }
    
    _initChartBoundingRect(){
        const oriCanvasRect = this._canvas.getBoundingClientRect();
        //console.log(oriCanvasRect);
        this._chartBoundingRect = {
            left: 0 + this._LEFT_OFFSET,
            top: 0 + this._TOP_OFFSET,
            bottom: oriCanvasRect.height - this._BOTTOM_OFFSET,
            right: oriCanvasRect.width - this._RIGHT_OFFSET,
            
            width: oriCanvasRect.width - this._LEFT_OFFSET - this._RIGHT_OFFSET,
            height: oriCanvasRect.height - this._BOTTOM_OFFSET - this._TOP_OFFSET,
        }
        console.log(this._chartBoundingRect);
    }
    
    _initXAxisAndYAxis(){
        let xMax = Number.MIN_VALUE;
        let xMin = Number.MAX_VALUE;
        
        let yMax = Number.MIN_VALUE;
        let yMin = Number.MAX_VALUE;
        
        this._oriMatrix.forEach((point) => {
            const x = point[0];
            const y = point[1];
            
            xMax = Math.max(xMax, x);
            xMin = Math.min(xMin, x);
            
            yMax = Math.max(yMax, y);
            yMin = Math.min(yMin, y);
        });
        
        const xNormal = (xMax - xMin);
        const yNormal = (yMax - yMin);
        
        
    }
    
    getChartBoundingRect(){
        return this._chartBoundingRect;
    }
}

