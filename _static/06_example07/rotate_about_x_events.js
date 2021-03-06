/**
 * ScaleAboutOriginEvents.js, By Wayne Brown, Fall 2017
 *
 * These event handlers can modify the characteristics of a scene.
 * These will be specific to a scene's models and the models' attributes.
 */

/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2017 C. Wayne Brown
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

//-------------------------------------------------------------------------
/**
 * Event handlers for a scene.
 * @param id - the webgldemo ID used to give HTML tags unique names
 * @param scene - an instance of the rendering object
 * @constructor
 */
window.RotateAboutXEvents = function (id, scene) {

  // Private variables
  let self = this;
  let out = scene.out;

  // Remember the current state of events
  let start_of_mouse_drag = null;
  let previous_time = Date.now();
  let animate_is_on = scene.animate_active;

  // Control the rate at which animations refresh
  let frame_rate = 30; // 33 milliseconds = 1/30 sec


  //-----------------------------------------------------------------------
  self.mouse_drag_started = function (event) {

    //console.log("started mouse drag event x,y = " + event.clientX + " " + event.clientY + "  " + event.which);
    start_of_mouse_drag = event;
    event.preventDefault();

    if (animate_is_on) {
      scene.animate_active = false;
    }
  };

  //-----------------------------------------------------------------------
  self.mouse_drag_ended = function (event) {

    //console.log("ended mouse drag event x,y = " + event.clientX + " " + event.clientY + "  " + event.which);
    start_of_mouse_drag = null;

    event.preventDefault();

    if (animate_is_on) {
      scene.animate_active = true;
      self.animate();
    }
  };

  //-----------------------------------------------------------------------
  self.mouse_dragged = function (event) {
    let delta_x, delta_y;

    //console.log("drag event x,y = " + event.clientX + " " + event.clientY + "  " + event.which);
    if (start_of_mouse_drag) {
      delta_x = event.clientX - start_of_mouse_drag.clientX;
      delta_y = -(event.clientY - start_of_mouse_drag.clientY);
      //console.log("moved: " + delta_x + " " + delta_y);

      scene.angle_x -= delta_y;
      scene.angle_y += delta_x;
      scene.render();

      start_of_mouse_drag = event;
      event.preventDefault();
    }
  };

  //------------------------------------------------------------------------------
  self.animation_status = function (event) {
    out.showInfo('animation_status event happened');
    if ($(event.target).is(":checked"))  {
      animate_is_on = true;
      scene.animate_active = true;
      self.animate();
    } else {
      animate_is_on = false;
      scene.animate_active = false;
    }
  };

  //------------------------------------------------------------------------------
  self.resetSliders = function (new_value) {

    let angle = $('#' + id + '_angle');
    angle.val(new_value);
    angle.prev().html(new_value.toFixed(2));

    let tx = $('#' + id + '_tx');
    tx.val(new_value);
    tx.prev().html(new_value.toFixed(2));

    let ty = $('#' + id + '_ty');
    ty.val(new_value);
    ty.prev().html(new_value.toFixed(2));

    let tz = $('#' + id + '_tz');
    tz.val(new_value);
    tz.prev().html(new_value.toFixed(2));
  };

  //------------------------------------------------------------------------------
  self.reset = function (event) {
    let control = $(event.target);

    scene.angle_x = 0.0;
    scene.angle_y = 0.0;
    scene.x_angle = 0.0;
    scene.tx = 0.0;
    scene.ty = 0.0;
    scene.tz = 0.0;
    scene.render();

    self.resetSliders(0);
  };

  //------------------------------------------------------------------------------
  self.angle = function (event) {
    let control = $(event.target);

    let angle = Number(control.val());
    scene.x_angle = angle;
    scene.render();

    // Update the value of the slider
    control.prev().html(angle.toFixed(2));
  };

  //------------------------------------------------------------------------------
  self.tx = function (event) {
    let control = $(event.target);

    let tx = Number(control.val());
    scene.tx = tx;
    scene.render();

    // Update the value of the slider
    control.prev().html(tx.toFixed(2));
  };

  //------------------------------------------------------------------------------
  self.ty = function (event) {
    let control = $(event.target);

    let ty = Number(control.val());
    scene.ty = ty;
    scene.render();

    // Update the value of the slider
    control.prev().html(ty.toFixed(2));
  };

  //------------------------------------------------------------------------------
  self.tz = function (event) {
    let control = $(event.target);

    let tz = Number(control.val());
    scene.tz = tz;
    scene.render();

    // Update the value of the slider
    control.prev().html(tz.toFixed(2));
  };

  //------------------------------------------------------------------------------
  self.animate = function () {

    let now, elapsed_time;

    if (scene.animate_active) {

      now = Date.now();
      elapsed_time = now - previous_time;
      requestAnimationFrame(self.animate);

      if (elapsed_time >= frame_rate) {
        previous_time = now;

        scene.angle_x -= 0.5;
        scene.angle_y += 1;
        scene.render();
      }

    }
  };

  //------------------------------------------------------------------------------
  self.removeAllEventHandlers = function () {
    $('#' + id + '_animate_status').unbind("click", self.animation_status);
    $('#' + id + '_reset').unbind("click", self.reset);
    $('#' + id + '_angle').unbind("click", self.angle);
    $('#' + id + '_tx').unbind("click", self.tx);
    $('#' + id + '_ty').unbind("click", self.ty);
    $('#' + id + '_tz').unbind("click", self.tz);

    let cid = '#' + id + "_canvas";
    $( cid ).unbind("mousedown", self.mouse_drag_started );
    $( cid ).unbind("mouseup",   self.mouse_drag_ended );
    $( cid ).unbind("mousemove", self.mouse_dragged );
  };

  //------------------------------------------------------------------------------
  // Constructor code for the class.

  // Add an onclick callback to each HTML control
  $('#' + id + '_animate_status').on('click', self.animation_status);
  $('#' + id + '_reset').on('click', self.reset);
  $('#' + id + '_angle').on("input change", self.angle);
  $('#' + id + '_tx').on("input change", self.tx);
  $('#' + id + '_ty').on("input change", self.ty);
  $('#' + id + '_tz').on("input change", self.tz);

  // Add standard mouse events to the canvas
  let cid = '#' + id + "_canvas";
  $( cid ).mousedown( self.mouse_drag_started );
  $( cid ).mouseup( self.mouse_drag_ended );
  $( cid ).mousemove( self.mouse_dragged );

};



