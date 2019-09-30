const cv = require('opencv4nodejs');
const ih = require('../../js/modules/image-helpers.js');
const fs = require('fs');
const path = require('path');
const remote = require('electron').remote;

const imgPath = remote.getGlobal('shared').blurRadiusImage;

// Init
remote.getGlobal('shared').blurRadius = 7;
blurAndDisplay(imgPath, 7);

/* When the selected radius changes */
function radiusChanged(newVal) {
  document.getElementById("currentValue").innerHTML = newVal;

console.log("radius", newVal);

  // Redraw image with new blur
  blurAndDisplay(imgPath, newVal);

  // Set this value globally
  remote.getGlobal('shared').blurRadius = parseInt(newVal);
}

/* Apply a median blur to the image then display it to the canvas */
function blurAndDisplay(path, radius) {
  var newImg = cv.imread(path);

  newImg = newImg.medianBlur(parseInt(radius));

  ih.renderImage(newImg, document.getElementById('imgCanvas'));
}
