const video = document.getElementById("video");
const result = document.getElementById("result");

// START CAMERA
navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    video.srcObject = stream;
})
.catch(() => {
    result.innerText = "Camera permission denied";
});

// LOAD MODELS
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("Models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("Models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("Models")
]).then(startRecognition);

async function startRecognition() {

    result.innerText = "Loading student faces...";

    const labels = ["yash","nikhil","charan"];
    const labeledDescriptors = [];

    for (const label of labels) {

        const img = await faceapi.fetchImage(`students/${label}.jpg`);

        const detection = await faceapi
        .detectSingleFace(img)
        .withFaceLandmarks()
        .withFaceDescriptor();

        if (!detection) {
            console.log("No face found in", label);
            continue;
        }

        labeledDescriptors.push(
            new faceapi.LabeledFaceDescriptors(label,[detection.descriptor])
        );
    }

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors,0.6);

    result.innerText = "System ready. Look at the camera.";

    setInterval(async () => {

        const detections = await faceapi
        .detectAllFaces(video,new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

        if(detections.length>0){

            const match = faceMatcher.findBestMatch(detections[0].descriptor);

            if(match.label !== "unknown"){
                result.innerText = "✅ "+match.label+" belongs to DCME-B";
            }else{
                result.innerText = "❌ Face not recognised";
            }

        }else{
            result.innerText = "👀 No face detected";
        }

    },1000);
}
