import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");

    // Get the UI runtime.
    const { runtime } = addOnUISdk.instance;

    // Get the proxy object, which is required
    // to call the APIs defined in the Document Sandbox runtime
    const sandboxProxy = await runtime.apiProxy("documentSandbox");

    async function generateResponse() {
        const url = document.getElementById('qrCodeURL').value;
        const aesthetic = document.getElementById('qrAesthetic').value;

        console.log('Sending request with:', { url, aesthetic });

        try {
            const response = await fetch('http://localhost:5001/generate-qr', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    url: url,
                    aesthetic: aesthetic
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Received response:', data);

            document.getElementById('result').innerHTML = `
                <h3>Generated QR Code Style:</h3>
                <pre>${JSON.stringify(data.style, null, 2)}</pre>
            `;
        } catch (error) {
            console.error('Detailed error:', error);
            document.getElementById('result').innerHTML = `Error generating QR code style: ${error.message}`;
        }
    }

    // Set up event listeners
    document.getElementById('generateButton').addEventListener('click', function(event) {
        event.preventDefault();
        generateResponse();
    });

    document.getElementById('resetButton').addEventListener('click', function() {
        document.getElementById('qrCodeURL').value = '';
        document.getElementById('qrAesthetic').value = '';
        document.getElementById('result').innerHTML = '';
    });

    const createRectangleButton = document.getElementById("createRectangle");
    createRectangleButton.addEventListener("click", async event => {
        await sandboxProxy.createRectangle();
    });

    // Enable the button only when:
    // 1. `addOnUISdk` is ready,
    // 2. `sandboxProxy` is available, and
    // 3. `click` event listener is registered.
    createRectangleButton.disabled = false;
});
