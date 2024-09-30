import "./App.css";
import triangleVertWGSL from "./shader.wgsl";
import { useEffect } from "react";

import { u32, mat4x4f, vec4f, struct, arrayOf, vec2f } from "typegpu/data";
import tgpu from "typegpu";
import { getRotationMatrix } from "./camera";

const GRID_SIZE = 80;
const CAMERA_MATRIX = mat4x4f(
  vec4f(0.707, 0.408, 0, 0), // first column
  vec4f(0, 0.816, 0, 0), // second column
  vec4f(-0.707, 0.408, 0, 0), // third column
  vec4f(0, 0, 0, 0.3) // fourth column
);

function getUniforms(device: GPUDevice) {
  const Uniforms = struct({
    cameraMatrix: mat4x4f,
    gridSize: u32,
    // LOOK HERE: needed for alignment
    somethingElse: u32,
    somethingElseElse: u32,
    something: u32,
  });

  const buffer = tgpu
    .createBuffer(Uniforms, {
      cameraMatrix: CAMERA_MATRIX,
      gridSize: GRID_SIZE,
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
