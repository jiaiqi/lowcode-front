/**
 * 在Canvas上绘制航线
 * @param {string} canvasId - Canvas元素的ID
 * @param {Object} startPoint - 起点坐标 {x: number, y: number}
 * @param {Array} endPoints - 终点坐标数组 [{x: number, y: number}, ...]
 * @param {Object} options - 可选配置项
 * @param {string} options.lineColor - 线条颜色，默认 '#1890ff'
 * @param {number} options.lineWidth - 线条宽度，默认 2
 * @param {number} options.animationDuration - 动画持续时间(ms)，默认 1000
 */
export function drawFlightLines(canvasId, startPoint, endPoints, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    // 设置 canvas 尺寸
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // 颜色转换函数：将颜色转换为rgba格式
    function convertToRgba(color, alpha = 1) {
        if (!color) return color;
        
        // 如果已经是rgba格式，直接返回
        if (color.startsWith('rgba(')) {
            return color;
        }
        
        // 如果是rgb格式，转换为rgba
        if (color.startsWith('rgb(')) {
            return color.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
        }
        
        // 如果是hex格式，转换为rgba
        if (color.startsWith('#')) {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        
        // 其他格式直接返回
        return color;
    }

    const ctx = canvas.getContext('2d');
    const {
        lineColor = '#00ffff', // 基础线条颜色
        lineWidth = 2,
        animationDuration = 1000,
        // 新增颜色配置
        glowColor = 'rgba(0, 255, 255, 0.5)', // 发光效果颜色
        flowColor = 'rgba(255, 255, 255, 0.8)', // 流动光效颜色
        pointColor = '#00ffff', // 点位基础颜色
        pointGlowColor = 'rgba(0, 255, 255, 0.8)', // 点位光晕颜色
        rippleColor = 'rgba(0, 255, 255, 0.2)', // 水波纹颜色
        centerPointColor = '#ffffff' // 中心点颜色
    } = options;

    // 转换颜色为rgba格式并添加透明度
    const convertedColors = {
        lineColor: convertToRgba(lineColor, 1), // 线条颜色不透明
        glowColor: convertToRgba(glowColor, 0.5), // 发光效果半透明
        flowColor: convertToRgba(flowColor, 0.8), // 流动光效较透明
        pointColor: convertToRgba(pointColor, 1), // 点位基础颜色不透明
        pointGlowColor: convertToRgba(pointGlowColor, 0.8), // 点位光晕较透明
        rippleColor: convertToRgba(rippleColor, 0.2), // 水波纹很透明
        centerPointColor: convertToRgba(centerPointColor, 1) // 中心点不透明
    };

    // 固定线条宽度
    const adjustedLineWidth = lineWidth;

    // 设置线条样式
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 绘制科技感点位
    function drawTechPoint(x, y, isEndPoint = false) {
        // 固定基础大小为10px
        const baseSize = 10;
        const glowRadius = baseSize; // 光晕半径10px
        const innerRadius = baseSize * 0.4; // 内圈半径4px
        const centerRadius = baseSize * 0.15; // 中心点半径1.5px
        const crossLength = baseSize * 0.6; // 十字线长度6px

        // 绘制外圈光晕
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        gradient.addColorStop(0, convertedColors.pointGlowColor);
        gradient.addColorStop(0.5, convertedColors.pointGlowColor.replace(/[\d.]+\)$/, '0.2)'));
        gradient.addColorStop(1, convertedColors.pointGlowColor.replace(/[\d.]+\)$/, '0)'));

        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // 绘制内圈
        ctx.beginPath();
        ctx.arc(x, y, innerRadius, 0, Math.PI * 2);
        ctx.fillStyle = convertedColors.pointColor;
        ctx.fill();

        // 绘制中心点
        ctx.beginPath();
        ctx.arc(x, y, centerRadius, 0, Math.PI * 2);
        ctx.fillStyle = convertedColors.centerPointColor;
        ctx.fill();

        // 如果是终点，添加额外的装饰效果
        if (isEndPoint) {
            // 绘制十字线
            ctx.beginPath();
            ctx.strokeStyle = convertedColors.pointGlowColor.replace(/[\d.]+\)$/, '0.6)');
            ctx.lineWidth = 1;
            ctx.moveTo(x - crossLength, y);
            ctx.lineTo(x + crossLength, y);
            ctx.moveTo(x, y - crossLength);
            ctx.lineTo(x, y + crossLength);
            ctx.stroke();
        }
    }

    // 创建动画函数
    function animate() {
        let rippleTime = 0;
        let flowTime = 0;
        
        function draw() {
            rippleTime += 0.05; // 控制水波纹速度
            flowTime += 0.04; // 增加流动光效速度从0.02到0.04

            // 清除画布
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // 绘制起点
            drawTechPoint(startPoint.x, startPoint.y);

            // 为每个终点绘制线条
            endPoints.forEach(endPoint => {
                // 计算控制点（贝塞尔曲线的控制点）
                const dx = endPoint.x - startPoint.x;
                const dy = endPoint.y - startPoint.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // 控制点位置（在起点和终点的中间位置，向上偏移）
                const controlX = startPoint.x + dx * 0.5;
                const controlY = startPoint.y + dy * 0.5 - distance * 0.2;

                // 绘制基础线条
                const gradient = ctx.createLinearGradient(
                    startPoint.x, startPoint.y,
                    endPoint.x, endPoint.y
                );
                
                gradient.addColorStop(0, convertedColors.lineColor.replace(/[\d.]+\)$/, '0.1)'));
                gradient.addColorStop(0.5, convertedColors.lineColor.replace(/[\d.]+\)$/, '0.5)'));
                gradient.addColorStop(1, convertedColors.lineColor);

                ctx.shadowColor = convertedColors.glowColor;
                ctx.shadowBlur = 10; // 固定阴影模糊10px
                ctx.strokeStyle = gradient;
                ctx.lineWidth = adjustedLineWidth;

                ctx.beginPath();
                ctx.moveTo(startPoint.x, startPoint.y);
                ctx.quadraticCurveTo(controlX, controlY, endPoint.x, endPoint.y);
                ctx.stroke();

                // 绘制流动光效
                const flowGradient = ctx.createLinearGradient(
                    startPoint.x, startPoint.y,
                    endPoint.x, endPoint.y
                );

                // 创建流动的光效
                const flowOffset = (flowTime % 1); // 确保值在 0-1 之间
                const flowWidth = 0.4; // 增加光效宽度从0.2到0.4

                // 确保所有值都在 0-1 范围内
                const startStop = Math.max(0, flowOffset - flowWidth);
                const endStop = Math.min(1, flowOffset + flowWidth);

                flowGradient.addColorStop(startStop, 'rgba(0, 255, 255, 0)');
                flowGradient.addColorStop(Math.max(0, flowOffset - flowWidth * 0.3), convertedColors.flowColor);
                flowGradient.addColorStop(flowOffset, 'rgba(255, 255, 255, 1)'); // 中心添加明亮的白色
                flowGradient.addColorStop(Math.min(1, flowOffset + flowWidth * 0.3), convertedColors.flowColor);
                flowGradient.addColorStop(endStop, 'rgba(0, 255, 255, 0)');

                ctx.strokeStyle = flowGradient;
                ctx.lineWidth = adjustedLineWidth * 2.5; // 增加流动光效宽度从1.5到2.5
                ctx.beginPath();
                ctx.moveTo(startPoint.x, startPoint.y);
                ctx.quadraticCurveTo(controlX, controlY, endPoint.x, endPoint.y);
                ctx.stroke();

                // 重置阴影
                ctx.shadowBlur = 0;

                // 绘制终点
                drawTechPoint(endPoint.x, endPoint.y, true);

                // 绘制水波纹效果
                const rippleRadius = 10 + Math.sin(rippleTime) * 5; // 调整水波纹大小，基础10px，波动5px
                const rippleGradient = ctx.createRadialGradient(
                    endPoint.x, endPoint.y, 0,
                    endPoint.x, endPoint.y, rippleRadius
                );
                rippleGradient.addColorStop(0, convertedColors.rippleColor);
                rippleGradient.addColorStop(1, convertedColors.rippleColor.replace(/[\d.]+\)$/, '0)'));

                ctx.beginPath();
                ctx.arc(endPoint.x, endPoint.y, rippleRadius, 0, Math.PI * 2);
                ctx.fillStyle = rippleGradient;
                ctx.fill();
            });

            // 继续动画
            requestAnimationFrame(draw);
        }

        // 开始动画
        requestAnimationFrame(draw);
    }

    // 启动动画
    animate();
}
