let rotAmount = 15;
let snap = 1;

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL);
    // cnv.style('z-index', '-1');
    // cnv.style('position', 'fixed');
    // frameRate(60);
    angleMode(DEGREES);
}

function draw() {
    let scrollPos = window.scrollY % 2500;
    let angleY = 0; // To map scroll to 90 degrees
    // ambientLight(200);
    normalMaterial(); // simple material that reacts to rotation
    // noFill();
    // stroke(255);
    // camera(map(mouseY, 0, height, -1000, 0), 0, map(mouseY, 0, height, 0, 1000), 0, 0, 0, 0, 1, 0);

    if(scrollPos<1000){
        angleY = map(scrollPos, 0, 1000, 0, 90);
        snap = map(angleY, 0, 90, 0, rotAmount);
        camera(map(angleY, 0, 90, -1000, 0), 0, map(angleY, 0, 90, 0, 1000), 0, 0, 0, 0, 1, 0);
        background(map(angleY, 0, 70, 0, 255));
        // stroke(map(angleY, 0, 70, 255, 0));
    }
    if(scrollPos > 1000 && scrollPos < 1500){
        angleY = 90;
        background(255);
    }
    if(scrollPos > 1500 && scrollPos < 2500){
        angleY = map(scrollPos, 1500, 2500, 90, 180);
        snap = map(angleY, 90, 180, rotAmount, 0)
        camera(map(angleY, 90, 180, 0, 1000), 0, map(angleY, 90, 180, 1000, 0), 0, 0, 0, 0, 1, 0);
        background(map(angleY, 90, 160, 255, 0));
        // stroke(map(angleY, 0, 70, 0, 255));
    }
    if(scrollPos > 2500){
        background(0);
        //writing it with Else didnt work for some reason?
    }
    // console.log(scrollPos);
    
    
    
    // rotateY(angleY);
    // box(150)
    // translate(160, 0, 0);
    for(let i=0; i<5; i++){
        push();
        translate(160*i - 320, 0, 0); // shift so boxes are roughly centered
        rotateX(rotAmount * i - snap * i  + map(angleY, 0, 180, 0, 360))
        //rotAmount * i - Individual rotation
        //snap * i - Above we map the scroll 0, 90 to 0, rotAmount, so all the boxes snap together into one straight line based on rotation
        //map(angleY, 0, 180, 0, 360)) - Common rotation
        box(150); 
        // cylinder(50);
        pop();
    }
}

// ----- VERY COOL SHARP TRANSITION EFFECT. IDEA FOR PORTFOLIO WEBSITE -----
// function setup() {
//     createCanvas(windowWidth, windowHeight, WEBGL);
//     // frameRate(60);
//     angleMode(DEGREES);
// }

// function draw() {
//     let scrollPos = window.scrollY;
//     let angleY = 0;
//     // ambientLight(200);
//     normalMaterial(); // simple material that reacts to rotation
//     // noFill();
//     // stroke(255);
//     // camera(map(mouseY, 0, height, -1000, 0), 0, map(mouseY, 0, height, 0, 1000), 0, 0, 0, 0, 1, 0);
    
//     if(scrollPos<1000){
//         angleY = map(scrollPos, 0, 1000, 0, 90);
//     }
//     if(scrollPos > 1000 && scrollPos < 1500){
//         angleY = 90;
//     }
//     if(scrollPos > 1500 && scrollPos < 2500){
//         angleY = map(scrollPos, 1500, 2500, 90, 180);
//     }
//     // console.log(scrollPos);
    
//     background(map(angleY, 0, 70, 0, 255));
//     camera(map(angleY, 0, 180, -1000, 1000), 0, map(angleY, 0, 180, -1000, 0), 0, 0, 0, 0, 1, 0);
//     // rotateY(angleY);
//     // box(150)
//     // translate(160, 0, 0);
//     for(let i=0; i<5; i++){
//         push();
//         translate(160*i - 320, 0, 0); // shift so boxes are roughly centered
//         rotateX(12 * i + map(scrollPos, 0, 1000, 0, 360)) 
//         box(150);
//         pop();
//     }
// }



// ----- TO TEST THE CAMERA -----
// function setup() {
//     createCanvas(windowWidth, windowHeight, WEBGL);
//     // cnv.style('z-index', '-1');
//     // cnv.style('position', 'fixed');
//     // frameRate(60);
//     angleMode(DEGREES);
// }

// function draw() {
//     background(25);
//     ambientLight(150);
//     // camera(0, 0, (height/2) / tan(PI/6), 0, 0, 0, 0, 1, 0);
//     camera(300, 300, 0, 0, 0, mouseX, 0, 1, 0);
//     orbitControl();

//     box(200);
// }
