const video = document.getElementById("video");
const result = document.getElementById("result");

async function startVideo() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (err) {
    console.error("Camera error:", err);
    result.innerText = "Camera permission denied";
  }
}

async function loadModels() {
  await faceapi.nets.tinyFaceDetector.loadFromUri("Models");
  await faceapi.nets.faceLandmark68Net.loadFromUri("Models");
  await faceapi.nets.faceRecognitionNet.loadFromUri("Models");
}

async function loadLabeledImages() {
  const labels = ["yash", "charan", "nikhil", "karthik", "chaitanya", "harish"];

  return Promise.all(
    labels.map(async (label) => {
      const img = await faceapi.fetchImage(`students/${label}.jpg`);

      const detection = await faceapi
        .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        console.log("No face detected in", label);
        return null;
      }

      const descriptors = [detection.descriptor];
      return new faceapi.LabeledFaceDescriptors(label, descriptors);
    })
  );
}

async function init() {
  await loadModels();
  startVideo();

  const labeledFaceDescriptors = await loadLabeledImages();
  const validDescriptors = labeledFaceDescriptors.filter(d => d !== null);

  const faceMatcher = new faceapi.FaceMatcher(validDescriptors, 0.6);

  video.addEventListener("play", () => {
    const canvas = faceapi.createCanvasFromMedia(video);
    document.body.append(canvas);

    const displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);

      resizedDetections.forEach(detection => {
        const match = faceMatcher.findBestMatch(detection.descriptor);

        if (match.label !== "unknown") {
          result.innerText = "Belongs to DCME-B";
        } else {
          result.innerText = "Unknown Person";
        }

        const box = detection.detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, { label: match.toString() });
        drawBox.draw(canvas);
      });

    }, 1000);
  });
}

init();