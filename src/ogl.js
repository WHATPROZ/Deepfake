const compileShader = (gl, type, source) => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Failed to create shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Shader compile failed: ' + info);
  }
  return shader;
};

const createProgram = (gl, vertex, fragment) => {
  const program = gl.createProgram();
  if (!program) throw new Error('Failed to create program');
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertex);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error('Program link failed: ' + info);
  }
  return program;
};

const parseColor = value => {
  if (!value) return [1, 1, 1];
  if (Array.isArray(value)) {
    return value.length === 3 ? value : [1, 1, 1];
  }
  if (typeof value === 'string' && value.startsWith('#')) {
    const hex = value.slice(1);
    const normalized = hex.length === 3 ? hex.split('').map(x => x + x).join('') : hex;
    const int = parseInt(normalized, 16);
    return [((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255];
  }
  if (typeof value === 'object') {
    const { r = 1, g = 1, b = 1 } = value;
    return [r, g, b];
  }
  return [1, 1, 1];
};

const identity = out => {
  out[0] = 1;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = 1;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = 1;
  out[11] = 0;
  out[12] = 0;
  out[13] = 0;
  out[14] = 0;
  out[15] = 1;
  return out;
};

const multiplyMat4 = (out, a, b) => {
  const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
  const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
  const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
  const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

  const b00 = b[0], b01 = b[1], b02 = b[2], b03 = b[3];
  const b10 = b[4], b11 = b[5], b12 = b[6], b13 = b[7];
  const b20 = b[8], b21 = b[9], b22 = b[10], b23 = b[11];
  const b30 = b[12], b31 = b[13], b32 = b[14], b33 = b[15];

  out[0] = a00 * b00 + a01 * b10 + a02 * b20 + a03 * b30;
  out[1] = a00 * b01 + a01 * b11 + a02 * b21 + a03 * b31;
  out[2] = a00 * b02 + a01 * b12 + a02 * b22 + a03 * b32;
  out[3] = a00 * b03 + a01 * b13 + a02 * b23 + a03 * b33;
  out[4] = a10 * b00 + a11 * b10 + a12 * b20 + a13 * b30;
  out[5] = a10 * b01 + a11 * b11 + a12 * b21 + a13 * b31;
  out[6] = a10 * b02 + a11 * b12 + a12 * b22 + a13 * b32;
  out[7] = a10 * b03 + a11 * b13 + a12 * b23 + a13 * b33;
  out[8] = a20 * b00 + a21 * b10 + a22 * b20 + a23 * b30;
  out[9] = a20 * b01 + a21 * b11 + a22 * b21 + a23 * b31;
  out[10] = a20 * b02 + a21 * b12 + a22 * b22 + a23 * b32;
  out[11] = a20 * b03 + a21 * b13 + a22 * b23 + a23 * b33;
  out[12] = a30 * b00 + a31 * b10 + a32 * b20 + a33 * b30;
  out[13] = a30 * b01 + a31 * b11 + a32 * b21 + a33 * b31;
  out[14] = a30 * b02 + a31 * b12 + a32 * b22 + a33 * b32;
  out[15] = a30 * b03 + a31 * b13 + a32 * b23 + a33 * b33;
  return out;
};

const translateMat4 = (out, x, y, z) => {
  out[12] = x;
  out[13] = y;
  out[14] = z;
  return out;
};

const rotateXMat4 = (out, rad) => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const m00 = out[0], m01 = out[1], m02 = out[2], m03 = out[3];
  const m10 = out[4], m11 = out[5], m12 = out[6], m13 = out[7];
  const m20 = out[8], m21 = out[9], m22 = out[10], m23 = out[11];
  out[0] = m00;
  out[1] = m01;
  out[2] = m02;
  out[3] = m03;
  out[4] = m10 * c + m20 * s;
  out[5] = m11 * c + m21 * s;
  out[6] = m12 * c + m22 * s;
  out[7] = m13 * c + m23 * s;
  out[8] = m20 * c - m10 * s;
  out[9] = m21 * c - m11 * s;
  out[10] = m22 * c - m12 * s;
  out[11] = m23 * c - m13 * s;
  return out;
};

const rotateYMat4 = (out, rad) => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const m00 = out[0], m01 = out[1], m02 = out[2], m03 = out[3];
  const m10 = out[4], m11 = out[5], m12 = out[6], m13 = out[7];
  const m20 = out[8], m21 = out[9], m22 = out[10], m23 = out[11];
  out[0] = m00 * c - m20 * s;
  out[1] = m01 * c - m21 * s;
  out[2] = m02 * c - m22 * s;
  out[3] = m03 * c - m23 * s;
  out[4] = m10;
  out[5] = m11;
  out[6] = m12;
  out[7] = m13;
  out[8] = m00 * s + m20 * c;
  out[9] = m01 * s + m21 * c;
  out[10] = m02 * s + m22 * c;
  out[11] = m03 * s + m23 * c;
  return out;
};

const rotateZMat4 = (out, rad) => {
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const m00 = out[0], m01 = out[1], m02 = out[2], m03 = out[3];
  const m10 = out[4], m11 = out[5], m12 = out[6], m13 = out[7];
  const m20 = out[8], m21 = out[9], m22 = out[10], m23 = out[11];
  out[0] = m00 * c + m10 * s;
  out[1] = m01 * c + m11 * s;
  out[2] = m02 * c + m12 * s;
  out[3] = m03 * c + m13 * s;
  out[4] = m10 * c - m00 * s;
  out[5] = m11 * c - m01 * s;
  out[6] = m12 * c - m02 * s;
  out[7] = m13 * c - m03 * s;
  out[8] = m20;
  out[9] = m21;
  out[10] = m22;
  out[11] = m23;
  return out;
};

const perspectiveMat4 = (out, fov, aspect, near, far) => {
  const f = 1 / Math.tan(fov / 2);
  out[0] = f / aspect;
  out[1] = 0;
  out[2] = 0;
  out[3] = 0;
  out[4] = 0;
  out[5] = f;
  out[6] = 0;
  out[7] = 0;
  out[8] = 0;
  out[9] = 0;
  out[10] = (far + near) / (near - far);
  out[11] = -1;
  out[12] = 0;
  out[13] = 0;
  out[14] = (2 * far * near) / (near - far);
  out[15] = 0;
  return out;
};

export class Renderer {
  constructor({ alpha = false, premultipliedAlpha = false, antialias = false, dpr = 1 } = {}) {
    const canvas = document.createElement('canvas');
    this.canvas = canvas;
    this.dpr = dpr;
    const gl = canvas.getContext('webgl2', { alpha, premultipliedAlpha, antialias }) || canvas.getContext('webgl', { alpha, premultipliedAlpha, antialias });
    if (!gl) throw new Error('WebGL not supported');
    this.gl = gl;
  }

  setSize(width, height) {
    const w = Math.round(width * this.dpr);
    const h = Math.round(height * this.dpr);
    this.canvas.width = w;
    this.canvas.height = h;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    this.gl.viewport(0, 0, w, h);
  }

  render({ scene, camera }) {
    const gl = this.gl;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if (!scene || !scene.program || !scene.geometry) return;

    const modelMatrix = new Float32Array(16);
    identity(modelMatrix);
    translateMat4(modelMatrix, scene.position?.x || 0, scene.position?.y || 0, scene.position?.z || 0);
    rotateXMat4(modelMatrix, scene.rotation?.x || 0);
    rotateYMat4(modelMatrix, scene.rotation?.y || 0);
    rotateZMat4(modelMatrix, scene.rotation?.z || 0);

    scene.program.uniforms.modelMatrix = scene.program.uniforms.modelMatrix || { value: new Float32Array(16) };
    scene.program.uniforms.viewMatrix = scene.program.uniforms.viewMatrix || { value: new Float32Array(16) };
    scene.program.uniforms.projectionMatrix = scene.program.uniforms.projectionMatrix || { value: new Float32Array(16) };
    scene.program.uniforms.modelMatrix.value = modelMatrix;
    scene.program.uniforms.viewMatrix.value = camera?.viewMatrix || new Float32Array(16);
    scene.program.uniforms.projectionMatrix.value = camera?.projectionMatrix || new Float32Array(16);

    scene.program.bind();
    scene.geometry.bind(scene.program);
    gl.drawArrays(scene.mode || gl.TRIANGLES, 0, scene.geometry.vertexCount);
  }
}

export class Program {
  constructor(gl, { vertex, fragment, uniforms = {} }) {
    this.gl = gl;
    this.program = createProgram(gl, vertex, fragment);
    this.uniforms = {};
    this.uniformLocations = {};
    Object.keys(uniforms).forEach(name => {
      const def = uniforms[name];
      this.uniforms[name] = def;
      this.uniformLocations[name] = gl.getUniformLocation(this.program, name);
    });
  }

  bind() {
    const gl = this.gl;
    gl.useProgram(this.program);
    Object.entries(this.uniforms).forEach(([name, def]) => {
      let location = this.uniformLocations[name];
      if (location == null) {
        location = gl.getUniformLocation(this.program, name);
        this.uniformLocations[name] = location;
      }
      if (!location) return;
      const value = def.value;
      if (typeof value === 'number') {
        gl.uniform1f(location, value);
      } else if (Array.isArray(value)) {
        if (value.length === 2) gl.uniform2fv(location, value);
        else if (value.length === 3) gl.uniform3fv(location, value);
        else if (value.length === 4) gl.uniform4fv(location, value);
      } else if (value instanceof Float32Array) {
        if (value.length === 16) {
          gl.uniformMatrix4fv(location, false, value);
        } else if (value.length === 9) {
          gl.uniformMatrix3fv(location, false, value);
        }
      }
    });
  }
}

export class Mesh {
  constructor(gl, { geometry, program, mode }) {
    this.gl = gl;
    this.geometry = geometry;
    this.program = program;
    this.mode = mode;
    this.position = { x: 0, y: 0, z: 0 };
    this.rotation = { x: 0, y: 0, z: 0 };
  }
}

export class Geometry {
  constructor(gl, attributes = {}) {
    this.gl = gl;
    this.attributes = {};
    this.vertexCount = 0;
    Object.entries(attributes).forEach(([name, def]) => {
      const buffer = gl.createBuffer();
      if (!buffer) throw new Error('Failed to create buffer');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, def.data, gl.STATIC_DRAW);
      this.attributes[name] = {
        buffer,
        size: def.size,
        type: gl.FLOAT,
        normalized: false,
        stride: 0,
        offset: 0
      };
      this.vertexCount = def.data.length / def.size;
    });
  }

  bind(program) {
    const gl = this.gl;
    Object.entries(this.attributes).forEach(([name, attr]) => {
      const location = gl.getAttribLocation(program.program, name);
      if (location === -1) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, attr.buffer);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, attr.size, attr.type, attr.normalized, attr.stride, attr.offset);
    });
  }
}

export class Camera {
  constructor(gl, { fov = 15, near = 0.1, far = 1000 } = {}) {
    this.gl = gl;
    this.fov = fov;
    this.near = near;
    this.far = far;
    this._position = { x: 0, y: 0, z: 0 };
    this._position.set = (x, y, z) => {
      this._position.x = x;
      this._position.y = y;
      this._position.z = z;
      this.updateView();
    };
    this.rotation = { x: 0, y: 0, z: 0 };
    this.projectionMatrix = new Float32Array(16);
    this.viewMatrix = new Float32Array(16);
    this.aspect = 1;
    identity(this.projectionMatrix);
    identity(this.viewMatrix);
  }

  perspective({ aspect }) {
    this.aspect = aspect;
    perspectiveMat4(this.projectionMatrix, (this.fov * Math.PI) / 180, this.aspect, this.near, this.far);
    this.updateView();
  }

  positionSet(x, y, z) {
    this.position.x = x;
    this.position.y = y;
    this.position.z = z;
    this.updateView();
  }

  setPosition(x, y, z) {
    this.positionSet(x, y, z);
  }

  updateView() {
    const view = new Float32Array(16);
    identity(view);
    translateMat4(view, -this.position.x, -this.position.y, -this.position.z);
    this.viewMatrix = view;
  }
}

Object.defineProperty(Camera.prototype, 'position', {
  get() {
    return this._position;
  },
  set(value) {
    this._position = value;
    if (this._position && typeof this._position.set !== 'function') {
      this._position.set = (x, y, z) => {
        this._position.x = x;
        this._position.y = y;
        this._position.z = z;
        this.updateView();
      };
    }
    this.updateView();
  }
});

export class Triangle {
  constructor(gl) {
    this.gl = gl;
    this.vertexCount = 3;
    const vertices = new Float32Array([-1, -1, 3, -1, -1, 3]);
    const buffer = gl.createBuffer();
    if (!buffer) throw new Error('Failed to create buffer');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    this.attributes = {
      position: {
        buffer,
        size: 2,
        type: gl.FLOAT,
        normalized: false,
        stride: 0,
        offset: 0
      }
    };
  }

  bind(program) {
    const gl = this.gl;
    const location = gl.getAttribLocation(program.program, 'position');
    if (location === -1) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.attributes.position.buffer);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  }
}

export class Color {
  constructor() {
    this.r = 1;
    this.g = 1;
    this.b = 1;
  }

  set(value) {
    const [r, g, b] = parseColor(value);
    this.r = r;
    this.g = g;
    this.b = b;
  }
}
