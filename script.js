const video = document.getElementById("video");
const result = document.getElementById("result");

// START CAMERA FIRST
navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    video.srcObject = stream;
    result.innerText = "Camera active. Loading models...";
})
.catch(() => {
    result.innerText = "Camera permission denied. Please allow camera access.";
});

// LOAD FACE API MODELS
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('Models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('Models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('Models')
]).then(() => {
    result.innerText = "Models loaded. Starting recognition...";
    startRecognition();
}).catch(() => {
    result.innerText = "Failed to load models. Check your Models folder.";
});

async function startRecognition() {

    const labels = ['yash', 'nikhil', 'charan'];

    const labeledDescriptors = await Promise.all(
        labels.map(async label => {
            try {
                const img = await faceapi.fetchImage(`students/${label}.jpg`);
                const detections = await faceapi
                    .detectSingleFace(img)
                    .withFaceLandmarks()
                    .withFaceDescriptor();

                if (!detections) {
                    console.warn(`No face found in image for: ${label}`);
                    return null;
                }

                return new faceapi.LabeledFaceDescriptors(label, [detections.descriptor]);
            } catch (err) {
                console.error(`Error loading image for ${label}:`, err);
                return null;
            }
        })
    );

    // Filter out any failed labels
    const validDescriptors = labeledDescriptors.filter(d => d !== null);

    if (validDescriptors.length === 0) {
        result.innerText = "No student faces loaded. Check students folder.";
        return;
    }

    const faceMatcher = new faceapi.FaceMatcher(validDescriptors, 0.6);

    result.innerText = "Ready! Scanning for faces...";

    // FIX: Use setInterval directly instead of waiting for 'play' event
    setInterval(async () => {
        if (video.readyState < 2) return; // Video not ready yet

        const detections = await faceapi
            .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptors();

        if (detections.length > 0) {
            const match = faceMatcher.findBestMatch(detections[0].descriptor);

            if (match.label !== "unknown") {
                result.innerText = match.label + " belongs to DCME-B";
            } else {
                result.innerText = "Face not recognised";
            }
        } else {
            result.innerText = "No face detected";
        }

    }, 1000);
}
