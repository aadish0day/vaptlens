/* Landing scene: scroll-scrubbed reveals, the CVSS→risk board, plate nav and a raymarched "liquid chrome" WebGL
   object that reshapes per plate. Runs against the markup Landing.tsx renders; returns a cleanup function. */
import { BOARD, INSTALL_CMD, PLATES, RISK } from "@/landing/data";

var S = 6,
  HOLD = 0.34,
  PER = 1.15;

function clamp(x, a, b) {
  return x < a ? a : x > b ? b : x;
}
function ease(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

/* camera keys (wide / tall): 0 lens · 1 findings cloud · 2 ranked ring · 3 rank gate · 4 padlock · 5 container */
var KEYS = [
  { spin: -0.25, el: 0.1, size: 0.72, ox: 0.44, oy: 0.27 },
  { spin: 1.6, el: 0.2, size: 0.6, ox: 0, oy: 0.44 },
  { spin: 6.1, el: 0.16, size: 0.8, ox: -0.4, oy: 0.0 },
  { spin: 6.48, el: 0.34, size: 0.64, ox: 0.04, oy: 0.12 },
  { spin: 12.3, el: 0.08, size: 0.74, ox: -0.32, oy: 0.03 },
  { spin: 13.2, el: 0.45, size: 0.52, ox: 0, oy: 0.44 },
];
var KEYS_TALL = [
  { spin: -0.25, el: 0.1, size: 0.86, ox: 0, oy: 0.46 },
  { spin: 1.6, el: 0.2, size: 0.62, ox: 0, oy: 0.42 },
  { spin: 6.1, el: 0.16, size: 0.4, ox: 0.32, oy: 0.6 },
  { spin: 6.66, el: 0.2, size: 0.5, ox: 0, oy: 0.56 },
  { spin: 12.3, el: 0.08, size: 0.5, ox: 0, oy: 0.46 },
  { spin: 13.2, el: 0.45, size: 0.5, ox: 0, oy: 0.5 },
];
function cam(c, tall): any {
  var K = tall ? KEYS_TALL : KEYS,
    i = Math.floor(clamp(c, 0, S - 1)),
    j = Math.min(S - 1, i + 1),
    t = clamp(c - i, 0, 1),
    a = K[i],
    b = K[j],
    o = {};
  for (var k in a) o[k] = lerp(a[k], b[k], t);
  return o;
}

/* the 17 sample findings as beads: scattered (A), then a descending spiral by risk (B) */
function beadLayout() {
  var NB = RISK.length,
    BA = new Float32Array(NB * 3),
    BB = new Float32Array(NB * 3),
    BR = new Float32Array(NB),
    BH = new Float32Array(NB);
  var seed = 7;
  function rnd() {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  }
  var order = [3, 11, 0, 14, 6, 9, 1, 16, 4, 12, 8, 2, 15, 7, 13, 5, 10]; // scatter: no visible order
  var arc = [0],
    i,
    tot,
    Rh = 0.6;
  for (i = 0; i < NB; i++) {
    BR[i] = 0.055 + (0.185 * RISK[i]) / 100;
    BH[i] = RISK[i] >= 70 ? 1 : 0;
    if (i > 0) arc[i] = arc[i - 1] + (BR[i - 1] + BR[i]) * 1.06;
  }
  tot = arc[NB - 1];
  for (i = 0; i < NB; i++) {
    var u = arc[i] / tot,
      rr = Rh * (1 - 0.35 * u),
      an = (-arc[i] / Rh) * 0.92 + 0.6;
    BB[i * 3] = Math.cos(an) * rr;
    BB[i * 3 + 1] = 1.15 - 2.3 * u;
    BB[i * 3 + 2] = Math.sin(an) * rr;
  }
  for (i = 0; i < NB; i++) {
    var k = order[i],
      th = rnd() * Math.PI * 2,
      ph = Math.acos(2 * rnd() - 1),
      r2 = 0.35 + 0.8 * Math.cbrt(rnd());
    BA[k * 3] = Math.sin(ph) * Math.cos(th) * r2 * 1.25;
    BA[k * 3 + 1] = Math.cos(ph) * r2;
    BA[k * 3 + 2] = Math.sin(ph) * Math.sin(th) * r2 * 0.8;
  }
  return { BA: BA, BB: BB, BR: BR, BH: BH };
}

var VS = "attribute vec2 aP;void main(){gl_Position=vec4(aP,0.,1.);}";
var FS = [
  "precision highp float;",
  "uniform vec2 uRes,uOff;uniform mat3 uR,uRt;uniform float uS,uTime,uHeat,uC;",
  "uniform vec3 uA[17];uniform vec3 uB[17];uniform float uRad[17];uniform float uHot[17];",
  "float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}",
  "float tor(vec3 p,vec2 t){return length(vec2(length(p.xy)-t.x,p.z))-t.y;}",
  "float rbox(vec3 p,vec3 b,float r){vec3 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;}",
  "float cap(vec3 p,vec3 a,vec3 b,float r){vec3 pa=p-a,ba=b-a;float h=clamp(dot(pa,ba)/dot(ba,ba),0.,1.);return length(pa-ba*h)-r;}",
  // 0: the lens — a chrome magnifier held over a scan's findings; the critical one, under the glass, is amber
  "vec2 lensS(vec3 p,bool glass){float d=1e3,m=0.,t;",
  " vec3 q=p-vec3(-.08,.14,.25);",
  " t=tor(q,vec2(.62,.058));if(t<d){d=t;m=0.;}",
  " vec3 hd=normalize(vec3(.6,-.8,-.12));float ax=dot(q,hd);",
  " t=cap(q,hd*.6,hd*.8,.048);if(t<d){d=t;m=0.;}",
  " t=cap(q,hd*.82,hd*1.5,.082+.007*sin(ax*70.))*.85;if(t<d){d=t;m=3.;}",
  " t=cap(q,hd*.8,hd*.84,.092);if(t<d){d=t;m=1.;}",
  " t=cap(q,hd*1.5,hd*1.56,.09);if(t<d){d=t;m=0.;}",
  " if(glass){float R=1.7,hh=.075;t=max(max(length(q-vec3(0,0,R-hh))-R,length(q+vec3(0,0,R-hh))-R),length(q.xy)-.6);if(t<d){d=t;m=2.;}}",
  " for(int i=0;i<12;i++){float fi=float(i);vec3 c=vec3(fract(sin(fi*12.989+1.)*43758.5)*2.5-1.25,fract(sin(fi*78.233+2.)*43758.5)*1.9-.95,-.75+fract(sin(fi*3.71)*91.7)*.25);",
  "  float r=.05+.055*fract(sin(fi*5.13)*31.7);t=length(p-c)-r;if(t<d){d=t;m=0.;}}",
  " t=length(p-vec3(-.06,.16,-.62))-.17-.012*sin(p.x*14.+uTime)*sin(p.y*12.-uTime*.8);if(t<d){d=t;m=1.;}",
  " return vec2(d,m);}",
  "vec2 lens(vec3 p){return lensS(p,true);}",
  // 1/2: findings — scattered, then sorted by risk into a ring
  "vec2 beads(vec3 p,float t){float d=1e3,m=0.,e=t*t*(3.-2.*t);",
  " for(int i=0;i<17;i++){vec3 c=mix(uA[i],uB[i],e);float fi=float(i);c+=vec3(sin(uTime*.7+fi*1.3),cos(uTime*.9+fi*2.1),sin(uTime*.6+fi))*.05*(1.-e);",
  "  float di=length(p-c)-uRad[i];if(di<d)m=uHot[i]*smoothstep(.35,1.,e);d=smin(d,di,.09+.05*(1.-e));}return vec2(d,m);}",
  // 3: pipeline — a drop travels through three rings (drop, rank, prove) and comes out amber
  "float bx(float t){return mod(t*.55,4.6)-2.3;}",
  "vec2 gate(vec3 p){float ring=1e3;for(int i=0;i<3;i++){float xi=float(i-1)*1.5;ring=min(ring,tor(vec3(p.y,p.z,p.x-xi),vec2(.56,.07)));}",
  " float x=bx(uTime);float sq=1.+.3*(exp(-x*x*7.)+exp(-(x-1.5)*(x-1.5)*7.)+exp(-(x+1.5)*(x+1.5)*7.));",
  " float r=.34*smoothstep(2.3,1.85,abs(x));vec3 q=p-vec3(x,0,0);q.yz*=sq;float blob=(length(q)-r)/sq;",
  " float d=smin(ring,blob,.22);float m=blob<ring?smoothstep(-1.6,1.4,x):0.;return vec2(d,m);}",
  // 4: padlock
  "vec2 lock(vec3 p){float body=rbox(p-vec3(0,-.3,0),vec3(.62,.5,.27),.15);vec3 q=p-vec3(0,.18,0);",
  " float arc=max(tor(q,vec2(.4,.085)),-q.y);float legs=min(cap(q,vec3(.4,0,0),vec3(.4,-.2,0),.085),cap(q,vec3(-.4,0,0),vec3(-.4,-.2,0),.085));",
  " float sh=min(arc,legs);float k2=min(length(p.xy-vec2(0,-.24))-.085,rbox(vec3(p.xy-vec2(0,-.4),0.),vec3(.035,.15,1.),0.));",
  " float kh=max(k2,abs(p.z-.27)-.09);body=max(body,-kh);float d=min(body,sh);return vec2(d,sh<body?1.:0.);}",
  // 5: container (docker) — corrugated box
  "vec2 box(vec3 p){float b=rbox(p,vec3(.8,.48,.48),.08);float g=abs(mod(p.x+.08,.16)-.08)-.025;",
  " float side=max(g,abs(abs(p.z)-.48)-.025);side=max(side,abs(p.y)-.36);b=max(b,-side);",
  " float door=max(abs(abs(p.x)-.8)-.02,max(abs(p.y)-.36,abs(p.z)-.36));b=max(b,-door);return vec2(b,0.);}",
  "vec2 shape(float k,vec3 p){if(k<.5)return lens(p);if(k<1.5)return beads(p,0.);if(k<2.5)return beads(p,1.);if(k<3.5)return gate(p);if(k<4.5)return lock(p);return box(p);}",
  "vec2 map(vec3 p){float i=floor(uC),t=uC-i,j=min(i+1.,5.);",
  " if(i>.5&&i<1.5)return beads(p,t);",
  " vec2 a=shape(i,p);if(t<.002)return a;vec2 b=shape(j,p);float e=t*t*(3.-2.*t);return mix(a,b,e);}",
  "vec3 env(vec3 r){float y=r.y;vec3 c=mix(vec3(.018,.016,.014),vec3(.16,.15,.14),smoothstep(-.35,.7,y));",
  " c+=vec3(1.)*smoothstep(.07,0.,abs(y-.04))*.75;",
  " c+=vec3(1.25,1.2,1.12)*smoothstep(.72,.96,y)*smoothstep(.85,.2,abs(r.x));",
  " c+=vec3(1.)*exp(-pow((r.x-.78)*5.5,2.))*smoothstep(-.4,.5,y)*1.1;",
  " c+=vec3(1.,.55,.12)*exp(-pow((r.x+.82)*4.,2.))*smoothstep(-.6,.4,y)*(.8+uHeat);",
  " c+=vec3(.9,.5,.1)*smoothstep(-.55,-.95,y)*.25;return c;}",
  "vec3 shade(vec3 n,vec3 rd,float m){vec3 r=reflect(rd,n);vec3 e=env(r);float fr=pow(1.-clamp(dot(-rd,n),0.,1.),5.);",
  " vec3 amb=vec3(1.,.69,.125);vec3 ch=e*mix(vec3(.9,.88,.85),vec3(1.),fr);vec3 am=e*amb*1.15+amb*.07;vec3 gs=e*.2+amb*fr*.9+vec3(.012,.01,.008);",
  " vec3 st=vec3(.018,.016,.014)+e*.07+e*fr*.5;return m>2.?mix(gs,st,clamp(m-2.,0.,1.)):m>1.?mix(am,gs,m-1.):mix(ch,am,m);}",
  "void main(){vec2 uv=gl_FragCoord.xy/uRes*2.-1.;uv-=uOff;uv.x*=uRes.x/uRes.y;",
  " vec3 ro=vec3(0,0,4.5),rd=normalize(vec3(uv,-3.2));",
  " float B=2.5*uS,bb=dot(ro,rd),cc=dot(ro,ro)-B*B,ds=bb*bb-cc;if(ds<0.){gl_FragColor=vec4(0.);return;}",
  " float sq=sqrt(ds),t=max(0.,-bb-sq),tm=-bb+sq;bool hit=false;vec2 h;vec3 q;",
  " for(int s=0;s<110;s++){vec3 p=ro+rd*t;q=uRt*p/uS;h=map(q);float d=h.x*uS;if(d<.0012*t){hit=true;break;}t+=d*.8;if(t>tm)break;}",
  " if(!hit){gl_FragColor=vec4(0.);return;}",
  " vec2 k=vec2(1,-1)*.0015;vec3 no=normalize(k.xyy*map(q+k.xyy).x+k.yyx*map(q+k.yyx).x+k.yxy*map(q+k.yxy).x+k.xxx*map(q+k.xxx).x);",
  " vec3 n=normalize(uR*no);float m=h.y;vec3 col=shade(n,rd,m);float al=1.;",
  " if(uC<.02&&m>1.5&&m<2.5){",
  "  vec3 rd2=normalize(refract(rd,n,.62));vec3 p0=ro+rd*t;float t2=.03;bool h2=false;vec3 q2;vec2 g;",
  "  for(int s=0;s<64;s++){vec3 pp=p0+rd2*t2;q2=uRt*pp/uS;g=lensS(q2,false);float d=g.x*uS;if(d<.0015){h2=true;break;}t2+=d*.85;if(t2>6.)break;}",
  "  float fr=pow(1.-clamp(dot(-rd,n),0.,1.),4.);vec3 refl=env(reflect(rd,n));vec3 behind=vec3(.03,.026,.02);al=.55;",
  "  if(h2){vec3 n2=normalize(uR*normalize(k.xyy*lensS(q2+k.xyy,false).x+k.yyx*lensS(q2+k.yyx,false).x+k.yxy*lensS(q2+k.yxy,false).x+k.xxx*lensS(q2+k.xxx,false).x));behind=shade(n2,rd2,g.y)*1.08;al=1.;}",
  "  col=mix(behind*vec3(1.,.98,.93),refl,.08+.85*fr);al=max(al,fr);}",
  " col=col/(1.+col*.55);gl_FragColor=vec4(pow(col,vec3(1./2.2))*al,al);}",
].join("\n");

function rot(yaw, pitch, roll) {
  var cy = Math.cos(yaw),
    sy = Math.sin(yaw),
    cp = Math.cos(pitch),
    sp = Math.sin(pitch),
    cr = Math.cos(roll),
    sr = Math.sin(roll);
  var Rz = [cr, sr, 0, -sr, cr, 0, 0, 0, 1],
    Ry = [cy, 0, -sy, 0, 1, 0, sy, 0, cy],
    Rx = [1, 0, 0, 0, cp, sp, 0, -sp, cp];
  function mul(a, b) {
    var o = [];
    for (var c = 0; c < 3; c++)
      for (var r = 0; r < 3; r++) o[c * 3 + r] = a[r] * b[c * 3] + a[3 + r] * b[c * 3 + 1] + a[6 + r] * b[c * 3 + 2];
    return o;
  }
  return mul(Rx, mul(Ry, Rz));
}
function tr(m) {
  return [m[0], m[3], m[6], m[1], m[4], m[7], m[2], m[5], m[8]];
}

export function startScene(scope: HTMLElement): () => void {
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var docEl = document.documentElement;
  if (reduce) docEl.classList.add("lx-static");

  /* every listener goes through on() so the cleanup removes all of them */
  var offs: (() => void)[] = [];
  function on(target: any, type: string, fn: any, opts?: any) {
    target.addEventListener(type, fn, opts);
    offs.push(function () {
      target.removeEventListener(type, fn, opts);
    });
  }
  var $ = function (s): any {
    return scope.querySelector(s);
  };
  var spec = $("#spec"),
    stage = $("#stage"),
    canvas = $("#gl") as HTMLCanvasElement,
    glow = $("#glow"),
    bar = $("#bar");
  var letters: HTMLElement[] = [].slice.call(scope.querySelectorAll("#word .l"));

  /* ---------- findings board ---------- */
  var rowsEl = $("#rows"),
    rowEls: HTMLElement[] = [].slice.call(scope.querySelectorAll("#rows .lx-row")),
    labA = $("#labA"),
    labB = $("#labB");
  function setBoard(t) {
    var e = ease(clamp(t, 0, 1));
    rowEls.forEach(function (r, i) {
      var f = BOARD[i],
        pos = lerp(f[5], f[6], e);
      r.style.setProperty("--pos", pos.toFixed(3));
      (r.firstChild as HTMLElement).textContent = String(Math.round(pos) + 1).padStart(2, "0");
    });
    rowsEl.style.setProperty("--mv", clamp((t - 0.85) / 0.15, 0, 1).toFixed(2));
    labA.style.opacity = 1 - e;
    labA.style.transform = "translateY(" + -e * 100 + "%)";
    labB.style.opacity = e;
    labB.style.transform = "translateY(" + (1 - e) * 100 + "%)";
  }
  setBoard(reduce ? 1 : 0);

  /* ---------- nav ---------- */
  var navBtns: HTMLElement[] = [].slice.call(scope.querySelectorAll("#nav button"));
  function goTo(i) {
    if (reduce) {
      var fr = scope.querySelectorAll(".lx-frame")[i];
      if (fr) fr.scrollIntoView({ behavior: "auto" });
      return;
    }
    var total = spec.offsetHeight - stage.clientHeight;
    var p = clamp((i + HOLD * 0.5) / (S - 1), 0, 1);
    if (i === S - 1) p = 1;
    window.scrollTo({ top: spec.offsetTop + p * total, behavior: "smooth" });
  }
  on(scope, "click", function (e) {
    var t = e.target.closest("[data-go]");
    if (!t) return;
    e.preventDefault();
    goTo(+t.dataset.go);
  });

  /* ---------- copy ---------- */
  var copyBtn = $("#copy"),
    copyTimer: any = 0;
  on(copyBtn, "click", function () {
    var done = function () {
      copyBtn.textContent = "Copied";
      copyTimer = setTimeout(function () {
        copyBtn.textContent = "Copy";
      }, 1600);
    };
    var fallback = function () {
      var r = document.createRange();
      r.selectNodeContents($("#cmd"));
      var s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
      copyBtn.textContent = "Selected";
    };
    try {
      navigator.clipboard.writeText(INSTALL_CMD).then(done, fallback);
    } catch (err) {
      fallback();
    }
  });

  /* ---------- reveal engine ---------- */
  var frames: HTMLElement[] = [].slice.call(scope.querySelectorAll(".lx-frame"));
  var fx = [];
  frames.forEach(function (fr, i) {
    [].slice.call(fr.querySelectorAll("[data-fx]")).forEach(function (el) {
      fx.push({ el: el, sc: i, type: el.dataset.fx, d: parseFloat(el.dataset.d || 0) });
    });
  });
  function reveal(c) {
    for (var k = 0; k < fx.length; k++) {
      var o = fx[k],
        d = c - o.sc;
      var enter = clamp((d + 0.5 - o.d * 0.25) / 0.3, 0, 1),
        exit = clamp((d - 0.04 - o.d * 0.08) / 0.34, 0, 1);
      var e = easeOut(enter),
        x = ease(exit),
        v = e * (1 - x),
        el = o.el;
      if (o.type === "clip") {
        el.style.clipPath = "inset(-10% " + ((1 - e) * 100).toFixed(2) + "% -10% 0)";
        el.style.opacity = 1 - x;
        el.style.transform = "translateY(" + (-x * 40).toFixed(1) + "px)";
      } else if (o.type === "fade") {
        el.style.opacity = v;
      } else {
        el.style.opacity = v;
        el.style.transform = "translateY(" + ((1 - e) * 36 - x * 36).toFixed(1) + "px)";
      }
    }
    for (var i = 0; i < frames.length; i++) {
      var onF = Math.abs(c - i) < 0.45;
      frames[i].classList.toggle("on", onF);
      frames[i].setAttribute("aria-hidden", onF ? "false" : "true");
      if ("inert" in frames[i]) (frames[i] as any).inert = !onF;
    }
  }

  /* ---------- WebGL: raymarched liquid chrome (2D fallback without WebGL) ---------- */
  var beads = beadLayout();
  var gl: WebGLRenderingContext | null = null;
  try {
    gl = (canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true }) ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext;
  } catch (e) {
    gl = null;
  }
  var U: any = {};
  function sh(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function initGL() {
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    var b = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aP = gl.getAttribLocation(prog, "aP");
    gl.enableVertexAttribArray(aP);
    gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
    ["uRes", "uOff", "uR", "uRt", "uS", "uTime", "uHeat", "uC", "uA", "uB", "uRad", "uHot"].forEach(function (n) {
      U[n] = gl.getUniformLocation(prog, n);
    });
    gl.uniform3fv(U.uA, beads.BA);
    gl.uniform3fv(U.uB, beads.BB);
    gl.uniform1fv(U.uRad, beads.BR);
    gl.uniform1fv(U.uHot, beads.BH);
    gl.clearColor(0, 0, 0, 0);
  }
  if (gl) {
    try {
      initGL();
    } catch (e) {
      console.warn(e);
      gl = null;
    }
  }
  var ctx2 = gl ? null : canvas.getContext("2d");
  on(
    canvas,
    "webglcontextlost",
    function (e) {
      e.preventDefault();
      gl = null;
      ctx2 = null;
    },
    false,
  );

  /* render scale adapts to the device: drop resolution if frames get slow */
  var W = 0,
    H = 0,
    DPR = 1,
    QUAL = 1,
    slow = 0;
  function resize() {
    DPR = Math.min(1.5, window.devicePixelRatio || 1) * QUAL;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * DPR));
    canvas.height = Math.max(1, Math.round(H * DPR));
    if (!reduce) spec.style.height = stage.clientHeight * (1 + (S - 1) * PER) + "px";
  }
  function perf(dt) {
    if (dt > 0.034) {
      slow++;
      if (slow > 20 && QUAL > 0.55) {
        QUAL -= 0.2;
        slow = 0;
        resize();
      }
    } else slow = Math.max(0, slow - 1);
  }
  var TAU = Math.PI * 2;
  function draw2D(k) {
    var c = ctx2;
    if (!c) return;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, canvas.width, canvas.height);
    var m = Math.min(canvas.width, canvas.height),
      R = m * 0.3 * k.size,
      cx = (canvas.width / 2) * (1 + k.ox),
      cy = (canvas.height / 2) * (1 - k.oy);
    var g = c.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.05, cx, cy, R);
    g.addColorStop(0, "#fffaf0");
    g.addColorStop(0.35, "#8a857c");
    g.addColorStop(0.7, "#2a2723");
    g.addColorStop(0.92, "#c98a1a");
    g.addColorStop(1, "#1a1712");
    c.fillStyle = g;
    c.beginPath();
    c.arc(cx, cy, R, 0, TAU);
    c.fill();
  }
  function render(k, yaw, pitch, roll, t, heat) {
    glow.style.transform =
      "translate(" +
      ((k.ox * W) / 2).toFixed(1) +
      "px," +
      ((-k.oy * H) / 2).toFixed(1) +
      "px) scale(" +
      (0.6 + k.size * 0.6).toFixed(3) +
      ")";
    if (!gl) {
      draw2D(k);
      return;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    var asp = W / H,
      fit = asp < 1 ? asp : 1,
      R = rot(yaw, pitch, roll);
    gl.uniformMatrix3fv(U.uR, false, new Float32Array(R));
    gl.uniformMatrix3fv(U.uRt, false, new Float32Array(tr(R)));
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uOff, k.ox, k.oy);
    gl.uniform1f(U.uS, k.size * fit);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uHeat, heat || 0);
    gl.uniform1f(U.uC, k.c || 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ---------- state ---------- */
  var tall = false;
  function measureTall() {
    tall = canvas.clientWidth / Math.max(1, canvas.clientHeight) < 0.8;
  }
  function progress() {
    var total = spec.offsetHeight - stage.clientHeight;
    if (total <= 0) return 0;
    return clamp((window.scrollY - spec.offsetTop) / total, 0, 1);
  }
  function sceneCoord(raw) {
    var i = Math.floor(raw),
      f = raw - i;
    if (i >= S - 1) return S - 1;
    return i + (f < HOLD ? 0 : ease((f - HOLD) / (1 - HOLD)));
  }
  var stepEls: HTMLElement[] = [].slice.call(scope.querySelectorAll("#steps .lx-step"));
  var plateNo = $("#plateNo"),
    plateName = $("#plateName"),
    footCoord = $("#footCoord"),
    cur = -1;
  function setPlate(i) {
    if (i === cur) return;
    cur = i;
    plateNo.innerHTML = "<b>" + String(i + 1).padStart(2, "0") + "</b> / 06";
    plateName.textContent = "· " + PLATES[i];
    navBtns.forEach(function (b, j) {
      if (j === i) b.setAttribute("aria-current", "step");
      else b.removeAttribute("aria-current");
    });
  }

  /* pointer tilt + drag spin */
  var tx = 0,
    ty = 0,
    ptx = 0,
    pty = 0,
    drag = 0,
    dragV = 0,
    dragging = false,
    lastX = 0,
    fine = matchMedia("(pointer:fine)").matches;
  on(stage, "pointermove", function (e) {
    if (fine) {
      ptx = e.clientX / W - 0.5;
      pty = e.clientY / H - 0.5;
    }
    if (dragging) {
      var dx = e.clientX - lastX;
      lastX = e.clientX;
      dragV = dx * 0.008;
      drag += dragV;
    }
  });
  on(canvas, "pointerdown", function (e) {
    dragging = true;
    lastX = e.clientX;
    canvas.classList.add("drag");
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) {}
  });
  on(window, "pointerup", function () {
    dragging = false;
    canvas.classList.remove("drag");
  });
  on(stage, "pointerleave", function () {
    ptx = 0;
    pty = 0;
  });

  /* letter morph: Bodoni Moda weight swings hairline↔black, optical size swings display↔text cut */
  function morph(raw, t) {
    var leave = clamp(raw / 0.9, 0, 1);
    for (var i = 0; i < letters.length; i++) {
      var ph = i * 0.78 + raw * 4.2 + (reduce ? 0 : t * 0.6);
      var wave = Math.sin(ph) * 0.5 + 0.5;
      var near = fine ? Math.max(0, 1 - Math.abs(ptx * 2 - ((i / (letters.length - 1)) * 2 - 1) * 0.5) * 1.6) : 0;
      var wg = lerp(860, lerp(560, 900, 1 - wave), leave * 0.85 + 0.06 * wave);
      wg = lerp(wg, 900, near * 0.7);
      var op = lerp(36, lerp(8, 72, wave), leave * 0.8 + 0.08 * wave);
      op = lerp(op, 8, near * 0.6);
      letters[i].style.fontVariationSettings = '"opsz" ' + op.toFixed(1) + ',"wght" ' + wg.toFixed(0);
    }
  }

  /* ---------- loop ---------- */
  var sc = 0,
    sraw = 0,
    last = performance.now(),
    t0 = last,
    visible = true,
    running = false,
    rafId = 0,
    stopped = false;
  function frame(now) {
    running = false;
    if (stopped) return;
    var t = (now - t0) / 1000,
      raw = progress() * (S - 1),
      c = sceneCoord(raw);
    var dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    perf(dt);
    var a = 1 - Math.exp(-dt * 9);
    sc += (c - sc) * a;
    sraw += (raw - sraw) * a;
    if (Math.abs(c - sc) < 1e-4) sc = c;
    var b2 = 1 - Math.exp(-dt * 4);
    tx += (ptx - tx) * b2;
    ty += (pty - ty) * b2;
    if (!dragging) {
      dragV *= 0.94;
      drag += dragV;
    }
    var k = cam(sc, tall);
    var bloom = easeOut(clamp(t / 1.8, 0, 1));
    k.size *= lerp(0.55, 1, bloom);
    var yaw = k.spin + drag + tx * 0.5 + Math.sin(t * 0.35) * 0.22 + (1 - bloom) * -2.2,
      pitch = k.el + ty * 0.35,
      roll = 0;
    k.c = sc;
    var heat = Math.abs(sc - 2) < 0.6 ? (1 - Math.abs(sc - 2) / 0.6) * 0.8 : 0;
    render(k, yaw, pitch, roll, t, heat);
    if (Math.abs(sc - 3) < 0.6) {
      var bxv = ((((t * 0.55) % 4.6) + 4.6) % 4.6) - 2.3,
        hot = Math.abs(bxv) > 2 ? -1 : bxv < -0.75 ? 0 : bxv < 0.75 ? 1 : 2;
      for (var si = 0; si < stepEls.length; si++) stepEls[si].classList.toggle("hot", si === hot);
    }
    reveal(sc);
    morph(sraw, t);
    setBoard((sraw - 1.75) / 0.4);
    bar.style.transform = "scaleX(" + progress().toFixed(4) + ")";
    setPlate(Math.round(sc));
    footCoord.textContent = "Plate " + (sc + 1).toFixed(2);
    if (visible) schedule();
  }
  function schedule() {
    if (!running && !stopped) {
      running = true;
      rafId = requestAnimationFrame(frame);
    }
  }
  function staticRender() {
    /* reduced motion: one still frame of the reticle behind the cover, everything else stacked and visible */
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    DPR = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    measureTall();
    var k = cam(0, tall);
    k.c = 0;
    render(k, k.spin, k.el, 0, 0, 0);
    morph(0, 0);
    setPlate(0);
  }

  measureTall();
  resize();
  var io: IntersectionObserver | null = null;
  if (reduce) {
    staticRender();
    on(window, "resize", staticRender);
  } else {
    io = new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) schedule();
    });
    io.observe(stage);
    on(window, "resize", function () {
      measureTall();
      resize();
      schedule();
    });
    on(document, "visibilitychange", function () {
      if (!document.hidden) schedule();
    });
    on(window, "scroll", schedule, { passive: true });
    reveal(0);
    schedule();
  }

  return function stop() {
    stopped = true;
    cancelAnimationFrame(rafId);
    clearTimeout(copyTimer);
    if (io) io.disconnect();
    offs.forEach(function (off) {
      off();
    });
    docEl.classList.remove("lx-static");
  };
}
