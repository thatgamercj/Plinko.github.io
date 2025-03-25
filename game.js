const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const DECIMAL_MULTIPLIER = 10000;
const WIDTH = 800;
const HEIGHT = 800;
const ballRadius = 7;
const pegRadius = 4;
const gravity = pad(0.2);
const horizontalFriction = 0.4;
const verticalFriction = 0.6;
let balls = [];
const pegs = [];
const multipliers = [];
const NUM_MULTIPLIERS = 15;

function pad(n) { return n * DECIMAL_MULTIPLIER; }
function unpad(n) { return Math.floor(n / DECIMAL_MULTIPLIER); }

const rows = 16;
for (let row = 2; row < rows; row++){
    const pegsInRow = row + 1;
    const y = 0 + row * 35;
    const spacing = 36;
    for (let col = 0; col < pegsInRow; col++){
        const x = WIDTH / 2 - spacing * (row / 2 - col);
        pegs.push({x: pad(x), y: pad(y), radius: pegRadius});
    }
}

const multipliersWidth = 36;
const multiplierValues =[108, 18, 9, 4.5, 1.8, 0.9, 0.5, 0, 0.5, 0.9, 1.8, 4.5, 9, 18, 108]
const multiplierColors = [
    'rgba(246, 34, 23, 0.8)', 
    'rgba(200, 0, 0, 0.8)', 
    'rgba(255, 130, 0, 0.8)',
    'rgb(253, 185, 82)', 
    'rgba(246, 255, 124, 0.8)', 
    'rgba(173, 255, 47, 0.8)', 
    'rgb(5, 133, 5)', 
    'rgba(0, 255, 127, 0.8)', 
    'rgba(0, 128, 0, 0.8)', 
    'rgba(173, 255, 47, 0.8)', 
    'rgba(246, 255, 124, 0.8)', 
    'rgb(253, 185, 82)', 
    'rgba(255, 130, 0, 0.8)', 
    'rgba(200, 0, 0, 0.8)', 
    'rgba(246, 34, 23, 0.8)', 
];

for(let i = 0; i < NUM_MULTIPLIERS; i++){
    const x = WIDTH / 2 + (i - NUM_MULTIPLIERS / 2) * multipliersWidth + pegRadius;
    const y = HEIGHT - 240;
    const width = multipliersWidth;
    const height = width;
    const value = multiplierValues[i];
    const color = multiplierColors[i % multiplierColors.length];
    multipliers.push({x, y, width, height, bob: 0, value, color});
}

class Ball {
    constructor(x,y,radius,color){
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.toBeRemoved = false;
    }

    draw(){
        ctx.beginPath();
        ctx.arc(unpad(this.x), unpad(this.y), this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.vy += gravity;
        this.x += this.vx;
        this.y += this.vy;
    
        for (const peg of pegs) {
            const dist = Math.hypot(this.x - peg.x, this.y - peg.y);
            if (dist < pad(this.radius + peg.radius)) {
                const angle = Math.atan2(this.y - peg.y, this.x - peg.x);
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                this.vx = (Math.cos(angle) * speed * horizontalFriction);
                this.vy = Math.sin(angle) * speed * verticalFriction;
                const overlap = pad(this.radius + peg.radius - unpad(dist));
                this.x += Math.cos(angle) * overlap;
                this.y += Math.sin(angle) * overlap;
            }
        }
    
        for (const multiplier of multipliers) {
            if (
                unpad(this.x) > multiplier.x &&
                unpad(this.x) < multiplier.x + multiplier.width - 2 * pegRadius &&
                unpad(this.y) + this.radius > multiplier.y - multiplier.height / 2
            ) {
                updateBallMultiplier(this, multiplier);
            }
        }
    }
}

function drawMultipliers(){
    for(let i = 0; i < multipliers.length; i++){
        const m = multipliers[i];
        const bobOffset = Math.max(0, m.bob);

        ctx.fillStyle = m.color;
        ctx.fillRect(m.x, m.y - m.height / 2 + bobOffset, m.width - pegRadius * 2, m.height);

        ctx.shadowColor = m.color;
        ctx.shadowBlur = 20;
        ctx.fillRect(m.x, m.y - m.height / 2 + bobOffset, m.width - pegRadius * 2, m.height);
        ctx.shadowBlur = 0; 

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y - m.height / 2 + bobOffset);
        ctx.lineTo(m.x + m.width - pegRadius * 2, m.y - m.height / 2 + bobOffset);
        ctx.lineTo(m.x + m.width - pegRadius * 2, m.y + m.height / 2 + bobOffset);
        ctx.stroke();

        ctx.fillStyle = 'black';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(m.value + "x", m.x + (m.width - pegRadius * 2)/2 , m.y + bobOffset);

        if (m.bob > 0) {
            m.bob -= 0.4; 
        }
    }
}

//Create an offscreen canvas (provides mroe efficent rendering for static pegs)
const offscreenCanvas = document.createElement('canvas');
offscreenCanvas.width = WIDTH;
offscreenCanvas.height = HEIGHT;
const offscreenCtx = offscreenCanvas.getContext('2d');

//Draw pegs on the offscreen canvas
function drawPegsOffscreen() {
    offscreenCtx.fillStyle='white';
    offscreenCtx.filter = 'drop-shadow(0 0 5px white)';
    pegs.forEach(peg => {
        offscreenCtx.beginPath();
        offscreenCtx.arc(unpad(peg.x), unpad(peg.y), peg.radius, 0, Math.PI * 2);
        offscreenCtx.fill();
        offscreenCtx.closePath();
    });
}

drawPegsOffscreen();

function draw() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(offscreenCanvas, 0, 0); 
    drawMultipliers();
    
    balls = balls.filter(ball => !ball.toBeRemoved);

    balls.forEach(ball => {
        ball.draw();
        ball.update();
    });
}

function update(){
    draw();
    requestAnimationFrame(update);
}
let balance = 1000; 
let currentBet = 10; 

const balanceElement = document.getElementById('balanceAmount');
const betInput = document.getElementById('betInput');
const doubleBetButton = document.getElementById('doubleBet');
const halfBetButton = document.getElementById('halfBet');
const placeBetButton = document.getElementById('placeBet');

function updateBalanceDisplay() {
    balanceElement.textContent = balance.toFixed(2);
}

doubleBetButton.addEventListener('click', () => {
    currentBet *= 2;
    betInput.value = currentBet;
});

halfBetButton.addEventListener('click', () => {
    currentBet = Math.max(1, currentBet / 2); 
    betInput.value = currentBet;
});

placeBetButton.addEventListener('click', () => {
    currentBet = parseFloat(betInput.value);
    if (currentBet > balance) {
        alert("Insufficient balance!");
        return;
    }
    balance -= currentBet;
    updateBalanceDisplay();
    addBallWithBet(currentBet);
});

function addBallWithBet(betAmount) {
    const randomArray = Array.from({ length: 14 }, () => Math.random() < 0.5 ? 0 : 1);
    const value = randomArray.reduce((acc, curr) => acc + curr, 0);
    console.log(randomArray);
    console.log(value);

    const multipliersArray = [
        Multiplier1, Multiplier2, Multiplier3, Multiplier4, Multiplier5, Multiplier6,
        Multiplier7, Multiplier8, Multiplier9, Multiplier10, Multiplier11, Multiplier12,
        Multiplier13, Multiplier14, Multiplier15
    ];

    const index = Math.min(value, multipliersArray.length - 1);
    const selectedMultiplier = multipliersArray[index];

    const offset = selectedMultiplier[Math.floor(Math.random() * selectedMultiplier.length)];
    
    const positionX = (WIDTH / 2) + (randomArray[0] === 0 ? -offset : offset);

    const newBall = new Ball(pad(positionX), pad(50), ballRadius, 'white');
    newBall.betAmount = betAmount; 
    balls.push(newBall);
}

function updateBallMultiplier(ball, multiplier) {
    ball.toBeRemoved = true;
    multiplier.bob = 10; 
    const winnings = ball.betAmount * multiplier.value;
    balance += winnings;
    updateBalanceDisplay();
}

updateBalanceDisplay();
update();