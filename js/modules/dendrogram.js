// Module to draw a dendrogram using d3
const d3 = require('d3');
//const preview = require('./preview.js')
const ih = require('../../js/modules/image-helpers.js');
const cv = require('opencv4nodejs');
const props = require('../../js/modules/properties.js');

module.exports = {
  drawDendrogram: function(divId, data, descriptors, rootDir) {

    labels = descriptors.map(x => x.filename);

//DEBUG:::
  const vpHeight = 400;
  const vpWidth  = 700;
  const height = data.size * 25;
  const width  = data.size * 10;
  const radius = 6;

  // Main svg viewport
  const svg = d3.select(divId)
      .append("svg");
      //.attr("viewBox", [0, 0, vpWidth, vpHeight]);

  // Main graph container
  const g = svg.append("g")
      .attr("class", "circles");

  svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([0, 25])
      .on("zoom", zoomed))
      .on("dblclick.zoom", null); // disable double-click zoom

  function mousedowned(d, i) {
    d3.select(this).transition()
        .attr("fill", "black")
        .attr("r", radius * 2)
      .transition()
        .attr("fill", "#69b3a2")
        .attr("r", radius);
  }

  function zoomed() {
    g.attr("transform", d3.event.transform);
  }

    var i = 0,
    duration = 750,
    root;

    var treemap = d3.cluster().size([height, width]);

    // Give the data to this cluster layout:
    root = d3.hierarchy(data, function(d) {
        return d.children;
    });
    root.x0 = height / 2;
    root.y0 = 0;

    // root.children.forEach(collapse);

    update(root);

    // Collapse the node and all its children
    function collapse(d) {
      if(d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
      }
    }

    /* UI HOOKS
     *
     * Ideally this would be in properties.js, but that can't
     * happen with the current design without introducing
     * circular dependencies between dendrogram.js and properties.js.
     */
    document.querySelector('.props-collapse-node').addEventListener('click', (event) => {
      toggleChildren(props.activeNode());
    });
    document.querySelector('.props-make-die').addEventListener('click', (event) => {
      const nextDie = remote.getGlobal('shared').nextDie;
      remote.getGlobal('shared').nextDie = nextDie + 1;

      // Annotate the nodes
      annotate(props.activeNode(), "D" + nextDie);

      // Update the dendrogram
      update(props.activeNode());
    });

    // Annotate a node and all its children
    // Collapse the node and all its children
    function annotate(root, label) {
      root.label = label;

      // Recursive call
      if(root.children) {
        root.children.forEach(c => annotate(c, label));
      }
    }

    // Toggle children on click.
    function toggleChildren(d) {
      if (d.children) {
          d._children = d.children;
          d.children = null;
        } else {
          d.children = d._children;
          d._children = null;
        }
      update(d);
    }

    function update(source) {

      // Assigns the x and y position for the nodes
      var treeData = treemap(root);

      // Compute the new tree layout
      var nodes = treeData.descendants(),
          links = treeData.descendants().slice(1);

      // Normalize for fixed-depth
      nodes.forEach(function(d){ d.y = d.depth * 180});

      // **** Nodes section ****
      // Update the nodes...
      var node = g.selectAll('g.node')
          .data(nodes, function(d) {return d.id || (d.id = ++i); });

      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append('g')
          .attr('class', 'node')
          .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })

      // Add Circle for the nodes
      nodeEnter.append('circle')
          .attr('class', 'node')
          .attr('r', radius)

      // Add labels for the nodes
      nodeEnter.append('text')
          .attr("dy", ".35em")
          .attr("x", function(d) {
              return d.children || d._children ? -15 : 40;
          })
          .attr("text-anchor", function(d) {
              return d.children || d._children ? "end" : "start";
          })
          .text(function(d) {
            // If this node is a member of a die
            var l = "";
            if(d.label) {
              l = "(" + d.label + ")";
            }
             return d.children ? d.data.height.toFixed(2) + " " + l : "" + labels[d.data.index] + " " + l;
           });

      // Add icon images to leaf nodes
      nodeEnter.filter(function(d) {
            return d.data.index > -1
        }).on('click', function(d) {
          props.updatePropertiesPanel(d, rootDir, descriptors);
        }).append("svg:image")
            .attr('x', 15)
            .attr('y', -10)
            .attr('width', 20)
            .attr('height', 20)
            .attr('class', 'preview')
            .attr("xlink:href", function(d) {
              return path.join(rootDir, labels[d.data.index]);
          });

      // Handler for intermediate notes
      nodeEnter.filter(function(d) {
        return d.data.index == -1
      }).on('click', function(d) {
        props.updatePropertiesPanel(d, rootDir, descriptors);
      });

      // UPDATE
      var nodeUpdate = nodeEnter.merge(node);

      // Transition to the proper position for the node
      nodeUpdate.transition()
        .duration(duration)
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")";
         });

      // Update the node attributes and style
      nodeUpdate.select('circle.node')
        .attr('r', radius)
        .attr('cursor', 'pointer')
        .on("mouseover", function(d,i) {
          d3.select(this).transition()
            .ease(d3.easeBounce)
            .duration("500")
            .attr("r", radius * 1.5);
        })
        .on("mouseout", function(d,i) {
          d3.select(this).transition()
            .ease(d3.easeQuad)
            .delay("100")
            .duration("200")
            .attr("r", radius)
        });


      // Remove any exiting nodes
      var nodeExit = node.exit().transition()
          .duration(duration)
          .attr("transform", function(d) {
              return "translate(" + source.y + "," + source.x + ")";
          })
          .remove();

      // On exit reduce the node circles size to 0
      nodeExit.select('circle')
        .attr( 1e-6);

      // On exit reduce the opacity of text labels
      nodeExit.select('text')
        .style('fill-opacity', 1e-6);

      // ****************** links section ***************************

      // Update the links...
      var link = g.selectAll('path.link')
          .data(links, function(d) { return d.id; });

      // Enter any new links at the parent's previous position.
      var linkEnter = link.enter().insert('path', "g")
          .attr("class", "link")
          .attr('d', function(d){
            var o = {x: source.x0, y: source.y0}
            return diagonal(o, o)
          });

      // UPDATE
      var linkUpdate = linkEnter.merge(link);

      // Transition back to the parent element position
      linkUpdate.transition()
          .duration(duration)
          .attr('d', function(d){ return diagonal(d, d.parent) });

      // Remove any exiting links
      var linkExit = link.exit().transition()
          .duration(duration)
          .attr('d', function(d) {
            var o = {x: source.x, y: source.y}
            return diagonal(o, o)
          })
          .remove();

      // Store the old positions for transition.
      nodes.forEach(function(d){
        d.x0 = d.x;
        d.y0 = d.y;
      });

      // Creates a curved (diagonal) path from parent to the child nodes
      function diagonal(s, d) {

        var path = `
            M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}
        `;

        return path;
      }
    }
  }
};
