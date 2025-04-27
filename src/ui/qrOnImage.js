const canvas = document.getElementById("frame");
const ctx = canvas.getContext("2d");
const qrCodeCanvas = document.getElementById("qrCodeCanvas");
const qrCodeCTX = qrCodeCanvas.getContext("2d");
var size = 500;
var dotSize = document.getElementById("numberDotSize").value;
var image;
const imageStats = {
	"sx": 0,
	"sy": 0,
	"swidth": size,
	"sheight": size,
	"x": 0,
	"y": 0,
	"width": size,
	"height": size,
	"maxWidth": size,
	"maxHeight": size
};
// need a color for both 1 dots and 0 dots.
const colors = {
	"primary": "#000000",
	"secondary": "#FFFFFF",
	"bg": "#FFFFFF"
}

var inc, startX, startY, endX, endY, width, gridSize;
var qrCodeReady = false;
var qrCodeCreated = false;
var opacity = 1.0;
var temp = 0;
var data = [];

const drawButton = document.getElementById("draw");

drawButton.onclick = function() {
	if(qrCodeCreated) drawQRCode();
	if(!image) {
		console.log("Please upload an image first.");
		return;
	}
	const qrcode = new Image();
	qrcode.crossOrigin = "anonymous";
	let imgData = qrCodeOnImage();
	if(!imgData) {
		console.log("Something went wrong with the API.");
		return;
	}
	qrcode.src = `data:image/png;base64,${imgData}`;
	qrcode.onload = function() {
		qrCodeCTX.drawImage(qrcode, 0, 0, size, size);
		document.body.appendChild(qrCodeCanvas);
		console.log(qrcode);
		// find top left corner of top left eye
		let pos = 0;
		let pixel = qrCodeCTX.getImageData(pos, pos, 1, 1);
		

		while(pixel.data[0] != 0 && pixel.data[1] != 0 && pixel.data[2] != 0 && pixel.data[3]) {
			pos++;
			pixel = qrCodeCTX.getImageData(pos, pos, 1, 1);
		}

		// measure how big the eye is
		let x = pos;
		while(pixel.data[0] == 0 && pixel.data[1] == 0 && pixel.data[2] == 0) { // ONLY WORKS FOR BLACK QR CODES
			x++;
			pixel = qrCodeCTX.getImageData(x, pos, 1, 1);

		}
		console.log(x-pos);
		// qrCodeCTX.fillStyle = "red";
		// qrCodeCTX.fillRect(pos, pos, x-pos, 2);

		// make all constants using found values
		// we know that all eyes are 7 dots wide.
		inc = Math.round((x-pos) / 7);

		// the starting position is the "middle of the first dot", which is actually
		// just the top left corner of the eye. however, it should be centered where
		// the dot's center is meant to be.

		startX = pos+inc/2;
		startY = pos+inc/2;

		


		// we need to find how big the grid is. we know that all QR codes we recieve
		// from QRcode monkey will have the same size of 1000px. We can count back
		// from right using the pos to find the top right of the top right eye.

		endX = size - pos - inc * 0.5;
		temp = pos;
		width = endX-startX;
		gridSize = Math.round(width / inc) + 1;
		console.log(gridSize);

		let oldSize = size;
		size = startX * 2 + inc * (gridSize-1);

		console.log("Grid Size: " + gridSize);
		console.log("Size: " + size);
		canvas.width = size;
		canvas.height = size;
		endX = size - startX;
		endY = endX;

		if(image) {
			ctx.globalAlpha = opacity;
			imageStats["width"] -= (oldSize - size);
			imageStats["height"] -= (oldSize - size);
			ctx.drawImage(image, imageStats["sx"], imageStats["sy"], imageStats["swidth"], imageStats["sheight"], imageStats["x"], imageStats["y"], imageStats["width"], imageStats["height"]);
			ctx.globalAlpha = 1.0;
		}

		// make the 2D array with all of the data.
		data = [];
		for(let row = 0; row < gridSize; row++) {
			data.push([]);
			for(let col = 0; col < gridSize; col++) {
				pixel = qrCodeCTX.getImageData(startX + col * inc, startY + row * inc, 1, 1);
				if(pixel.data[0] != 0 && pixel.data[1] != 0 && pixel.data[2] != 0) { // if not black pixel
					data[row].push(0);
				} else data[row].push(1);
			}
		}
		qrCodeReady = true;
		console.log("QR CODE READY");
		drawQRCode();
		return;
	}
}


function drawQRCode() {
	if(!qrCodeReady) {
		console.log("Upload a url first!")
		return;
	}
	canvas.style = "border: 1px solid black; background-color: " + colors["bg"] + "; margin: 20px;";
	ctx.clearRect(0, 0, size, size);
	ctx.globalAlpha = opacity;
	ctx.drawImage(image, imageStats["sx"], imageStats["sy"], imageStats["swidth"], imageStats["sheight"], imageStats["x"], imageStats["y"], imageStats["width"], imageStats["height"]);
	ctx.globalAlpha = 1.0;
	// DRAW QR CODE
	ctx.fillStyle = colors["primary"];
	// top left eye
	ctx.fillRect(startX - inc/2, startY - inc/2, inc*7, inc); // top
	ctx.fillRect(startX - inc/2, startY - inc/2, inc, inc*7); // left

	ctx.fillRect(startX - inc/2, startY - inc/2 + inc*6, inc*7, inc); // bottom
	ctx.fillRect(startX - inc/2 + inc*6, startY - inc/2, inc, inc*7); // right

	ctx.fillRect(startX - inc/2 + inc*2, startY - inc/2 + inc*2, inc*3, inc*3); // pupil

	// top right eye
	ctx.fillRect(endX - inc * 6.5, startY - inc * 0.5, inc * 7, inc); // top
	ctx.fillRect(endX - inc * 6.5, startY - inc * 0.5, inc, inc * 7); // left

	ctx.fillRect(endX - inc * 6.5, startY + inc * 5.5, inc*7, inc); // bottom
	ctx.fillRect(endX - inc * 0.5, startY - inc * 0.5, inc, inc*7); // right

	ctx.fillRect(endX - inc*4.5, startY + 1.5*inc, inc*3, inc*3); // pupil

	// bottom left eye
	ctx.fillRect(startX - inc * 0.5, endY - inc*6.5, inc*7, inc); // top
	ctx.fillRect(startX - inc * 0.5, endY - inc*6.5, inc, inc*7); // left

	ctx.fillRect(startX - inc/2, endY-inc*0.5, inc*6.5, inc); // bottom
	ctx.fillRect(startX - inc/2 + inc * 6, endY-inc*6.5, inc, inc*7); // right

	ctx.fillRect(startX - inc/2 + inc*2, endY - inc*4.5, inc*3, inc*3); // pupil

	// bottom right eye

	ctx.fillRect(endX - 8*inc - dotSize - 1, endY - 8*inc - dotSize - 1, inc*4+dotSize*2+2, dotSize*2+2); // top
	ctx.fillRect(endX-inc*8-dotSize-1, endY-inc*8 - dotSize - 1, dotSize*2+2, inc*4+dotSize*2+2); // left

	ctx.fillRect(endX-inc*8-dotSize-1, endY-inc*4-dotSize-1, inc*4+dotSize*2+2, dotSize*2+2); // bottom
	ctx.fillRect(endX-inc*4-dotSize-1, endY-inc*8-dotSize-1, dotSize*2+2, inc*4+dotSize*2+2); // right

	ctx.fillRect(endX-inc*6-dotSize-1, endY-inc*6-dotSize-1, dotSize*2+2, dotSize*2+2); // pupil

	// dots
	let col = 0;
	let maxCol = gridSize;
	for(let row = 0; row < gridSize; row++) {
		if(row < 8) {
			col = 8;
			maxCol = gridSize-8;
		} else if(row > gridSize-9) {
			col = 8;
			maxCol = gridSize;
		} else {
			col = 0;
			maxCol = gridSize;
		}
		for(; col < maxCol; col++) {
			if(data[row][col]) 
				drawCircle(startX+inc*col, startY+inc*row, colors["primary"]);
			else 
				drawCircle(startX+inc*col, startY+inc*row, colors["secondary"]);
		}
	}
	qrCodeCreated = true;
	return;
}

function drawCircle(x, y, color) {
	ctx.beginPath();
	ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
	ctx.fillStyle = color;
	ctx.fill();
	ctx.strokeStyle = color;
	ctx.stroke();
}

// MAKE SURE TO ONCHANGE AND IMAGE SLIDERS.s
const numberLeftX = document.getElementById("numberLeftX");
const numberRightX = document.getElementById("numberRightX");
const numberTopY = document.getElementById("numberTopY");
const numberBotY = document.getElementById("numberBotY");
const numberXOff = document.getElementById("numberXOff");
const numberYOff = document.getElementById("numberYOff");

const sliderLeftX = document.getElementById("sliderLeftX");
const sliderRightX = document.getElementById("sliderRightX");
const sliderTopY = document.getElementById("sliderTopY");
const sliderBotY = document.getElementById("sliderBotY");
const sliderXOff = document.getElementById("sliderXOff");
const sliderYOff = document.getElementById("sliderYOff");

const numberOpacity = document.getElementById("numberOpacity");
const sliderOpacity = document.getElementById("sliderOpacity");
const numberDotSize = document.getElementById("numberDotSize");
const sliderDotSize = document.getElementById("sliderDotSize");

const primaryColorInput = document.getElementById("primaryColor");
const secondaryColorInput = document.getElementById("secondaryColor");
const bgColorInput = document.getElementById("bgColor");

var input = document.getElementById("input");
input.onchange = function() {
	ctx.clearRect(0, 0, size, size);
	if(FileReader) {
		let reader = new FileReader();
		image = new Image();
		image.crossOrigin = "anonymous";
		reader.readAsDataURL(input.files[0]);
		reader.onload = function(e) {
			image.src= e.target.result;
			image.onload = function() {
				imageStats.maxWidth = image.width;
				imageStats.maxHeight = image.height;

				// set max for crops
				numberLeftX.max = imageStats.maxWidth+"";
				numberRightX.max = imageStats.maxWidth+"";
				numberTopY.max = imageStats.maxHeight+"";
				numberBotY.max = imageStats.maxHeight+"";
				sliderLeftX.max = imageStats.maxWidth+"";
				sliderRightX.max = imageStats.maxWidth+"";
				sliderTopY.max = imageStats.maxHeight+"";
				sliderBotY.max = imageStats.maxHeight+"";
				// set values to default
				numberLeftX.value = 0;
				numberRightX.value = imageStats.maxWidth+"";
				numberTopY.value = 0;
				numberBotY.value = imageStats.maxHeight+"";
				sliderLeftX.value = 0;
				sliderRightX.value = imageStats.maxWidth+"";
				sliderTopY.value = 0;
				sliderBotY.value = imageStats.maxHeight+"";

				// set max for slider / min for offsets
				numberXOff.max = size+"";
				numberYOff.max = size+"";
				numberXOff.min = "-"+size;
				numberYOff.min = "-"+size;
				sliderXOff.max = size+"";
				sliderYOff.max = size+"";
				sliderXOff.min = "-"+size;
				sliderYOff.min = "-"+size;
				// set values to default
				numberXOff.value = 0;
				numberYOff.value = 0;
				sliderXOff.value = 0;
				sliderYOff.value = 0;

				imageStats["sx"] = 0;
				imageStats["sy"] = 0;

				imageStats["swidth"] = image.width;
				imageStats["sheight"] = image.height;

				imageStats["x"] = 0;
				imageStats["y"] = 0;

				imageStats["width"] = size;
				imageStats["height"] = size;

				opacity = 1.0;
				numberOpacity.value = 1.0;
				sliderOpacity.value = 1.0;

				ctx.globalAlpha = opacity;
				ctx.drawImage(image, imageStats["sx"], imageStats["sy"], imageStats["swidth"], imageStats["sheight"], imageStats["x"], imageStats["y"], imageStats["width"], imageStats["height"]);
			}
		}
	} else {
		console.log("Your browser does not support this.");
		return;
	}
}


// TODO RESET BUTTONS AND SCALE TO FIT BUTTON!!

// context.drawImage(img, sx, sy, swidth, sheight, x, y, width, height);
function updateImageAndInputs(elem, counterpart, stat) {
	if(elem.value == '') elem.value = 0;
	let difference = Number(elem.value) - Number(counterpart.value);
	counterpart.value = elem.value;
	if(image) {
		// if left or top, need to change the max swidth / sheight.
		if(stat == "sx") {
			imageStats["swidth"] -= difference;
			numberRightX.value = imageStats["swidth"];
			sliderRightX.value = imageStats["swidth"];
			numberRightX.max -= difference;
			sliderRightX.max -= difference;
		} else if (stat == "swidth") {
			imageStats["width"] -= difference;
			
		} else if(stat == "sy") {
			imageStats["sheight"] -= difference;
			numberBotY.value = imageStats["sheight"];
			sliderBotY.value = imageStats["sheight"];
			numberBotY.max -= difference;
			sliderBotY.max -= difference;
		} else if (stat == "sheight") {
			imageStats["height"] -= difference;
		}
		imageStats[stat] = elem.value;
		if(qrCodeCreated) drawQRCode();
		else {
			ctx.clearRect(0, 0, size, size);
			ctx.globalAlpha = opacity;
			ctx.drawImage(image, imageStats["sx"], imageStats["sy"], imageStats["swidth"], imageStats["sheight"], imageStats["x"], imageStats["y"], imageStats["width"], imageStats["height"]);
			ctx.globalAlpha = 1.0;
		}
	}
}

numberLeftX.oninput = () => {updateImageAndInputs(numberLeftX, sliderLeftX, "sx") };
numberRightX.oninput = () => {updateImageAndInputs(numberRightX, sliderRightX, "swidth") };
numberTopY.oninput = () => {updateImageAndInputs(numberTopY, sliderTopY, "sy") };
numberBotY.oninput = () => {updateImageAndInputs(numberBotY, sliderBotY, "sheight") };
numberXOff.oninput = () => {updateImageAndInputs(numberXOff, sliderXOff, "x") };
numberYOff.oninput = () => {updateImageAndInputs(numberYOff, sliderYOff, "y") };

sliderLeftX.oninput = () => {updateImageAndInputs(sliderLeftX, numberLeftX, "sx") };
sliderRightX.oninput = () => {updateImageAndInputs(sliderRightX, numberRightX, "swidth") };
sliderTopY.oninput = () => {updateImageAndInputs(sliderTopY, numberTopY, "sy") };
sliderBotY.oninput = () => {updateImageAndInputs(sliderBotY, numberBotY, "sheight") };
sliderXOff.oninput = () => {updateImageAndInputs(sliderXOff, numberXOff, "x") };
sliderYOff.oninput = () => {updateImageAndInputs(sliderYOff, numberYOff, "y") };

function updateDotSize(elem, counterpart) {
	if(elem.value == '') elem.value = 0;
	counterpart.value = elem.value;
	dotSize = Number(elem.value);
	if(qrCodeCreated) drawQRCode(); 
}

numberDotSize.oninput = () => { updateDotSize(numberDotSize, sliderDotSize) }
sliderDotSize.oninput = () => { updateDotSize(sliderDotSize, numberDotSize) }

function updateColors(elem, value) {
	colors[value] = elem.value;
	if(value == "bg") {
		canvas.style = "border: 1px solid black; background-color: " + colors["bg"] + "; margin: 20px;";
	}
	if(qrCodeCreated) drawQRCode(); 
}

primaryColorInput.oninput = () => { updateColors(primaryColorInput, "primary") };
secondaryColorInput.oninput = () => { updateColors(secondaryColorInput, "secondary") };
bgColorInput.oninput = () => { updateColors(bgColorInput, "bg") };

function updateOpacity(elem, counterpart) {
	counterpart.value = elem.value;
	opacity = elem.value;
	if(qrCodeCreated) {
		console.log(opacity);
		drawQRCode();
	} else if(image) {
		ctx.clearRect(0, 0, size, size);
		ctx.globalAlpha = opacity;
		ctx.drawImage(image, imageStats["sx"], imageStats["sy"], imageStats["swidth"], imageStats["sheight"], imageStats["x"], imageStats["y"], imageStats["width"], imageStats["height"]);
		ctx.globalAlpha = 1.0;
	}
}

numberOpacity.oninput = () => { updateOpacity(numberOpacity, sliderOpacity) };
sliderOpacity.oninput = () => { updateOpacity(sliderOpacity, numberOpacity) };