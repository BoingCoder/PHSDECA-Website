import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { makeReferenceFrame, makeReferenceMaterial, makeRollingPath, referencePose, referenceScale } from './blue-hour-frame.js';

const noiseGLSL = `
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),
      mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.)),f.x),f.y);
  }
  float fbm(vec2 p) {
    float v=0., a=.5;
    for(int i=0;i<5;i++){v+=a*noise(p);p=mat2(.8,-.6,.6,.8)*p*2.03+17.1;a*=.5;}
    return v;
  }
`;

// Fine tool marks change the highlights without turning the metal into stone.
function makeMetalTextures(renderer) {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  let seed = 38771;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const image = ctx.createImageData(size, size);
  for (let i = 0; i < image.data.length; i += 4) {
    const value = 126 + random() * 5;
    image.data[i] = image.data[i + 1] = image.data[i + 2] = value;
    image.data[i + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  for (let i = 0; i < 35; i++) {
    const x = random()*size, y = random()*size, radius = 40+random()*180;
    const gradient = ctx.createRadialGradient(x,y,0,x,y,radius);
    gradient.addColorStop(0, i%2 ? 'rgba(220,220,220,.045)' : 'rgba(35,35,35,.04)');
    gradient.addColorStop(1, 'rgba(128,128,128,0)');
    ctx.fillStyle=gradient; ctx.fillRect(x-radius,y-radius,radius*2,radius*2);
  }
  for (let i = 0; i < 2400; i++) {
    const x = random() * size;
    const y = random() * size;
    const length = 3 + Math.pow(random(), 2) * 105;
    const angle = -.8 + random() * 2.8;
    ctx.strokeStyle = random() > .4 ? 'rgba(225,225,225,.23)' : 'rgba(30,30,30,.2)';
    ctx.lineWidth = .35 + random() * .65;
    ctx.beginPath(); ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
    ctx.stroke();
  }
  const height = new THREE.CanvasTexture(canvas);
  height.wrapS = height.wrapT = THREE.RepeatWrapping;
  height.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = roughCanvas.height = size;
  const roughCtx = roughCanvas.getContext('2d');
  roughCtx.fillStyle = '#d2d2d2'; roughCtx.fillRect(0, 0, size, size);
  roughCtx.globalAlpha = .3; roughCtx.drawImage(canvas, 0, 0);
  const roughness = new THREE.CanvasTexture(roughCanvas);
  roughness.wrapS = roughness.wrapT = THREE.RepeatWrapping;
  roughness.anisotropy = height.anisotropy;
  return { height, roughness };
}

export async function createSculpture({ host, stage, state, toggle, mobileQuery, reducedQuery, isPaused, onFailure }) {
  const referenceTexture = await new THREE.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}images/blue-hour-metal-reference.png`);
  referenceTexture.colorSpace = THREE.SRGBColorSpace;
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobileQuery.matches ? 1.25 : 1.8));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  // The photograph already contains the intended exposure and color grading.
  renderer.toneMapping = THREE.NoToneMapping;
  referenceTexture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  host.append(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.setAttribute('role', 'button');
  canvas.setAttribute('aria-label', 'Twirl the DECA sculpture');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#03070d');
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  camera.position.set(0, .18, 11.8);

  // Thin, bright studio reflections give the edges a machined silver finish.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#080d16');
  const softboxes = [];
  function softbox(width, height, position, color, intensity) {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    panel.position.set(...position); panel.lookAt(0, 0, 0);
    studio.add(panel); softboxes.push(panel);
  }
  softbox(1.2, 7, [-3,3,5], '#e4edff', 2.4);
  softbox(3.5, 1.4, [1,6,2], '#ffffff', 3.2);
  softbox(.7, 5, [4,2,3], '#dce8ff', 1.6);
  softbox(.55, 6, [-4,0,-3], '#0864ff', 2.5);
  softbox(3, .8, [1,-3,3], '#126bff', .55);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(studio, .025);
  scene.environment = environment.texture;
  scene.environmentIntensity = .65;
  softboxes.forEach((box) => { box.geometry.dispose(); box.material.dispose(); });
  pmrem.dispose();
  const key = new THREE.DirectionalLight('#e2eaff', 1.2);
  key.position.set(3,6,4); scene.add(key);
  const rim = new THREE.DirectionalLight('#146bff', 1.1);
  rim.position.set(-4,2,-3); scene.add(rim);
  const fill = new THREE.DirectionalLight('#b8c8e3', .32);
  fill.position.set(-4,1,6); scene.add(fill);
  scene.add(new THREE.HemisphereLight('#9bafcc', '#040916', .18));
  RectAreaLightUniformsLib.init();
  const silverPanel = new THREE.RectAreaLight('#e5eeff', 3.5, 1.8, 4.5);
  const bluePanel = new THREE.RectAreaLight('#0864ff', 5, .45, 4);
  scene.add(silverPanel, bluePanel);

  const textures = makeMetalTextures(renderer);
  const common = { metalness: .98, roughnessMap: textures.roughness, bumpMap: textures.height,
    bumpScale: .009, clearcoat: .08, clearcoatRoughness: .38 };
  const face = new THREE.MeshPhysicalMaterial({ ...common, color: '#667181', roughness: .57 });
  const frameGeometry = makeReferenceFrame();
  const referenceMaterial = makeReferenceMaterial(referenceTexture);
  const referenceRotation = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(referencePose.rx,referencePose.ry,referencePose.rz),
  );
  const referenceNormal = new THREE.Vector3(0,0,1).applyQuaternion(referenceRotation);
  const sculpture = new THREE.Group();
  const body = new THREE.Mesh(frameGeometry, [referenceMaterial,face]);
  sculpture.add(body); scene.add(sculpture);

  const backdropUniforms = { uTime: { value: 0 }, uAspect: { value: 1 }, uCenter: { value: .72 } };
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(2,2), new THREE.ShaderMaterial({
    uniforms: backdropUniforms, depthTest: false, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,.999,1.);}',
    fragmentShader: `varying vec2 vUv; uniform float uTime,uAspect,uCenter; ${noiseGLSL}
      void main(){
        vec2 uv=vUv; vec2 p=vec2((uv.x-uCenter)*uAspect,uv.y-.38);
        vec2 drift=vec2(uTime*.009,-uTime*.006);
        vec2 warp=vec2(fbm(p*3.+drift),fbm(p*3.+8.7-drift));
        float cloud=fbm(p*8.+warp*2.5+drift);
        float detail=fbm(p*21.+warp*3.-drift);
        float focus=exp(-dot(p*vec2(1.15,.9),p*vec2(1.15,.9))*2.8);
        float haze=smoothstep(.27,.76,cloud*.68+detail*.32)*focus;
        float ground=exp(-pow((uv.y-.24)*5.5,2.))*focus;
        float billows=smoothstep(.32,.72,cloud*.55+detail*.45);
        float shaft=exp(-pow((p.x+.025-(uv.y-.2)*.075)*14.,2.));
        shaft*=smoothstep(.24,.95,uv.y)*(.25+cloud*.75);
        float horizon=exp(-pow((uv.y-.18)*34.,2.))*exp(-pow(p.x*2.3,2.));
        vec3 col=vec3(.0008,.0016,.003)+vec3(.004,.012,.035)*haze;
        col+=vec3(.004,.04,.18)*ground*billows;
        col+=vec3(.01,.04,.14)*shaft;
        col+=vec3(.006,.06,.27)*horizon;
        col*=mix(.06,1.,smoothstep(-.5,-.08,p.x));
        col+=vec3(hash(gl_FragCoord.xy)*.0004);
        gl_FragColor=vec4(col,1.);
      }`,
  }));
  backdrop.frustumCulled = false; backdrop.renderOrder = -100;
  // Do not draw the screen-space backdrop in the floor's reflected camera.
  backdrop.layers.set(1); camera.layers.enable(1); scene.add(backdrop);

  const floorUniforms = {
    color: { value: new THREE.Color('#09101d') }, tDiffuse: { value: null }, textureMatrix: { value: new THREE.Matrix4() },
    uContact: { value: new THREE.Vector2(2,0) }, uShadow: { value: 1 },
    uSlate: { value: null },
  };
  const floor = new Reflector(new THREE.PlaneGeometry(80,24), {
    textureWidth: mobileQuery.matches ? 512 : 1536, textureHeight: mobileQuery.matches ? 512 : 1024,
    clipBias: .004, multisample: 0,
    shader: {
      name: 'WetSlateReflection', uniforms: floorUniforms,
      vertexShader: `uniform mat4 textureMatrix; varying vec4 vMirror; varying vec3 vWorld;
        void main(){vMirror=textureMatrix*vec4(position,1.);vWorld=(modelMatrix*vec4(position,1.)).xyz;
          gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform sampler2D tDiffuse,uSlate; uniform vec2 uContact; uniform float uShadow;
        varying vec4 vMirror; varying vec3 vWorld; ${noiseGLSL}
        void main(){
          vec2 p=vWorld.xz;
          vec2 offset=p-uContact;
          float stone=fbm(p*vec2(3.,5.));
          // A text-free patch of the reference supplies the irregular slate grain.
          vec2 slateUv=fract(p*vec2(.18,.24))*vec2(195./1499.,76./940.)+vec2(450./1499.,74./940.);
          vec3 slateSample=texture2D(uSlate,slateUv).rgb;
          float grain=clamp(dot(slateSample,vec3(.2126,.7152,.0722))*45.,0.,1.);
          float fine=noise(p*vec2(95.,120.))*.15+grain*.85;
          float ridges=pow(grain,2.)*.7;
          float veins=abs(fbm(p*vec2(4.,7.))-.49);
          float cracks=1.-smoothstep(.006,.018,veins);
          vec2 uv=vMirror.xy/vMirror.w;
          vec2 ripple=vec2(noise(p*vec2(18.,36.)),noise(p*vec2(31.,14.)))-.5;
          float blur=.0015+min(abs(offset.y),6.)*.0007;
          uv+=ripple*vec2(.003,.009);
          vec3 reflection=texture2D(tDiffuse,uv).rgb*.34;
          reflection+=texture2D(tDiffuse,uv+vec2(blur,blur*.5)).rgb*.165;
          reflection+=texture2D(tDiffuse,uv-vec2(blur,blur*.5)).rgb*.165;
          reflection+=texture2D(tDiffuse,uv+vec2(blur*2.,-blur)).rgb*.165;
          reflection+=texture2D(tDiffuse,uv-vec2(blur*2.,-blur)).rgb*.165;
          float illumination=exp(-length(offset*vec2(.35,.24)));
          float wetness=smoothstep(.28,.76,stone);
          vec2 contactPoint=offset*vec2(3.2,7.);
          float contact=exp(-dot(contactPoint,contactPoint))*uShadow;
          vec2 shadowPoint=(offset+vec2(.38,-.02))*vec2(1.45,4.);
          float shadow=exp(-dot(shadowPoint,shadowPoint))*.78*uShadow;
          vec3 slate=vec3(.008,.013,.022)*(.35+stone*.65+fine*.1);
          slate*=1.-cracks*.65;
          slate+=vec3(.004,.015,.055)*illumination*(.16+wetness*.35+ridges*.3);
          vec2 beacon=offset-vec2(-1.35,-.7);
          float pool=exp(-dot(beacon*vec2(.7,.85),beacon*vec2(.7,.85)));
          float streak=exp(-pow(beacon.x*1.65,2.))*exp(-abs(beacon.y)*.2);
          float secondPool=exp(-dot((offset-vec2(.9,-.5))*vec2(1.,1.3),(offset-vec2(.9,-.5))*vec2(1.,1.3)));
          float glints=(.12+wetness*.7+ridges*.65)*(1.-cracks*.8);
          slate+=vec3(.003,.115,.72)*(pool+streak*.6+secondPool*.4)*glints;
          float source=exp(-dot(beacon*vec2(3.5,4.),beacon*vec2(3.5,4.)));
          slate+=vec3(.35,.85,2.2)*source*(.25+wetness);
          vec3 result=slate+reflection*(.2+wetness*.28)*(1.-shadow);
          result*=1.-max(contact*.97,shadow);
          result*=mix(.12,1.,smoothstep(-5.,-1.,offset.x));
          float rearFade=smoothstep(-3.,-1.65,p.y);
          float distanceFade=1.-smoothstep(16.,35.,length(p));
          gl_FragColor=vec4(result,rearFade*distanceFade);
        }`,
    },
  });
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.6;
  floor.position.z = 9;
  floor.material.transparent = true;
  floor.material.depthWrite = false;
  floor.material.uniforms.uSlate.value = referenceTexture;
  floor.frustumCulled = false;
  // Reflect the sculpture and lights, but not the screen-space atmosphere.
  const originalBeforeRender = floor.onBeforeRender;
  floor.onBeforeRender = function (...args) {
    backdrop.visible = false;
    originalBeforeRender.apply(this, args);
    backdrop.visible = true;
  };
  scene.add(floor);

  // Backlit, slowly curling smoke surrounds the aperture and the contact point.
  const mistUniforms = { uTime: { value: 0 }, uIntensity: { value: .5 } };
  const mistMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: mistUniforms,
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec2 vUv;uniform float uTime,uIntensity;${noiseGLSL}
      void main(){
        vec2 p=vUv;
        vec2 drift=vec2(uTime*.012,-uTime*.008);
        float warp=fbm(p*vec2(5.,4.)+drift);
        float cloud=fbm(p*vec2(14.,9.)+vec2(warp*2.,warp)-drift);
        float detail=fbm(p*vec2(31.,18.)+warp*2.+drift);
        float edges=smoothstep(0.,.15,p.x)*(1.-smoothstep(.83,1.,p.x));
        edges*=smoothstep(0.,.12,p.y)*(1.-smoothstep(.48,1.,p.y));
        float density=smoothstep(.28,.73,cloud*.65+detail*.35);
        float light=exp(-dot((p-vec2(.4,.22))*vec2(3.5,3.),(p-vec2(.4,.22))*vec2(3.5,3.)));
        vec3 color=vec3(.006,.025,.085)+vec3(.008,.105,.54)*light;
        gl_FragColor=vec4(color,density*edges*uIntensity);
      }`,
  });
  const mist = new THREE.Mesh(new THREE.PlaneGeometry(9,3.4), mistMaterial);
  mist.renderOrder = 1;
  scene.add(mist);
  const foregroundMist = new THREE.Mesh(new THREE.PlaneGeometry(8,1.2), mistMaterial.clone());
  foregroundMist.material.uniforms.uIntensity.value = .055;
  foregroundMist.renderOrder = 2;
  scene.add(foregroundMist);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  // Only saturated blue sources bloom. Silver reflections keep their contrast.
  const bloom = new UnrealBloomPass(new THREE.Vector2(1,1), .2, .08, .9);
  bloom.materialHighPassFilter.fragmentShader = `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main() {
      vec3 source = texture2D(tDiffuse, vUv).rgb;
      float blueEnergy = source.b - max(source.r, source.g) * 1.8;
      float mask = smoothstep(.9, 1.7, blueEnergy);
      gl_FragColor = vec4(min(source, vec3(.025,.32,2.8)) * mask, 1.);
    }
  `;
  bloom.compositeMaterial.uniforms.bloomFactors.value = [1, .38, .12, .025, 0];
  bloom.bloomTintColors.forEach(color => color.set(.08,.38,1));
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  let viewWidth = 1, viewHeight = 1, elapsed = 0, previous = performance.now();
  let tiltX = 0, tiltY = 0, tiltZ = 0, followX = 0;
  let slideDistance = 0, slideReady = false;
  const slideGlideRate = 3.2;
  const rollTravelScale = .64;
  let pointerActive = false, pointerOnCanvas = false, hovered = false, press = null;
  const twirlDuration = 1.15;
  let twirlElapsed = twirlDuration;
  let visible = true, disposed = false, frameId;
  const pointerPosition = new THREE.Vector2();
  const screenCenter = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const intersections = [];
  const tip = new THREE.Vector3();
  const restingTip = new THREE.Vector3();
  const restingTransform = new THREE.Matrix4();
  const vertex = new THREE.Vector3();
  const viewCorrection = new THREE.Quaternion();
  const viewEuler = new THREE.Euler();
  const restingRotation = new THREE.Quaternion();
  const rollRotation = new THREE.Quaternion();
  const rollAxis = new THREE.Vector3(0,0,1);
  const surfaceNormal = new THREE.Vector3();
  let rollingPath;
  const interactionRotation = new THREE.Quaternion();
  const interactionEuler = new THREE.Euler();
  const referenceViewYaw = Math.atan2(2*Math.tan(THREE.MathUtils.degToRad(17))*(1499/940)*referencePose.x,1);
  const frameVertices = body.geometry.getAttribute('position');
  function hitsSculpture() {
    raycaster.setFromCamera(pointerPosition, camera);
    intersections.length = 0;
    raycaster.intersectObject(body, false, intersections);
    return intersections.length > 0;
  }
  function setHovered(value) {
    if (hovered === value) return;
    hovered = value;
    canvas.style.cursor = value ? 'pointer' : '';
    canvas.title = value ? 'Click to twirl' : '';
  }
  function render(time = performance.now()) {
    if (disposed) return;
    const delta = Math.min((time-previous)/1000,.05); previous = time;
    const moving = !isPaused() && !reducedQuery.matches;
    if (moving) {
      elapsed += delta;
      twirlElapsed = Math.min(twirlElapsed + delta, twirlDuration);
    } else {
      tiltX = tiltY = tiltZ = followX = 0;
      twirlElapsed = twirlDuration;
      press = null;
    }
    canvas.tabIndex = moving ? 0 : -1;
    canvas.setAttribute('aria-disabled', String(!moving));
    const mobile = mobileQuery.matches;
    screenCenter.copy(sculpture.position).project(camera);
    const aimX = moving && pointerActive ? THREE.MathUtils.clamp((pointerPosition.x-screenCenter.x)/.7,-1,1) : 0;
    const aimY = moving && pointerActive ? THREE.MathUtils.clamp((pointerPosition.y-screenCenter.y)/.7,-1,1) : 0;
    // Follow the pointer with a little weight, consistently at any frame rate.
    tiltX = THREE.MathUtils.damp(tiltX,-aimY*.18,9,delta);
    tiltY = THREE.MathUtils.damp(tiltY,aimX*.3,9,delta);
    tiltZ = THREE.MathUtils.damp(tiltZ,-aimX*.045,9,delta);
    followX = THREE.MathUtils.damp(followX,aimX*.12,7,delta);
    const twirlProgress = twirlElapsed/twirlDuration;
    const twirlAngle = twirlProgress < 1 ? Math.PI*2*THREE.MathUtils.smootherstep(twirlProgress,0,1) : 0;
    const baseScale = mobile ? Math.min(viewWidth*.185,.72,viewWidth*.34/rollingPath.radius) : Math.min(viewWidth*.117,referenceScale);
    sculpture.scale.setScalar(baseScale*state.scale*(.93+state.reveal*.07));
    const travel = (referencePose.x-state.x)/(referencePose.x*2);
    const targetSlideDistance = viewWidth*(mobile ? .12 : referencePose.x*2)*travel*rollTravelScale;
    if (!moving) {
      slideDistance = targetSlideDistance;
      slideReady = true;
    } else if (!slideReady) {
      slideDistance = targetSlideDistance;
      slideReady = true;
    } else {
      // Follow with friction-like momentum so the frame glides into place without rebounding.
      slideDistance += (targetSlideDistance-slideDistance)*(1-Math.exp(-slideGlideRate*delta));
    }
    const rollAngle = rollingPath.angleAtDistance(slideDistance/sculpture.scale.x);
    sculpture.position.set((mobile ? 0 : viewWidth*referencePose.x)-slideDistance+followX,0,0);
    sculpture.quaternion.copy(restingRotation);
    // Keep the floor level while the frame rises and falls over its corners.
    restingTransform.compose(sculpture.position,sculpture.quaternion,sculpture.scale);
    sculpture.quaternion.premultiply(rollRotation.setFromAxisAngle(rollAxis,rollAngle));
    interactionEuler.set(tiltX,tiltY+twirlAngle,tiltZ);
    sculpture.quaternion.premultiply(interactionRotation.setFromEuler(interactionEuler));
    surfaceNormal.set(0,0,1).applyQuaternion(sculpture.quaternion);
    const referenceAlignment = Math.abs(surfaceNormal.dot(referenceNormal));
    referenceMaterial.uniforms.uLighting.value = .55+.45*Math.pow(referenceAlignment,2);
    sculpture.updateMatrixWorld(true);
    tip.set(0,Infinity,0);
    restingTip.set(0,Infinity,0);
    for (let i=0; i<frameVertices.count; i++) {
      vertex.fromBufferAttribute(frameVertices,i).applyMatrix4(restingTransform);
      if (vertex.y<restingTip.y) restingTip.copy(vertex);
      vertex.fromBufferAttribute(frameVertices,i).applyMatrix4(body.matrixWorld);
      if (vertex.y<tip.y) tip.copy(vertex);
    }
    floor.position.y = mobile ? -viewHeight*.41 : camera.position.y-(788/940-.5)*2*Math.tan(THREE.MathUtils.degToRad(17))*(camera.position.z-restingTip.z);
    const lift = .002 + Math.sin(twirlProgress*Math.PI)**2*.18;
    sculpture.position.y = floor.position.y-tip.y+lift;
    floor.material.uniforms.uContact.value.set(tip.x,tip.z);
    floor.material.uniforms.uShadow.value = 1-lift*2;
    mist.position.set(sculpture.position.x-.3,floor.position.y+.95,-2.8);
    foregroundMist.position.set(sculpture.position.x-.25,floor.position.y+.35,1.8);
    foregroundMist.material.uniforms.uTime.value = elapsed+41;
    backdropUniforms.uTime.value = mistUniforms.uTime.value = elapsed;
    backdropUniforms.uCenter.value = mobile ? .55 : .5+state.x;
    sculpture.updateMatrixWorld(true);
    silverPanel.position.set(sculpture.position.x+2.6,sculpture.position.y+3.7,4.2);
    silverPanel.lookAt(sculpture.position);
    bluePanel.position.set(sculpture.position.x-2.3,sculpture.position.y+.7,-2.2);
    bluePanel.lookAt(sculpture.position);
    composer.render();
    setHovered(moving && pointerActive && pointerOnCanvas && hitsSculpture());
  }
  function resize() {
    const width = host.clientWidth, height = host.clientHeight;
    camera.aspect = width/height; camera.updateProjectionMatrix();
    renderer.setSize(width,height); composer.setSize(width,height);
    viewHeight = 2*Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.position.z;
    viewWidth = viewHeight*camera.aspect;
    backdropUniforms.uAspect.value = camera.aspect;
    const mobile = mobileQuery.matches;
    const startX = mobile ? 0 : viewWidth*referencePose.x;
    viewEuler.set(mobile ? -.17 : 0,referenceViewYaw-Math.atan2(startX,camera.position.z),0);
    restingRotation.copy(referenceRotation).premultiply(viewCorrection.setFromEuler(viewEuler));
    rollingPath = makeRollingPath(frameGeometry,restingRotation);
    slideReady = false;
    render();
  }
  function loop(time) {
    frameId = undefined;
    if (disposed || !visible || document.hidden) return;
    render(time);
    if (!isPaused() && !reducedQuery.matches) frameId=requestAnimationFrame(loop);
  }
  function resume() {
    if (frameId===undefined && visible && !document.hidden && !disposed) {
      previous=performance.now();frameId=requestAnimationFrame(loop);
    }
  }
  function updatePointer(event) {
    const bounds = canvas.getBoundingClientRect();
    pointerPosition.set((event.clientX-bounds.left)/bounds.width*2-1,1-(event.clientY-bounds.top)/bounds.height*2);
  }
  function twirl() {
    if (disposed || isPaused() || reducedQuery.matches || twirlElapsed < twirlDuration) return;
    twirlElapsed = 0;
    resume();
  }
  const pointer = (event) => {
    if (!event.isPrimary) return;
    if (press && Math.hypot(event.clientX-press.x,event.clientY-press.y) > 10) press = null;
    if (event.pointerType === 'touch') return;
    updatePointer(event);
    pointerActive = true;
    pointerOnCanvas = event.target === canvas;
  };
  const leave = () => {
    pointerActive = pointerOnCanvas = false;
    press = null;
    setHovered(false);
  };
  const pointerDown = (event) => {
    if (!event.isPrimary || event.button !== 0 || isPaused() || reducedQuery.matches) return;
    updatePointer(event);
    if (hitsSculpture()) press = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const pointerUp = (event) => {
    const start = press;
    press = null;
    if (!start || start.id !== event.pointerId || Math.hypot(event.clientX-start.x,event.clientY-start.y) > 10) return;
    updatePointer(event);
    if (hitsSculpture()) twirl();
  };
  const keyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!event.repeat) twirl();
  };
  stage.addEventListener('pointermove',pointer);stage.addEventListener('pointerleave',leave);
  canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);
  canvas.addEventListener('pointercancel',leave);canvas.addEventListener('pointerleave',leave);
  canvas.addEventListener('keydown',keyDown);
  toggle.addEventListener('click',resume);reducedQuery.addEventListener('change',resume);
  document.addEventListener('visibilitychange',resume);
  const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)resume();});
  observer.observe(stage);
  const resizeObserver=new ResizeObserver(resize);resizeObserver.observe(host);
  renderer.domElement.addEventListener('webglcontextlost',(event)=>{
    event.preventDefault();disposed=true;cancelAnimationFrame(frameId);host.setAttribute('aria-hidden','true');onFailure();
  });
  resize();host.classList.add('has-webgl');host.removeAttribute('aria-hidden');resume();
  return { render, dispose() {
    disposed=true;cancelAnimationFrame(frameId);observer.disconnect();resizeObserver.disconnect();
    stage.removeEventListener('pointermove',pointer);stage.removeEventListener('pointerleave',leave);
    canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);
    canvas.removeEventListener('pointercancel',leave);canvas.removeEventListener('pointerleave',leave);
    canvas.removeEventListener('keydown',keyDown);
    host.setAttribute('aria-hidden','true');
    toggle.removeEventListener('click',resume);reducedQuery.removeEventListener('change',resume);
    document.removeEventListener('visibilitychange',resume);
    const geometries=new Set(), materials=new Set();
    scene.traverse((object)=>{
      if(object.geometry)geometries.add(object.geometry);
      if(object.material)(Array.isArray(object.material)?object.material:[object.material]).forEach(m=>materials.add(m));
    });
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
    floor.getRenderTarget().dispose();textures.height.dispose();textures.roughness.dispose();referenceTexture.dispose();environment.dispose();
    composer.passes.forEach(pass=>pass.dispose?.());composer.dispose();renderer.dispose();renderer.domElement.remove();
  } };
}
