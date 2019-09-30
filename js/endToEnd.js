const cv = require('opencv4nodejs');
const ih = require('../js/modules/image-helpers.js');
const fs = require('fs');
const path = require('path');
const { agnes } = require('ml-hclust');
const dendrogram = require('../js/modules/dendrogram.js');
const remote = require('electron').remote;

// root dir for input images
var rootDir;
var descriptors = new Array();

let globalTree;

/* Entry point to clustering process, called when directory is selected */
function loadDir(dirInput) {
  const root = dirInput.files[0].path;
  rootDir = root;

  // Prompt the user to define the feature radius for this image set
  userDefineFeatureRadius();
}

/* Called after userDefineFeatureRadius modal is closed */
function extractFeatures() {
  // Will have been defined by userDefineFeatureRadius modal
  const featureRadius = remote.getGlobal('shared').featureRadius;

  console.log("featureRadius", featureRadius);

  // Time this process
  var start = Date.now();
  console.log("Starting timer...")

  // Read dir input and prepare images for processing
  fs.readdir(rootDir, function(err, files) {

    // Make progress bar visible
    // TODO: Refactor so the renderer can render the progress change
    // progInit(files.length);

    files.forEach(function (file, index) {
      // Add the descriptors to the global array (filename, descriptors)
      const desc = preProcess(file);
      descriptors.push({'filename': file, 'descriptors': desc});
      console.log(index);
      // updateProgBar(index, files.length);
    });

    // Stop timing
    var millis = Date.now() - start;
    console.log("Seconds elapsed = " + Math.floor(millis/1000));
  });
}

/* Prompts the user to define the feature radius */
function userDefineFeatureRadius() {
  var url = 'file://' + __dirname + '/modal/defineFeatureRadius.html';

  // Set image path for modal to read
  console.log(path.join(rootDir, fs.readdirSync(rootDir)[0]));
  remote.getGlobal('shared').featureRadiusImage = path.join(rootDir, fs.readdirSync(rootDir)[0]);

  launchModal(url, userDefineBlurRadius);
}

/* Prompts the user to define the ksize for the median blur */
function userDefineBlurRadius() {
  var url = 'file://' + __dirname + '/modal/defineBlurRadius.html';

  // Set image path for modal to read
  console.log(path.join(rootDir, fs.readdirSync(rootDir)[0]));
  remote.getGlobal('shared').blurRadiusImage = path.join(rootDir, fs.readdirSync(rootDir)[0]);

  // Continue with feature extraction afterwards
  launchModal(url, extractFeatures);
}

/* Opens a modal window for user interaction. callback(cbParams) is called upon closing the window. */
function launchModal(url, callback) {
  // Open a new window to do this
  let win = new remote.BrowserWindow({
    width: 1200,
    height: 800,
    parent: remote.getCurrentWindow(),
    modal: true,
    webPreferences: {
            nodeIntegration: true
        },
  });
  win.setMenu(null);
  win.on('closed', () => {
    win = null;

    // Continue
    callback();
  });
  win.webContents.on('did-finish-load', ()=>{
   win.show();
   win.focus();
  });

  // win.webContents.openDevTools();
  win.loadURL(url);
}

/* Extracts features from an image and returns the descriptors */
function preProcess(file) {

  // Read the image to a mat
  var src = cv.imread(path.join(rootDir, file));

  // Convert to grayscale
  src = src.bgrToGray();

  // Median blur
  src = src.medianBlur(getBlurRadius());

  // Detect features
  detector = new cv.ORBDetector();
  const keyPoints = detector.detect(src);

  // Ignore keypoints outside user-defined radius
  var center = new cv.Point(src.rows/2, src.cols/2);
  var radius = getFeatureRadius();

  /*
  // Debug - shows keypoints over image
  var mat = cv.drawKeyPoints(src, keyPoints);
  mat.drawCircle(center, parseFloat(radius), new cv.Vec3(0,255,0), 5);
  cv.imshow('Before circle filter', mat);
  cv.waitKey();
  */

  // Iterate through all keypoints & omit if distance from center is too great
  var filteredKeyPoints = keyPoints.filter(kp => {
    // Is this keypoint within the user-defined feature radius?
    return center.sub(kp.pt).norm() <= radius
  });

  /*
  // Debug - shows keypoints over image after filtering
  mat = cv.drawKeyPoints(src, filteredKeyPoints);
  mat.drawCircle(center, parseFloat(radius), new cv.Vec3(0,255,0), 5);
  cv.imshow('After circle filter', mat);
  cv.waitKey();
  */

  // Return the descriptors
  return detector.compute(src, keyPoints);
}

/* Perform hierarchical clustering and draw resulting dendrogram */
function cluster() {

  // Time this process
  var start = Date.now();
  console.log("Starting timer for hierarchical clustering...")

  // hierarchical clustering clustering
  const tree = agnes(descriptors, {
    method: 'ward',
    distanceFunction: distance
  })

  console.log(tree);

  globalTree = tree;

  // Draw the dendrogram
  dendrogram.drawDendrogram("#dendrogram", tree, descriptors.map(x => x.filename), rootDir);

  // Stop timing
  var millis = Date.now() - start;
  console.log("Seconds elapsed = " + Math.floor(millis/1000));
}

/* Custom distance function for clustering */
function distance(objA, objB) {
  //console.log("A: " + objA);
  //console.log("B: " + objB);

  // Get the descriptor matches
  const matches = cv.matchBruteForceHamming(objA.descriptors, objB.descriptors);

  // Filter out the best 20 matches
  const bestN = 20;
  const bestMatches = matches.sort(
    (match1, match2) => match1.distance - match2.distance
  ).slice(0, bestN);

  // Return the average distance between matched descriptors
  let dist = Math.abs(
    bestMatches.reduceRight(
      (acc, curr) => acc + Math.abs(curr.distance),
      0
    ) / bestMatches.length
  );

  //console.log("dist: " + dist);
  //console.log();

  return dist;
}

/* Clear a directory */
function clearDir(dirname) {
  fs.readdir(dirname, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(dirname, file), err => {
        if (err) throw err;
      });
    }
  });
}

function onOpenCvReady() {
  document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
}
function onOpenCvError() {
  let element = document.getElementById('status');
  element.setAttribute('class', 'err');
  element.innerHTML = 'Failed to load opencv.js';
}

/* Get the user-defined feature radius from its global container */
function getFeatureRadius() {
  return remote.getGlobal('shared').featureRadius;
}

/* Get the user-defined blur radius from its global container */
function getBlurRadius() {
  return remote.getGlobal('shared').blurRadius;
}

function progInit(max) {
  var prog = document.getElementById("prog");
  var progBar = document.getElementById("progBar");
  prog.style.display = "block";
  progBar.value = 0;
  progBar.max = max;

  var progInfo = document.getElementById("progInfo");
  progInfo.innerHTML = "0/" + max + " (0%)";
}
function updateProgBar(value, max) {
  var progBar = document.getElementById("progBar");
  progBar.value = value;
  progBar.max = max;

  var progInfo = document.getElementById("progInfo");
  progInfo.innerHTML = value + "/" + max + " (" + (value / max) + "%)";
}
