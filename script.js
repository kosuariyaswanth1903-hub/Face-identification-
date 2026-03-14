const video = document.getElementById("video");
const result = document.getElementById("result");
const canvas = document.getElementById("overlay");

// START CAMERA
async function startCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        video.onloadedmetadata = () => {
            video.play();
        };

        result.innerText = "Camera started. Loading models...";
    } catch (err) {
        result.innerText = "Camera permission denied";
        console.error(err);
    }
}

// LOAD MODELS
async function loadModels() {
    await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri("Models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("Models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("Models")
    ]);

    result.innerText = "Models loaded. Loading student faces...";
}

// LOAD STUDENT FACES
async function loadStudentFaces() {

    const labels = ["yash", "nikhil", "charan"];
    const labeledDescriptors = [];

    for (const label of labels) {
        try {
            const img = await faceapi.fetchImage(`students/${label}.jpg`);

            const detection = await faceapi
                .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (!detection) {
                console.log("No face in", label);
                continue;
            }

            labeledDescriptors.push(
                new faceapi.LabeledFaceDescriptors(label, [detection.descriptor])
            );

        } catch (err) {
            console.log("Error loading", label);
        }
    }

    return labeledDescriptors;
}

// FACE RECOGNITION
async function startRecognition() {

    const labeledDescriptors = await loadStudentFaces();

    if (labeledDescriptors.length === 0) {
        result.innerText = "❌ No reference faces loaded";
        return;
    }

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);

    result.innerText = "System ready. Look at the camera.";

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {

        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        const resized = faceapi.resizeResults(detections, displaySize);

        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (detections.length > 0) {

            faceapi.draw.drawDetections(canvas, resized);

            const match = faceMatcher.findBestMatch(detections[0].descriptor);

            if (match.label !== "unknown") {
                result.innerText = "✅ " + match.label + " belongs to DCME-B";
            } else {
                result.innerText = "❌ Face not recognised";
            }

        } else {
            result.innerText = "👀 No face detected";
        }

    }, 1000);
}

// START SYSTEM
async function init() {
    await startCamera();
    await loadModels();
    startRecognition();
}

init();
