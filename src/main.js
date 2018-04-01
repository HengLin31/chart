import Chart from './chart.js'
(function(global){
    const canvasId = 'chart';
    const matrix = [[10, 90], [30, 40], [70, 80], [90, 40], [120, 120], [150, 10], [190, 70]];
    const radius = 4;
    const chart = new Chart({
            id: canvasId, 
            matrix: matrix,
            radius: radius
        });
    chart.draw();
    chart.printDataSet();
    console.log('chart', chart);
    console.log(chart._id);
})(this);