const fs = require('fs');
const Jimp = require('jimp');
const jsQR = require('jsqr');

async function decodeQR() {
    const buffer = fs.readFileSync('vercel-qrcode.png');
    Jimp.read(buffer, function (err, image) {
        if (err) {
            console.error(err);
            return;
        }
        const qr = jsQR(image.bitmap.data, image.bitmap.width, image.bitmap.height);
        if (qr) {
            console.log("FOUND URL:", qr.data);

            // Now generate a new QR code for this URL
            const qrcode = require('qrcode');
            qrcode.toFile('qrcode.png', qr.data, {
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                },
                width: 400
            }, (err) => {
                if (err) console.error("Error writing QR code:", err);
                else console.log("SUCCESSFULLY UPDATED qrcode.png with the Vercel link!");
            });

        } else {
            console.log("No QR code found in vercel-qrcode.png");
        }
    });
}
decodeQR();
