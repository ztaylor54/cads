const Tokenfield = require('tokenfield');
const remote = require('electron').remote;

var activeNode = undefined;
var descriptors = undefined;
var rootDir = undefined;

module.exports = {
  updatePropertiesPanel: (node, _rootDir, _descriptors) => {

    // Update script globals
    rootDir = _rootDir
    activeNode = node.id;
    console.log(activeNode);
    descriptors = _descriptors;

    labels = descriptors.map(x => x.filename);

    // Is this a leaf?
    console.log(node);
    if (node.data.isLeaf) {
      // We're dealing with an actual coin
      // console.log(path.join(rootDir, labels[d.data.index]));
      document.querySelector('.props-card-img').style["background-image"] = 'url(\''+path.join(rootDir, labels[node.data.index])+'\')';
      document.querySelector('.props-card-filename').innerHTML = labels[node.data.index];
    }
    // Otherwise, this is an intermediate node
    else {
      // We can display depth, height, id, and a 'representative image'
      // Also need to populate the cards panel with all members
      console.log("intermediate node");


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
    var filteredTags = tags.filter(x => x.id == this.activeNode);
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
    el = document.querySelector('.props-tags-wrapper');
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

  activeNode: function() {
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
      if(tags.every(x => x.id != activeNode || x.tag != tag)) {
        var t = {
          id: activeNode,
          tag: tag
        };
        tags.push(t);
        remote.getGlobal('shared').tags = tags;
      }
    }
  });
}

// Feature inspection button
const propsInspectFeatures = document.querySelector('.props-inspect-features');
propsInspectFeatures.addEventListener('click', (event) => {
  var url = 'file://' + __dirname + '/../../app/modal/inspectFeatures.html';

  // Set image path for modal to read
  remote.getGlobal('shared').featureInspectImage = path.join(rootDir, descriptors[activeNode].filename);

  modal.launchModal(url, 400, 400, () => {});
});
