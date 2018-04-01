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
        
        this._initDataSet();
        this._bindMouseEvent();
        this.draw();
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
        let prePoint;
        for(const [index, point] of this._dataSet.entries()){
            if(index == 0){
                prePoint = point;
                continue;
            }
            this._drawLine(prePoint, point);
            prePoint = point;
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
}
