import { u32, mat4x4f, vec4f, struct } from "typegpu/data";

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function createRotXMatrix(angle: number): number[][] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    [1, 0, 0, 0],
    [0, cos, -sin, 0],
    [0, sin, cos, 0],
    [0, 0, 0, 1],
  ];
}

function createRotYMatrix(angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    [cos, 0, sin, 0],
    [0, 1, 0, 0],
    [-sin, 0, cos, 0],
    [0, 0, 0, 1],
  ];
}

function createRotZMatrix(angle: number) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    [cos, -sin, 0, 0],
    [sin, cos, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

function multiplyMatrices(a: number[][], b: number[][]) {
  return a.map((aRow, i) =>
    aRow.map((_, j) => aRow.reduce((acc, _, n) => acc + a[i][n] * b[n][j], 0))
  );
}

export function getRotationMatrix(
  yaw: number,
  pitch: number,
  roll: number
): mat4x4f {
  let cos = Math.cos;
  let sin = Math.sin;

  let cy = cos(yaw);
  let sy = sin(yaw);
  let cp = cos(pitch);
  let sp = sin(pitch);
  let cr = cos(roll);
  let sr = sin(roll);

  let matrix = [
    [cy * cp, sy * cp, 0, 0],
    [cy * sp * sr - sy * cr, sy * sp * sr + cy * cr, 0, 0],
    [cy * sp * cr + sy * sr, sy * sp * cr - cy * sr, 0, 0],
    [0, 0, 0, 1],
  ];

  // Depending on the rotation order, you can change the multiplication
  // The order here for the rotation is ZYX
  return mat4x4f(
    ...matrix.map((row) =>
      vec4f(...(row as unknown as [number, number, number, number]))
    )
  );
}
