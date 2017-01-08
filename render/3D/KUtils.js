/**
 * KUtils gl utils
 */
KUtils = {
	uv: [0, 0],
	uvChecking: function(bufferGeometry) {
		var position = bufferGeometry.attributes.position.array;
		var uv;
		if (bufferGeometry.attributes.uv) {
			uv = bufferGeometry.attributes.uv.array;
		} else uv = [];
		if (uv.length < position.length * 2 / 3) {
			var n = position.length * 2 / 3 - uv.length;
			var m = uv.length;
			var uvNew = new Float32Array(position.length * 2 / 3);
			for (var i = 0; i < m; i++) {
				uvNew[i] = uv[i];
			}
			for (var i = m; i < n; i++) {
				uvNew[i] = uvNew[m - 1];
			}
			bufferGeometry.addAttribute('uv', new THREE.BufferAttribute(uvNew, 2));
		}
	},
	/*
	w,h: relative unit
	x,y: relative unit
	not  finnishing
	*/
	projectFlat: function(geometry, ratio, x, y, w, h, clip) {
		geometry.computeBoundingBox();
		var max = geometry.boundingBox.max,
			min = geometry.boundingBox.min;

		var offset = new THREE.Vector2(0 - min.x, 0 - min.z);
		var range = new THREE.Vector2(max.x - min.x, max.z - min.z);
		var repeat = new THREE.Vector2(1, 1);
		if (geometry instanceof THREE.BufferGeometry) {
			var position = geometry.attributes.position.array;
			var verticesNo = position.length / 3;
			//var indices = new ( ( verticesNo ) > 65535 ? Uint32Array : Uint16Array )( verticesNo );

			var uv = new Float32Array(verticesNo * 2);
			for (var i = 0; i < verticesNo; i++) {
				if (i >= verticesNo * clip) { //seperate surface with legs TEMPORARILY
					uv[i * 2] = repeat.x * (position[i * 3] + offset.x) / range.x;
					uv[i * 2 + 1] = 1 - repeat.y * (position[i * 3 + 2] + offset.y) / range.y;
				} else {
					uv[i * 2] = 0;
					uv[i * 2] = 0;
				}
				//indices[i*2] = i*2;
				//indices[i*2+1] = i*2+1;
			}
			geometry.addAttribute('uv', new THREE.BufferAttribute(uv, 2));
			//geometry.addAttribute( 'index', new THREE.BufferAttribute( indices, 1 ) );
			geometry.uvsNeedUpdate = true;
		} else {

			geometry.faceVertexUvs[0] = [];
			for (i = 0; i < geometry.faces.length; i++) {

				var v1 = geometry.vertices[geometry.faces[i].a],
					v2 = geometry.vertices[geometry.faces[i].b],
					v3 = geometry.vertices[geometry.faces[i].c];
				geometry.faceVertexUvs[0].push(
					[
						new THREE.Vector2(repeat.x * (v1.x + offset.x) / range.x, repeat.y * (v1.y + offset.y) / range.y),
						new THREE.Vector2(repeat.x * (v2.x + offset.x) / range.x, repeat.y * (v2.y + offset.y) / range.y),
						new THREE.Vector2(repeat.x * (v3.x + offset.x) / range.x, repeat.y * (v3.y + offset.y) / range.y)
					]);

			}
			geometry.uvsNeedUpdate = true;
		}
	},
	assignUVs: function(geometry, w, h) {
		//FIXME need to support buffergeometry
		geometry.computeBoundingBox();
		var max = geometry.boundingBox.max,
			min = geometry.boundingBox.min;
		var range = new THREE.Vector3(max.x - min.x, max.y - min.y, max.z - min.z);
		var offset = new THREE.Vector3(0 - min.x, 0 - min.y, 0 - min.z);
		if (geometry instanceof THREE.BufferGeometry) {

			var range = [max.x - min.x, max.y - min.y, max.z - min.z];
			var offset = [0 - min.x, 0 - min.y, 0 - min.z];
			var position = geometry.attributes.position.array;
			var normal = geometry.attributes.normal.array;
			var verticesNo = position.length / 3;
			//var indices = new ( ( verticesNo ) > 65535 ? Uint32Array : Uint16Array )( verticesNo );
			var uv = new Float32Array(verticesNo * 2);

			for (var i = 0; i < verticesNo; i++) {
				var components = [0, 1, 2].sort(function(a, b) {
					return Math.abs(normal[i * 3 + a]) > Math.abs(normal[i * 3 + b]);
				});
				var repeat = [1, 1];
				if (w && h) {
					repeat = [range[components[0]] / w, range[components[1]] / h];
				}

				uv[i * 2] = repeat[0] * (position[i * 3 + components[0]] + offset[components[0]]) / range[components[0]];
				uv[i * 2 + 1] = repeat[1] * (position[i * 3 + components[1]] + offset[components[1]]) / range[components[1]];

			}
			geometry.addAttribute('uv', new THREE.BufferAttribute(uv, 2));
			//geometry.addAttribute( 'index', new THREE.BufferAttribute( indices, 1 ) );
			geometry.uvsNeedUpdate = true;
			return;
		}

		geometry.faceVertexUvs[0] = [];
		geometry.faces.forEach(function(face) {

			var components = ['x', 'y', 'z'].sort(function(a, b) {
				return Math.abs(face.normal[a]) > Math.abs(face.normal[b]);
			});

			var v1 = geometry.vertices[face.a];
			var v2 = geometry.vertices[face.b];
			var v3 = geometry.vertices[face.c];
			var repeat = [1, 1];
			if (w && h) {
				repeat = [range[components[0]] / w, range[components[1]] / h];
			}

			var uv = [
				new THREE.Vector2(repeat[0] * (v1[components[0]] + offset[components[0]]) / range[components[0]], repeat[1] * (v1[components[1]] + offset[components[1]]) / range[components[1]]),
				new THREE.Vector2(repeat[0] * (v2[components[0]] + offset[components[0]]) / range[components[0]], repeat[1] * (v2[components[1]] + offset[components[1]]) / range[components[1]]),
				new THREE.Vector2(repeat[0] * (v3[components[0]] + offset[components[0]]) / range[components[0]], repeat[1] * (v3[components[1]] + offset[components[1]]) / range[components[1]])
			];
			geometry.faceVertexUvs[0].push(uv);

		});

		geometry.uvsNeedUpdate = true;

	},
	lazyLoadSTL: function(list, colors, duration, callback) {
		var loader = new THREE.STLLoader();
		var group = new THREE.Group();
		for (var i in list) {
			if (!list[i]) {
				var mesh = new THREE.Group(); //dummy to keep order
				mesh.name = i;
				group.add(mesh);
			} else
				setTimeout(function(path, color, index) {

					loader.load(path, function(geometry) {
						geometry.computeBoundingBox();
						var material = color;
						var mesh = new THREE.Mesh(geometry, material);
						mesh.name = this.path.match(/\d+/)[0];
						group.add(mesh);
						if (callback && group.children.length === list.length) callback(); //full items
					}.bind({
						color: color,
						path: path
					}))
				}.bind(this, list[i], colors[i], i), duration * i);

		}
		return group;
	},
	//Error
	createRoundRectCSG: function(x, y, z, w, h, d, fillet) {
		var frame = CSG.cube({
			center: [x, y, z],
			radius: [w / 2, h / 2, d / 2]
		});

		if (fillet) {
			var cylCut = CSG.cylinder({
				start: [x + w / 2, y + h / 2, -d / 2],
				end: [x + w / 2, y + h / 2, d / 2],
				radius: fillet
			});
			frame = frame.subtract(cylCut);
			var cylMerg = CSG.cylinder({
				start: [x + w / 2 - fillet, y + h / 2 - fillet, -d / 2],
				end: [x + w / 2 - fillet, y + h / 2 - fillet, d / 2],
				radius: fillet
			});
			frame = frame.union(cylMerg);

			cylCut = CSG.cylinder({
				start: [x - w / 2, y - h / 2, -d / 2],
				end: [x - w / 2, y - h / 2, d / 2],
				radius: fillet
			});
			frame = frame.subtract(cylCut);
			cylMerg = CSG.cylinder({
				start: [x - w / 2 + fillet, y - h / 2 + fillet, -d / 2],
				end: [x - w / 2 + fillet, y - h / 2 + fillet, d / 2],
				radius: fillet
			});
			frame = frame.union(cylMerg);

			cylCut = CSG.cylinder({
				start: [x + w / 2, y - h / 2, -d / 2],
				end: [x + w / 2, y - h / 2, d / 2],
				radius: fillet
			});
			frame = frame.subtract(cylCut);
			cylMerg = CSG.cylinder({
				start: [x + w / 2 - fillet, y - h / 2 + fillet, -d / 2],
				end: [x + w / 2 - fillet, y - h / 2 + fillet, d / 2],
				radius: fillet
			});
			frame = frame.union(cylMerg);

			cylCut = CSG.cylinder({
				start: [x - w / 2, y + h / 2, -d / 2],
				end: [x - w / 2, y + h / 2, d / 2],
				radius: fillet
			});
			frame = frame.subtract(cylCut);
			cylMerg = CSG.cylinder({
				start: [x - w / 2 + fillet, y + h / 2 - fillet, -d / 2],
				end: [x - w / 2 + fillet, y + h / 2 - fillet, d / 2],
				radius: fillet
			});
			frame = frame.union(cylMerg);
		}
		return frame;
	},
	createRoundRectCSGFast: function(_x, _y, z, w, h, d, fillet) {
		var frame;
		if (!fillet) {
			frame = CSG.cube({
				center: [_x, _y, z],
				radius: [w / 2, h / 2, d / 2]
			});


		} else {
			var x = _x - w / 2;
			var y = _y - h / 2;
			var f = fillet;
			var data = [
				[x, y + f],
				[f, 0, f, 2 * Math.PI / 2, 3 * Math.PI / 2],
				[x + w - f, y],
				[0, f, f, 3 * Math.PI / 2, 4 * Math.PI / 2],
				[x + w, y + h - f],
				[-f, 0, f, 0, Math.PI / 2],
				[x + f, y + h],
				[0, -f, f, Math.PI / 2, 2 * Math.PI / 2],
				[x, y + f]
			];
			var shape = new THREE.Shape();
			data.forEach(function(elem, index) {
				if (index === 0) shape.moveTo(elem[0], elem[1]);
				else if (elem.length === 2) shape.lineTo(elem[0], elem[1]);
				else shape.arc(elem[0], elem[1], elem[2], elem[3], elem[4]);
			});

			var geo = new THREE.ExtrudeGeometry(shape, {
				amount: d,
				bevelEnabled: false
			});
			geo.translate(0, 0, -d / 2);
			frame = THREE.CSG.toCSG(geo);
		}
		return frame;
	},
	createWindowFrameCSG: function(x, y, z, w, h, d, frameSize, type, fillet) {
		var frame = KUtils.createRoundRectCSG(x, y, z, w, h, d, fillet);
		var hole = KUtils.createRoundRectCSG(x, y, z, w - frameSize * 2, h - frameSize * 2, d, fillet ? fillet - frameSize : 0);
		frame = frame.subtract(hole);
		return frame;
	},
	bbox: function(object) {
		var box = null;
		object.traverse(function(obj3D) {
			var geometry = obj3D.geometry;
			if (geometry === undefined) return;
			var elem = new THREE.Box3().setFromObject(obj3D);
			if (box === null) {
				box = elem;
			} else {
				box.union(elem);
			}
		});
		return box;
	},
	cleanGroup: function(scene, group) {
		group.traverse(function(child) {

			if (child instanceof THREE.Mesh) {
				//child.dispose();
				child.geometry.dispose();
				if (child.material.materials) child.material.materials.forEach(function(child_) {
					child_.dispose();
					if (child_.map) child_.map.dispose();
				})
				else {
					child.material.dispose();
					if (child.material.map) child.material.map.dispose();
				}
				scene.remove(child);
			}
		})
		group.children = [];
	},
	drawCanvas: function(text, options, canvas) {
		if (!options) options = {};
		var font = (options.font ? options.font : "12px Comic Sans MS, cursive, sans-serif");
		var c = canvas ? canvas : document.createElement("canvas");
		var ctx = c.getContext("2d");
		ctx.font = font;

		var textSize = parseInt(font);
		c.width = 32 //ctx.measureText(text).width;
			//c.width = 256;
		c.height = 16 //textSize;
			//reapply font
		ctx.font = font;

		ctx.textBaseline = 'middle';
		ctx.textAlign = "center";
		ctx.fillStyle = "rgba(0, 0, 0, 0)";
		ctx.clearRect(0, 0, c.width, c.height);

		ctx.fillStyle = options.color ? options.color : "rgba(0, 0, 0,1.0)";
		ctx.fillText(text, c.width / 2, c.height / 2);
		//test
		//document.body.appendChild(c);
		return c;
	},

	drawHPCanvas: function(text, options, canvas) {
		if (!options) options = {};
		if (!this.canvas) {
			this.canvas = document.createElement("canvas");
			//document.body.appendChild(this.canvas);
			//SIZE TEST
			var canvasTest = document.createElement("canvas");
			var gl = canvasTest.getContext("webgl") || canvasTest.getContext("experimental-webgl");
			var maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
			console.log("Maximum texture size " + maxSize);
			//
			this.canvas.width = this.canvas.height = maxSize / 2;
			var ctx = this.canvas.getContext("2d");
			ctx.textBaseline = 'middle';
			ctx.textAlign = "center";
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		}
		var font = (options.font ? options.font : "24px Comic Sans MS, cursive, sans-serif");
		var c = this.canvas;
		var ctx = c.getContext("2d");
		ctx.font = font;

		var textSize = parseInt(font) + 4;
		var textLength = ctx.measureText(text).width + 4;
		//reapply font
		ctx.font = font;
		ctx.fillStyle = options.color ? options.color : "rgba(0, 0, 0,1.0)";
		//ctx.fillStyle ="rgba(255, 0, 255,1.0)";

		var currentUV = this.uv.slice();

		if (this.uv[0] < c.width - textLength) {
			//currentUV = this.uv[0];
		} else {
			currentUV[0] = 0;
			currentUV[1] += textSize;
		}
		ctx.fillText(text, currentUV[0] + textLength / 2, currentUV[1] + textSize / 2);
		this.uv[0] = currentUV[0] + textLength;
		this.uv[1] = currentUV[1]; // + textSize;

		return [currentUV[0] / this.canvas.width, 1 - currentUV[1] / this.canvas.height, textLength / this.canvas.width, textSize / this.canvas.height];
	},
	drawHPCanvasTest: function(text, options, canvas) {
		if (!options) options = {};
		if (!this.canvas) {
			this.canvas = document.createElement("canvas");
			//document.body.appendChild(this.canvas);
			//SIZE TEST
			var canvasTest = document.createElement("canvas");
			var gl = canvasTest.getContext("webgl") || canvasTest.getContext("experimental-webgl");
			var maxSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
			console.log("Maximum texture size " + maxSize);
			//
			this.canvas.width = this.canvas.height = maxSize / 2;
			var ctx = this.canvas.getContext("2d");
			ctx.textBaseline = 'middle';
			ctx.textAlign = "center";
			ctx.fillStyle = "rgba(0, 0, 0, 0)";
			ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			var font = "24px Comic Sans MS, cursive, sans-serif";
			ctx.font = font;
			this.ctx = ctx;
		}

		var textSize = 28;
		var textLength = this.ctx.measureText(text).width + 4;
		//reapply font
		this.ctx.font = font;
		this.ctx.fillStyle = "rgba(255, 255, 255,1.0)";
		var currentUV = this.uv.slice();

		if (this.uv[0] < this.canvas.width - textLength) {
			//currentUV = this.uv[0];
		} else {
			currentUV[0] = 0;
			currentUV[1] += textSize;
		}
		this.ctx.fillText(text, currentUV[0] + textLength / 2, currentUV[1] + textSize / 2);
		this.uv[0] = currentUV[0] + textLength;
		this.uv[1] = currentUV[1]; // + textSize;

		return [currentUV[0] / this.canvas.width, 1 - currentUV[1] / this.canvas.height, textLength / this.canvas.width, textSize / this.canvas.height];
	},


	/**
	var spritey = makeTextSprite( " World! ", 
		{ fontsize: 32, fontface: "Georgia", borderColor: {r:0, g:0, b:255, a:1.0} } );
	spritey.position.set(55,105,55);
	scene.add( spritey );
	*/
	makeTextSprite: function(message, parameters) {
		var canvas = KUtils.drawCanvas(message, parameters);
		var texture = new THREE.Texture(canvas);
		texture.needsUpdate = true;

		var spriteMaterial = new THREE.SpriteMaterial({
			map: texture
				//side: THREE.DoubleSide
				//useScreenCoordinates: false,
				//alignment: spriteAlignment
		});
		var sprite = new THREE.Sprite(spriteMaterial);
		sprite.scale.set(canvas.width, canvas.height, 1);
		return sprite;
	},
	makeHPTextSprite: function(message, parameters) {
		var uv = KUtils.drawHPCanvasTest(message, parameters);
		if (!this.texture) {
			this.texture = new THREE.Texture(this.canvas);
		} else {
			this.texture.needsUpdate = true;
		}
		return {
			texture: this.texture,
			uv: uv
		};
	},
	cubeUVProjectionGroup: function(object3d, realW, realH) {
		object3d.traverse(function(mesh) {
			if (mesh instanceof THREE.Mesh)
				KUtils.cubeUVProjection(mesh, realW, realH);
		});
	},
	cubeUVProjection: function(mesh, realW, realH) {
		if (mesh instanceof THREE.Mesh) {
			if (mesh.material) {
				var hasTexture = true;
				// if (mesh.material.materials) {
				// 	mesh.material.materials.forEach(function(mat) {
				// 		if (mat.map || mat.bumpMap || mat.envMap || mat.displacementMap || mat.normalMap) {
				// 			//FIXME only project if uv is empty
				// 			hasTexture = true;
				// 		}
				// 	})
				// } else {
				// 	if (mesh.material.map || mesh.material.bumpMap || mesh.material.envMap || mesh.material.displacementMap || mesh.material.normalMap) {

				// 		hasTexture = true;
				// 	}
				// }
				if (hasTexture) {
					KUtils.assignUVs(mesh.geometry, realW, realH); //30cmx30cm pattern

				}
			}
		}
	},
	generateExtrude: function(data, settings, mat, holes) {
		var shape = new THREE.Shape();

		data.forEach(function(child, index) {
			if (!index)
				shape.moveTo(data[index][0], data[index][1]);
			else
				shape.lineTo(data[index][0], data[index][1]);
		});
		if (holes)
			holes.forEach(function(hole) {
				var hole1 = new THREE.Path(hole);
				shape.holes.push(hole1);
			});
		var mesh = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, settings), mat);
		return mesh;
	},
	getGroup: function(child) {
		var result = child.parent;
		while (!(result instanceof THREE.Group) || !$.isNumeric(result.name)) { // RB fix to get id of the parent of a window
			result = result.parent;
		}
		return result;
	},
	setGroupColor: function(group, color) {
		if (color === null || color === undefined) {
			group.traverse(function(child) {
				if (child.material)
					if (child.material.color) {
						child.material.color.copy(child.material._color);
					} else if (child.material.materials) {
					child.material.materials.forEach(function(mat) {
						mat.color.copy(mat._color);
					});
				}
			});
		} else
			group.traverse(function(child) {
				if (child.material)
					if (child.material.color) {
						if (!child.material._color) {
							child.material._color = new THREE.Color();
							child.material._color.copy(child.material.color);
						}
						child.material.color.setHex(color);
					} else if (child.material.materials) {
					child.material.materials.forEach(function(mat) {
						if (!mat._color) {
							mat._color = new THREE.Color();
							mat._color.copy(mat.color);
						}
						mat.color.setHex(color);
					});
				}
			});
	}

}
if (typeof module != 'undefined')
	module.exports = KUtils;