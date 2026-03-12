const video = document.getElementById("video")
const result = document.getElementById("result")

navigator.mediaDevices.getUserMedia({video:true})
.then(stream=>{
video.srcObject=stream
result.innerText="Camera active. Loading models..."
})

Promise.all([
faceapi.nets.tinyFaceDetector.loadFromUri('Models'),
faceapi.nets.faceLandmark68Net.loadFromUri('Models'),
faceapi.nets.faceRecognitionNet.loadFromUri('Models')
]).then(start)

async function start(){

result.innerText="Models loaded. Loading student faces..."

const labels=['yash','nikhil','charan']
const descriptors=[]

for(const label of labels){

const img=await faceapi.fetchImage(`students/${label}.jpg`)

const detection=await faceapi
.detectSingleFace(img)
.withFaceLandmarks()
.withFaceDescriptor()

descriptors.push(
new faceapi.LabeledFaceDescriptors(label,[detection.descriptor])
)

}

const matcher=new faceapi.FaceMatcher(descriptors)

result.innerText="Ready! Look at camera"

setInterval(async()=>{

const detections=await faceapi
.detectAllFaces(video,new faceapi.TinyFaceDetectorOptions())
.withFaceLandmarks()
.withFaceDescriptors()

if(detections.length>0){

const match=matcher.findBestMatch(detections[0].descriptor)

if(match.label!=="unknown"){
result.innerText=match.label+" belongs to DCME-B"
}else{
result.innerText="Face not recognised"
}

}

},1000)

}
