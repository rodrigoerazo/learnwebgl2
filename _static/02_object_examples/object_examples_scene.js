/**
 * object_examples_scene.js, By Wayne Brown, Fall 2017
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
 * @param download {object} An instance of the SceneDownload class
 * @param vshaders_dictionary {dict} A dictionary of vertex shaders.
 * @param fshaders_dictionary {dict} A dictionary of fragment shaders.
 * @param models {dict} A dictionary of models.
 * @constructor
 */
window.ObjectExampleScene = function (id, download, vshaders_dictionary,
                                fshaders_dictionary, models) {

  // Private variables
  let self = this; // Store a local reference to the new object.
  let my_canvas = null;

  let gl = null;
  let program = null;
  let model_VOBs = null;
  let model_gpu = null;

  let matrix = new GlMatrix4x4();
  let transform = matrix.create();
  let projection_matrix = matrix.createOrthographic(-4.0, 4.0, -4.0, 4.0, -8.0, 8.0);
  let camera_matrix = matrix.create();
  let rotate_x_matrix = matrix.create();
  let rotate_y_matrix = matrix.create();

  // Public variables that will be changed by event handlers.
  self.canvas = null;
  self.angle_x = 0.0;
  self.angle_y = 0.0;
  self.animate_active = true;
  self.out = download.out;

  //-----------------------------------------------------------------------
  // Public function to render the scene.
  self.render = function () {

    // Build individual transforms
    matrix.setIdentity(transform);
    matrix.rotate(rotate_x_matrix, self.angle_x, 1, 0, 0);
    matrix.rotate(rotate_y_matrix, self.angle_y, 0, 1, 0);

    // Combine the transforms into a single transformation
    matrix.multiplySeries(transform, projection_matrix, camera_matrix,
                          rotate_x_matrix, rotate_y_matrix);

    // Draw each model
    for (let j = 0; j < model_VOBs.length; j += 1) {
      model_VOBs[j].render(transform);
    }
  };

  //-----------------------------------------------------------------------
  // Public function to delete and reclaim all rendering objects.
  self.delete = function () {
    // Clean up shader programs
    gl.deleteShader(program.vShader);
    gl.deleteShader(program.fShader);
    gl.deleteProgram(program);

    // Delete each model's VOB
    for (let j = 0; j < model_VOBs.length; j += 1) {
      model_VOBs[j].delete(gl);
    }
    model_VOBs = [];

    // Remove all event handlers
    events.removeAllEventHandlers();

    // Disable any animation
    self.animate_active = false;
  };

  //-----------------------------------------------------------------------
  // Object constructor. One-time initialization of the scene.

  // Get the rendering context for the canvas
  my_canvas = download.getCanvas(id + "_canvas");
  if (my_canvas) {
    gl = download.getWebglContext(my_canvas);
  }
  if (!gl) {
    return;
  }

  // Set up the rendering program and set the state of webgl
  program = download.createProgram(gl, vshaders_dictionary["color_per_vertex"], fshaders_dictionary["color_per_vertex"]);
  gl.useProgram(program);

  // Enable hidden-surface removal
  gl.enable(gl.DEPTH_TEST);

  gl.clearColor(0.98, 0.98, 0.98, 1.0);

  matrix.lookAt(camera_matrix, 0, 0, 4, 0, 0, 0, 0, 1, 0);

  // Create Vertex Object Buffers for the models
  let n = models.number_models;
  model_VOBs = new Array(n);
  for (let j = 0; j < n; j += 1) {
    model_gpu = new ModelArraysGPU(gl, models[j], download.out);
    model_VOBs[j] = new RenderColorPerVertex(gl, program, model_gpu, download.out);
  }

  // Set up callbacks for user and timer events
  let events;
  events = new ExampleObjectsEvents(id, self);
  events.animate();
};
