const cv = require('opencv4nodejs');
const ih = require('../js/modules/image-helpers.js');
const fs = require('fs');
const path = require('path');
const { agnes } = require('ml-hclust');
const dendrogram = require('../js/modules/dendrogram.js');
const modal = require('../js/modules/modal.js');
// const remote = require('electron').remote;
const tmp = require('tmp');
const mdc = require('material-components-web');
const Tokenfield = require('tokenfield');

// Root dir for input images
var rootDir;
var descriptors = new Array();
var tags = new Array();

let globalTree = {};

/* Entry point to clustering process, called when directory is selected */
function loadDir(dirInput) {
  // Make sure descriptors and tree are empty
  globalTree = undefined;
  descriptors = new Array();
  tags = new Array();

  const root = dirInput.files[0].path;
  rootDir = root;

  // Prompt the user to define the feature radius for this image set
  userDefineFeatureRadius();
}

/* Load a clustering from a file */
function loadFromFile(fileInput) {
  try {
    // Validate the json
    load(fileInput.files[0].path);
  } catch (e) {
    // Notify the user of a failed load
    var MDCSnackbar = mdc.snackbar.MDCSnackbar;
    var snackbar = new MDCSnackbar(document.querySelector('.mdc-snackbar'));
    const snackbar_label = document.querySelector('.mdc-snackbar__label');
    snackbar_label.innerHTML = "Unable to load file: not a valid CADS data file.";

    console.log(e);

    snackbar.open();
  }
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
      const cvMats = preProcess(file);
      const desc = cvMats.descriptors;
      const kps = cvMats.keypoints;
      descriptors.push({'filename': file, 'descriptors': desc, 'keypoints': kps});
      console.log(index);
      // updateProgBar(index, files.length);
    });

    // Stop timing
    var millis = Date.now() - start;
    console.log("Seconds elapsed = " + Math.floor(millis/1000));

    //makeImages();

    // Display the graph
    cluster();
  });
}

function makeImages() {
  const matchFeatures = ({ img1, img2, detector, matchFunc }) => {
    // detect keypoints
    const keyPoints1 = detector.detect(img1);
    const keyPoints2 = detector.detect(img2);
  
    // compute feature descriptors
    const descriptors1 = detector.compute(img1, keyPoints1);
    const descriptors2 = detector.compute(img2, keyPoints2);
  
    // match the feature descriptors
    const matches = matchFunc(descriptors1, descriptors2);
  
    // Ignore keypoints outside user-defined radius
    const center1 = new cv.Point(img1.rows/2, img1.cols/2);
    const center2 = new cv.Point(img2.rows/2, img2.cols/2);
    var radius = 100;
  
    // Iterate through all keypoints & omit if distance from center is too great
    const filteredKeyPoints1 = keyPoints1.filter(kp => {
      // Is this keypoint within the user-defined feature radius?
      return center1.sub(kp.pt).norm() <= radius
    });
  
    const filteredKeyPoints2 = keyPoints2.filter(kp => {
      // Is this keypoint within the user-defined feature radius?
      return center2.sub(kp.pt).norm() <= radius
    });
  
    // only keep good matches
    const bestN = 40;
    const bestMatches = matches.sort(
      (match1, match2) => match1.distance - match2.distance
    ).slice(0, bestN);

    const dist = Math.abs(
      bestMatches.reduceRight(
        (acc, curr) => acc + Math.abs(curr.distance),
        0
      ) / bestMatches.length
    );

    console.log(dist);

  
    return cv.drawMatches(
      img1,
      img2,
      keyPoints1,
      keyPoints2,
      bestMatches
    );
  };
  
  // const img1 = cv.imread('../cads/resources/images for thesis/0081_D44.jpg');
  // const img2 = cv.imread('../cads/resources/images for thesis/0082_D44.jpg');
  // const img2 = cv.imread('../cads/resources/vset 3/0112_D55.jpg');
  const img1 = cv.imread('../cads/resources/vset 3/0094_D52.jpg');
  const img2 = cv.imread('../cads/resources/vset 3/0098_D51.jpg');
  
  const orbMatchesImg = matchFeatures({
    img1,
    img2,
    detector: new cv.ORBDetector(),
    matchFunc: cv.matchBruteForceHamming
  });
  cv.imshowWait('ORB matches', orbMatchesImg);
}

/* Prompts the user to define the feature radius */
function userDefineFeatureRadius() {
  var url = 'file://' + __dirname + '/modal/defineFeatureRadius.html';

  // Set image path for modal to read
  console.log(path.join(rootDir, fs.readdirSync(rootDir)[0]));
  remote.getGlobal('shared').featureRadiusImage = path.join(rootDir, fs.readdirSync(rootDir)[0]);

  modal.launchModal(url, 1000, 600, userDefineBlurRadius);
}

/* Prompts the user to define the ksize for the median blur */
function userDefineBlurRadius() {
  var url = 'file://' + __dirname + '/modal/defineBlurRadius.html';

  // Set image path for modal to read
  console.log(path.join(rootDir, fs.readdirSync(rootDir)[0]));
  remote.getGlobal('shared').blurRadiusImage = path.join(rootDir, fs.readdirSync(rootDir)[0]);

  // Continue with feature extraction afterwards
  modal.launchModal(url, 1000, 600, extractFeatures);
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
  return {
    descriptors: detector.compute(src, keyPoints),
    keypoints: keyPoints
  };
}

/* Perform hierarchical clustering and draw resulting dendrogram */
function cluster() {
  // Delete any old visualizations
  cleanup();

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
  annotate(globalTree);
  // Serialize the OpenCV work to global state
  save();

  // Draw the dendrogram
  dendrogram.drawDendrogram("#dendrogram", globalTree, descriptors, rootDir);

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

  // // Debug to show the feature matches
  // const matchesMat = cv.drawMatches(
  //   objA.img,
  //   objB.img,
  //   objA.keypoints,
  //   objB.keypoints,
  //   bestMatches
  // )
  // cv.imshowWait('ORB matches', matchesMat);

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

/* Annotate a cluster */
function annotate(cluster) {
  // Base case
  if(cluster.isLeaf) {
    return [cluster.index];
  }
  else {
    // Annotate this node and pass along
    cluster.members = cluster.children.map(x => annotate(x)).reduce((curr, acc) => acc.concat(curr), []);
    return cluster.members;
  }
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
  //document.getElementById('status').innerHTML = 'OpenCV.js is ready.';
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

/* Clean up dendrogram div */
function cleanup() {
  const d = document.getElementById('dendrogram');
  while (d.firstChild) {
    d.removeChild(d.firstChild);
  }
}

/* When the selected modal image changes */
function radiusChanged(newVal) {
  document.getElementById("currentValue").innerHTML = newVal;

  // Redraw image with new circle
  drawCircleAndDisplay(imgPath, newVal);

  // Set this value globally
  remote.getGlobal('shared').featureRadius = newVal;
}

/* UI ACTIONS THAT INTERACT WITH OPENCV OR CLUSTERING DATA STRUCTURE
 *
 * These need to be included here because the main app.js
 * cannot use opencv with the current webpack configuration.
 *
 */

// Launch modals on nav action
const navNewEl = document.querySelector('.nav-action-new');
navNewEl.addEventListener('click', (event) => {
  // Create an input element to get dir input from user
  var input = document.createElement('input');
  input.setAttribute("type", "file");
  input.setAttribute("id", "dirInput");
  input.setAttribute("accept", "image/*");
  input.setAttribute("onchange", "loadDir(this)");
  input.webkitdirectory = true;
  input.mozdirectory = true;
  input.click();
  return false;
});

const navLoadEl = document.querySelector('.nav-action-open');
navLoadEl.addEventListener('click', (event) => {
  // Create an input element to get json input from user
  var input = document.createElement('input');
  input.setAttribute("type", "file");
  input.setAttribute("accept", ".json");
  input.setAttribute("onchange", "loadFromFile(this)");
  input.click();
  return false;

});

// Handle tags to dies
const tf = new Tokenfield({
  el: document.querySelector('.props-tags-input'), // Attach Tokenfield to the input element with class "text-input"
  items: [
    // Autocomplete items go here
  ],
  setItems: [
    // Pre-set items go here
  ],
  newItems: true,
  placeholder: "Enter a tag..."
});

/* Serialize the OpenCV state to the global scope */
function save() {
  var pjson = require('../package.json');

  var saveFile = {
    meta: {
      version: pjson.version
    },
    rootDir: rootDir,
    clustering: globalTree,
    tags: remote.getGlobal('shared').tags,
    descriptors: []
  };

  // Encode the descriptors and add them to the save file
  descriptors.forEach(desc => {
    const descOutBase64 = cv.imencode('.jpg', desc.descriptors).toString('base64'); // Perform base64 encoding
    saveFile.descriptors.push({
      filename: desc.filename,
      descriptors: descOutBase64,
      keypoints: desc.keypoints
    })
  });

  // Write to temp file
  tmp.file(function _tempFileCreated(err, path, fd, cleanupCallback) {
    if (err) throw err;

    console.log('File: ', path);
    console.log('Filedescriptor: ', fd);

    fs.writeFile(path, JSON.stringify(saveFile), 'utf8', function(err) {
      if(err) {
        return console.log(err);
      }
        console.log("Saved temp file!");

        remote.getGlobal('shared').tempFileLoc = path;
    });
  });
}

/* Load from serialized state */
function load(saveFile) {
  // Read the file, then parse the fields
  const data = fs.readFileSync(saveFile, 'utf8');

  // Will throw error to parent if not valid JSON
  const parsedJSON = JSON.parse(data);

  if (!parsedJSON.rootDir) {
    throw new Error("No root directory specified in save file, aborting load");
  }

  if (!parsedJSON.clustering) {
    throw new Error("No clustering data specified in save file, aborting load");
  }

  if(!parsedJSON.descriptors) {
    throw new Error("No descriptor data specified in save file, aborting load");
  }

  if(!parsedJSON.tags) {
    throw new Error("No tags data specified in save file, aborting load");
  }

  // Copy the tags over
  this.tags = new Array();
  var self = this;
  parsedJSON.tags.forEach(tag => {
    self.tags.push(tag);
  });

  remote.getGlobal('shared').tags = this.tags;

  const descr = new Array();

  parsedJSON.descriptors.forEach(desc => {
    // Convert to OpenCV mat
    const descBuffer = Buffer.from(desc.descriptors,'base64');
    const kpsBuffer = Buffer.from(desc.keypoints, 'base64');
    const descMat = cv.imdecode(descBuffer);
    const kpsMat = cv.imdecode(kpsBuffer);

    descr.push({
      filename: desc.filename,
      descriptors: descMat,
      keypoints: kpsMat
    });

  });

  // Draw the dendrogram
  dendrogram.drawDendrogram("#dendrogram", parsedJSON.clustering, descr, parsedJSON.rootDir);
}
const remote = require('electron').remote;
