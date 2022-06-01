

function init_webgl() {
  // Get A WebGL context
  var canvas = document.getElementById("main_canvas");
  canvas.width = document.documentElement.clientWidth;
  canvas.height = document.documentElement.clientHeight;

  gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  // Use our boilerplate utils to compile the shaders and link into a program
  var program = webglUtils.createProgramFromScripts(gl, ["vertex-shader-2d", "fragment-shader-2d"]);

  // look up where the vertex data needs to go.
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  var colorAttributeLocation = gl.getAttribLocation(program, "a_color");

  // look up uniform locations
  var resolutionUniformLocation = gl.getUniformLocation(program, "u_resolution");

  // Create a buffer to put three 2d clip space points in
  positionBuffer = gl.createBuffer();

  colorBuffer = gl.createBuffer();

  webglUtils.resizeCanvasToDisplaySize(gl.canvas);

  // Tell WebGL how to convert from clip space to pixels
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Bind the position buffer.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  var size = 2; // 2 components per iteration
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation, size, type, normalize, stride, offset);

  gl.enableVertexAttribArray(colorAttributeLocation);

  // 绑定颜色缓冲
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

  // 告诉颜色属性怎么从 colorBuffer (ARRAY_BUFFER) 中读取颜色值
  var size = 4; // 每次迭代使用4个单位的数据
  var type = gl.FLOAT; // 单位数据类型是32位的浮点型
  var normalize = false; // 不需要归一化数据
  var stride = 0; // 0 = 移动距离 * 单位距离长度sizeof(type) 
  // 每次迭代跳多少距离到下一个数据
  var offset = 0; // 从绑定缓冲的起始处开始
  gl.vertexAttribPointer(
    colorAttributeLocation, size, type, normalize, stride, offset)

  // set the resolution
  gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

  container = document.getElementById("container");
}

init_webgl();

function draw_line(x1, y1, x2, y2) {
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  let positions = [
    x1, y1,
    x2, y2,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.drawArrays(gl.LINES, 0, 2);
}

function draw_rectangle(x1, y1, x2, y2) {
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  let positions = [
    x1, y1,
    x1, y2,
    x2, y1,
    x1, y2,
    x2, y1,
    x2, y2,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function put_text(text, x, y, color) {
  let div = document.createElement("div");
  div.className = "overlay";
  div.style.left = x + "px";
  div.style.top = y + "px";
  let span = document.createElement("span");
  div.appendChild(span);
  // 创建文字节点为浏览器节省一些时间
  let textNode = document.createElement("font");
  span.appendChild(textNode);
  textNode.textContent = text;
  textNode.style.color = color;
  container.appendChild(div);
}

function set_color(r255, g255, b255) {
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  let r = r255 / 255;
  let g = g255 / 255;
  let b = b255 / 255;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(
      [r, g, b, 1,
        r, g, b, 1,
        r, g, b, 1,
        r, g, b, 1,
        r, g, b, 1,
        r, g, b, 1,
      ]),
    gl.STATIC_DRAW);

}

function set_background_color(r, g, b) {
  gl.clearColor(r, g, b, 1);
}


function clear_canvas() {
  gl.clear(gl.COLOR_BUFFER_BIT);
  let divs = document.getElementsByClassName("overlay");
  for (let i = 0; i < divs.length; i++) {
    divs[i].remove();
  }
}


function remove() {
  if (!pause_time) {
    return;
  }
  let g_top = 50;
  let square_edge = 30;
  let g_left = 100;
  let interval = 10;
  let pathHgiht = 350;

  let canvas = document.getElementById("main_canvas");
  canvas.style.cursor = "hand";
  canvas.onclick = function (event) {
    let x = event.offsetX;
    let y = event.offsetY;
    for (let i = 0; i < sending_confirm_packets.length; i++) {
      let packet = sending_confirm_packets[i];
      let left = g_left + (square_edge + interval) * packet.sequence_number;
      let top = g_top + pathHgiht - pathHgiht * (packet.position / total_distance);
      if (x > left && x < left + square_edge && y > top && y < top + square_edge) {
        delete_confirm_packet(packet.key_number);
        canvas.onclick = null;
        canvas.style.cursor = "";
        return;
      }
    }
    for (let i = 0; i < sending_data_packets.length; i++) {
      let packet = sending_data_packets[i];
      let left = g_left + (square_edge + interval) * packet.sequence_number;
      let top = g_top + pathHgiht * (packet.position / total_distance);
      if (x > left && x < left + square_edge && y > top && y < top + square_edge) {
        delete_data_packet(packet.key_number);
        canvas.style.cursor = "";
        canvas.onclick = null;
        return;
      }
    }
  }
}

function init_canvas(group_numbers) {
  set_color(255, 255, 0);
  set_background_color(245/255,222/255,179/255);
  clear_canvas();
  draw_scene();
}

function draw_scene() {
  let top = 50;
  let square_edge = 30;
  let left = 100;
  let interval = 10;
  let pathHgiht = 350;

  clear_canvas();
  let i = 0;
  // 已传输分组
  for (i = 0; i < packetNum; i++) {
    if ((cfm_buffer & (1 << i)) != 0) {
      draw_confrim_packet(i);
    } else {
      if ((send_buffer & (1 << i)) != 0) {
        draw_sended_packet(i);
      } else {
        draw_unsended_packet(i);
      }
    }
  }

  draw_sending_data_packet();
  draw_sending_confirm_packet();


  for (i = 0; i < packetNum; i++) {
    if ((rcv_buffer & (1 << i)) != 0) {
      draw_received_packet(i);
    } else {
      draw_unreceived_packet(i);
    }
  }

  draw_slideWindow();
  draw_info_box();

  function draw_confrim_packet(i) {
    set_color(255,165,0);
    draw_rectangle(left + (interval + square_edge) * i, top, left + (interval + square_edge) * i + square_edge, top + square_edge);
  }

  function draw_sended_packet(i) {
    set_color(255,239,213);
    draw_rectangle(left + (interval + square_edge) * i, top, left + (interval + square_edge) * i + square_edge, top + square_edge);
  }

  function draw_sending_data_packet() {
    set_color(255,215,0);
    for (let i = 0; i < sending_data_packets.length; i++) {
      let packet = sending_data_packets[i];
      let x = left + (square_edge + interval) * packet.sequence_number;
      let y = top + pathHgiht * packet.position / total_distance;
      draw_rectangle(x, y, x + 30, y + 30);
    }
  }

  function draw_sending_confirm_packet() {
    set_color(255,165,0);
    for (let i = 0; i < sending_confirm_packets.length; i++) {
      let packet = sending_confirm_packets[i];
      let x = left + (square_edge + interval) * packet.sequence_number;
      let y = top + pathHgiht - pathHgiht * (packet.position / total_distance);
      draw_rectangle(x, y, x + 30, y + 30);
    }
  }

  function draw_unsended_packet(i) {
    set_color(255, 255, 0);
    draw_rectangle(left + (interval + square_edge) * i, top, left + (interval + square_edge) * i + square_edge, top + square_edge);
  }

  function draw_unreceived_packet(i) {
    set_color(128, 128, 128);
    let x = left + (interval + square_edge) * i;
    let y = top + pathHgiht;
    draw_rectangle(x, y, x + square_edge, y + square_edge);
  }

  function draw_received_packet(i) {
    set_color(205,133,63);
    let x = left + (interval + square_edge) * i;
    let y = top + pathHgiht;
    draw_rectangle(x, y, x + square_edge, y + square_edge);
  }

  function draw_slideWindow() {
    let x = (interval + square_edge) * base + left - interval/2;
    let width = (interval + square_edge) * windowSize;
    if (base+windowSize>=packetNum){
       x = left + (interval + square_edge) * (packetNum-windowSize) - interval/2;
    }
    let y = top - interval/2;
    draw_line(x, y, x, y + square_edge + interval);
    draw_line(x, y, x + width, y);
    draw_line(x + width, y, x + width, y + square_edge + interval);
    draw_line(x, y + square_edge + interval, x + width, y + square_edge + interval);
    
    x = (interval + square_edge) * expectedseq + left - interval/2;
    if (expectedseq+windowSize>=packetNum){
      x = left + (interval + square_edge) * (packetNum-windowSize) - interval/2;
   }
   y = top + pathHgiht - interval/2;
   draw_line(x, y, x, y + square_edge + interval);
    draw_line(x, y, x + width, y);
    draw_line(x + width, y, x + width, y + square_edge + interval);
    draw_line(x, y + square_edge + interval, x + width, y + square_edge + interval);
    
  }

  function draw_info_box(){

    put_text('unsended packets',160,585,000000);
    set_color(255, 255, 0);
    draw_rectangle(120,580,120+square_edge,580+square_edge);

    put_text('waiting ACK',360,585,000000);
    set_color(255,239,213);
    draw_rectangle(320,580,320+square_edge,580+square_edge);

    put_text('ACKed / ACK',560,585,000000);
    set_color(255,165,0);
    draw_rectangle(520,580,520+square_edge,580+square_edge);

    put_text('unreceived packets',760,585,0);
    set_color(128, 128, 128);
    draw_rectangle(720,580,720+square_edge,580+square_edge);

    put_text('received packets',960,585,0);
    set_color(205,133,63);
    draw_rectangle(920,580,920+square_edge,580+square_edge);

    put_text('发送方:',20,top+5,0)
    put_text('接受方:',20,top+pathHgiht+5,0)

    put_text('base:'+base,1200,200,0)
    put_text('nextseqnum:'+nextseq,1200,250,0)

    let x = (interval + square_edge) * base + left + square_edge / 6;
    for(let i=0;i<windowSize;i++){
      put_text(parseInt((timeout - clocks[i+base].time) / 500),x+i * (square_edge + interval),top-30,0);
    }
  }
}



function reset(){
   location.reload();
}