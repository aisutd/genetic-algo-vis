//Create a Pixi Application
let app = new PIXI.Application({
    width: document.body.clientWidth,
    height: document.body.clientHeight,
});
app.renderer.backgroundColor = 0xcccccc;
console.log(document.body.clientHeight)
//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

const NUM_CRITTERS = 100;
const MUTATION_RATE = 0.5;
const MUTATION_PERC = 0.1;
const MUTATED_PERC = 0.75;
const DIFF = 0.001;
var SPEED = 0.5;

var hitTest = function(s2, s1)
{
    var x1 = s1.x + (s1.width/2),
    y1 = s1.y + (s1.height/2),
    w1 = s1.width,
    h1 = s1.height,
    x2 = s2.x + ( s2.width / 2 ),
    y2 = s2.y + ( s2.height / 2 ),
    w2 = s2.width,
    h2 = s2.height;
    
    if(Math.abs(x2 - x1) + Math.abs(y2 - y1) < Math.max(w1 + 5, w2 + 5)){
        return true;
    }
    return false;
};

function keyboard(value) {
    let key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
      if (event.key === key.value) {
        if (key.isUp && key.press) key.press();
        key.isDown = true;
        key.isUp = false;
        event.preventDefault();
      }
    };
  
    //The `upHandler`
    key.upHandler = event => {
      if (event.key === key.value) {
        if (key.isDown && key.release) key.release();
        key.isDown = false;
        key.isUp = true;
        event.preventDefault();
      }
    };
  
    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);
    
    window.addEventListener(
      "keydown", downListener, false
    );
    window.addEventListener(
      "keyup", upListener, false
    );
    
    // Detach event listeners
    key.unsubscribe = () => {
      window.removeEventListener("keydown", downListener);
      window.removeEventListener("keyup", upListener);
    };
    
    return key;
}

var idTracker = 0;
let critters = new Map();
var numCritters = 0;

function createCritter(x, y, values=[Math.random(), Math.random(), Math.random()], size=15){
    //Critter variables - priority for eating strangers, priority for food, priority for escaping
    var rect = new PIXI.Graphics();
    rect.beginFill(PIXI.utils.rgb2hex([values[2], values[1], values[0]]));
    let smallerDim = (app.renderer.height < app.renderer.width ? app.renderer.height : app.renderer.width) * 0.03;
    let critSize = Math.max(smallerDim * values[0], 15);
    rect.drawRect(0, 0, critSize, critSize);
    var texture = app.renderer.generateTexture(rect);
    var crit = new PIXI.Sprite(texture);
    crit.critSize = critSize;
    crit.values = values;
    crit.x = x;
    crit.y = y;
    crit.id = ++idTracker;
    crit.hp = 100;
    crit.lifespan = 0;
    crit.foodPrio = 0;
    crit.cannibalPrio = 0;
    crit.cowardPrio = 0;
    crit.moveSpeed = crit.critSize * 0.33;
    crit.adjustedSpeed = crit.moveSpeed;
    crit.moveUp = () => {
        if (crit.y >= crit.critSize){
            crit.y -= crit.adjustedSpeed;
        }
    }
    crit.moveDown = () => {
        if (crit.y <= app.renderer.height - 2 * crit.critSize){
            crit.y += crit.adjustedSpeed;
        }
    }
    crit.moveRight = () => {
        if (crit.x <= app.renderer.width - 2 * crit.critSize){
            crit.x += crit.adjustedSpeed;
        }
    }
    crit.moveLeft = () => {
        if (crit.x >= crit.critSize){
            crit.x -= crit.adjustedSpeed;
        }
    }
    crit.destroy = () => {
        critters.delete(crit.id);
        app.stage.removeChild(crit);
        numCritters--;
    }
    crit.updateSize = function(newSize){
        crit.scale._x = newSize / crit.critSize;
        crit.scale._y = newSize / crit.critSize;
        crit.critSize = newSize;
        // console.log(crit.height, crit.critSize);
    }
    crit.interactive = true;
    crit.buttonMode = true;
    var onClick = (event) => {
        console.log(crit.x, crit.y, crit.x - crit.width, crit.y - crit.height, crit.width, crit.critSize, crit.id);
    }
    crit.on('pointerdown', onClick)
    critters.set(crit.id, crit);
    app.stage.addChild(crit);
    numCritters++;
    return crit
}

function createFood(){
    var food = new PIXI.Graphics();
    food.beginFill(0x00CC00);
    let smallerDim = (app.renderer.height < app.renderer.width ? app.renderer.height : app.renderer.width) * 0.03;
    let foodSize = smallerDim * 0.33;
    food.drawRect(0, 0, foodSize, foodSize);
    food.move = () => {
        food.x = Math.random() * (app.renderer.width * 0.9) + app.renderer.width * 0.05;
        food.y = Math.random() * (app.renderer.height * 0.9) + app.renderer.height * 0.05;
    }
    food.move();
    app.stage.addChild(food);
    return food;
}

let foods = [];
for(i = 0; i < 100; i++)
    foods.push(createFood());

for(var i = 0; i < NUM_CRITTERS; i++){
    createCritter((Math.random() * 0.8 + 0.1) * app.renderer.width, (Math.random() * 0.8 + 0.1) * app.renderer.height)
}

function distance(obj1, obj2){
    return Math.abs(obj1.x - obj2.x) + Math.abs(obj1.y - obj2.y);
}

function checkFoodHit(value){
    let closestFood = undefined
    let closestDis = 10000000
    foods.forEach(f => {
        if(hitTest(value, f)){
            f.move();
            value.hp += 10;
        }
        if(distance(value, f) < closestDis){
            closestDis = distance(value, f);
            closestFood = f;
        }
    });
    value.foodPrio = 1 / closestDis * value.values[1];
    return closestFood;
}

function checkCritterHit(value){
    let closestDangerCritter = undefined;
    let closestEatableCritter = undefined;
    let closestDangerDis = 1000000;
    let closestEatableDis = 1000000;

    let errorCritters = 0;
    critters.forEach(c => {
        if(value.id != c.id){
            if(Math.abs(value.values[0] - c.values[0]) > DIFF || Math.abs(value.values[1] - c.values[1]) > DIFF || Math.abs(value.values[2] - c.values[2]) > DIFF){
                if(value.critSize > c.critSize){
                    if(hitTest(value, c)){
                        value.hp += c.hp;
                        value.updateSize(value.critSize + c.critSize * 0.1);
                        c.destroy();
                    }
                    else{
                        if(distance(value, c) < closestEatableDis){
                            closestEatableDis = distance(value, c);
                            closestEatableCritter = c;
                        }
                    }
                }
                if(value.critSize < c.critSize){
                    if(hitTest(value, c)){
                        if(value.critSize < c.critSize){
                            c.hp += value.hp;
                            c.updateSize(c.critSize + value.critSize * 0.1);
                            value.destroy();
                        }
                    }
                    else{
                        if(distance(value, c) < closestDangerDis){
                            closestDangerDis = distance(value, c);
                            closestDangerCritter = c;
                        }
                    }
                }
            }
        }
    });
    if(errorCritters > 0)
        console.log(errorCritters);
    value.cannibalPrio = 1 / closestEatableDis * value.values[2];
    value.cowardPrio = 1 / closestDangerDis * value.values[0];
    return closestDangerCritter, closestEatableCritter;
}

var generations = 0;
var timePassed = 0;
function critterUpdate(value, delta){
    if(value.hp <= 0){
        value.destroy();
    }
    value.adjustedSpeed = value.moveSpeed * delta * SPEED;
    value.hp -= 0.5 * SPEED;
    value.lifespan += SPEED;
    let closestFood = checkFoodHit(value);
    let closestTarget = closestFood;
    let running = false;
    let closestDangerCritter, closestEatableCritter = checkCritterHit(value);
    if(numCritters == 1 || (closestDangerCritter == undefined && closestEatableCritter == undefined) || (value.foodPrio > value.cannibalPrio && value.foodPrio > value.cowardPrio)){
        closestTarget = closestFood;
        closestPrio = value.foodPrio;
        value.moveSpeed = value.critSize * 0.33;
    }
    else if(closestDangerCritter == undefined || value.cannibalPrio > value.cowardPrio){
        closestTarget = closestEatableCritter;
        closestPrio = value.cannibalPrio;
    }
    else{
        closestTarget = closestDangerCritter;
        closestPrio = value.cowardPrio;
        running = true;
    }
    if(closestTarget.x < value.x){
        if(running)
            value.moveRight();
        else
            value.moveLeft();
    }
    else if(closestTarget.x > value.x){
        if(running)
            value.moveLeft();
        else
            value.moveRight();
    }
    if(closestTarget.y < value.y){
        if(running)
            value.moveDown();
        else
            value.moveUp();
    }
    else if(closestTarget.y > value.y){
        if(running)
            value.moveUp();
        else
            value.moveDown();
    }
}

function gameLoop(delta){
    if(numCritters <= 1 || timePassed > 500 / SPEED){
        timePassed = 0;
        generations++;
        let critterList = [];
        for(let [key, value] of critters){
            critterList.push({k: key, val: value.hp});
        }
        critterList = critterList.sort(function(a, b){
            return a.val < b.val;
        });
        //Pop all bad critters from end of list
        while(critterList.length > 5){
            critters.get(critterList.pop().k).destroy();
        }
        //Add new critters
        while(numCritters < NUM_CRITTERS * MUTATED_PERC){
            let baseCritID = critterList[Math.floor(Math.random() * critterList.length)].k
            let baseCrit = critters.get(baseCritID);
            let vals = baseCrit.values;
            for(let i = 0; i < vals.length; i++)
                if(Math.random() > MUTATION_RATE)
                    vals[i] *= (1 - MUTATION_PERC) + 2 * MUTATION_PERC * Math.random()
            let s = baseCrit.critSize;
            s *= (1 - MUTATION_PERC) + 2 * MUTATION_PERC * Math.random();
            createCritter((Math.random() * 0.8 + 0.1) * app.renderer.width, (Math.random() * 0.8 + 0.1) * app.renderer.height, values=vals, size=s)
        }
        while(numCritters < NUM_CRITTERS){
            createCritter((Math.random() * 0.8 + 0.1) * app.renderer.width, (Math.random() * 0.8 + 0.1) * app.renderer.height);
        }
        console.log("GEN", generations)
    }
    else{
        critters.forEach(critter => critterUpdate(critter, delta));
        timePassed++;
    }
}

app.ticker.add(gameLoop);

let rightKey = keyboard('ArrowRight');
rightKey.press = () => {
    critters.get(cr.id).moveRight();
}
let leftKey = keyboard('ArrowLeft');
leftKey.press = () => {
    critters.get(cr.id).moveLeft();
}
let upKey = keyboard('ArrowUp');
upKey.press = () => {
    critters.get(cr.id).moveUp();
}
let downKey = keyboard('ArrowDown');
downKey.press = () => {
    critters.get(cr.id).moveDown();
}