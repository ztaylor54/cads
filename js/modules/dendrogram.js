// Module to draw a dendrogram using d3
const d3 = require('d3');
const path = require('path');

module.exports = {
  drawDendrogram: function(divId, data, labels, root) {
    // set the dimensions and margins of the graph
    var width = 1200;
    var height = 800;

    // append the svg object to the body of the page
    var svg = d3.select(divId)
      .append("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("cursor", "grab")
      .append("g");

    //const g = svg.append("g")
    // .attr("cursor", "grab");

     function dragstarted() {
       d3.select(this).raise();
       svg.attr("cursor", "grabbing");
     }

     function dragged(d) {
       d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
     }

     function dragended() {
       svg.attr("cursor", "grab");
     }

    // Create the cluster layout:
    var cluster = d3.cluster()
      .size([height, width - 300]);  // 100 is the margin I will have on the right side

    // Give the data to this cluster layout:
    var root = d3.hierarchy(data, function(d) {
        return d.children;
    });
    cluster(root);

    // Add the links between nodes:
    svg.selectAll('path')
      .data( root.descendants().slice(1) )
      .enter()
      .append('path')
      .attr("d", function(d) {
          return "M" + d.y + "," + d.x
                  + "C" + (d.parent.y + 50) + "," + d.x
                  + " " + (d.parent.y + 150) + "," + d.parent.x // 50 and 150 are coordinates of inflexion, play with it to change links shape
                  + " " + d.parent.y + "," + d.parent.x;
                })
      .style("fill", 'none')
      .attr("stroke", '#ccc')

    // Select all the nodes:
    var node = svg.selectAll("g")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("transform", function(d) {
            return "translate(" + d.y + "," + d.x + ")"
        })
        .call(d3.drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended));

    // Add a circle for each node:
    node.append("circle")
      .attr("r", 4.5)
      .style("fill", "#69b3a2")
      .attr("stroke", "black")
      .style("stroke-width", 2)

    // Add labels to the leaves:
    node.filter(function(d) {
        return d.data.index > -1
      }).append("text")
        .attr("dx", function(d) { return d.children ? 8 : 60; })
        .attr("dy", function(d) { return d.children ? 20 : 4; })
        .style("text-anchor", function(d) { return d.children ? "end" : "start"; })
        .text(function(d) { return d.children ? "node" + d.height : "" + labels[d.data.index]; });

    // Add icon images:
    node.filter(function(d) {
        return d.data.index > -1
      }).append("svg:image")
        .attr('x', 15)
        .attr('y', -12)
        .attr('width', 30)
        .attr('height', 30)
        .attr("xlink:href", function(d) {
          return path.join(rootDir, labels[d.data.index]);
        })

    // Handle zoom
    svg.call(d3.zoom()
      .extent([[0, 0], [width, height]])
      .scaleExtent([1, 8])
      .on("zoom", zoomed));

    function zoomed() {
      svg.attr("transform", d3.event.transform);
    }

  }
};
