// Keep track of our socket connection
var socket;

var VerletPhysics2D = toxi.physics2d.VerletPhysics2D,
    VerletParticle2D = toxi.physics2d.VerletParticle2D,
    VerletSpring2D = toxi.physics2d.VerletSpring2D,
    VerletMinDistanceSpring2D = toxi.physics2d.VerletMinDistanceSpring2D,
    Vec2D = toxi.geom.Vec2D,
    Rect = toxi.geom.Rect;

var options = {
    nodeRadius: 40,
    ageThreshold: 30000,
    springStrength: 0.001,
    minDistanceSpringStrength: 0.05,
    strengthScale: 5.0
};

var mesh,
    nodes,
    physics,
    nodeColors;

var dataCounter = 0;
var bottomPadding = 50;
var selectedNode;
var showIndirectRoutes = true;

// utility to provide an iterator function with everly element
// and every element after that element
function forEachNested(arr, fn){
    for(var i=0; i<arr.length; i++){
        for(var j=i+1; j<arr.length; j++){
            var result = fn(arr[i], arr[j], i, j, arr);
            if(result === false){
                return;
            }
        }
    }
}


function setup() {
  createCanvas(window.innerWidth, window.innerHeight - bottomPadding);
  textSize(18);
  nodeColors = [color('#ff0000'), color('#ffcc00'), color('#0000ff'), color('#00bb00')];

  physics = new VerletPhysics2D();
  physics.setWorldBounds(new Rect(10, 10, width-20, height-20));
  physics.clear();
  mesh = new Mesh();

  // Start a socket connection to the server
  socket = io.connect(getURL());
  // We make a named event called 'mouse' and write an
  // anonymous callback function
  socket.on('mesh-data',
    // When we receive data
    function(data) {
      var nodeInfo = JSON.parse(data);
      var nodeKey = Object.keys(nodeInfo)[0];
      var nodeNumber = parseInt(nodeKey); // assume one property which is the node name
      var routes = nodeInfo[nodeKey];
      console.log("updating node " + nodeNumber + " with routes " + JSON.stringify(routes));
      mesh.updateNode(nodeNumber, routes);
    }
  );
}

function mousePressed() {
  Object.values(mesh.nodes).forEach(function (n) {
    var dx = mouseX - n.x;
    var dy = mouseY - n.y;
    if (sqrt((dx*dx) + (dy*dy)) < (options.nodeRadius/2)) {
      selectedNode = n;
    }
  });
  if (!selectedNode) {
    showIndirectRoutes = !showIndirectRoutes;
  }
}

function mouseReleased() {
  selectedNode = null;
}

function mouseDragged() {
  if (selectedNode) {
    selectedNode.x = mouseX;
    selectedNode.y = mouseY;
  }
}

function dashedLine(x1, y1, x2, y2, c1, c2) {
  var dx = x2-x1;
  var dy = y2-y1;
  var d = sqrt((dx*dx) + (dy*dy));
  var steps = d / 40;
  var ix1, iy1, ix2, iy2;
  var mx, my;
  stroke(c1);
  line(x1, y1, x2, y2);
  for(var i=0; i<steps; i++) {
    ix1 = lerp(x1, x2, i/steps);
    iy1 = lerp(y1, y2, i/steps);
    ix2 = lerp(x1, x2, (i+1)/steps);
    iy2 = lerp(y1, y2, (i+1)/steps);
    mx = (ix2+ix1)/2.0;
    my = (iy2+iy1)/2.0;
    if (i < (steps-1)) {
      stroke(c2);
      //line(mx, my, ix2, iy2);
      ellipse(ix1, iy1, 2, 2);
    }
  }

}


// For testing
/*
function mouseClicked() {
  socket.emit('mouse-click', dataCounter++);
}
*/

function draw(){

    // update the physics world. This moves the particles around.
    // after the movement, we can draw the particles and the connections.
    physics.update();

    background(255);

    // display all points
    mesh.display();

}


function Mesh(){
    this.nodes = {}; // map of nodes
}

// n is number, routes is object with route tables
Mesh.prototype.updateNode = function(n, routes) {
    var nodeKey = n.toString();
    var node = this.nodes[nodeKey];

    if (!node) {
        var pos = new Vec2D((width/2) + random(-50, 50), (height/2) + random(-50, 50));
        node = new Node(n, routes, pos);
        this.nodes[nodeKey] = node;
        console.log('created node ' + nodeKey);
    } else {
      node.routes = routes;
    }
    node.lastUpdate = new Date();

    // create a spring between each pair of nodes to keep them
    // at a minimum distance
    forEachNested(Object.values(this.nodes), function(n1, n2) {
      physics.addSpring(
        new VerletMinDistanceSpring2D(
          n1,
          n2,
          100,
          0.01
        )
      );
    });

    for (var r=1;r<=routes.length;r++) {
      if (r == n) continue; // self
      var route = routes[r-1];
      var nextNodeKey = route.n;
      var nextNode = parseInt(route.n);
      if (nextNode == 0) {
        console.log('route to node ' + r + ' is unknown');
      } else {
        if (r == nextNode) {
          // direct route
          var strength = abs(route.r);
          console.log('route to node ' + r + ' is direct with strength ' + strength);
          var node2 = this.nodes[nextNodeKey];
          if (node2) {
            // see if there is already a spring between the nodes. If so, remove it.
            var spring = physics.getSpring(node, node2);
            if (spring) {
              //console.log('--- removed spring between ' + n + ' and ' + nextNode);
              physics.removeSpring(spring);
            }
            spring = physics.getSpring(node2, node);
            if (spring) {
              //console.log('--- removed spring between ' + nextNode + ' and ' + n);
              physics.removeSpring(spring);
            }
            var node2Routes = node2.routes;
            var reverseRoute = node2Routes[n-1];
            if (parseInt(reverseRoute.n) == n) {
              //console.log('found reverse route from ' + nextNode + ' to ' + n + ': ' + JSON.stringify(reverseRoute));
              var strength2 = abs(reverseRoute.r);
              strength = (strength + strength2) / 2.0;
              //console.log('using average strength = ' + strength);
            }
            physics.addSpring(
                new VerletSpring2D(
                    node,
                    node2,
                    strength * options.strengthScale,
                    options.springStrength
                )
            );
            //console.log('+++ added spring between ' + n + ' and ' + nextNode + ' with strength ' + strength);
          }
        } else {
          console.log('route to node ' + r + ' is via node ' + nextNode);
        }
      }
    }

    console.log('');
}

Mesh.prototype.display = function() {
    var nodeNums = Object.keys(this.nodes);
    for(var i=0;i<nodeNums.length;i++) {
      var n = this.nodes[nodeNums[i]];
      var now = new Date();
      if (now.getTime() - n.lastUpdate.getTime() > options.ageThreshold) {
        continue;
      }
      fill(nodeColors[n.nodeNum - 1]);
      for(var j=0;j<n.routes.length;j++) {
        var r = n.routes[j];
        if (r.n != '255') { // if not self
          var n2, via;
          var direct = false;
          if (r.n == (j+1).toString()) {
            // direct route
            direct = true;
            n2 = this.nodes[r.n];
          } else {
            // indirect route
            n2 = this.nodes[(j+1).toString()];
            via = this.nodes[r.n];
          }
          if (n2) {
            var m = (n.y-n2.y)/(n.x-n2.x);
            var mp = -(n.x-n2.x)/(n.y-n2.y); // slope of perpendicular
            var q = sqrt(1.0/(1.0 + (mp*mp)));
            var tx, ty;
            var tOffset = 15;
            var lineWeight = 3;
            strokeWeight(lineWeight);
            var lineOffset = lineWeight/2.0;
            var s = r.r.toString();
            if (n.x < n2.x) {
              if (direct && (r.r != 0)) {
                // direct route. Draw solid line
                stroke(nodeColors[n.nodeNum - 1]);
                line(n.x + (lineOffset*q), n.y + (lineOffset*mp*q), n2.x + (lineOffset*q), n2.y + (lineOffset*mp*q));
                tx = n.x + abs(n.x-n2.x)/2.0;
                if (n.y < n2.y) {
                  ty = n.y + abs(n.y-n2.y)/2.0;
                } else {
                  ty = n.y - abs(n.y-n2.y)/2.0;
                }
                tx = tx + (tOffset*q);
                ty = ty + (tOffset*mp*q);
                strokeWeight(1);
                text(s, tx, ty);
              } else {
                // indirect route, draw dashed line
                if (showIndirectRoutes && via) {
                  dashedLine(n.x + (lineOffset*q), n.y + (lineOffset*mp*q), n2.x + (lineOffset*q), n2.y + (lineOffset*mp*q), nodeColors[n.nodeNum - 1], nodeColors[via.nodeNum - 1]);
                }
              }
            } else {
              if (direct && (r.r != 0)) {
                // direct route. Draw solid line
                stroke(nodeColors[n.nodeNum - 1]);
                line(n.x - (lineOffset*q), n.y - (lineOffset*mp*q), n2.x - (lineOffset*q), n2.y - (lineOffset*mp*q));
                tx = n.x - abs(n.x-n2.x)/2.0;
                if (n.y > n2.y) {
                  ty = n.y - abs(n.y-n2.y)/2.0;
                } else {
                  ty = n.y + abs(n.y-n2.y)/2.0;
                }
                tx = tx - (tOffset*q) - textWidth(s);
                ty = ty - (tOffset*mp*q);
                strokeWeight(1);
                text(s, tx, ty);
              } else {
                // indirect route, draw dashed line
                if (showIndirectRoutes && via) {
                  dashedLine(n.x - (lineOffset*q), n.y - (lineOffset*mp*q), n2.x - (lineOffset*q), n2.y - (lineOffset*mp*q), nodeColors[n.nodeNum - 1], nodeColors[via.nodeNum - 1]);
                }
              }
            }
          }
        }
      }
    }

    Object.values(this.nodes).forEach(function (n) {
      n.display();
    });

};



// Node inherits from `toxi.physic2d.VerletParticle2D`
// and adds a `display()` function for rendering with p5.js
function Node(nodeNum, routes, pos){
    // extend VerletParticle2D!
    this.nodeNum = nodeNum;
    this.routes = routes;
    VerletParticle2D.call(this, pos);
}

Node.prototype = Object.create(VerletParticle2D.prototype);

Node.prototype.display = function(){
    fill(nodeColors[this.nodeNum - 1]);
    stroke(0, 50);
    //noStroke();
    ellipse(this.x, this.y, options.nodeRadius, options.nodeRadius);
    fill('white');
    var s = "" + this.nodeNum;
    var tx = this.x - textWidth(s)/2.0;
    var ty = this.y + textAscent()/2.0 - textDescent()/2.0;
    text(this.nodeNum, tx, ty);
};
