let cv = require('../bin/opencv.js');

let imgElement = document.getElementById('imageSrc');
let inputElement = document.getElementById('fileInput');
inputElement.addEventListener('change', (e) => {
  imgElement.src = URL.createObjectURL(e.target.files[0]);
}, false);
imgElement.onload = function() {
//  let mat = cv.imread(imgElement);
//  cv.imshow('canvasOutput', mat);
//  mat.delete();

  pHoughTransform(imgElement, 0);
  cHoughTransform(imgElement, 254);
};

function pHoughTransform(imgElement, threshold) {
  // Probablilistic Hough Transform
  let src = cv.imread(imgElement);
  let dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
  let lines = new cv.Mat();
  let color = new cv.Scalar(255, 0, 0);
  cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY, 0);
  cv.Canny(src, src, 50, 200, 3);
  // You can try more different parameters
  cv.HoughLinesP(src, lines, 1, Math.PI / 180, 2, threshold, 0);
  // draw lines
  for (let i = 0; i < lines.rows; ++i) {
    let startPoint = new cv.Point(lines.data32S[i * 4], lines.data32S[i * 4 + 1]);
    let endPoint = new cv.Point(lines.data32S[i * 4 + 2], lines.data32S[i * 4 + 3]);
    cv.line(dst, startPoint, endPoint, color);
  }
  cv.imshow('pHoughTransform', dst);
  src.delete(); dst.delete(); lines.delete();
}

function cHoughTransform(imgElement, threshold) {
  let src = cv.imread(imgElement);

  // Convert to grayscale image
  let grayscale = new cv.Mat();
  cv.cvtColor(src, grayscale, cv.COLOR_RGBA2GRAY, 0)
  src.delete();

  // Convert to binary
  let binary = new cv.Mat();
  let low = new cv.Mat(grayscale.rows, grayscale.cols, grayscale.type(), [0, 0, 0, 0]);
  let high = new cv.Mat(grayscale.rows, grayscale.cols, grayscale.type(), [threshold, threshold, threshold, 255]);
  // You can try more different parameters
  cv.inRange(grayscale, low, high, binary);
  grayscale.delete(); low.delete(); high.delete();

  // Circular Hough Transform
  let cht = cv.Mat.zeros(binary.rows, binary.cols, cv.CV_8U);
  let circles = new cv.Mat();
  let color = new cv.Scalar(255, 0, 0);
  // You can try more different parameters
  cv.HoughCircles(binary, circles, cv.HOUGH_GRADIENT,
                1, 45, 75, 40, 0, 0);
  // draw circles
  for (let i = 0; i < circles.cols; ++i) {
    let x = circles.data32F[i * 3];
    let y = circles.data32F[i * 3 + 1];
    let radius = circles.data32F[i * 3 + 2];
    let center = new cv.Point(x, y);
    cv.circle(cht, center, radius, color);
  }
  cv.imshow('cHoughTransform', cht);
  cht.delete(); binary.delete(); circles.delete();
}

function onOpenCvReady() {
  document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
}
function onOpenCvError() {
  let element = document.getElementById('status');
  element.setAttribute('class', 'err');
  element.innerHTML = 'Failed to load opencv.js';
}
