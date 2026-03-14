const video = document.getElementById("video");
const result = document.getElementById("result");
const canvas = document.getElementById("overlay");

// ✅ Load models from CDN — no need to host model files yourself!
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model";

// START CAMERA
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        await new Promise(resolve => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });

        result.innerText = "✅ Camera ready. Loading models...";
    } catch (err) {
        result.innerText = "❌ Camera permission denied";
        console.error(err);
    }
}

// LOAD MODELS FROM CDN
async function loadModels() {
    result.innerText = "⏳ Loading model 1/3...";
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

    result.innerText = "⏳ Loading model 2/3...";
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

    result.innerText = "⏳ Loading model 3/3...";
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

    result.innerText = "✅ Models loaded!";
}

// LOAD STUDENT FACES
async function loadStudentFaces() {
    const labels = ["yash", "nikhil", "charan"];
    const labeledDescriptors = [];

    const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.3
    });

    for (const label of labels) {
        result.innerText = `⏳ Loading face: ${label}...`;
        try {
            const img = await faceapi.fetchImage(`./students/${label}.jpg`);

            const detection = await faceapi
                .detectSingleFace(img, options)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                console.warn(`⚠️ No face found in ${label}.jpg`);
                continue;
            }

            labeledDescriptors.push(
                new faceapi.LabeledFaceDescriptors(label, [detection.descriptor])
            );
            console.log(`✅ Loaded: ${label}`);

        } catch (err) {
            console.error(`❌ Error loading ${label}.jpg:`, err);
        }
    }

    return labeledDescriptors;
}

// FACE RECOGNITION
async function startRecognition() {
    const labeledDescriptors = await loadStudentFaces();

    if (labeledDescriptors.length === 0) {
        result.innerText = "❌ No reference faces loaded. Check student photos.";
        return;
    }

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

    result.innerText = `✅ System ready (${labeledDescriptors.length} students). Look at the camera.`;

    const displaySize = {
        width: video.videoWidth || video.width,
        height: video.videoHeight || video.height
    };
    faceapi.matchDimensions(canvas, displaySize);

    const detectionOptions = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.3
    });

    setInterval(async () => {
        if (video.readyState < 2 || video.paused) return;

        const size = {
            width: video.videoWidth || video.width,
            height: video.videoHeight || video.height
        };
        faceapi.matchDimensions(canvas, size);

        const detections = await faceapi
            .detectAllFaces(video, detectionOptions)
            .withFaceLandmarks()
            .withFaceDescriptors();

        const resized = faceapi.resizeResults(detections, size);

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections.length === 0) {
            result.innerText = "👀 No face detected";
            return;
        }

        faceapi.draw.drawDetections(canvas, resized);

        const names = detections.map(d => {
            const match = faceMatcher.findBestMatch(d.descriptor);
            return match.label !== "unknown"
                ? `✅ ${match.label} — DCME-B`
                : "❌ Unknown face";
        });

        result.innerText = names.join("  |  ");

    }, 700);
}

// START SYSTEM
async function init() {
    await startCamera();
    await loadModels();
    startRecognition();
}

init();
