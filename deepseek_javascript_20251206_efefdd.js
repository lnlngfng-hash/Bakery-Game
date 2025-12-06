// handTracking.js
// 手部追踪模块 - 使用MediaPipe Hands API
let hands = null;
let camera = null;
let handLandmarks = null;
let isTracking = false;

// 初始化手部追踪
function initHandTracking() {
    // 初始化MediaPipe Hands
    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });
    
    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });
    
    hands.onResults(onHandResults);
    
    // 初始化摄像头
    const videoElement = document.getElementById('input-video');
    const canvasElement = document.getElementById('output-canvas');
    const canvasCtx = canvasElement.getContext('2d');
    
    camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({image: videoElement});
        },
        width: 640,
        height: 480
    });
}

// 处理手部追踪结果
function onHandResults(results) {
    const canvasElement = document.getElementById('output-canvas');
    const canvasCtx = canvasElement.getContext('2d');
    
    // 清除画布
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // 绘制摄像头画面
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
    
    // 如果有检测到手，绘制手部关键点
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        // 绘制关键点和连接线
        drawConnectors(canvasCtx, results.multiHandLandmarks[0], HAND_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 4
        });
        
        drawLandmarks(canvasCtx, results.multiHandLandmarks[0], {
            color: '#FF0000',
            lineWidth: 2,
            radius: 4
        });
        
        // 保存手部关键点数据
        handLandmarks = results.multiHandLandmarks[0];
        
        // 处理手部数据
        if (typeof processHandData === 'function') {
            const handedness = results.multiHandedness && results.multiHandedness.length > 0 
                ? results.multiHandedness[0].label 
                : 'Unknown';
            processHandData(handLandmarks, handedness);
        }
    } else {
        handLandmarks = null;
    }
    
    canvasCtx.restore();
}

// 开始手部追踪
function startHandTracking() {
    if (camera && !isTracking) {
        camera.start();
        isTracking = true;
    }
}

// 停止手部追踪
function stopHandTracking() {
    if (camera && isTracking) {
        camera.stop();
        isTracking = false;
    }
}

// 在全局范围内暴露函数
window.initHandTracking = initHandTracking;
window.startHandTracking = startHandTracking;
window.stopHandTracking = stopHandTracking;
window.onHandResults = onHandResults;