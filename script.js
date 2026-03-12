const video = document.getElementById("video")
const result = document.getElementById("result")

// START CAMERA
navigator.mediaDevices.getUserMedia({ video: true })
.then(stream => {
video.srcObject = stream
result.innerText = "Camera active. Loading models..."
})
.catch(() => {
result.innerText = "Camera permission denied"
})

// MODEL CDN
const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/model"

// LOAD MODELS
Promise.all([
faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
]).then(startRecognition)

async function startRecognition(){

result.innerText = "Models loaded. Loading student faces..."

const labels = ['yash','nikhil','charan']
const labeledDescriptors = []

for(const label of labels){

const img = await faceapi.fetchImage(`students/${label}.jpg`)

const detection = await faceapi
.detectSingleFace(img)
.withFaceLandmarks()
.withFaceDescriptor()

if(detection){

labeledDescriptors.push(
new faceapi.LabeledFaceDescriptors(label,[detection.descriptor])
)

}

}

if(labeledDescriptors.length === 0){
result.innerText = "No student faces found"
return
}

const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors,0.6)

result.innerText = "Ready! Look at the camera"

setInterval(async ()=>{

if(video.readyState < 2) return

const detections = await faceapi
.detectAllFaces(video,new faceapi.TinyFaceDetectorOptions())
.withFaceLandmarks()
.withFaceDescriptors()

if(detections.length > 0){

const match = faceMatcher.findBestMatch(detections[0].descriptor)

if(match.label !== "unknown"){
result.innerText = "✅ " + match.label + " belongs to DCME-B"
}else{
result.innerText = "❌ Face not recognised"
}

}else{

result.innerText = "No face detected"

}

},1000)

}
