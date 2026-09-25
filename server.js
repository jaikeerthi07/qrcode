const express = require('express');
const localtunnel = require('localtunnel');
const qrcode = require('qrcode');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, async () => {
    console.log(`Server is running locally at http://localhost:${PORT}`);

    try {
        const tunnel = await localtunnel({ port: PORT });
        console.log(`Localtunnel created. Public URL: ${tunnel.url}`);

        // Generate QR code and save to root folder
        const qrPath = path.join(__dirname, 'qrcode.png');
        await qrcode.toFile(qrPath, tunnel.url, {
            color: {
                dark: '#000000',
                light: '#FFFFFF'
            },
            width: 400
        });
        console.log(`\n======================================================`);
        console.log(`✅ QR code successfully generated and saved at ${qrPath}`);
        console.log(`📱 Please open qrcode.png on your monitor and scan it with a mobile device.`);
        console.log(`======================================================\n`);

        tunnel.on('close', () => {
            console.log('Tunnel closed');
        });
    } catch (err) {
        console.error("Error creating tunnel or QR code:", err);
    }
});
