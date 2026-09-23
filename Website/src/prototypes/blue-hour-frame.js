import * as THREE from 'three';

export const referencePose = { x: .215, y: 0, rx: -.18, ry: .35, rz: -.58, scale: 1 };
export const referenceScale = 1.2;

const photoWidth = 1499;
const photoHeight = 940;

// Left, bottom, right, top: measured miter corners in the supplied photograph.
// The texture is projected onto real faces; the opening remains empty geometry.
const outerPixels = [[788,530], [1200,788], [1394,357], [1036,83]];
const innerPixels = [[895,428], [1108,672], [1322,427], [1114,219]];
const rearOuterPixels = [[733,554], [1100,782], [1328,368], [1035,83]];
const rearInnerPixels = [[895,428], [1108,672], [1277,440], [1114,219]];

export function makeReferenceFrame() {
  const camera = new THREE.PerspectiveCamera(34, photoWidth/photoHeight, .1, 100);
  camera.position.set(0, .18, 11.8);
  camera.updateMatrixWorld();
  const height = 2*Math.tan(THREE.MathUtils.degToRad(17))*11.8;
  const position = new THREE.Vector3(height*camera.aspect*referencePose.x, .36, 0);
  const rotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(referencePose.rx, referencePose.ry, referencePose.rz),
  );
  const transform = new THREE.Matrix4().compose(position, rotation, new THREE.Vector3().setScalar(referenceScale));
  const inverse = transform.clone().invert();
  const origin = camera.position.clone().applyMatrix4(inverse);

  function ring(pixels, z) {
    return pixels.map(([x,y]) => {
      const world = new THREE.Vector3(x/photoWidth*2-1, 1-y/photoHeight*2, .5).unproject(camera);
      const direction = world.sub(camera.position).normalize().transformDirection(inverse);
      return origin.clone().addScaledVector(direction, (z-origin.z)/direction.z);
    });
  }

  const outer = ring(outerPixels, .44);
  const inner = ring(innerPixels, .22);
  const rearOuter = ring(rearOuterPixels, -.38);
  const rearInner = ring(rearInnerPixels, -.22);

  // Keep the rear of the bottom beam above the front contact point.
  const frontTip = outer[1].clone().applyMatrix4(transform);
  const rearTip = rearOuter[1].clone().applyMatrix4(transform);
  rearTip.y = Math.max(rearTip.y, frontTip.y+.018);
  rearOuter[1].copy(rearTip.applyMatrix4(inverse));

  const positions = [], projectionUvs = [], uvs = [], indices = [];
  const geometry = new THREE.BufferGeometry();
  const world = new THREE.Vector3();
  const projected = new THREE.Vector3();

  function quad(vertices, material, side, textureVertices = vertices) {
    const offset = positions.length/3;
    const start = indices.length;
    for (let index=0; index<4; index++) {
      const vertex = vertices[index];
      positions.push(vertex.x,vertex.y,vertex.z);
      world.copy(textureVertices[index]).applyMatrix4(transform);
      const depth = camera.position.z-world.z;
      projected.copy(world).project(camera);
      projectionUvs.push((projected.x*.5+.5)*depth, (projected.y*.5+.5)*depth, depth);
      // The recessed inner walls use a continuous scratch texture.
      uvs.push((index===1 || index===2 ? 1 : 0)+side*.27, index>=2 ? .22 : 0);
    }
    indices.push(offset,offset+1,offset+2, offset,offset+2,offset+3);
    geometry.addGroup(start,6,material);
  }

  for (let side=0; side<4; side++) {
    const next=(side+1)%4;
    quad([outer[side],outer[next],inner[next],inner[side]],0,side);
    quad([inner[side],inner[next],rearInner[next],rearInner[side]],side===0 || side===3 ? 1 : 0,side);
    quad([rearOuter[side],rearOuter[next],outer[next],outer[side]],0,side);
    // Give each rear beam the same photographed metal as its front face.
    quad([rearInner[side],rearInner[next],rearOuter[next],rearOuter[side]],0,side,
      [inner[side],inner[next],outer[next],outer[side]]);
  }
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('referenceUv',new THREE.Float32BufferAttribute(projectionUvs,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function makeRollingPath(geometry, rotation) {
  const positions = geometry.getAttribute('position');
  const corners = Array.from({ length: positions.count }, (_, index) =>
    new THREE.Vector3().fromBufferAttribute(positions,index).applyQuaternion(rotation));
  const steps = 720;
  const angleStep = Math.PI*2/steps;
  const distances = new Float64Array(steps+1);
  let previousHeight = 0;

  // A rolling polygon travels by its contact height for each small turn.
  // This captures the arcs around its corners, including this frame's bevels.
  for (let step=0; step<=steps; step++) {
    const angle = step*angleStep;
    const sine = Math.sin(angle), cosine = Math.cos(angle);
    let height = -Infinity;
    for (const corner of corners) height = Math.max(height,-corner.x*sine-corner.y*cosine);
    if (step > 0) distances[step] = distances[step-1]+(previousHeight+height)*.5*angleStep;
    previousHeight = height;
  }

  return {
    radius: Math.max(...corners.map(corner => Math.hypot(corner.x,corner.y))),
    angleAtDistance(distance) {
      const circumference = distances[steps];
      const turns = Math.floor(distance/circumference);
      const remaining = distance-turns*circumference;
      let low = 0, high = steps;
      while (high-low > 1) {
        const middle = Math.floor((low+high)/2);
        if (distances[middle] <= remaining) low = middle;
        else high = middle;
      }
      const fraction = (remaining-distances[low])/(distances[high]-distances[low]);
      return turns*Math.PI*2+(low+fraction)*angleStep;
    },
  };
}

export function makeReferenceMaterial(texture) {
  return new THREE.ShaderMaterial({
    name: 'ReferenceMetal',
    uniforms: { uReference: { value: texture }, uLighting: { value: 1 }, uDaylight: { value: 0 } },
    vertexShader: `
      attribute vec3 referenceUv;
      varying vec3 vReferenceUv;
      varying vec3 vViewNormal;
      void main() {
        vReferenceUv = referenceUv;
        vViewNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.);
      }
    `,
    fragmentShader: `
      uniform sampler2D uReference;
      uniform float uLighting, uDaylight;
      varying vec3 vReferenceUv;
      varying vec3 vViewNormal;
      void main() {
        vec3 metal = texture2D(uReference, vReferenceUv.xy/vReferenceUv.z).rgb;
        vec2 pixel = (vReferenceUv.xy/vReferenceUv.z)*vec2(1499.,940.);
        vec2 edge = vec2(248.,447.);
        vec2 relative = pixel-vec2(788.,410.);
        float along = clamp(dot(relative,edge)/dot(edge,edge),0.,1.);
        float edgeDistance = length(relative-edge*along);
        float rim = exp(-edgeDistance*edgeDistance/.81);
        float blue = metal.b-max(metal.r,metal.g)*1.8;
        float seam = smoothstep(.35,.75,blue);
        // The photographed finish contains blue light, so relight it alongside
        // the physical side walls while keeping the same texture and geometry.
        float luminance = dot(metal,vec3(.2126,.7152,.0722));
        float softLight = .65+.35*max(dot(normalize(vViewNormal),normalize(vec3(-.4,.7,1.))),0.);
        vec3 neutral = vec3(luminance)*vec3(1.14,1.12,1.08)+vec3(.035)*softLight;
        metal = mix(metal,neutral,uDaylight*.9);
        metal += (vec3(.002,.018,1.2)*seam+vec3(.003,.1,1.8)*rim)*(1.-uDaylight*.9);
        gl_FragColor = vec4(metal*uLighting,1.);
      }
    `,
  });
}
