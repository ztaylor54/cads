const Tokenfield = require('tokenfield');
const remote = require('electron').remote;

var activeNode = undefined;
var descriptors = undefined;
var rootDir = undefined;

module.exports = {
  updatePropertiesPanel: (node, _rootDir, _descriptors) => {

    // Update script globals
    rootDir = _rootDir
    activeNode = node;
    console.log(activeNode);
    descriptors = _descriptors;

    labels = descriptors.map(x => x.filename);

    // Populate die
    if(activeNode.label) {
      document.querySelector('.props-card-die').innerHTML = activeNode.label;
    }
    else {
      document.querySelector('.props-card-die').innerHTML = "-";
    }

    // Is this a leaf?
    if (node.data.isLeaf) {
      // We're dealing with an actual coin
      // console.log(path.join(rootDir, labels[d.data.index]));
      document.querySelector('.props-card-img').style["background-image"] = 'url(\''+path.join(rootDir, labels[node.data.index])+'\')';
      document.querySelector('.props-card-filename').innerHTML = labels[node.data.index];

      // Hide the intermediate pieces of this card
      document.querySelectorAll('.properties .intermediate').forEach(x => x.classList.add("props-card-inactive"));

      // Make leaf pieces of this card visible
      document.querySelectorAll('.properties .leaf').forEach(x => {
        if (x.classList.contains("props-card-inactive")) {
          x.classList.remove("props-card-inactive");
        }
      });

      // Raise the tags wrapper
      const propsTagsLabel = document.querySelector('.props-tags-label');
      const propsTags = document.querySelector('.props-tags');
      if (propsTags.classList.contains("props-tags-wrapper-intermediate")) {
        propsTags.classList.remove("props-tags-wrapper-intermediate");
      }
      if(propsTagsLabel.classList.contains("props-tags-label-intermediate")) {
        propsTagsLabel.classList.remove("props-tags-label-intermediate");
      }
      propsTags.classList.add("props-tags-wrapper");
      propsTagsLabel.classList.add("props-tags-label-leaf");

      // Move the die label
      const propsDieLabel = document.querySelector('.props-die-label');
      const propsDie = document.querySelector('.props-card-die');
      if (propsDieLabel.classList.contains("props-die-label-intermediate")) {
        propsDieLabel.classList.remove("props-die-label-intermediate");
      }
      if (propsDie.classList.contains("props-card-die-intermediate")) {
        propsDie.classList.remove("props-card-die-intermediate");
      }
      propsDieLabel.classList.add("props-die-label-leaf");
      propsDie.classList.add("props-card-die-leaf");
    }
    // Otherwise, this is an intermediate node
    else {
      // Populate height, depth, and score
      document.querySelector('.props-card-height').innerHTML = activeNode.height;
      document.querySelector('.props-card-depth').innerHTML = activeNode.depth;
      document.querySelector('.props-card-score').innerHTML = activeNode.data.height.toFixed(2);

      // Hide the leaf pieces of this card
      document.querySelectorAll('.properties .leaf').forEach(x => x.classList.add("props-card-inactive"));

      // Make intermediate pieces of this card visible
      document.querySelectorAll('.properties .intermediate').forEach(x => {
        if (x.classList.contains("props-card-inactive")) {
          x.classList.remove("props-card-inactive");
        }
      });

      // Lower the tags wrapper
      const propsTagsLabel = document.querySelector('.props-tags-label');
      const propsTags = document.querySelector('.props-tags');
      if (propsTags.classList.contains("props-tags-wrapper")) {
        propsTags.classList.remove("props-tags-wrapper");
      }
      if(propsTagsLabel.classList.contains("props-tags-label-leaf")) {
        propsTagsLabel.classList.remove("props-tags-label-leaf");
      }
      propsTags.classList.add("props-tags-wrapper-intermediate");
      propsTagsLabel.classList.add("props-tags-label-intermediate");

      // Move the die label
      const propsDieLabel = document.querySelector('.props-die-label');
      const propsDie = document.querySelector('.props-card-die');
      if (propsDieLabel.classList.contains("props-die-label-leaf")) {
        propsDieLabel.classList.remove("props-die-label-leaf");
      }
      if (propsDie.classList.contains("props-card-die-leaf")) {
        propsDie.classList.remove("props-card-die-leaf");
      }
      propsDieLabel.classList.add("props-die-label-intermediate");
      propsDie.classList.add("props-card-die-intermediate");

    }

    var tags = remote.getGlobal('shared').tags;

    // Prapare the Tags
    var i;
    var allTags = new Array();
    for(i = 0; i < tags.length; i++) {
      allTags.push({
        id: i,
        name: tags[i].tag
      });
    }
    var filteredTags = tags.filter(x => x.id == activeNode.id);
    console.log("filtered tags:", filteredTags);
    var filteredPreparedTags = new Array();
    for(i = 0; i < filteredTags.length; i++) {
      filteredPreparedTags.push({
        id: i,
        name: filteredTags[i].tag
      });
    }

    // Add tags to input field, if any

    // Remove previous tag element
    var el = document.querySelector('.tokenfield');
    el.parentElement.removeChild(el);

    // Add new input element to add the tokenfield to
    el = document.querySelector('.props-tags');
    var x = document.createElement("input");
    x.setAttribute("class", "props-tags-input");
    el.appendChild(x);

    const tf = new Tokenfield({
      el: document.querySelector('.props-tags-input'), // Attach Tokenfield to the input element with class "text-input"
      items: allTags,
      setItems: filteredPreparedTags,
      newItems: true,
      placeholder: "Enter a tag..."
    });

    addPropsListener();

    // Add notes to input field, if any
  },

  activeNode: () => {
    return activeNode;
  }
};

function addPropsListener() {
  // Annotate cluster with tags
  const propsTagInput = document.querySelector('.tokenfield-input');
  propsTagInput.addEventListener("keydown", (event) => {
    // Number 13 is the "Enter" key on the keyboard
    if (event.keyCode === 13 && propsTagInput.value.trim() != "") {
      // Cancel the default action
      event.preventDefault();
      var tag = propsTagInput.value;
      // Save the tag if it doesn't already exist
      if(tags.every(x => x.id != activeNode.id || x.tag != tag)) {
        var t = {
          id: activeNode.id,
          tag: tag
        };
        tags.push(t);
        remote.getGlobal('shared').tags = tags;
      }
    }
  });
}

// Feature inspection button
document.querySelector('.props-inspect-features').addEventListener('click', (event) => {
  var url = 'file://' + __dirname + '/../../app/modal/inspectFeatures.html';

  // Set image path for modal to read
  console.log(activeNode);
  remote.getGlobal('shared').featureInspectImage = path.join(rootDir, descriptors[activeNode.data.index].filename);

  modal.launchModal(url, 400, 400, () => {});
});

// Card view button
document.querySelector('.props-view-cards').addEventListener('click', (event) => {
  var url = 'file://' + __dirname + '/../../app/modal/cardView.html';

  // Get filenames
  const filenames = activeNode.descendants()
    .filter(x => x.data.index > -1)
    .map(x => path.join(rootDir, descriptors[x.data.index].filename));

  // Add params to url
  const params = new URLSearchParams({
    files: filenames
  });

  modal.launchModal(url+"?"+params.toString(), 450, 670, () => {});
});
