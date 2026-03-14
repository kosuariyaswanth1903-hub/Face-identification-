const video = document.getElementById("video");
const result = document.getElementById("result");

// start camera
navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
    video.srcObject = stream;
})
.catch(() => {
    result.innerText = "Camera permission denied";
});

// load models
Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("Models"),
    faceapi.nets.faceLandmark68Net.loadFromUri("Models"),
    faceapi.nets.faceRecognitionNet.loadFromUri("Models")
]).then(startSystem);

async function startSystem(){

    result.innerText = "Loading student faces...";

    const labels = ["yash","nikhil","charan"];
    const descriptors = [];

    for (const label of labels){

        const img = await faceapi.fetchImage(`students/${label}.jpg`);

        const detection = await faceapi
        .detectSingleFace(img,new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

        if(detection){
            descriptors.push(
                new faceapi.LabeledFaceDescriptors(label,[detection.descriptor])
            );
        }
    }

    const matcher = new faceapi.FaceMatcher(descriptors,0.6);

    result.innerText = "System ready. Look at camera.";

    setInterval(async ()=>{

        const detections = await faceapi
        .detectAllFaces(video,new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

        if(detections.length>0){

            const match = matcher.findBestMatch(detections[0].descriptor);

            if(match.label!=="unknown"){
                result.innerText = "✅ "+match.label+" belongs to DCME-B";
            }else{
                result.innerText = "❌ Face not recognised";
            }

        }else{
            result.innerText = "👀 No face detected";
        }

    },700);
}
