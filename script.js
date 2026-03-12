const video = document.getElementById("video");
const result = document.getElementById("result");

// START CAMERA
navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    video.srcObject = stream;
    result.innerText = "Camera active. Loading models...";
})
.catch(() => {
    result.innerText = "Camera permission denied.";
});

// LOAD MODELS FROM CDN (fixes GitHub Pages issue)
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model';

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
]).then(() => {
    result.innerText = "Models loaded. Loading student faces...";
    startRecognition();
}).catch((err) => {
    console.error("Model loading failed:", err);
    result.innerText = "Failed to load models.";
});

async function startRecognition() {

    const labels = ['yash', 'nikhil', 'charan'];
    const labeledDescriptors = [];

    for (const label of labels) {
        try {
            const img = await faceapi.fetchImage(`students/${label}.jpg`);
            const detection = await faceapi
                .detectSingleFace(img)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                console.warn(`No face found for: ${label}`);
                continue;
            }

            labeledDescriptors.push(
                new faceapi.LabeledFaceDescriptors(label, [detection.descriptor])
            );
            console.log(`✅ Loaded: ${label}`);

        } catch (err) {
            console.error(`Error loading ${label}:`, err);
        }
    }

    if (labeledDescriptors.length === 0) {
        result.innerText = "No student faces loaded. Check students folder.";
        return;
    }

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
    result.innerText = "Ready! Point your face at the camera...";

    setInterval(async () => {
        if (video.readyState < 2) return;

        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        if (detections.length > 0) {
            const match = faceMatcher.findBestMatch(detections[0].descriptor);
            if (match.label !== "unknown") {
                result.innerText = `✅ ${match.label} belongs to DCME-B`;
            } else {
                result.innerText = "❌ Face not recognised";
            }
        } else {
            result.innerText = "👀 No face detected - look at the camera";
        }

    }, 1000);
}
