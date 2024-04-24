// Global Variables

let Redlip;
let Blueball;
let You;
let ball;
let leftPaddle;
let rightPaddle;
let pussyImage;
let pussyFlashTimer;
let confetti = [];
let audio;
let rightWristPos;
let nosePos;



let capture;
let poseNet;
let poses = []; // this array will contain our detected poses (THIS IS THE IMPORTANT STUFF)
const cam_w = 640;
const cam_h = 480;


const options = {
  architecture: "MobileNetV1",
  imageScaleFactor: 0.3,
  outputStride: 16, // 8, 16 (larger = faster/less accurate)
  flipHorizontal: true,
  minConfidence: 0.5,
  maxPoseDetections: 5, // 5 is the max
  scoreThreshold: 0.5,
  nmsRadius: 20,
  detectionType: "multiple",
  inputResolution: 257, // 161, 193, 257, 289, 321, 353, 385, 417, 449, 481, 513, or 801, smaller = faster/less accurate
  multiplier: 0.5, // 1.01, 1.0, 0.75, or 0.50, smaller = faster/less accurate
  quantBytes: 2,
};

function preload() {
  Redlip = loadImage('Redlip.png');
  Blueball = loadImage('Blueball.png');
  You = loadImage('You.png');
  pussyImage = loadImage('Pussy.png');
  audio = loadSound('Pussyaudio.mp3');
  audio.setVolume(1.5);
}

function setup() {
  createCanvas(800, 400);
  ball = new Ball();
  leftPaddle = new Paddle(true, 20, height / 2);
  rightPaddle = new Paddle(false, width - 20, height / 2);
  pussyFlashTimer = 0;
  for (let i = 0; i < 100; i++) {
    confetti.push(new Confetti());
  }
  
  capture = createCapture(VIDEO);
  capture.size(cam_w, cam_h);

  // Create a new poseNet method with a single detection
  poseNet = ml5.poseNet(capture, options, modelReady);

  // This sets up an event that fills the global variable "poses"
  // with an array every time new poses are detected.
  poseNet.on("pose", function (results) {
    poses = results;
  });

  // Hide the capture element, and just show the canvas
  capture.hide();
  
  rightWristPos = createVector(0, 0);
  nosePos = createVector(0, 0);
}

function modelReady() {
  console.log("Model loaded");
}


function draw() {
  background(0);
  image(You, 0, 0, width, height);
  
  if (poses.length > 0) {
    findPlayer();
  }

  ball.update();
  ball.show();

  leftPaddle.show();
  leftPaddle.update(nosePos.y);

  rightPaddle.show();
  rightPaddle.update(rightWristPos.y);

  checkCollision(leftPaddle);
  checkCollision(rightPaddle);

  if (ball.x - ball.radius < 0 || ball.x + ball.radius > width) {
    if (!pussyFlashTimer) {
      pussyFlashTimer = frameCount;
      audio.play();
    }
  }

  if (pussyFlashTimer && frameCount - pussyFlashTimer < 300) { // 300 frames = 5 seconds at 60 FPS
    image(pussyImage, 0, 0, width, height);
    for (let confettiParticle of confetti) {
      confettiParticle.show();
      confettiParticle.update();
    }
  } else if (pussyFlashTimer) {
    resetGame();
  }
}

function checkCollision(paddle) {
  if (ball.x + ball.radius > paddle.x &&
    ball.x - ball.radius < paddle.x + paddle.width &&
    ball.y + ball.radius > paddle.y - paddle.height / 2 &&
    ball.y - ball.radius < paddle.y + paddle.height / 2) {
    ball.xSpeed *= -1;
  }
}

function resetGame() {
  pussyFlashTimer = 0;
  ball = new Ball();
  confetti = [];
  for (let i = 0; i < 100; i++) {
    confetti.push(new Confetti());
  }
}

function findPlayer() {
  
  let noseRecord = 0;
  let rightMostPose = 0;
  for(let i = 0; i < poses.length; i++) {
    let currentNose = poses[i].pose.nose.x
    //console.log(currentNose)
    
    if(currentNose > noseRecord) {
      noseRecord = currentNose;
      rightMostPose = i;
    }
  }
  
  
  let player = poses[rightMostPose].pose
  rightWristPos = createVector(player.rightWrist.x, map(player.rightWrist.y, 0, cam_h, 0, height, true));
  nosePos = createVector(player.nose.x, map(player.nose.y, 0, cam_h, 0, height, true));
  
  //ellipse(player.nose.x, player.nose.y, 20, 20)
  //ellipse(rightWristPos.x, rightWristPos.y, 20, 20);
  
}

class Ball {
  constructor() {
    this.x = width / 2;
    this.y = height / 2;
    this.radius = 20;
    this.xSpeed = random(-6, 6);
    this.ySpeed = random(-6, 6);
  }

  update() {
    this.x += this.xSpeed;
    this.y += this.ySpeed;

    if (this.y < 0 || this.y > height) {
      this.ySpeed *= -1;
    }
  }

  show() {
    push();
    imageMode(CENTER)
    image(Blueball, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
    pop();
  }
}

class Paddle {
  constructor(isLeft, x, y) {
    this.isLeft = isLeft;
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 100;
  }

  show() {
    if (this.isLeft) {
      image(Redlip, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    } else {
      image(Redlip, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
  }

  update(y) {
    this.y = y;
  }
}

class Confetti {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(5, 15);
    this.speed = random(1, 3);
    this.color = color(random(255), random(255), random(255));
  }

  show() {
    noStroke();
    fill(this.color);
    ellipse(this.x, this.y, this.size, this.size);
  }

  update() {
    this.y += this.speed;
    if (this.y > height) {
      this.y = 0;
      this.x = random(width);
    }
  }
}