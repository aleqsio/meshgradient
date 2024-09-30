// Vertex shader

struct VertexOutput {
    @builtin(position) clip_position: vec4<f32>,
    @location(0) position: vec3<f32>,
};

@vertex
fn vs_main(
    @builtin(vertex_index) in_vertex_index: u32,
) -> VertexOutput {
    const gridSize = 25;
    var vertexes = array<vec2<f32>, 3*2*gridSize*gridSize>();
    for (var i = 0; i < gridSize; i++) {
        for (var j = 0; j < gridSize; j++) {
            let x = f32(i) / f32(gridSize);
            let y = f32(j) / f32(gridSize);
            let offset = i * gridSize + j;
            let size = 1.0 / f32(gridSize);
            // top left
            vertexes[offset * 6 + 0] = vec2<f32>(x, y);
            vertexes[offset * 6 + 3] = vec2<f32>(x, y);
            // top right
            vertexes[offset * 6 + 5] = vec2<f32>(x + size, y);
            // bottom left
            vertexes[offset * 6 + 1] = vec2<f32>(x, y + size);
            // bottom right
            vertexes[offset * 6 + 2] = vec2<f32>(x + size, y + size);
            vertexes[offset * 6 + 4] = vec2<f32>(x + size, y + size);
        }
    }
    let x = vertexes[in_vertex_index].x*2 - 1;
    let y = vertexes[in_vertex_index].y*2-1;
    var out: VertexOutput;
    let z = 20.0;
    let coordIndex = in_vertex_index/6;
    // let displ = sin(x * 0.1)/10.0 + cos(y * 0.1)/10.0;
    var sample_view_proj = mat4x4<f32>(
    vec4<f32>(0.707, 0.408, 0, 0), // first column
    vec4<f32>(0, 0.816, 0, 0),     // second column
    vec4<f32>(-0.707, 0.408, 0, 0), // third column
    vec4<f32>(0, 0, 0, 1)          // fourth column
  );
    out.position = vec3<f32>(x, y, z);
    out.clip_position = sample_view_proj * vec4<f32>(x, y, sin(x*100.)*cos(y*100.)/4., 1.);
    return out;
}

// Fragment shader

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    return vec4<f32>(in.position.x, in.position.y,in.position.x*in.position.y, 1.0);
}
