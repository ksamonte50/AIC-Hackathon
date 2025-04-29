import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");

    // Set up responsive container styles
    const style = document.createElement('style');
    style.textContent = `
        .qr-container {
            max-width: 100%;
            overflow: auto;
            padding: 10px;
            box-sizing: border-box;
        }
        .qr-image {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
        }
        .qr-details {
            margin-top: 10px;
            font-size: 14px;
            word-break: break-word;
        }
        .error {
            color: #d32f2f;
            padding: 10px;
        }
        .loading {
            padding: 10px;
            text-align: center;
        }
    `;
    document.head.appendChild(style);

// ------------------------------------------------------------ CUSTOM QR CODE ------------------------------------------------------------

    async function generateResponse() {
        const url = document.getElementById('qrCodeURL').value;
        const aesthetic = document.getElementById('qrAesthetic').value;

        if (!url) {
            document.getElementById('result').innerHTML = `
                <div class="error">Please enter a valid URL first</div>
            `;
            return;
        }

        // Show loading state
        document.getElementById('result').innerHTML = `
            <div class="loading">Generating QR code...</div>
        `;

        try {
            const requestBody = { 
                url, 
                aesthetic: aesthetic || "black dots on white background" 
            };
            console.log('Sending request:', requestBody);

            const response = await fetch('http://localhost:5001/generate-qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody)
            });

            const data = await response.json();
            console.log('Received response:', { 
                success: data.success, 
                style: data.style,
                error: data.error 
            });

            if (!response.ok || !data.success) {
                throw new Error(data.error || "QR generation failed");
            }

            // Display the QR code with proper sizing
            document.getElementById('result').innerHTML = `
                <div class="qr-container">
                    <h3>Generated QR Code</h3>
                    <img src="data:image/png;base64,${data.qrImage}" 
                        alt="Generated QR Code"
                        class="qr-image">
                    <div style="margin-top: 15px;">
                        <button class="spectrum-Button spectrum-Button--cta" id="addToDocumentButton">
                            <span class="spectrum-Button-label">Add to Document</span>
                        </button>
                    </div>
                </div>
            `;

            // Add click handler for the new button
            document.getElementById('addToDocumentButton').addEventListener('click', async () => {
                try {
                    // Convert base64 to Blob
                    const base64Data = data.qrImage.replace(/^data:image\/png;base64,/, '');
                    const byteCharacters = atob(base64Data);
                    const byteNumbers = new Array(byteCharacters.length);
                    
                    for (let i = 0; i < byteCharacters.length; i++) {
                        byteNumbers[i] = byteCharacters.charCodeAt(i);
                    }
                    
                    const byteArray = new Uint8Array(byteNumbers);
                    const blob = new Blob([byteArray], { type: 'image/png' });
                    
                    // Create MediaAttributes object
                    const mediaAttributes = {
                        title: `QR Code for ${url}`,
                        author: "QR Code Generator Add-on"
                    };
                    
                    // Insert the image into the document
                    await addOnUISdk.app.document.addImage(blob, mediaAttributes);
                    
                    // Show success message
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'success-message';
                    messageDiv.textContent = 'QR code added to document!';
                    messageDiv.style.color = '#2d7d4c';
                    messageDiv.style.marginTop = '10px';
                    document.querySelector('.qr-container').appendChild(messageDiv);
                } catch (error) {
                    console.error('Failed to add QR code to document:', error);
                    // Show error message to user
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'error';
                    errorDiv.textContent = 'Failed to add QR code to document. Please try again.';
                    document.querySelector('.qr-container').appendChild(errorDiv);
                }
            });

            // Get the add-on container dimensions
            const container = document.querySelector('.qr-container');
            const containerWidth = container.clientWidth;
            
            // Dynamically resize the image if needed
            const img = document.querySelector('.qr-image');
            if (img.naturalWidth > containerWidth) {
                img.style.width = `${containerWidth - 20}px`; // 20px padding
            }

        } catch (error) {
            document.getElementById('result').innerHTML = `
                <div class="error">
                    <p>Failed to generate QR code: ${error.message}</p>
                    <p>Try these formats:</p>
                    <ul>
                        <li>"black dots on white background"</li>
                        <li>"dark blue dots on light gray background"</li>
                        <li>"#14213D dots on #FFF8E8 background"</li>
                    </ul>
                </div>
            `;
        }
    }

    document.getElementById('generateButton').addEventListener('click', function(event) {
        event.preventDefault();
        generateResponse();
    });

    document.getElementById('resetButton').addEventListener('click', function() {
        document.getElementById('qrCodeURL').value = '';
        document.getElementById('qrAesthetic').value = '';
        document.getElementById('result').innerHTML = '';
    });

    async function qrCodeOnImage() {
        const url = document.getElementById('qrCodeURL-img').value;
        
        if (!url) {
            document.getElementById('result').innerHTML = `
                <div class="error">Please enter a valid URL first</div>
            `;
            return null;
        }

        // Show loading state
        document.getElementById('result').innerHTML = `
            <div class="loading">Generating QR code...</div>
        `;

        try {
            const response = await fetch('http://localhost:5001/generate-qr-on-img', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();
            console.log('Received response:', { success: data.success, error: data.error });

            if (!response.ok || !data.success) {
                throw new Error(data.error || "QR generation failed");
            }

            // Display the QR code with proper sizing
            // document.getElementById('result').innerHTML = `
            //     <div class="qr-container">
            //         <h3>Generated QR Code on Image</h3>
            //         <img src="data:image/png;base64,${data.qrImage}" 
            //             alt="Generated QR Code on Image"
            //             class="qr-image">
            //     </div>
            // `;

            // Get the add-on container dimensions and resize if needed
            // const container = document.querySelector('.qr-container');
            // const containerWidth = container.clientWidth;
            // const img = container.querySelector('.qr-image');
            // if (img.naturalWidth > containerWidth) {
            //     img.style.width = `${containerWidth - 20}px`; // 20px padding
            // }
            return data.qrImage;
        } catch (error) {
            document.getElementById('result').innerHTML = `
                <div class="error">
                    Failed to generate QR code: ${error.message}
                </div>
            `;
            console.error('Error generating QR code:', error);
            return null;
        }
    }

    document.getElementById('generateButton-img').addEventListener('click', function(event) {
        event.preventDefault();
        qrCodeOnImage();
    });

    document.getElementById('resetButton-img').addEventListener('click', function() {
        document.getElementById('qrCodeURL-img').value = '';
        document.getElementById('result').innerHTML = '';
    });

    // ------------------------------------------------------------ QR CODE ON IMAGE CODE ------------------------------------------------------------
    const canvas = document.getElementById("frame");
    const ctx = canvas.getContext("2d");
    //<canvas id="qrCodeCanvas" width="500px" height="500px" style="display: block;"></canvas>
    const qrCodeCanvas = document.createElement("CANVAS");
    const qrSize = 1000
    qrCodeCanvas.width = qrSize;
    qrCodeCanvas.height = qrSize;
    qrCodeCanvas.style.display = "none";
    
    // document.body.appendChild(qrCodeCanvas);

    const qrCodeCTX = qrCodeCanvas.getContext("2d");
    var size = 500;
    var dotSize = document.getElementById("numberDotSize").value;
    var dotType = "circle";
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
        "bg": "#FFFFFF",
    }

    var inc, startX, startY, endX, endY, width, gridSize;
    var qrCodeReady = false;
    var qrCodeCreated = false;
    var eyeOpacity = document.getElementById("numberEyeOpacity").value;
    var opacity = 1.0;
    var qrData = [];

    const drawButton = document.getElementById("draw");

    drawButton.onclick = async function() {
        if(qrCodeCreated) drawQRCode();
        if(!image) {
            console.log("Please upload an image first.");
            return;
        }
        const qrcode = new Image();
        qrcode.crossOrigin = "anonymous";
        let imgData = await qrCodeOnImage();
        if(!imgData) {
            console.log("Something went wrong with the API.");
            return;
        }
        qrcode.src = `data:image/png;base64,${imgData}`;
        qrcode.onload = function() {
            qrCodeCTX.drawImage(qrcode, 0, 0, qrSize, qrSize);
            document.body.appendChild(qrCodeCanvas);
            //console.log(qrcode);
            // find top left corner of top left eye
            let pos = 0;
            let pixel = qrCodeCTX.getImageData(pos, pos, 1, 1);
            
            // find top left pixel
            while(pixel.data[0] != 0 && pixel.data[1] != 0 && pixel.data[2] != 0 && pixel.data[3]) {
                pos++;
                pixel = qrCodeCTX.getImageData(pos, pos, 1, 1);
            }

            console.log("first: " + pixel.data[0] + " " + pixel.data[1] + " " + pixel.data[2] + " " + pixel.data[3]);

            // measure how big the eye is
            let x = pos;
            // let testPosY = pos;
            // let testPosX = pos;
            // let testPixel;
            // do {
            //     testPosY--;
            //     testPixel = qrCodeCTX.getImageData(x, testPosY, 1, 1); 
            // } while (testPixel.data[0] == 255 && testPixel.data[1] == 255 && testPixel.data[2] == 255);

            // do {
            //     testPosX--;
            //     testPixel = qrCodeCTX.getImageData(testPosX, pos, 1, 1); 
            // } while (testPixel.data[0] == 255 && testPixel.data[1] == 255 && testPixel.data[2] == 255);

            // console.log("X: " + x + "; Y: " + pos);
            // console.log("X: " + testPosX + 1 + "; Y: " + testPosY + 1);





            while(pixel.data[0] != 255 && pixel.data[1] != 255 && pixel.data[2] != 255) { // ONLY WORKS FOR BLACK QR CODES
                x++;
                pixel = qrCodeCTX.getImageData(x, pos, 1, 1);
            }

            // console.log("last: " + pixel.data[0] + " " + pixel.data[1] + " " + pixel.data[2] + " " + pixel.data[3]);
            

            // make all constants using found values
            // we know that all eyes are 7 dots wide.
            inc = (x-pos) / 7.0;

            // the starting position is the "middle of the first dot", which is actually
            // just the top left corner of the eye. however, it should be centered where
            // the dot's center is meant to be.

            startX = pos+inc/2;
            startY = pos+inc/2;

            


            // we need to find how big the grid is. we know that all QR codes we recieve
            // from QRcode monkey will have the same size of 1000px. We can count back
            // from right using the pos to find the top right of the top right eye.

            endX = qrSize - pos;
            width = endX-startX;
            gridSize = Math.floor(width / inc)+1; //36

            endX -= inc/2;
            endY = endX;

            // make the 2D array with all of the data.
            qrData = [];
            // do it in quarters to make it more accurate
            let row = 0;
            let col = 0;
            console.log(gridSize);
            let halfGrid = Math.floor(gridSize / 2);

            // top left
            for(row = 0; row < halfGrid; row++) {
                qrData.push([]);
                for(col = 0; col < halfGrid; col++) {
                    pixel = qrCodeCTX.getImageData(startX + col * inc, startY + row * inc, 1, 1);
                    if(pixel.data[0] != 0 && pixel.data[1] != 0 && pixel.data[2] != 0) { // if not black pixel
                        qrData[row].push(0);
                    } else qrData[row].push(1);
                    qrCodeCTX.fillStyle = "red";
                    qrCodeCTX.fillRect(startX + col * inc, startY + row * inc, 4, 4);
                }
            }

            // top right
            for(row = 0; row < halfGrid; row++) {

                for(col = halfGrid; col < gridSize; col++) {
                    pixel = qrCodeCTX.getImageData(endX - (gridSize - col - 1) * inc, startY + row * inc, 1, 1);
                    if(pixel.data[0] != 0 && pixel.data[1] != 0 && pixel.data[2] != 0) { // if not black pixel
                        qrData[row].push(0);
                    } else qrData[row].push(1);
                    qrCodeCTX.fillStyle = "green";
                    qrCodeCTX.fillRect(endX - (gridSize - col - 1) * inc, startY + row * inc, 4, 4);
                }
            }

            // bottom left
            for(row = halfGrid; row < gridSize; row++) {
                qrData.push([]);
                for(col = 0; col < halfGrid; col++) {
                    pixel = qrCodeCTX.getImageData(startX + col * inc, endY - (gridSize - row - 1) * inc, 1, 1);
                    if(pixel.data[0] != 0 && pixel.data[1] != 0 && pixel.data[2] != 0) { // if not black pixel
                        qrData[row].push(0);
                    } else qrData[row].push(1);
                    qrCodeCTX.fillStyle = "orange";
                    qrCodeCTX.fillRect(startX + col * inc, endY - (gridSize - row - 1) * inc, 4, 4);
                }
            }

            // bottom right
            for(row = halfGrid; row < gridSize; row++) {
                for(col = halfGrid; col < gridSize; col++) {
                    pixel = qrCodeCTX.getImageData(endX - (gridSize - col - 1) * inc, endY - (gridSize - row - 1) * inc, 1, 1);
                    if(pixel.data[0] != 0 && pixel.data[1] != 0 && pixel.data[2] != 0) { // if not black pixel
                        qrData[row].push(0);
                    } else qrData[row].push(1);
                    qrCodeCTX.fillStyle = "cyan";
                    qrCodeCTX.fillRect(endX - (gridSize - col - 1) * inc, endY - (gridSize - row - 1) * inc, 4, 4);
                }
            }

            inc = Math.round(inc / 2);
            let oldSize = size;
            startX /= 2;
            startY = startX;

            size = Math.round(startX * 2) + inc * (gridSize-1);

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
            qrCodeReady = true;
            console.log("QR CODE READY");
            console.log(qrData);
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
        ctx.fillStyle = colors["bg"];
        ctx.fillRect(0, 0, size, size);
        ctx.globalAlpha = opacity;
        ctx.drawImage(image, imageStats["sx"], imageStats["sy"], imageStats["swidth"], imageStats["sheight"], imageStats["x"], imageStats["y"], imageStats["width"], imageStats["height"]);
        ctx.globalAlpha = 1.0;
        // DRAW QR CODE

        // top left eye
        ctx.fillStyle = colors["secondary"];
        ctx.globalAlpha = eyeOpacity;
        ctx.fillRect(startX - inc/2 + inc*-1, startY - inc/2 + inc*-1, inc*9, inc*9); // pupil secondary
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors["primary"];

        ctx.fillRect(startX - inc/2, startY - inc/2, inc*7, inc); // top
        ctx.fillRect(startX - inc/2, startY - inc/2, inc, inc*7); // left

        ctx.fillRect(startX - inc/2, startY - inc/2 + inc*6, inc*7, inc); // bottom
        ctx.fillRect(startX - inc/2 + inc*6, startY - inc/2, inc, inc*7); // right
        
        ctx.fillRect(startX - inc/2 + inc*2, startY - inc/2 + inc*2, inc*3, inc*3); // pupil primary

        // top right eye
        ctx.fillStyle = colors["secondary"];
        ctx.globalAlpha = eyeOpacity;
        ctx.fillRect(endX - inc*7.5, startY + -1.5*inc, inc*9, inc*9); // pupil secondary
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors["primary"];

        ctx.fillRect(endX - inc * 6.5, startY - inc * 0.5, inc * 7, inc); // top
        ctx.fillRect(endX - inc * 6.5, startY - inc * 0.5, inc, inc * 7); // left

        ctx.fillRect(endX - inc * 6.5, startY + inc * 5.5, inc*7, inc); // bottom
        ctx.fillRect(endX - inc * 0.5, startY - inc * 0.5, inc, inc*7); // right

        ctx.fillRect(endX - inc*4.5, startY + 1.5*inc, inc*3, inc*3); // pupil primary

        // bottom left eye
        ctx.fillStyle = colors["secondary"];
        ctx.globalAlpha = eyeOpacity;
        ctx.fillRect(startX - inc*1.5, endY - inc*7.5, inc*9, inc*9); // pupil secondary
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors["primary"];

        ctx.fillRect(startX - inc * 0.5, endY - inc*6.5, inc*7, inc); // top
        ctx.fillRect(startX - inc * 0.5, endY - inc*6.5, inc, inc*7); // left

        ctx.fillRect(startX - inc/2, endY-inc*0.5, inc*6.5, inc); // bottom
        ctx.fillRect(startX - inc/2 + inc * 6, endY-inc*6.5, inc, inc*7); // right

        ctx.fillRect(startX - inc/2 + inc*2, endY - inc*4.5, inc*3, inc*3); // pupil primary

        // bottom right eye full size!
        ctx.fillStyle = colors["secondary"];
        ctx.globalAlpha = eyeOpacity;
        ctx.fillRect(endX-inc*7.5, endY-inc*7.5, inc*2+inc, inc*2+inc); // pupil
        ctx.globalAlpha = 1;
        ctx.fillStyle = colors["primary"];

        ctx.fillRect(endX - 8.5*inc, endY - 8.5*inc, inc*4+inc, inc); // top
        ctx.fillRect(endX-inc*8.5, endY-inc*8.5, inc, inc*4+inc); // left

        ctx.fillRect(endX-inc*8.5, endY-inc*4.5, inc*4+inc, inc); // bottom
        ctx.fillRect(endX-inc*4.5, endY-inc*8.5, inc, inc*4+inc); // right

        ctx.fillRect(endX-inc*6.5, endY-inc*6.5, inc, inc); // pupil

        // bottom right eye dot sized!
            // ctx.fillRect(endX - 8*inc - dotSize - 1, endY - 8*inc - dotSize - 1, inc*4+dotSize*2+2, dotSize*2+2); // top
            // ctx.fillRect(endX-inc*8-dotSize-1, endY-inc*8 - dotSize - 1, dotSize*2+2, inc*4+dotSize*2+2); // left

            // ctx.fillRect(endX-inc*8-dotSize-1, endY-inc*4-dotSize-1, inc*4+dotSize*2+2, dotSize*2+2); // bottom
            // ctx.fillRect(endX-inc*4-dotSize-1, endY-inc*8-dotSize-1, dotSize*2+2, inc*4+dotSize*2+2); // right

            // ctx.fillStyle = colors["secondary"];
            // ctx.globalAlpha = eyeOpacity;
            // ctx.fillRect(endX-inc*7-dotSize-1, endY-inc*7-dotSize-1, inc*2+dotSize*2+2, inc*2+dotSize*2+2); // pupil
            // ctx.globalAlpha = 1;
            // ctx.fillStyle = colors["primary"];
            // ctx.fillRect(endX-inc*6-dotSize-1, endY-inc*6-dotSize-1, dotSize*2+2, dotSize*2+2); // pupil

        // get dot type
        if(document.getElementById("circle").checked) dotType = "circle";
        else dotType = "square";

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
                let xpos = startX+inc*col;
                let ypos = startY+inc*row;

                if(qrData[row][col]) { // dark
                    drawDot(xpos, ypos, colors["primary"], "square");
                }
                else { // light
                    drawDot(xpos, ypos, colors["secondary"], "square");
                }
            }
        }
        qrCodeCreated = true;
        return;
    }

    function drawDot(x, y, color) {
        if(dotType == "circle"){
            ctx.beginPath();
            ctx.arc(x, y, dotSize, 0, 2 * Math.PI);
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = color;
            ctx.stroke();
        } else if (dotType == "square") {
            ctx.fillStyle = color;
            ctx.fillRect(x - dotSize, y - dotSize, dotSize*2, dotSize*2);
        }
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

    const numberEyeOpacity = document.getElementById("numberEyeOpacity");
    const sliderEyeOpacity = document.getElementById("sliderEyeOpacity");

    var input = document.getElementById("input");
    input.onchange = () => {
        // document.body.style.zoom = "55%";
        ctx.clearRect(0, 0, size, size);
        ctx.fillStyle = colors["bg"];
        ctx.fillRect(0, 0, size, size);
        canvas.style.display = "block";
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
                    return;
                }
            }
        } else {
            console.log("Your browser does not support this.");
            return;
        }
    }




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
                ctx.fillStyle = colors["bg"];
                ctx.fillRect(0, 0, size, size);
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
            ctx.fillStyle = colors["bg"];
            ctx.fillRect(0, 0, size, size);
            ctx.globalAlpha = opacity;
            ctx.drawImage(image, imageStats["sx"], imageStats["sy"], imageStats["swidth"], imageStats["sheight"], imageStats["x"], imageStats["y"], imageStats["width"], imageStats["height"]);
            ctx.globalAlpha = 1.0;
        }
    }

    numberOpacity.oninput = () => { updateOpacity(numberOpacity, sliderOpacity) };
    sliderOpacity.oninput = () => { updateOpacity(sliderOpacity, numberOpacity) };

    function updateEyeOpacity(elem, counterpart) {
        counterpart.value = elem.value;
        eyeOpacity = elem.value;
        if(qrCodeCreated) {
            console.log(opacity);
            drawQRCode();
        } else if(image) {
            ctx.clearRect(0, 0, size, size);
            ctx.fillStyle = colors["bg"];
            ctx.fillRect(0, 0, size, size);
            ctx.globalAlpha = opacity;
            ctx.drawImage(image, imageStats["sx"], imageStats["sy"], imageStats["swidth"], imageStats["sheight"], imageStats["x"], imageStats["y"], imageStats["width"], imageStats["height"]);
            ctx.globalAlpha = 1.0;
        }
    }

    numberEyeOpacity.oninput = () => { updateEyeOpacity(numberEyeOpacity, sliderEyeOpacity) };
    sliderEyeOpacity.oninput = () => { updateEyeOpacity(sliderEyeOpacity, numberEyeOpacity) };

    
    document.getElementById('generateButton-img').addEventListener('click', function(event) {
        event.preventDefault();
        try {
                canvas.toBlob( async (blob) => {
                await addOnUISdk.app.document.addImage(blob);
            })
        } catch (e) {
            console.error("Something went wrong with blobifying", e);
        }
    });

    document.getElementById('resetButton-img').addEventListener('click', function() {
        image = null;
        canvas.style.display = "none";
        qrCodeCTX.clearRect(0, 0, qrSize, qrSize);
        ctx.clearRect(0, 0, qrSize, qrSize);
    });

});
