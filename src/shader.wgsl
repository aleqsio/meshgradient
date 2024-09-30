// Vertex shader

struct Uniforms {
  cameraMatrix: mat4x4<f32>,
  gridSize: u32,
};

@group(0) @binding(0)
var<uniform> myUniforms: Uniforms;



struct VertexOutput {
    @builtin(position) world_pos: vec4<f32>,
    @location(0) position: vec3<f32>,
};

fn get_sine_wave(x: f32, y: f32, sine_seeds: vec4<f32>, complexity: f32) -> f32 {
    let scale = 10.;
    let sine_wave1 = sine_seeds.x * sin(sine_seeds.w *sine_seeds.y * complexity + x * scale *sine_seeds.x);
    let sine_wave2 = sine_seeds.y * sin(sine_seeds.w *sine_seeds.x * complexity + y * scale * sine_seeds.y);
    let  sine_wave3 = sine_seeds.z * cos(sine_seeds.x*scale * complexity/sine_seeds.z*x*y + (x * sine_seeds.x *scale) + (y *scale * sine_seeds.z));
  return (sine_wave1 + sine_wave2 + sine_wave3);
}

@vertex
fn vs_main(
    @builtin(vertex_index) in_vertex_index: u32,
) -> VertexOutput {

  let cellIndex = in_vertex_index / 6u;
  let positionIndex = in_vertex_index % 6u;
  
  // Calculate the row (i) and column (j) in the grid
  let i: u32 = cellIndex / myUniforms.gridSize;
  let j: u32 = cellIndex % myUniforms.gridSize;


  // Scale factors for the viewport
  let scaleX: f32 = 2.0 / f32(myUniforms.gridSize);
  let scaleY: f32 = 2.0 / f32(myUniforms.gridSize);

  // Calculate normalized x and y
  let x: f32 = f32(i) * scaleX - 1.0; 
  let y: f32 = f32(j) * scaleY - 1.0; 

  // Vertex positions within the cell
  let size: f32 = 1;

  var position: vec2<f32>;

  switch (positionIndex) {
    case 0u: { position = vec2<f32>(x, y); } // top left of the first triangle
    case 1u: { position = vec2<f32>(x, y + size * scaleY); } // bottom left 
    case 2u: { position = vec2<f32>(x + size * scaleX, y + size * scaleY); } // bottom right
    case 3u: { position = vec2<f32>(x, y); } // top left of the second triangle
    case 4u: { position = vec2<f32>(x + size * scaleX, y + size * scaleY); } // bottom right 
    case 5u: { position = vec2<f32>(x + size * scaleX, y); } // top right
    default: { position = vec2<f32>(0.0, 0.0); } // Return zero vector if positionIndex is not expected
  }
    var out: VertexOutput;
    let coordIndex = in_vertex_index/6;

    out.position = vec3<f32>(position.x, position.y, 0.);

    let scale = 1.8;
    // out.world_pos = vec4<f32>(position.x * scale*0.5, position.y * scale*0.5,  0, 1.) ;

    out.world_pos = myUniforms.cameraMatrix * vec4<f32>(position.x * scale, position.y * scale,  1*0.3*scale, 1.) ;
    return out;
}

fn rgba2hsv(input_rgba: vec4<f32>) -> vec4<f32> {
    let rgbMin = min(min(input_rgba.r, input_rgba.g), input_rgba.b);
    let rgbMax = max(max(input_rgba.r, input_rgba.g), input_rgba.b);

    let delta = rgbMax - rgbMin;
    var hsvColor: vec4<f32>;

    if (rgbMax == rgbMin) {
        hsvColor.x = 0.0;
    } else if (rgbMax == input_rgba.r) {
        hsvColor.x = 60.0 * ((input_rgba.g - input_rgba.b) / delta);
    } else if (rgbMax == input_rgba.g) {
        hsvColor.x = 60.0 * (2.0 + (input_rgba.b - input_rgba.r) / delta);
    } else {
        hsvColor.x = 60.0 * (4.0 + (input_rgba.r - input_rgba.g) / delta);
    }

    if (hsvColor.x < 0.0) {
        hsvColor.x += 360.0;
    }

    hsvColor.x /= 360.0;
    hsvColor.y = delta / rgbMax;
    hsvColor.z = rgbMax;
    hsvColor.w = input_rgba.a; // Alpha is unchanged

    return hsvColor;
}

fn hsv2rgba(input_hsv: vec4<f32>) -> vec4<f32> {
    var rgbColor: vec4<f32>;
    let i = floor(input_hsv.x * 6.0);
    let f = input_hsv.x * 6.0 - i;
    let p = input_hsv.z * (1.0 - input_hsv.y);
    let q = input_hsv.z * (1.0 - f * input_hsv.y);
    let t = input_hsv.z * (1.0 - (1.0 - f) * input_hsv.y);
    
    if (i % 6.0 == 0.0) {
        rgbColor = vec4<f32>(input_hsv.z, t, p, input_hsv.w);
    } else if (i == 1.0) {
        rgbColor = vec4<f32>(q, input_hsv.z, p, input_hsv.w);
    } else if (i == 2.0) {
        rgbColor = vec4<f32>(p, input_hsv.z, t, input_hsv.w);
    } else if (i == 3.0) {
        rgbColor = vec4<f32>(p, q, input_hsv.z, input_hsv.w);
    } else if (i == 4.0) {
        rgbColor = vec4<f32>(t, p, input_hsv.z, input_hsv.w);
    } else {
        rgbColor = vec4<f32>(input_hsv.z, p, q, input_hsv.w);
    }
    return rgbColor;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    // write a loop over the points, computing blended average of color
    var avg = vec4<f32>(0., 0., 1., 1.);
  
    return vec4<f32>(avg);
}
