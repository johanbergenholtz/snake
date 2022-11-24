//The boxes
function Food(x, y, sideLength){
    return {
        xPos: x,
        yPos: y,
        side: sideLength,
    }
}

function SnakePart(x,y, sideLength, direction, movesVertically){
    return {
        xPos:  x, //OBS: not center pos, but upper left corner of box
        yPos:  y,
        side:  sideLength,
        dir :  direction, //1, or -1
        vertical: movesVertically,
        turnPos: [], //the positions at which a child/body part should steer
        steerInstrs: [], //the steer directions when positions reached
        move: function(speed,screenWidth,screenHeight){
            this.xPos = getNewPos(this.xPos,speed,screenWidth,!this.vertical,this.dir,this.side)
            this.yPos = getNewPos(this.yPos,speed,screenHeight,this.vertical,this.dir,this.side)
        },
        steer: function(vertical, dir, child){
            this.vertical = vertical;
            this.dir = dir;             
            if (child !== undefined){
                let x = this.xPos;
                let y = this.yPos;
                child.turnPos.unshift([x,y]) //add as first el. optimize if needed, like custom FIFO
                child.steerInstrs.unshift([vertical, dir])
            }
            
        },
        waitForSteer: function(child){
            let size = this.turnPos.length;
            if (size === 0){
                return;
            } 
            let pos = this.turnPos[size-1];
            if ((this.vertical || this.timeToTurn(this.dir, pos[0], this.xPos)) && 
                    (!this.vertical || this.timeToTurn(this.dir, pos[1], this.yPos))){
                this.turnPos.pop();
                this.xPos = pos[0];
                this.yPos = pos[1];
                let steerInstr = this.steerInstrs.pop();
                this.steer(steerInstr[0], steerInstr[1], child)
            }
        }, //helper
        timeToTurn: function(dir, savedPos, currentPos){
            
            let epsilon = Math.abs(currentPos - savedPos) < this.side + Math.floor(daSpeed/10);
            
            if (dir > 0 && epsilon)
                return savedPos <= currentPos;
            if (dir < 0 && epsilon)
                return savedPos >= currentPos;

            return false;
        }
    }
}

// HELPER

function getNewPos(pos, speed, screenLimit, vertical, dir, side){
    pos = pos > screenLimit ? -side : pos;
    pos = pos < -side? screenLimit : pos;
    pos += vertical ?  speed*dir : 0; //for y: if moving vertically: move, else: keep pos
    return pos;
}

//Animation

function drawBox(box, color,canvas){
    let context = canvas.getContext("2d"); 
    let width = box.side;
    context.fillStyle = color;
    context.fillRect(box.xPos, box.yPos, width, width)   
}

//GAME EVENTS

//make new body part
function feed(snake, head, screenWidth, screenHeight){
    let size = snake.length;
    let s = size > 0 ? snake[size-1] : head;
    let newX = s.vertical ?  s.xPos :  s.xPos - s.dir*s.side; //duplicate, might fix
    let newY = !s.vertical ? s.yPos : s.yPos - s.dir*s.side;
    newX = newX < -s.side ? screenWidth : (newX > screenWidth ? -s.side : newX);
    newY = newY < -s.side? screenHeight: (newY > screenHeight ? -s.side: newY);
    snake.push(new SnakePart(newX, newY, s.side,s.dir, s.vertical));
}

function placeFood(head, screenWidth, screenHeight){
    let x = Math.floor(Math.random() *(screenWidth-head.side))
    let y = Math.floor(Math.random() *(screenHeight-head.side))
    return new Food(x, y, head.side);
}

function collision(box1, box2, offset){
    let side = box1.side-offset;
    return  box1.xPos + side >= box2.xPos &&
            box1.xPos <= box2.xPos + side &&
            box1.yPos + side >= box2.yPos &&
            box1.yPos <= box2.yPos + side;
}

//GAME
document.getElementById("playButton").addEventListener("click", () => {
    daSpeed += 2;
});

const ctx =document.getElementById("myCanvas").getContext("2d");
ctx.font = "30px Comic Sans MS";
ctx.fillStyle = "red";
ctx.textAlign = "center";
ctx.fillText("Use WASD to steer", 150, 75);
ctx.font = "20px Comic Sans MS";
ctx.fillText("Press any key to play", 150, 105); 
var head;
var snake;
var playing = false;
var daSpeed = 2;

//var pause = false;

function play(){
    if (playing) return;
    document.getElementById("score").textContent = "Score: " + 0;
    playing = true;
    let canvas = document.getElementById("myCanvas");
    let width = canvas.clientWidth; //TODO: make work any screen size?
    let height = canvas.clientHeight;
    canvas.getContext("2d").clearRect(0,0, width,height);
    let posX = Math.floor((width*2)/3);
    let posY = Math.floor(height/3);
    //let side = Math.floor(posX/10)
    let side = 20;
    head = new SnakePart(posX,posY, side, 1,false);
    snake = [];
    for (let i = 1; i < 3; i++){
        feed(snake,head,width,height)
    }
    let speed = daSpeed;//Math.floor((canvas.clientWidth*2)/(3*100));
    let food = placeFood(head, width, height);
    let score = 0;
    window.requestAnimationFrame(() => gameLoop(canvas, speed, score, food))
}
function gameLoop(canvas, speed, score, food){
    //if (pause) return;
    let ctx = canvas.getContext("2d"), screenW = canvas.clientWidth, screenH = canvas.clientHeight;
    ctx.fillStyle ="#FFFFFF";
    ctx.fillRect(0, 0, screenW, screenH); 
    speed = daSpeed;
    let dead = false;
    
    head.waitForSteer(snake[0])
    head.move(speed, screenW,screenH)
    snake.forEach((bodyPart, index, snake) => bodyPart.waitForSteer(snake[index+1]));
    snake.forEach((bodyPart) => bodyPart.move(speed, screenW, screenH));
    
    drawBox(head, "#000000", canvas)
    snake.forEach((bodyPart,index) => {
        if (index !== 0 && collision(head, bodyPart, 10)){
            drawBox(bodyPart, "red", canvas);
            dead = true;
        }else 
            drawBox(bodyPart, "#000000", canvas)
    });
    
    if (collision(head, food, 0)){
        drawBox(food, "#11E21C", canvas)//green
    }else{
        drawBox(food, "#DF841B", canvas)//orange
    }

    if (collision(head, food, 4)){
        food = placeFood(head, canvas.clientWidth, canvas.clientHeight);
        feed(snake, head, canvas.clientWidth, canvas.clientHeight)
        score += 10
        document.getElementById("score").textContent = "Score: " + score;
    }

    if (!dead){
        window.requestAnimationFrame(() => gameLoop(canvas,speed,score,food));
    }else{
        playing = false;
        enterNameAndUpdateHighScores(score)
    } 
        
}

//HANDLING KEYBOARD EVENTS

document.addEventListener('keypress', (event) =>{
    if (!playing) play();
   
    switch(event.code){
        case 'KeyS':
            // head.steer(true,  1, snake[0])
            head.steerInstrs.unshift([true,1])
            head.turnPos.unshift([head.xPos, head.yPos])
            break;
        case 'KeyW':
            // head.steer(true, -1, snake[0])
            head.steerInstrs.unshift([true,-1])
            head.turnPos.unshift([head.xPos, head.yPos])
            break;
        case 'KeyA':
            // head.steer(false,-1, snake[0])
            head.steerInstrs.unshift([false,-1])
            head.turnPos.unshift([head.xPos, head.yPos])
            break;
        case 'KeyD':
            // head.steer(false, 1, snake[0])
            head.steerInstrs.unshift([false,1])
            head.turnPos.unshift([head.xPos, head.yPos])
            break;
    }
});

// HIGH SCORE DISPLAY
const scoreIDs = ["l1","l2","l3","l4","l5"];
var scoreNames = [];
var highScores = [];
scoreIDs.forEach((id) => {
    let storedScore = window.localStorage.getItem(id);
    let arr = storedScore !== null ? storedScore.split("#") : ["Patrik","0"];
    arr = arr.length > 1 ? arr : ["Patrik","0"];
    let score = parseInt(arr.pop());
    score = score !== NaN ? score : 0;
    let name = arr.pop();
    name = name !== undefined ? name : "Patrik";
    highScores.push(score);
    scoreNames.push(name);
    document.getElementById(id).textContent = name + ": " + score; 
});

function enterNameAndUpdateHighScores(score){
    let tmpScore = null, tmpName = null;
    scoreIDs.forEach((id,index) => {
        if (tmpScore !== null){
            let tmp1 = highScores[index]; 
            let tmp2 = scoreNames[index];
            printAndStore(id,index,tmpName, tmpScore);
            tmpScore = tmp1;
            tmpName = tmp2;
        }
        else if(score > highScores[index]){
            let name = window.prompt("I prince. You won fortune. Please enter name. I send money", "name")
            //what if user cancels, sends empty? IMPLEMENT!
            tmpScore = highScores[index]
            tmpName = scoreNames[index]
            printAndStore(id,index,name,score);
        }
    })

    function printAndStore(id,index, name, score) {
        highScores[index] = score;
        scoreNames[index] = name;
        document.getElementById(id).textContent = name + ": " + score;
        let storeStr = name + "#" + score;
        window.localStorage.setItem(id, storeStr);
    }
}
