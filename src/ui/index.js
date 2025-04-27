import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");

    const { runtime } = addOnUISdk.instance;
    const sandboxProxy = await runtime.apiProxy("documentSandbox");

    async function generateResponse() {
        const url = document.getElementById('qrCodeURL').value;
        const aesthetic = document.getElementById('qrAesthetic').value;

        console.log('Sending request with:', { url, aesthetic });

        try {
            // Step 1: Send request to our backend
            const response = await fetch('http://localhost:5001/generate-qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ url, aesthetic })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received response from backend:', data);

            // Step 2: Display the QR code directly from base64 data
            if (data.success && data.qrImage) {
                document.getElementById('result').innerHTML = `
                    <h3>Your Custom QR Code:</h3>
                    <img src="data:image/png;base64,${data.qrImage}" 
                        alt="Generated QR Code" 
                        style="max-width: 100%; height: auto;"/>
                    <div class="style-info">
                        <p>Color: ${data.style.color}</p>
                        <p>Background: ${data.style.backgroundColor}</p>
                        <p>Dot Style: ${data.style.dotStyle}</p>
                    </div>
                `;
            } else {
                throw new Error('Invalid response from server');
            }

        } catch (error) {
            console.error('Detailed error:', error);
            document.getElementById('result').innerHTML = `
                <div class="error">
                    Error generating QR code: ${error.message}
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
});