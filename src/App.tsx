import "./App.css";
import triangleVertWGSL from "./shader.wgsl";
import { useEffect } from "react";

import { u32, mat4x4f, vec4f, struct, arrayOf, vec2f } from "typegpu/data";
import tgpu from "typegpu";
import { getRotationMatrix } from "./camera";

const GRID_SIZE = 80;
const SINE_SEEDS = vec4f(1, -0.5, 0.5, 0.1);
const CAMERA_MATRIX = mat4x4f(
  vec4f(0.707, 0.408, 0, 0), // first column
  vec4f(0, 0.816, 0, 0), // second column
  vec4f(-0.707, 0.408, 0, 0), // third column
  vec4f(0, 0, 0, 0.3) // fourth column
);

/*
#eadcb7	(234,220,183)
#f47276	(244,114,118)
#e99a06	(233,154,6)
#3eb8a5	(62,184,165)
#afcd95	(175,205,149)
*/

const POINTS = [
  // positions go from -1 to 1
  { position: vec2f(-1, -1), color: vec4f(234 / 256, 220 / 256, 183 / 256, 1) },
  { position: vec2f(-1, 1), color: vec4f(244 / 256, 114 / 256, 118 / 256, 1) },
  { position: vec2f(0, -0.5), color: vec4f(233 / 256, 154 / 256, 6 / 256, 1) },
];

function getUniforms(device: GPUDevice) {
  // const bufferSize = 16 * 4;
  // let uniformBuffer = device.createBuffer({
  //   size: bufferSize, // The size of the buffer depends on the size of your uniform data
  //   usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST, // The buffer may be used as a uniform and maybe copied into
  // });
  // Defining a struct type
  const Point = struct({
    position: vec2f,
    color: vec4f,
  });
  const Uniforms = struct({
    cameraMatrix: mat4x4f,
    gridSize: u32,
    // needed for alignment – need to ask Iwo about it
    pointCount: u32,
    // somethingElse: u32,
    // somethingElseElse: u32,
    sineSeeds: vec4f,
    points: arrayOf(Point, 10),
  });

  // Creating and initializing a buffer. The type hint is:
  // TgpuBuffer<TgpuStruct<{
  //   position: Vec3f,
  //   health: U32,
  // }>> & Unmanaged
  /*
  mat4x4<f32>(
    vec4<f32>(0.707, 0.408, 0, 0), // first column
    vec4<f32>(0, 0.816, 0, 0),     // second column
    vec4<f32>(-0.707, 0.408, 0, 0), // third column
    vec4<f32>(0, 0, 0, 1)          // fourth column
  );*/
  const buffer = tgpu
    .createBuffer(Uniforms, {
      cameraMatrix: CAMERA_MATRIX,
      gridSize: GRID_SIZE,
      pointCount: POINTS.length,
      sineSeeds: SINE_SEEDS,
      points: POINTS,
    })
    .$usage(tgpu.Uniform)
    .$device(device);

  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0, // The index that will be used in the shader to access this data
        visibility: GPUShaderStage.VERTEX + GPUShaderStage.FRAGMENT, // This data will be accessible in the vertex shader
        buffer: {
          type: "uniform",
        },
      },
    ],
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: buffer.buffer,
        },
      },
    ],
  });

  // document
  //   .getElementById("canvas")
  //   ?.addEventListener("mousemove", function (event) {
  //     tgpu.write(buffer, {
  //       cameraMatrix: getRotationMatrix(
  //         (event.clientY + event.clientX / 2) / window.innerHeight / 1.5,
  //         event.clientY / window.innerHeight / 1.5,
  //         event.clientX / window.innerWidth / 1.5
  //       ),
  //       gridSize: GRID_SIZE,
  //       sineSeeds: vec4f(
  //         1,
  //         -0.5,
  //         0.5,
  //         (window.performance?.timeOrigin - Date.now()) / 100
  //       ),
  //     });
  //   });

  return { bindGroupLayout, bindGroup, buffer };
}

async function renderWebGPU() {
  const canvas = document.querySelector("canvas") as HTMLCanvasElement;
  const adapter = await navigator.gpu?.requestAdapter();
  const device = await adapter?.requestDevice();
  if (!device) return;

  const context = canvas.getContext("webgpu") as GPUCanvasContext;

  const devicePixelRatio = window.devicePixelRatio;
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  const presentationFormat = navigator.gpu.getPreferredCanvasFormat();

  const uniforms = getUniforms(device);

  context.configure({
    device,
    format: presentationFormat,
    alphaMode: "premultiplied",
  });

  const pipeline = device.createRenderPipeline({
    layout: device.createPipelineLayout({
      bindGroupLayouts: [uniforms.bindGroupLayout],
    }),
    vertex: {
      module: device.createShaderModule({
        code: triangleVertWGSL,
      }),
    },
    fragment: {
      module: device.createShaderModule({
        code: triangleVertWGSL,
      }),
      targets: [
        {
          format: presentationFormat,
        },
      ],
    },
    primitive: {
      topology: "triangle-list",
    },
  });

  function frame() {
    if (!device) return;
    tgpu.write(uniforms.buffer, {
      cameraMatrix: getRotationMatrix(
        Math.sin((window.performance?.timeOrigin - Date.now()) / 50000) / 2.5,
        Math.cos((window.performance?.timeOrigin - Date.now()) / 54000) / 2.5,
        0
      ),
      gridSize: GRID_SIZE,
      pointCount: POINTS.length,
      sineSeeds: vec4f(
        1,
        -0.5,
        0.5,
        (window.performance?.timeOrigin - Date.now()) / 100
      ),
      points: POINTS,
    });
    const commandEncoder = device.createCommandEncoder();
    const textureView = context.getCurrentTexture().createView();
    const renderPassDescriptor: GPURenderPassDescriptor = {
      colorAttachments: [
        {
          view: textureView,
          clearValue: [0, 0, 0, 1],
          loadOp: "clear",
          storeOp: "store",
        },
      ],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(pipeline);
    passEncoder.setBindGroup(0, uniforms.bindGroup);
    passEncoder.draw(3 * 2 * GRID_SIZE * GRID_SIZE);
    passEncoder.end();

    device.queue.submit([commandEncoder.finish()]);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

function App() {
  useEffect(() => {
    renderWebGPU();
  });
  return (
    <canvas id="canvas" style={{ width: "100vw", height: "100vh" }}></canvas>
  );
}

export default App;
