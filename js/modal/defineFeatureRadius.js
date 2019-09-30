const cv = require('opencv4nodejs');
const ih = require('../../js/modules/image-helpers.js');
const fs = require('fs');
const path = require('path');
const remote = require('electron').remote;

const imgPath = remote.getGlobal('shared').featureRadiusImage;

// Init
remote.getGlobal('shared').featureRadius = 50;
drawCircleAndDisplay(imgPath, 50);

/* When the selected radius changes */
function radiusChanged(newVal) {
  document.getElementById("currentValue").innerHTML = newVal;

  // Redraw image with new circle
  drawCircleAndDisplay(imgPath, newVal);

  // Set this value globally
  remote.getGlobal('shared').featureRadius = newVal;
}

/* Draw circle over the image then display it to the canvas */
function drawCircleAndDisplay(path, radius) {
  var newImg = cv.imread(path);
  // Create a radius from center to extract features from
  var center = new cv.Point(newImg.rows/2, newImg.cols/2);
  const green = new cv.Vec3(0,255,0);
  // (origin, radius, color, thickness)
  newImg.drawCircle(center, parseFloat(radius), new cv.Vec3(0,255,0), 5);

  ih.renderImage(newImg, document.getElementById('imgCanvas'));
}
