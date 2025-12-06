// game.js
document.addEventListener('DOMContentLoaded', function() {
    // 游戏状态
    const gameState = {
        currentStage: 1, // 1: 倒牛奶, 2: 揉面, 3: 烘焙, 4: 完成
        milkLevel: 100,
        doughLevel: 0,
        pourAngle: 0,
        kneadCount: 0,
        neededKneads: 15,
        score: {
            milk: 0,
            knead: 0,
            time: 0,
            total: 0
        },
        startTime: null,
        timerInterval: null,
        elapsedTime: 0,
        breadTypes: [
            { 
                id: 'baguette', 
                name: '法式长棍', 
                description: '外皮酥脆，内部柔软，完美的早餐伴侣。',
                icon: 'fas fa-baguette',
                color: '#e6b87e'
            },
            { 
                id: 'croissant', 
                name: '羊角面包', 
                description: '金黄酥脆，层次分明，浓郁的黄油香气。',
                icon: 'fas fa-croissant',
                color: '#ffcc80'
            },
            { 
                id: 'brioche', 
                name: '奶油面包', 
                description: '金黄酥脆的外皮，柔软的内层，带有浓郁的奶香。',
                icon: 'fas fa-bread-slice',
                color: '#f5a142'
            },
            { 
                id: 'sourdough', 
                name: '酸面包', 
                description: '外皮厚实有嚼劲，内部湿润，带有独特的酸味。',
                icon: 'fas fa-wheat-alt',
                color: '#d9a066'
            },
            { 
                id: 'rye', 
                name: '黑麦面包', 
                description: '浓郁的麦香，紧实的口感，营养丰富。',
                icon: 'fas fa-seedling',
                color: '#8b5a2b'
            },
            { 
                id: 'ciabatta', 
                name: '夏巴塔', 
                description: '外皮脆薄，内部有大而不规则的气孔。',
                icon: 'fas fa-wheat-awn',
                color: '#f0c890'
            }
        ],
        unlockedBreads: [],
        finalBread: null
    };

    // DOM元素
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    const homeBtn = document.getElementById('home-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const shareBtn = document.getElementById('share-btn');
    const musicToggle = document.getElementById('music-toggle');
    
    const stageTitle = document.getElementById('stage-title');
    const stageProgress = document.getElementById('stage-progress');
    const stageInstruction = document.getElementById('stage-instruction');
    const tipText = document.getElementById('tip-text');
    
    const milkLevelEl = document.getElementById('milk-level');
    const doughMixEl = document.getElementById('dough-mix');
    const handCursor = document.getElementById('hand-cursor');
    
    const timerEl = document.getElementById('timer');
    const recipeSteps = document.querySelectorAll('.step');
    
    const finalBreadEl = document.getElementById('final-bread');
    const breadNameEl = document.getElementById('bread-name');
    const breadDescEl = document.getElementById('bread-description');
    const scoreMilkEl = document.getElementById('score-milk');
    const scoreMilkValue = document.getElementById('score-milk-value');
    const scoreKneadEl = document.getElementById('score-knead');
    const scoreKneadValue = document.getElementById('score-knead-value');
    const scoreTimeEl = document.getElementById('score-time');
    const scoreTimeValue = document.getElementById('score-time-value');
    const totalScoreValue = document.getElementById('total-score-value');
    const collectionList = document.getElementById('collection-list');
    
    // 音频元素
    const bgMusic = document.getElementById('background-music');
    const pourSound = document.getElementById('pour-sound');
    const kneadSound = document.getElementById('knead-sound');
    const successSound = document.getElementById('success-sound');
    
    // 初始化
    function init() {
        // 事件监听
        startBtn.addEventListener('click', startGame);
        restartBtn.addEventListener('click', restartGame);
        homeBtn.addEventListener('click', goHome);
        pauseBtn.addEventListener('click', togglePause);
        shareBtn.addEventListener('click', shareResult);
        musicToggle.addEventListener('click', toggleMusic);
        
        // 初始化面包收藏
        renderBreadCollection();
        
        // 尝试自动播放背景音乐
        bgMusic.volume = 0.3;
        bgMusic.play().catch(e => console.log("自动播放被阻止:", e));
        
        // 初始化手部追踪
        initHandTracking();
    }
    
    // 开始游戏
    function startGame() {
        // 重置游戏状态
        resetGameState();
        
        // 切换屏幕
        startScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        endScreen.classList.add('hidden');
        
        // 开始计时
        startTimer();
        
        // 更新界面
        updateGameUI();
        
        // 开始手部追踪
        startHandTracking();
        
        // 播放背景音乐
        bgMusic.play().catch(e => console.log("音乐播放被阻止"));
    }
    
    // 重置游戏状态
    function resetGameState() {
        gameState.currentStage = 1;
        gameState.milkLevel = 100;
        gameState.doughLevel = 0;
        gameState.pourAngle = 0;
        gameState.kneadCount = 0;
        gameState.neededKneads = 15;
        gameState.score = { milk: 0, knead: 0, time: 0, total: 0 };
        gameState.startTime = Date.now();
        gameState.elapsedTime = 0;
        gameState.finalBread = null;
        
        // 更新UI
        milkLevelEl.style.height = '80%';
        doughMixEl.style.height = '0%';
        updateProgressBar();
        updateRecipeSteps();
    }
    
    // 更新游戏UI
    function updateGameUI() {
        // 更新阶段标题和说明
        switch(gameState.currentStage) {
            case 1:
                stageTitle.textContent = "阶段 1: 倒牛奶";
                stageInstruction.textContent = "将你的手移动到牛奶瓶上方，然后向下倾斜倒出牛奶";
                tipText.textContent = "伸出手指并向下移动来倒牛奶";
                break;
            case 2:
                stageTitle.textContent = "阶段 2: 揉面团";
                stageInstruction.textContent = "用拳头动作揉捏面团，直到面团变得光滑";
                tipText.textContent = "握拳并做圆周运动来揉面";
                break;
            case 3:
                stageTitle.textContent = "阶段 3: 烘焙中...";
                stageInstruction.textContent = "面包正在烤箱中烘焙，请稍候";
                tipText.textContent = "等待面包完成烘焙";
                break;
            case 4:
                stageTitle.textContent = "阶段 4: 完成!";
                stageInstruction.textContent = "面包已经完成，准备享用!";
                tipText.textContent = "查看你的烘焙成果";
                break;
        }
        
        // 更新进度条
        updateProgressBar();
        
        // 更新配方步骤
        updateRecipeSteps();
    }
    
    // 更新进度条
    function updateProgressBar() {
        let progress = 0;
        
        switch(gameState.currentStage) {
            case 1:
                progress = (100 - gameState.milkLevel) / 100 * 25;
                break;
            case 2:
                progress = 25 + (gameState.kneadCount / gameState.neededKneads * 25);
                break;
            case 3:
                progress = 75;
                break;
            case 4:
                progress = 100;
                break;
        }
        
        stageProgress.style.width = `${progress}%`;
    }
    
    // 更新配方步骤
    function updateRecipeSteps() {
        recipeSteps.forEach((step, index) => {
            step.classList.remove('active', 'completed');
            
            if (index + 1 === gameState.currentStage) {
                step.classList.add('active');
            } else if (index + 1 < gameState.currentStage) {
                step.classList.add('completed');
            }
        });
    }
    
    // 开始计时器
    function startTimer() {
        gameState.startTime = Date.now();
        
        if (gameState.timerInterval) {
            clearInterval(gameState.timerInterval);
        }
        
        gameState.timerInterval = setInterval(() => {
            const elapsed = Date.now() - gameState.startTime;
            gameState.elapsedTime = Math.floor(elapsed / 1000);
            
            const minutes = Math.floor(gameState.elapsedTime / 60);
            const seconds = gameState.elapsedTime % 60;
            
            timerEl.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }
    
    // 暂停/继续游戏
    function togglePause() {
        const isPaused = pauseBtn.querySelector('i').classList.contains('fa-pause');
        
        if (isPaused) {
            // 暂停游戏
            pauseBtn.innerHTML = '<i class="fas fa-play"></i>';
            clearInterval(gameState.timerInterval);
            stopHandTracking();
            bgMusic.pause();
        } else {
            // 继续游戏
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
            startTimer();
            startHandTracking();
            bgMusic.play();
        }
    }
    
    // 完成游戏
    function finishGame() {
        // 停止计时器
        clearInterval(gameState.timerInterval);
        
        // 停止手部追踪
        stopHandTracking();
        
        // 计算分数
        calculateScores();
        
        // 选择面包类型
        selectBreadType();
        
        // 解锁新面包
        unlockBread();
        
        // 更新结束界面
        updateEndScreen();
        
        // 切换到结束界面
        gameScreen.classList.add('hidden');
        endScreen.classList.remove('hidden');
        
        // 播放成功音效
        successSound.currentTime = 0;
        successSound.play();
    }
    
    // 计算分数
    function calculateScores() {
        // 倒牛奶分数 (基于剩余牛奶量)
        gameState.score.milk = Math.max(0, 100 - gameState.milkLevel);
        
        // 揉面分数 (基于完成度)
        const kneadPercent = Math.min(100, (gameState.kneadCount / gameState.neededKneads) * 100);
        gameState.score.knead = kneadPercent;
        
        // 时间分数 (越快越好)
        const timeScore = Math.max(0, 100 - (gameState.elapsedTime / 60 * 10));
        gameState.score.time = Math.min(100, timeScore);
        
        // 总分
        gameState.score.total = Math.round(
            (gameState.score.milk * 0.3) + 
            (gameState.score.knead * 0.4) + 
            (gameState.score.time * 0.3)
        );
        
        // 更新UI
        scoreMilkEl.style.width = `${gameState.score.milk}%`;
        scoreMilkValue.textContent = `${Math.round(gameState.score.milk)}%`;
        
        scoreKneadEl.style.width = `${gameState.score.knead}%`;
        scoreKneadValue.textContent = `${Math.round(gameState.score.knead)}%`;
        
        scoreTimeEl.style.width = `${gameState.score.time}%`;
        scoreTimeValue.textContent = `${Math.round(gameState.score.time)}%`;
        
        totalScoreValue.textContent = gameState.score.total;
    }
    
    // 选择面包类型
    function selectBreadType() {
        let breadIndex;
        
        if (gameState.score.total >= 90) {
            breadIndex = 0; // 法式长棍
        } else if (gameState.score.total >= 80) {
            breadIndex = 1; // 羊角面包
        } else if (gameState.score.total >= 70) {
            breadIndex = 2; // 奶油面包
        } else if (gameState.score.total >= 60) {
            breadIndex = 3; // 酸面包
        } else if (gameState.score.total >= 50) {
            breadIndex = 4; // 黑麦面包
        } else {
            breadIndex = 5; // 夏巴塔
        }
        
        gameState.finalBread = gameState.breadTypes[breadIndex];
    }
    
    // 解锁面包
    function unlockBread() {
        if (!gameState.unlockedBreads.includes(gameState.finalBread.id)) {
            gameState.unlockedBreads.push(gameState.finalBread.id);
            localStorage.setItem('unlockedBreads', JSON.stringify(gameState.unlockedBreads));
        }
    }
    
    // 更新结束界面
    function updateEndScreen() {
        // 更新面包信息
        finalBreadEl.innerHTML = `<i class="${gameState.finalBread.icon}"></i>`;
        finalBreadEl.style.background = `linear-gradient(135deg, ${gameState.finalBread.color}, #ff9a3c)`;
        breadNameEl.textContent = gameState.finalBread.name;
        breadDescEl.textContent = gameState.finalBread.description;
        
        // 更新面包收藏
        renderBreadCollection();
    }
    
    // 渲染面包收藏
    function renderBreadCollection() {
        // 从本地存储加载已解锁的面包
        const savedBreads = localStorage.getItem('unlockedBreads');
        if (savedBreads) {
            gameState.unlockedBreads = JSON.parse(savedBreads);
        }
        
        collectionList.innerHTML = '';
        
        gameState.breadTypes.forEach(bread => {
            const isUnlocked = gameState.unlockedBreads.includes(bread.id);
            const collectionItem = document.createElement('div');
            collectionItem.className = `collection-item ${isUnlocked ? 'unlocked' : ''}`;
            collectionItem.innerHTML = `<i class="${bread.icon}"></i>`;
            collectionItem.title = isUnlocked ? bread.name : '未解锁';
            collectionList.appendChild(collectionItem);
        });
    }
    
    // 重新开始游戏
    function restartGame() {
        startGame();
    }
    
    // 返回主页
    function goHome() {
        clearInterval(gameState.timerInterval);
        stopHandTracking();
        
        gameScreen.classList.add('hidden');
        endScreen.classList.add('hidden');
        startScreen.classList.remove('hidden');
    }
    
    // 分享结果
    function shareResult() {
        const shareText = `我在谷物社烘焙坊制作了${gameState.finalBread.name}，获得了${gameState.score.total}分！快来试试这个手势控制烘焙游戏吧！`;
        
        if (navigator.share) {
            navigator.share({
                title: '谷物社烘焙坊',
                text: shareText,
                url: window.location.href
            });
        } else {
            // 复制到剪贴板
            navigator.clipboard.writeText(shareText).then(() => {
                alert('分享文本已复制到剪贴板！');
            });
        }
    }
    
    // 切换音乐
    function toggleMusic() {
        if (bgMusic.paused) {
            bgMusic.play();
            musicToggle.innerHTML = '<i class="fas fa-volume-up"></i> 背景音乐';
        } else {
            bgMusic.pause();
            musicToggle.innerHTML = '<i class="fas fa-volume-mute"></i> 背景音乐';
        }
    }
    
    // 处理手部追踪数据
    function processHandData(handLandmarks, handedness) {
        if (!handLandmarks || handLandmarks.length === 0) return;
        
        // 获取食指指尖坐标
        const indexFingerTip = handLandmarks[8];
        
        // 更新手部光标位置
        updateHandCursor(indexFingerTip);
        
        // 根据当前阶段处理手势
        switch(gameState.currentStage) {
            case 1:
                processPouringStage(handLandmarks);
                break;
            case 2:
                processKneadingStage(handLandmarks);
                break;
        }
    }
    
    // 更新手部光标
    function updateHandCursor(fingerTip) {
        if (!fingerTip) return;
        
        // 将归一化坐标转换为屏幕坐标
        const x = fingerTip.x * window.innerWidth;
        const y = fingerTip.y * window.innerHeight;
        
        // 移动手部光标
        handCursor.style.left = `${x}px`;
        handCursor.style.top = `${y}px`;
        
        // 根据手势改变光标图标
        if (gameState.currentStage === 2 && isFist(handLandmarks)) {
            handCursor.innerHTML = '<i class="fas fa-fist-raised"></i>';
        } else {
            handCursor.innerHTML = '<i class="fas fa-hand-point-up"></i>';
        }
    }
    
    // 处理倒牛奶阶段
    function processPouringStage(handLandmarks) {
        // 获取手腕和食指指尖的坐标
        const wrist = handLandmarks[0];
        const indexFingerTip = handLandmarks[8];
        
        // 计算手部倾斜角度
        const deltaY = indexFingerTip.y - wrist.y;
        const deltaX = indexFingerTip.x - wrist.x;
        const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
        
        // 检查手是否在牛奶瓶上方
        const isOverBottle = checkHandOverBottle(indexFingerTip);
        
        // 如果手在牛奶瓶上方且倾斜角度合适，开始倒牛奶
        if (isOverBottle && angle > 45 && angle < 135 && gameState.milkLevel > 0) {
            // 减少牛奶量
            gameState.milkLevel = Math.max(0, gameState.milkLevel - 0.5);
            
            // 增加面团混合程度
            gameState.doughLevel = Math.min(100, gameState.doughLevel + 0.5);
            
            // 更新UI
            milkLevelEl.style.height = `${gameState.milkLevel * 0.8}%`;
            doughMixEl.style.height = `${gameState.doughLevel}%`;
            
            // 播放倒牛奶音效
            if (Math.random() < 0.1) {
                pourSound.currentTime = 0;
                pourSound.play();
            }
            
            // 检查是否完成倒牛奶
            if (gameState.milkLevel <= 30) {
                // 进入下一阶段
                gameState.currentStage = 2;
                updateGameUI();
                
                // 更新面包类型列表
                highlightPossibleBreads();
            }
            
            updateProgressBar();
        }
    }
    
    // 处理揉面阶段
    function processKneadingStage(handLandmarks) {
        // 检查是否为握拳手势
        if (isFist(handLandmarks)) {
            // 检查手是否在碗上方
            const indexFingerTip = handLandmarks[8];
            const isOverBowl = checkHandOverBowl(indexFingerTip);
            
            if (isOverBowl) {
                // 增加揉面计数
                gameState.kneadCount++;
                
                // 更新UI
                updateProgressBar();
                
                // 播放揉面音效
                if (gameState.kneadCount % 3 === 0) {
                    kneadSound.currentTime = 0;
                    kneadSound.play();
                }
                
                // 检查是否完成揉面
                if (gameState.kneadCount >= gameState.neededKneads) {
                    // 进入烘焙阶段
                    gameState.currentStage = 3;
                    updateGameUI();
                    
                    // 模拟烘焙过程
                    setTimeout(() => {
                        gameState.currentStage = 4;
                        updateGameUI();
                        
                        // 完成游戏
                        setTimeout(finishGame, 2000);
                    }, 3000);
                }
            }
        }
    }
    
    // 检查手是否在牛奶瓶上方
    function checkHandOverBottle(fingerTip) {
        // 牛奶瓶的大致位置 (相对坐标)
        const bottleX = 0.1; // 左侧10%
        const bottleY = 0.2; // 顶部20%
        const bottleWidth = 0.15; // 宽度15%
        const bottleHeight = 0.3; // 高度30%
        
        return (
            fingerTip.x >= bottleX && 
            fingerTip.x <= bottleX + bottleWidth &&
            fingerTip.y >= bottleY && 
            fingerTip.y <= bottleY + bottleHeight
        );
    }
    
    // 检查手是否在碗上方
    function checkHandOverBowl(fingerTip) {
        // 碗的大致位置 (相对坐标)
        const bowlX = 0.7; // 右侧70%
        const bowlY = 0.6; // 顶部60%
        const bowlWidth = 0.2; // 宽度20%
        const bowlHeight = 0.2; // 高度20%
        
        return (
            fingerTip.x >= bowlX && 
            fingerTip.x <= bowlX + bowlWidth &&
            fingerTip.y >= bowlY && 
            fingerTip.y <= bowlY + bowlHeight
        );
    }
    
    // 检查是否为握拳手势
    function isFist(landmarks) {
        // 简化的握拳检测：检查指尖是否靠近手掌
        const wrist = landmarks[0];
        const fingertips = [4, 8, 12, 16, 20]; // 所有指尖
        let closeCount = 0;
        
        for (const tipIndex of fingertips) {
            const tip = landmarks[tipIndex];
            const distance = Math.sqrt(
                Math.pow(tip.x - wrist.x, 2) + 
                Math.pow(tip.y - wrist.y, 2)
            );
            
            if (distance < 0.2) { // 阈值
                closeCount++;
            }
        }
        
        return closeCount >= 4; // 至少4个指尖靠近手腕
    }
    
    // 高亮可能的面包类型
    function highlightPossibleBreads() {
        const breadItems = document.querySelectorAll('.bread-item');
        breadItems.forEach(item => {
            item.classList.remove('active');
        });
        
        // 根据牛奶剩余量预测面包类型
        let activeIndex;
        if (gameState.milkLevel < 20) {
            activeIndex = 0; // 法式长棍
        } else if (gameState.milkLevel < 40) {
            activeIndex = 1; // 羊角面包
        } else if (gameState.milkLevel < 60) {
            activeIndex = 2; // 奶油面包
        } else {
            activeIndex = 3; // 酸面包
        }
        
        if (breadItems[activeIndex]) {
            breadItems[activeIndex].classList.add('active');
        }
    }
    
    // 初始化应用
    init();
});