var Drawing = Drawing || {};

Drawing.SimpleGraph = function(options) {
  var options = options || {};

  this.layout = "3d";
  this.layout_options = options.graphLayout || {};
  if (this.layout_options.width) Rs = [0, this.layout_options.width * 0.5, this.layout_options.width * 0.8, this.layout_options.width]
  this.show_stats = options.showStats || false;
  this.show_info = options.showInfo || false;
  this.show_labels = options.showLabels || false;
  this.selection = options.selection || false;
  this.limit = options.limit || 10;
  this.nodes_count = options.numNodes || 20;
  this.edges_count = options.numEdges || 10;
  this.data = options.data;
  this.realtimeUpdate = options.realtimeUpdate;

  var camera, controls, scene, renderer, interaction, nodeGeometry, edgeGeometry;
  var stats;
  var info_text = {};
  var graph = new Graph({
    limit: options.limit
  });

  var geometries = [];

  var that = this;

  init();
  //rendering worker
  animate();

  function init() {
    // Three.js initialization
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      sortObjects: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.z = 1000;
    var pointLight = new THREE.PointLight(0xffffff);
    var ambientLight = new THREE.AmbientLight(0x999999); // soft white light

    controls = new THREE.TrackballControls(camera);

    controls.rotateSpeed = 0.5;
    controls.zoomSpeed = 5.2;
    controls.panSpeed = 1;

    controls.noZoom = false;
    controls.noPan = false;

    controls.staticMoving = true;
    //controls.dynamicDampingFactor = 0.3;

    controls.keys = [65, 83, 68];

    controls.addEventListener('change', render);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0, 0, 0);
    document.body.appendChild(renderer.domElement);

    // Stats.js
    if (that.show_stats) {
      stats = new Stats();
      stats.domElement.style.position = 'absolute';
      stats.domElement.style.top = '0px';
      document.body.appendChild(stats.domElement);
    }

    generate();

  }


  function animate() {
    requestAnimationFrame(animate);
    controls.update();
    render();
  }



  function updateLabels() {
    if (labelGeometry) {
      var length = graph.nodes.length;
      var size = LABEL_SIZE;
      var i = 0;
      for (; i < length; i++) {
        var node = graph.nodes[i];
        var scale = node.uv[2] / node.uv[3];
        /*
            position.push(node.position.x - size, node.position.y + size, node.position.z);
            position.push(node.position.x + size, node.position.y + size, node.position.z);
            position.push(node.position.x + size, node.position.y - size, node.position.z);


            position.push(node.position.x - size, node.position.y - size, node.position.z);
            position.push(node.position.x - size, node.position.y + size, node.position.z);
            position.push(node.position.x + size, node.position.y - size, node.position.z);*/
        labelGeometry.attributes.position.array[i * 18 + 0] = node.position.x - size * scale;
        labelGeometry.attributes.position.array[i * 18 + 1] = node.position.y + size;
        labelGeometry.attributes.position.array[i * 18 + 2] = node.position.z + size;

        labelGeometry.attributes.position.array[i * 18 + 3] = node.position.x + size * scale;
        labelGeometry.attributes.position.array[i * 18 + 4] = node.position.y - size;
        labelGeometry.attributes.position.array[i * 18 + 5] = node.position.z + size;


        labelGeometry.attributes.position.array[i * 18 + 6] = node.position.x + size * scale;
        labelGeometry.attributes.position.array[i * 18 + 7] = node.position.y + size;
        labelGeometry.attributes.position.array[i * 18 + 8] = node.position.z + size;

        labelGeometry.attributes.position.array[i * 18 + 9] = node.position.x - size * scale;
        labelGeometry.attributes.position.array[i * 18 + 10] = node.position.y - size;
        labelGeometry.attributes.position.array[i * 18 + 11] = node.position.z + size;

        labelGeometry.attributes.position.array[i * 18 + 12] = node.position.x + size * scale;
        labelGeometry.attributes.position.array[i * 18 + 13] = node.position.y - size;
        labelGeometry.attributes.position.array[i * 18 + 14] = node.position.z + size;

        labelGeometry.attributes.position.array[i * 18 + 15] = node.position.x - size * scale;
        labelGeometry.attributes.position.array[i * 18 + 16] = node.position.y + size;
        labelGeometry.attributes.position.array[i * 18 + 17] = node.position.z + size;

      }
      labelGeometry.attributes.position.needsUpdate = true;
    }

  }

  function generate() {
    var length = params['max'];
    var layer = params['layer'];
    var position = [];
    var uv = [];
    var size = LABEL_SIZE;
    var param = {
      color: 'rgba(255,255,255,1'
    }
    for (var i = 0; i < length; i++) {
      var uvi = KUtils.makeHPTextSprite(i + "", param);
      texture = uvi.texture;
      var node = {
        position: {
          x: (Math.random() - 0.5) * window.innerWidth,
          y: (Math.random() - 0.5) * window.innerHeight,
          z: (Math.random() - 0.5) * window.innerWidth
        },
        uv: uvi.uv
      };
      var scale = size * node.uv[2] / node.uv[3];
      var corners = [[node.position.x - scale, node.position.y + size, node.position.z],
      [node.position.x + scale, node.position.y - size, node.position.z],
      [node.position.x + scale, node.position.y + size, node.position.z],
      [node.position.x - scale, node.position.y - size, node.position.z]
      ]
      position.push(corners[0][0],corners[0][1],corners[0][2]);
      position.push(corners[1][0],corners[1][1],corners[1][2]);
      position.push(corners[2][0],corners[2][1],corners[2][2]);


      uv.push(node.uv[0], node.uv[1]);
      uv.push(node.uv[0] + node.uv[2], node.uv[1] - node.uv[3]);
      uv.push(node.uv[0] + node.uv[2], node.uv[1]);


      position.push(corners[3][0],corners[3][1],corners[3][2]);
      position.push(corners[1][0],corners[1][1],corners[0][2]);
      position.push(corners[0][0],corners[0][1],corners[0][2]);

      uv.push(node.uv[0], node.uv[1] - node.uv[3]);
      uv.push(node.uv[0] + node.uv[2], node.uv[1] - node.uv[3]);
      uv.push(node.uv[0], node.uv[1]);


      //node.lookAt(camera.position);

    }


    labelGeometry = new THREE.BufferGeometry();
    labelGeometry.addAttribute('position', new THREE.BufferAttribute(new Float32Array(position), 3));
    labelGeometry.addAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
    var materialLabel = new THREE.MeshBasicMaterial({
      map: texture,
      //color: 0xffff00,
      //side: THREE.DoubleSide,
      transparent: true
    });

    that.labels = new THREE.Mesh(labelGeometry, materialLabel);
    scene.add(that.labels);
  }

  function render() {
    // update stats
    if (that.show_stats) {
      stats.update();
    }

    // render scene
    renderer.render(scene, camera);
  }
}

LABEL_SIZE = 5;