const video = document.getElementById('camera-stream');
const arVideo = document.getElementById('ar-video');
const canvasElement = document.getElementById('qr-canvas');
const canvas = canvasElement.getContext('2d');
const loader = document.getElementById('loader');
const container = document.getElementById('container');
const playOverlay = document.getElementById('play-overlay');
const startBtn = document.getElementById('start-btn');

let videoPlaying = false;
let arVideoInit = false;

startBtn.addEventListener('click', () => {
    playOverlay.style.display = 'none';
    arVideo.play().then(() => {
        arVideo.pause(); // Initialize video context for iOS
        arVideoInit = true;
        startCamera();
    }).catch(e => {
        console.error("Video play initial error", e);
        startCamera();
    });
});

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(function (stream) {
        video.srcObject = stream;
        video.setAttribute("playsinline", true); // required to tell iOS safari we don't want fullscreen
        video.play();
        requestAnimationFrame(tick);
        loader.style.display = 'none';
        container.style.display = 'flex';
    }).catch(function (err) {
        alert("Camera error: " + err);
    });
}

function getTransform(src, dst) {
    let A = [];
    let B = [];
    for (let i = 0; i < 4; i++) {
        A.push([src[i].x, src[i].y, 1, 0, 0, 0, -src[i].x * dst[i].x, -src[i].y * dst[i].x]);
        A.push([0, 0, 0, src[i].x, src[i].y, 1, -src[i].x * dst[i].y, -src[i].y * dst[i].y]);
        B.push(dst[i].x);
        B.push(dst[i].y);
    }

    let h;
    try {
        h = numeric.solve(A, B);
    } catch (e) {
        return null;
    }

    return `matrix3d(${h[0]}, ${h[3]}, 0, ${h[6]}, ${h[1]}, ${h[4]}, 0, ${h[7]}, 0, 0, 1, 0, ${h[2]}, ${h[5]}, 0, 1)`;
}

function tick() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvasElement.height = video.videoHeight;
        canvasElement.width = video.videoWidth;
        canvas.drawImage(video, 0, 0, canvasElement.width, canvasElement.height);

        var imageData = canvas.getImageData(0, 0, canvasElement.width, canvasElement.height);
        var code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            if (!videoPlaying) {
                arVideo.play();
                arVideo.style.display = 'block';
                videoPlaying = true;
            }

            const w = arVideo.videoWidth || 640;
            const h = arVideo.videoHeight || 480;

            arVideo.style.width = w + 'px';
            arVideo.style.height = h + 'px';

            const srcPoints = [
                { x: 0, y: 0 },
                { x: w, y: 0 },
                { x: w, y: h },
                { x: 0, y: h }
            ];

            const videoRatio = video.videoWidth / video.videoHeight;
            const screenRatio = window.innerWidth / window.innerHeight;

            let scale, offsetX = 0, offsetY = 0;

            if (screenRatio > videoRatio) {
                scale = window.innerWidth / video.videoWidth;
                offsetY = (window.innerHeight - video.videoHeight * scale) / 2;
            } else {
                scale = window.innerHeight / video.videoHeight;
                offsetX = (window.innerWidth - video.videoWidth * scale) / 2;
            }

            const dstPoints = [
                { x: code.location.topLeftCorner.x * scale + offsetX, y: code.location.topLeftCorner.y * scale + offsetY },
                { x: code.location.topRightCorner.x * scale + offsetX, y: code.location.topRightCorner.y * scale + offsetY },
                { x: code.location.bottomRightCorner.x * scale + offsetX, y: code.location.bottomRightCorner.y * scale + offsetY },
                { x: code.location.bottomLeftCorner.x * scale + offsetX, y: code.location.bottomLeftCorner.y * scale + offsetY }
            ];

            const transform = getTransform(srcPoints, dstPoints);
            if (transform) {
                arVideo.style.transform = transform;
            }
        } else {
            // Optional: Pause video if QR code is lost, or just keep playing it at last pos
            // We'll just keep it playing but fade it slightly or do nothing
        }
    }
    requestAnimationFrame(tick);
}
