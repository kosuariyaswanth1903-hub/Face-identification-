  const video = document.getElementById("video");
const result = document.getElementById("result");
const canvas = document.getElementById("overlay");

// START CAMERA
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        // ✅ FIX: await metadata so videoWidth/videoHeight are ready
        await new Promise(resolve => {
            video.onloadedmetadata = () => {
                video.play();
                resolve();
            };
        });

        result.innerText = "Camera started. Loading models...";
    } catch (err) {
        result.innerText = "❌ Camera permission denied";
        console.error(err);
    }
}

// LOAD MODELS
async function loadModels() {
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("./Models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("./Models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("./Models")
    ]);

    result.innerText = "Models loaded. Loading student faces...";
}

// LOAD STUDENT FACES
async function loadStudentFaces() {
    const labels = ["yash", "nikhil", "charan"];
    const labeledDescriptors = [];

    // ✅ FIX: lower scoreThreshold (0.3) catches faces on lower-quality photos
    const options = new faceapi.TinyFaceDetectorOptions({
        inputSize: 320,
        scoreThreshold: 0.3
    });

    for (const label of labels) {
        try {
            const img = await faceapi.fetchImage(`./students/${label}.jpg`);

            const detection = await faceapi
                .detectSingleFace(img, options)
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                console.warn(`⚠️ No face found in ${label}.jpg — use a clear front-facing photo`);
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

    // ✅ FIX: videoWidth/videoHeight instead of video.width/video.height
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

        // Recalculate each frame in case dimensions loaded late
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
