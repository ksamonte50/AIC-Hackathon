import addOnUISdk from "https://new.express.adobe.com/static/add-on-sdk/sdk.js";

addOnUISdk.ready.then(async () => {
    console.log("addOnUISdk is ready for use.");

    const { runtime } = addOnUISdk.instance;
    const sandboxProxy = await runtime.apiProxy("documentSandbox");

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
                </div>
            `;

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
});