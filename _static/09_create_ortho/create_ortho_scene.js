/**
 * create_ortho_render.js, By Wayne Brown, Spring 2016
 */

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 C. Wayne Brown
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

"use strict";

/** -----------------------------------------------------------------------
 * Create a WebGL 3D scene, store its state, and render its models.
 *
 * @param id {string} The id of the webglinteractive directive
 * @param download {SceneDownload} An instance of the SceneDownload class
 * @param vshaders_dictionary {object} A dictionary of vertex shaders.
 * @param fshaders_dictionary {object} A dictionary of fragment shaders.
 * @param models {object} A dictionary of models.
 * @constructor
 */
window.CreateOrthoScene = function (id, download, vshaders_dictionary,
                                   fshaders_dictionary, models) {

  // Private variables
  let self = this;
  let my_canvas;
  let out = download.out;

  let gl = null;
  let program = null;
  let render_models;
  let model_gpu;
  let ortho_model;
  let camera_models;

  let matrix = new GlMatrix4x4();
  let transform = matrix.create();
  let view_Rx = matrix.create();
  let view_Ry = matrix.create();
  self.translate = matrix.create();
  matrix.translate(self.translate, -2, -2, -4);
  self.translate2 = matrix.create();
  matrix.translate(self.translate2, 3, 3, 6);
  let base = matrix.create();

  // self.camera is the camera for the scene
  self.camera = matrix.create();
  matrix.lookAt(self.camera, 0, 0, 5, 0, 0, 0, 0, 1, 0);

  // backaway_camera is the camera that sees the entire environment.
  let backaway_camera = matrix.create();
  let camera_distance = 10;
  self.ortho = null;

  let backaway_orth = matrix.createOrthographic(-12, 12, -12, 12, -40, 40);

  let view_volume_scale = matrix.create();
  let view_volume_translate = matrix.create();

  matrix.setIdentity(view_Rx);
  matrix.setIdentity(view_Ry);

  // Public variables that will possibly be used or changed by event handlers.
  self.canvas = null;
  self.angle_x = 20.0 * 0.017453292519943295;
  self.angle_y = 10.0 * 0.017453292519943295;
  self.left = -5.0;
  self.right = 5.0;
  self.bottom = -5.0;
  self.top = 5.0;
  self.near = 0.0;
  self.far = 10.0;
  self.change_canvas_size = false;

  let model_names = ["textz","texty","textx","cubey","cubex","cubez","cube_center"];
  let ortho_model_name = "viewing_volume";
  let camera_model_names = ["Camera_lens", "Camera", "Camera_body", "u_axis", "v_axis", "n_axis"];

  //-----------------------------------------------------------------------
  self.render = function () {
    let ex, ey, ez, dist;

    // Calculate and set the camera for the entire rendering
    ex = Math.sin(self.angle_x) * camera_distance;
    ez = Math.cos(self.angle_x) * camera_distance;
    ey = Math.sin(self.angle_y) * camera_distance;
    dist = Math.sqrt(ex * ex + ey * ey + ez * ez);
    ex = (ex / dist) * camera_distance;
    ey = (ey / dist) * camera_distance;
    ez = (ez / dist) * camera_distance;
    matrix.lookAt(backaway_camera, ex, ey, ez, 0, 0, 0, 0, 1, 0);

    // Create the base transform which is built upon for all other transforms
    matrix.multiplySeries(base, backaway_orth, backaway_camera);

    // Draw the camera at the origin.
    for (let j=0; j<camera_models.length; j +=1 ) {
      camera_models[j].render(base);
    }

    matrix.multiplySeries(base, backaway_orth, backaway_camera, self.camera);

    // Draw each model
    for (let j = 0; j < render_models.length; j += 1) {
      render_models[j].render(base);
    }

    // Translate the position of the second rendering of the model
    matrix.multiplySeries(transform, base, self.translate);

    // Draw each model
    for (let j = 0; j < render_models.length; j += 1) {
      render_models[j].render(transform);
    }

    // Translate the position of the second rendering of the model
    matrix.multiplySeries(transform, base, self.translate2);

    // Draw each model behind the camera
    for (let j = 0; j < render_models.length; j += 1) {
      render_models[j].render(transform);
    }

    // Draw an outline of the orthographic volume
    self.ortho = matrix.createOrthographic(self.left, self.right,
                                           self.bottom, self.top,
                                           self.near, self.far);
    let sx = (self.right - self.left) / 2;
    let sy = (self.top - self.bottom) / 2;
    let sz = (self.far - self.near) / 2;
    // console.log('scale', sx, sy, sz);
    let tx = self.right - sx;
    let ty = self.top - sy;
    let tz = -(self.near + sz);
    // console.log('translate', tx, ty, tz);
    matrix.scale(view_volume_scale, sx, sy, sz);
    matrix.translate(view_volume_translate, tx, ty, tz);

    matrix.multiplySeries(transform, backaway_orth, backaway_camera,
                          view_volume_translate, view_volume_scale);
    ortho_model.render(transform);

    // Render the right canvas to show what the scene looks like with
    // this orthographic projection.
    right_canvas.render();
  };

  //-----------------------------------------------------------------------
  self.delete = function () {

    // Clean up shader programs
    gl.deleteShader(program.vShader);
    gl.deleteShader(program.fShader);
    gl.deleteProgram(program);

    // Delete each model's VOB
    for (let j = 0; j < render_models.length; j += 1) {
      render_models[j].delete(gl);
    }

    ortho_model.delete(gl);

    // Remove all event handlers
    events.removeAllEventHandlers();

    // Disable any animation
    self.animate_active = false;
  };

  //-----------------------------------------------------------------------
  // Object constructor. One-time initialization of the scene.

  // Get the rendering context for the canvas
  my_canvas = download.getCanvas(id + "_canvas");  // by convention
  if (my_canvas) {
    gl = download.getWebglContext(my_canvas);
  }
  if (!gl) {
    return;
  }

  // Set up the rendering program and set the state of webgl
  program = download.createProgram(gl, vshaders_dictionary["color_per_vertex"], fshaders_dictionary["color_per_vertex"]);

  gl.useProgram(program);

  gl.enable(gl.DEPTH_TEST);

  gl.clearColor(0.98, 0.98, 0.98, 1.0);

  // Create Vertex Object Buffers for the models
  render_models = new Array(model_names.length);
  for (let j = 0; j < model_names.length; j += 1) {
    model_gpu = new ModelArraysGPU(gl, models[model_names[j]], out);
    render_models[j] = new RenderColorPerVertex(gl, program, model_gpu, out);
  }

  model_gpu = new ModelArraysGPU(gl, models[ortho_model_name], out);
  ortho_model = new RenderColorPerVertex(gl, program, model_gpu, out);

  camera_models = new Array(camera_model_names.length);
  for (let j = 0; j<camera_model_names.length; j += 1) {
    model_gpu = new ModelArraysGPU(gl, models[camera_model_names[j]], out);
    camera_models[j] = new RenderColorPerVertex(gl, program, model_gpu, out);
  }

  let right_canvas = new OrthoScene(id, download, vshaders_dictionary,
    fshaders_dictionary, models, self);

  // Set up callbacks for user and timer events
  let events = new CreateOrthoEvents(id, self);
};

