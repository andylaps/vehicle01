// vehicles 1 - one motor, friction can be positive as well as negative 
// and varies according to shade of map tile - black = max +ve, white = max -ve
// al 01 October 2016

// declare global vars
var 	gTileSize = 120;
var 	gCanvasWidth = 960,
		gCanvasHeight = 480; // canvas dimensions should be muliples of gTileSize
var	gCfMax = 0.05, gCfMin = gCfMax * -1; // set parameters for coefficient of friction	
var	gShowData = false;	
var	gTilesWide = gCanvasWidth/gTileSize,
		gTilesHigh = gCanvasHeight/gTileSize;
var	gMap = [];		
		

function setup() {
	createCanvas(gCanvasWidth, gCanvasHeight);	
	// write descriptive text to screen
	createP("Vehicle with a single motor and single sensor on a map with randomised areas of varying coefficients of 'friction' between black (-ve) and white (+ve)");
	createP("+ve friction slows vehicle, -ve friction speeds vehicle");
	createP("Vehicle starts with a speed of 10 and random direction");
	dVelText = createElement('p', "Current speed: "+0);
	dButton = createButton("Show CofF");
	createP("Use cmd-R / ctl-R to reset map and vehicle direction");
	dButton.mousePressed(setShowData);	
	// spawn tiles to fill map
	for (var col = 0; col < gTilesWide; col++) {
			gMap[col] = [];
		for (var row = 0; row < gTilesHigh; row++) {
			gMap[col][row] = new Tile(col,row);
		}	// row
	} // col
	// spawn vehicle
	v = new Vehicle;
} // setup

function draw() {
	setMap();
	v.locate();
	v.wallAvoid();
	v.update();
	v.render();
	dVelText.html("Current speed: "+round(v.vel.mag()*100)/100);
} // draw

function setMap() { 
	noStroke();
	for (var col = 0; col < gTilesWide; col++) {
		for (var row = 0; row < gTilesHigh; row++) {
			fill(gMap[col][row].shade);
			rect(gTileSize*col,gTileSize*row,gTileSize,gTileSize);
			// put Cf of tile on screen
			if (gShowData == true){
				push();
				translate(gMap[col][row].loX,gMap[col][row].hiY);
				textSize(16);
				fill("royalBlue");
				text(round(gMap[col][row].cF*10000),10,-10);
				pop();
			}
		}
	}
}

function setShowData(){
	if (gShowData == true) {
		gShowData = false
		dButton.html("show CofF");
	} 	else {
		gShowData = true
		dButton.html("hide CofF");
	}
}	

function Tile(c,r) {  	//tile constructor
	this.name = "tile("+c+","+r+")";
 	this.shade = round(random(255));
 	this.cF = map(this.shade,0,255,gCfMin,gCfMax); // maps tile shade to coeffecient of friction
 	// save the corners of the tiles to variables
 	this.loX = c * gTileSize;
 	this.hiX = this.loX+gTileSize-1;
 	this.loY = r * gTileSize;
 	this.hiY = this.loY+gTileSize-1;
} // Tile

function Vehicle() {		// vehicle constructor
	//this.cF = 0; // current coefficient of friction 
	this.r = 10; // bounding circle of vehicle shape
	this.maxSpeed = 10;
	this.maxSteer = .005; // not used in this program
	this.static = false; 
	// euclidean velocity - start in centre of canvas with a random velocity
	this.pos = createVector(width/2,height/2);
	this.vel = createVector(random(-10,10),random(-10,10));
	this.vel.normalize();
	this.vel.mult(this.maxSpeed);
	this.acc = createVector(0,0);

 	this.update = function() {
 		this.vel.add(this.acc);
 		this.pos.add(this.vel);
 		this.acc.mult(0);
 	} // update

 	this.render = function() {
 		// Draw a triangle rotated in the direction of velocity
 		if (this.static==false) { // this ensures the vehicle points the right way when stopped
 			theta = this.vel.heading() + radians(90);	
 		}; // if 
	  	fill("red");
	  	noStroke();
	  	push();
	  	translate(this.pos.x,this.pos.y);
		rotate(theta);
		beginShape();
	  	vertex(0, -this.r*2);
		vertex(-this.r, this.r*2);
		vertex(this.r, this.r*2);
		endShape(CLOSE);
		stroke("blue");
		noFill();
		ellipse(0,0,this.r*4);
		pop();
 	}	// update

 	this.calcFriction = function(c) {
 		if (this.static == false) {
	 		this.friction = this.vel.copy();
	 		this.friction.mult(-1);
	 		this.friction.normalize();
	 		this.friction.mult(c);	
	 	} // if
 		if (this.friction.mag()>this.vel.mag()) {
 			this.friction.mult(0);
 			this.vel.mult(0);
 			this.static = true;
 		} // if 
 		this.applyForce(this.friction);
 	} // calcFriction
 
	this.locate = function() {
		// find out where this (vehicle) is on map (which tile)
		// get the shade of the tile and calculate friction
		for (var col = 0; col < gTilesWide; col++) {
			for (var row = 0; row < gTilesHigh; row++) {
		 		if ((this.pos.x >= gMap[col][row].loX) && (this.pos.x <= gMap[col][row].hiX) 
		 			&& (this.pos.y >= gMap[col][row].loY) && (this.pos.y <= gMap[col][row].hiY)) {
						this.calcFriction(gMap[col][row].cF);
						return; // once location found exit col and row loops for efficiency
				} // if
			} // row
		} // col
	} // locate
 	
 	this.wallAvoid = function() { // simple bounce off wall - not using the classic Reynolds formula
 		if (this.pos.x > width-this.r*2)  {
 			this.pos.x = width-this.r*2;
 			this.vel.x *= -1;
 		}
 		if (this.pos.x < this.r*2) {
 			this.pos.x = this.r*2;
 			this.vel.x *= -1;
 		} // if
		if (this.pos.y > height-this.r*2) {
	 		this.pos.y = height-this.r*2;
	 		this.vel.y *= -1;
	 	} // if
	 	if (this.pos.y < this.r*2) {
	 		this.pos.y = this.r*2;
	 		this.vel.y *= -1;
	 	} // if
	} // wallAvoid

 	this.applyForce = function(f) {
 		this.acc.add(f);	
 	} // applyForce

} // Vehicle 