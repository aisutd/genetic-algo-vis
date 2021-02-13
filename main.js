//Create a Pixi Application
var visualizationDiv = document.getElementById('visualization');
var graphCtx = document.getElementById('graph');
let fitnessData = []
var fitnessChart = new Chart(graphCtx, {
    type: 'line',
    data: {
        datasets: [
            {
                'label': 'Fitness Graph Over Generations',
                'data': fitnessData,
                'fill': false,
                'cubicInterpolationMode': 'monotone',
            }
        ]
    },
    label: 'Fitness Graph Over Generations',
    xAxisID: 'Generations',
    yAxisID: 'Average Gen. Fitness',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    options: {
        maintainAspectRatio: false,
        title: {
            display: true,
            text: 'Fitness Graph Over Generations',
            position: 'top'
        },
        legend: {
            display: false,
        },
        scales:{
            yAxes: [{
                display: true,
                labelString: 'Fitness Score'
            }],
            xAxes: [{
                display: true,
                labelString: 'Generations'
            }]
        }
    }
});
let dims = visualizationDiv.getBoundingClientRect();
let app = new PIXI.Application({
    // width: document.body.clientWidth,
    // height: document.body.clientHeight,
    width: dims.width,
    height: dims.height,
});
app.renderer.backgroundColor = 0xcccccc;
console.log(document.body.clientHeight)
//Add the canvas that Pixi automatically created for you to the HTML document
visualizationDiv.appendChild(app.view);

var NUM_CRITTERS = 20;
var MUTATION_RATE = 0.5;
var MUTATION_PERC = 0.1;
var MUTATED_PERC = 0.75;
const DIFF = 0.001;
var SPEED = 0.5;
const SelectionMethods = Object.freeze({
    "kbest" : 1,
    "tournament" : 2,
    "roulette" : 3
});
const FitnessMethods = Object.freeze({
    "hp" : 1,
    "crittersEaten" : 2,
    "foodEaten" : 3,
    "timeAlive" : 4
})
var SELECTION_METHOD = SelectionMethods.kbest;
var FITNESS_METHOD = FitnessMethods.hp;
var restartFunc;

Formio.createForm(document.getElementById('form'), {
    "components": [
        {
            "label": "Description",
            "attrs": [
                {
                    "attr": "",
                    "value": ""
                }
            ],
            "content": "Welcome to AIS's Genetic Algorithm Visualization! The objective of the square \"critters\" on the right is to survive as long as possible and expand their-color species! Adjust the parameters below and see how it affects the genetic algorithm.",
            "refreshOnChange": false,
            "key": "description",
            "type": "htmlelement",
            "input": false,
            "tableView": false
        },
        {
            "label": "Speed of the visualization:",
            "labelPosition": "left-left",
            "autocomplete": "off",
            "tableView": true,
            "key": "speedOfTheVisualization",
            "type": "textfield",
            "input": true,
            "labelMargin": 2,
            "labelWidth": 25
        },
        {
            "label": "Number of Critters",
            "labelPosition": "left-left",
            "placeholder": "10",
            "description": "Number of critters per generation",
            "tableView": true,
            "key": "numberOfCritters",
            "type": "textfield",
            "input": true,
            "labelWidth": 25,
            "labelMargin": 2
        },
        {
            "label": "Mutated Percentage",
            "labelPosition": "left-left",
            "placeholder": "75",
            "description": "% of critters per generation that are mutated from last generation selection",
            "tableView": true,
            "key": "mutatedPercentage",
            "type": "textfield",
            "input": true,
            "labelWidth": 25,
            "labelMargin": 2
        },
        {
            "label": "Mutation Rate",
            "labelPosition": "left-left",
            "placeholder": "50",
            "description": "% chance to change genes of critter for mutation",
            "tableView": true,
            "key": "mutationRate",
            "type": "textfield",
            "input": true,
            "labelWidth": 25,
            "labelMargin": 2
        },
        {
            "label": "Mutation Modifier",
            "labelPosition": "left-left",
            "placeholder": "10",
            "description": "% to mutate a weight once it has been selected",
            "tableView": true,
            "key": "mutationModifier",
            "type": "textfield",
            "input": true,
            "labelWidth": 25,
            "labelMargin": 2
        },
        {
            "label": "Select Fitness Function",
            "labelPosition": "left-left",
            "widget": "html5",
            "placeholder": "HP",
            "description": "Choose the Fitness option the Genetic Algorithm will optimize for",
            "uniqueOptions": true,
            "tableView": true,
            "data": {
                "values": [
                    {
                        "label": "HP",
                        "value": "hp"
                    },
                    {
                        "label": "Critters Eaten",
                        "value": "crittersEaten"
                    },
                    {
                        "label": "Food Eaten",
                        "value": "foodEaten"
                    },
                    {
                        "label": "Time Alive",
                        "value": "timeAlive"
                    }
                ]
            },
            "dataType": "string",
            "selectThreshold": 0.3,
            "key": "selectFitnessFunction",
            "type": "select",
            "labelWidth": 25,
            "labelMargin": 2,
            "input": true,
            "defaultValue": "hp"
        },
        {
            "label": "Selection Method Options",
            "labelPosition": "left-left",
            "optionsLabelPosition": "right",
            "description": "Method used to select critters to use in every generation.",
            "inline": false,
            "tableView": false,
            "values": [
                {
                    "label": "K-Best",
                    "value": "kBest",
                    "shortcut": ""
                },
                {
                    "label": "Tournament",
                    "value": "tournament",
                    "shortcut": ""
                },
                {
                    "label": "Roulette",
                    "value": "roulette",
                    "shortcut": ""
                }
            ],
            "key": "selectionMethodOptions",
            "type": "radio",
            "input": true,
            "defaultValue": "kBest",
            "labelWidth": 25,
            "labelMargin": 2
        },
        {
            "label": "Apply",
            "action": "event",
            "showValidations": false,
            "description": "Restart visualization with new genetic algorithm settings.",
            "tableView": false,
            "key": "apply",
            "type": "button",
            "input": true,
            "event": "refreshData"
        }
    ]
}).then(function(form){
    form.on('refreshData', (values) => {
        console.log(values);
        if(values.speedOfTheVisualization){
            SPEED = values.speedOfTheVisualization;
        }
        if(values.numberOfCritters){
            NUM_CRITTERS = values.numberOfCritters;
        }
        if(values.mutatedPercentage){
            let perc = Math.max(values.mutatedPercentage, 0);
            perc = Math.min(values.mutatedPercentage, 100);
            MUTATED_PERC = perc / 100;
        }
        if(values.mutationRate){
            let perc = Math.max(values.mutationRate, 0);
            perc = Math.min(values.mutationRate, 100);
            MUTATION_RATE = values.mutationRate;
        }
        if(values.mutationModifier){
            let perc = Math.max(values.mutationModifier, 0);
            perc = Math.min(values.mutationModifier, 100);
            MUTATION_PERC = values.mutationModifier;
        }
        if(values.selectFitnessFunction){
            if(values.selectFitnessFunction == 'hp')
                FITNESS_METHOD = FitnessMethods.hp;
            else if(values.selectFitnessFunction == 'crittersEaten')
                FITNESS_METHOD = FitnessMethods.crittersEaten;
            else if(values.selectFitnessFunction == 'foodEaten')
                FITNESS_METHOD = FitnessMethods.foodEaten;
            else
                FITNESS_METHOD = FitnessMethods.timeAlive;
        }
        if(values.selectionMethodOptions){
            if(values.selectionMethodOptions == 'tournament')
                SELECTION_METHOD = SelectionMethods.tournament;
            else if(values.selectionMethodOption == 'kBest')
                SELECTION_METHOD == SelectionMethods.kbest;
            else
                SELECTION_METHOD == SelectionMethods.roulette;
        }
    });
});

function weighted_random(items, weights) {  // https://stackoverflow.com/a/55671924
    var i;

    for (i = 0; i < weights.length; i++)
        weights[i] += weights[i - 1] || 0;
    
    var random = Math.random() * weights[weights.length - 1];
    
    for (i = 0; i < weights.length; i++)
        if (weights[i] > random)
            break;
    
    return items[i];
}

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
var destroyedCritters = new Map();
var numCritters = 0;

function createCritter(x, y, values=[Math.random(), Math.random(), Math.random()], size=15){
    //Critter variables - priority for eating strangers, priority for food, priority for escaping
    var rect = new PIXI.Graphics();
    // rect.beginFill(PIXI.utils.rgb2hex([values[2], values[1], values[0]]));
    rect.beginFill(PIXI.utils.rgb2hex([0, 0, 0]));
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
    crit.foodEaten = 0;
    crit.crittersEaten = 0;
    crit.foodPrio = 0;
    crit.cannibalPrio = 0;
    crit.cowardPrio = 0;
    crit.moveSpeed = crit.critSize * 0.33;
    crit.adjustedSpeed = crit.moveSpeed;
    crit.isEaten = false;
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
        if (!(crit.id in destroyedCritters)){
            if(critters.delete(crit.id)){
                destroyedCritters.set(crit.id, crit);
                app.stage.removeChild(crit);
                numCritters--;
            }
            else{
                console.error("FAILED TO DESTROY ", crit.id);
            }
        }
    }
    crit.updateSize = function(newSize){
        crit.scale._x = newSize / crit.critSize;
        crit.scale._y = newSize / crit.critSize;
        crit.critSize = newSize;
        // console.log(crit.height, crit.critSize);
    }
    crit.reset = () => {
        crit.hp = 100;
        crit.lifespan = 0;
        crit.crittersEaten = 0;
        crit.foodEaten = 0;
        crit.foodPrio = 0;
        crit.cannibalPrio = 0;
        crit.cowardPrio = 0;
        crit.moveSpeed = crit.critSize * 0.33;
        crit.adjustedSpeed = crit.moveSpeed;
        crit.isEaten = false;
    }
    crit.interactive = true;
    crit.buttonMode = true;
    var onClick = (event) => {
        console.log(crit.x, crit.y, crit.x - crit.width, crit.y - crit.height, crit.width, crit.critSize, crit.id);
    }
    crit.on('pointerdown', onClick)
    numCritters++;
    return crit
}

function getFitness(crit){
    if (FITNESS_METHOD == FitnessMethods.hp)
        return crit.hp;
    else if(FITNESS_METHOD == FitnessMethods.timeAlive)
        return crit.lifespan;
    else if(FITNESS_METHOD == FitnessMethods.crittersEaten)
        return crit.crittersEaten;
    else if(FITNESS_METHOD == FitnessMethods.foodEaten)
        return crit.foodEaten;
}

function addCritter(crit){
    critters.set(crit.id, crit);
    app.stage.addChild(crit);
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
    addCritter(createCritter((Math.random() * 0.8 + 0.1) * app.renderer.width, (Math.random() * 0.8 + 0.1) * app.renderer.height));
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
            value.foodEaten += 1;
            if(!critters.has(value.id)){
                console.log("IMPOSTER FOUND");
                console.log(critters);
                console.log(value);
                console.log("IMPOSTER KICKED");
            }
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
        if(!value.isEaten && value.id != c.id){
            if(Math.abs(value.values[0] - c.values[0]) > DIFF || Math.abs(value.values[1] - c.values[1]) > DIFF || Math.abs(value.values[2] - c.values[2]) > DIFF){
                if(value.critSize > c.critSize){
                    if(hitTest(value, c)){
                        c.isEaten = true;
                        value.hp += c.hp;
                        value.crittersEaten += 1;
                        value.updateSize(value.critSize + c.critSize * 0.1);
                        c.destroy();
                        console.log('EATING');
                    }
                    else{
                        if(distance(value, c) < closestEatableDis){
                            closestEatableDis = distance(value, c);
                            closestEatableCritter = c;
                        }
                    }
                }
                if(value.critSize < c.critSize){
                    if(distance(value, c) < closestDangerDis){
                        closestDangerDis = distance(value, c);
                        closestDangerCritter = c;
                    }
                    // if(hitTest(value, c)){
                    //     if(value.critSize < c.critSize){
                    //         c.hp += value.hp;
                    //         c.updateSize(c.critSize + value.critSize * 0.1);
                    //         value.destroy();
                    //     }
                    //     console.log('EATEN');
                    // }
                    // else{
                    //     if(distance(value, c) < closestDangerDis){
                    //         closestDangerDis = distance(value, c);
                    //         closestDangerCritter = c;
                    //     }
                    // }
                }
            }
        }
        errorCritters++;
    });
    if(errorCritters > NUM_CRITTERS)
        console.log('ERROR CRITTER', errorCritters);
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
    // value.hp -= 0.15 * SPEED;
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
        let critterList = [];   // Stores population
        console.log(SELECTION_METHOD);
        destroyedCritters.forEach(critter => console.log(critter.id, numCritters));
        console.log("NUM CRITTERS PRE: ", numCritters);
        critters.forEach(critter => {
            // console.log(critter.id, numCritters);
            critter.destroy();
        });
        let sum = 0;
        console.log("NUM CRITTERS BEFORE: ", numCritters);
        for(let [key, crit] of destroyedCritters){
            sum += getFitness(crit);
            critterList.push(crit);
        }
        fitnessChart.data.datasets.forEach((dataset) => {
            dataset.data.push(sum / critterList.length);
        });
        fitnessChart.data.labels.push(generations);
        console.log(fitnessChart.data.datasets);
        fitnessChart.update();

        if(SELECTION_METHOD == SelectionMethods.kbest){
            console.log(critterList);
            critterList = critterList.sort(function(a, b){
                return getFitness(b) - getFitness(a);
            });
            // Pop all bad critters from end of list
            while(critterList.length > 5){
                crit = critterList.pop()
            }
            console.log(critterList);
        }
        else if(SELECTION_METHOD == SelectionMethods.tournament){
            console.log(critterList);
            const NUM_TOURNEYS = 5;
            let tempPopulation = new Array(NUM_TOURNEYS);
            for(i = 0; i < tempPopulation.length; i++)
                tempPopulation[i] = [];
            k = 0
            for(let crit of critterList){
                tempPopulation[k % NUM_TOURNEYS].push(crit);
                k += 1
            }
            critterList = [];
            for(i = 0; i < NUM_TOURNEYS; i++){
                tempPopulation[i] = tempPopulation[i].sort(function(a, b){
                    return getFitness(b) - getFitness(a);
                });
                if(tempPopulation[i].length > 0){
                    while(tempPopulation[i].length > 1){
                        crit = tempPopulation[i].pop();
                        // critters.get(crit[0]).destroy();
                    }
                    critterList.push(tempPopulation[i][0]);
                }
            }
            console.log(critterList);
        }
        else if(SELECTION_METHOD == SelectionMethods.roulette){
            weights = []
            for(let crit of critterList){
                weights.push(getFitness(crit));
            }
            // TODO: Finish this. Issue: Need to "copy" critter without adding it to critters set. Requires small rewrite
            const NUM_SELECTED = 5;
            let tempPopulation = [];
            for(i = 0; i < NUM_SELECTED; i++)
                tempPopulation[i] = weighted_random(critterList, weights);
            critterList = tempPopulation;
        }
        console.log("NUM CRITTERS MIDDLE: ", numCritters, critterList.length);
        //Add new critters
        while(numCritters < (NUM_CRITTERS - critterList.length) * MUTATED_PERC){
            let baseCrit = critterList[Math.floor(Math.random() * critterList.length)]
            // let baseCrit = critters.get(baseCritID);
            let vals = baseCrit.values;
            for(let i = 0; i < vals.length; i++)
                if(Math.random() > MUTATION_RATE)
                    vals[i] *= (1 - MUTATION_PERC) + 2 * MUTATION_PERC * Math.random()
            let s = baseCrit.critSize;
            s *= (1 - MUTATION_PERC) + 2 * MUTATION_PERC * Math.random();
            addCritter(createCritter((Math.random() * 0.8 + 0.1) * app.renderer.width, (Math.random() * 0.8 + 0.1) * app.renderer.height, values=vals, size=s));
        }
        while(numCritters < (NUM_CRITTERS - critterList.length)){
            addCritter(createCritter((Math.random() * 0.8 + 0.1) * app.renderer.width, (Math.random() * 0.8 + 0.1) * app.renderer.height));
        }
        for(let crit of critterList){
            crit.reset();
            critters.set(crit.id, crit);
            numCritters++;
        }
        // test = 0
        // critters.forEach(critter => {
        //     console.log("CRITTERCHECK" + test++);
        // });
        destroyedCritters.clear();
        generations++;
        console.log("GEN", generations);
        console.log("NUM CRITTERS END: ", numCritters);
    }
    else{
        let i = 0;
        critters.forEach(critter => {
            critterUpdate(critter, delta);
            i++;
        });
        if(i > NUM_CRITTERS)
            console.log("ERROR: INVIS CRITTERS");
        // console.log(i);
        timePassed++;
    }
}

app.ticker.add(gameLoop);

// let rightKey = keyboard('ArrowRight');
// rightKey.press = () => {
//     critters.get(cr.id).moveRight();
// }
// let leftKey = keyboard('ArrowLeft');
// leftKey.press = () => {
//     critters.get(cr.id).moveLeft();
// }
// let upKey = keyboard('ArrowUp');
// upKey.press = () => {
//     critters.get(cr.id).moveUp();
// }
// let downKey = keyboard('ArrowDown');
// downKey.press = () => {
//     critters.get(cr.id).moveDown();
// }