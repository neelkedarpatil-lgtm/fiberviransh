import React, { useMemo, useState } from 'react';
import { Activity, Atom, BookOpen, Cable, Check, ChevronDown, CircleHelp, Download, FlaskConical, Gauge, Lightbulb, Play, RotateCcw, Pause, Waves, Zap } from 'lucide-react';
import FibreScene from './components/FibreScene.jsx';
import Graphs from './components/Graphs.jsx';
import { calculatePhysics, classifyInternalRay, downloadCsv, makeAngleGraph, makeAttenuationGraph, makeBendGraph, makeLengthGraph, makePowerGraph } from './lib/physics.js';

const initial = { nCore: 1.48, nClad: 1.46, nExternal: 1, wavelength: 1310, inputPower: 1, length: 1, attenuation: .2, bendRadius: 20, bendEnabled: true, couplingLoss: .15, bend: false, curvature: .32, controlPoints: [-.1, .32, -.1], incidence: 82, entrance: 8, rayMode: 'manual', showCore: true, showCladding: true, showRay: true, realistic: true };
const tabs = [{ id:'simulation', label:'Simulation', icon: Activity }, { id:'theory', label:'Physics theory', icon: BookOpen }, { id:'graphs', label:'Live graphs', icon: Waves }, { id:'applications', label:'Applications', icon: Lightbulb }, { id:'viva', label:'Viva questions', icon: CircleHelp }];
const viva = [
['What is an optical fibre?','A thin, flexible dielectric waveguide that transmits light along its length.'],
['What is the core?','The central region through which the optical signal is mainly guided.'],
['What is cladding?','The surrounding optical layer with a lower refractive index than the core.'],
['What is total internal reflection (TIR)?','Complete reflection at a boundary when light travels from higher to lower refractive index and the incidence angle exceeds the critical angle.'],
['Define critical angle.','The incidence angle in the denser medium for which the refracted ray travels along the interface.'],
['Write the critical-angle formula.','θc = sin⁻¹(n₂/n₁), valid when n₁ > n₂.'],
['What is numerical aperture?','A measure of an optical fibre’s light-gathering ability; for a step-index fibre in air, NA = √(n₁² − n₂²).'],
['Define acceptance angle.','The maximum external entrance half-angle for guided rays, measured from the fibre axis.'],
['What is attenuation?','Reduction in optical signal power as light propagates through a fibre, commonly expressed in dB/km.'],
['How is received power calculated from loss?','Pout = Pin × 10^(−Ltotal/10), with loss in dB.'],
['What is macrobending loss?','Loss caused by large-scale bends that allow guided optical power to escape.'],
['What is microbending loss?','Loss due to small, localized distortions or pressure-induced bends along the fibre.'],
['What does a transmitter do?','It converts an electrical information signal into an optical signal using a source such as a laser or LED.'],
['What does a photodetector do?','It converts received optical power into an electrical signal.'],
['Why is fibre used for long-distance communication?','It offers high bandwidth, low attenuation, electrical isolation and immunity to electromagnetic interference.'],
['Why must the core index exceed the cladding index for standard TIR guiding?','That index contrast allows light in the core to undergo TIR at the core–cladding boundary.'],
['What is Fresnel reflection?','Partial reflection at an interface caused by a mismatch in refractive index.'],
['Does this visualization solve Maxwell’s equations?','No. It is an educational geometric ray and link-budget model, not a full electromagnetic-wave solver.']
];

function Slider({ label, value, min, max, step, unit, onChange, digits=2 }) {
  return <div className="control">
    <div className="control-head"><label>{label}</label><output>{Number(value).toFixed(digits)}{unit}</output></div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))}/>
    <div className="range-labels"><span>{min}{unit}</span><span>{max}{unit}</span></div>
  </div>;
}
function Metric({ label, value, note, accent='cyan' }) {
  return <div className={`metric metric-${accent}`}><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}
function SectionHeading({ eyebrow, title, copy }) {
  return <div className="section-heading"><div><div className="eyebrow">{eyebrow}</div><h2>{title}</h2></div>{copy && <p>{copy}</p>}</div>;
}
function Theory() {
  const concepts = [
    ['Fibre structure','A fibre contains a higher-index core, lower-index cladding and a protective coating. The core guides the optical field; cladding helps maintain the boundary conditions for guidance.','Core and cladding are optical layers, not electrical conductors.'],
    ['Total internal reflection','At a core–cladding boundary, light can be guided by TIR when it travels from higher to lower refractive index and its incidence angle (measured from the normal) is greater than the critical angle.','Do not compare the entrance angle directly with the critical angle.'],
    ['Critical angle','The critical angle is the incidence angle in the higher-index medium for which the refracted ray travels along the boundary.','θc = sin⁻¹(n₂/n₁), where n₁ > n₂.'],
    ['Numerical aperture','NA describes the idealized light acceptance of a step-index fibre. With air outside, NA = √(n₁² − n₂²).','For an external medium n₀, sin θmax = NA/n₀ if the ratio is ≤ 1.'],
    ['Optical attenuation','Absorption, scattering, bends and connections reduce the power that reaches a receiver. Baseline attenuation is often quoted in dB/km.','Lbaseline = αL; Pout = Pin × 10^(−Ltotal/10).'],
    ['Bending and coupling losses','Macrobending can leak guided power around tight curves. Microbending creates small distortions. Fresnel reflection and imperfect alignment can also reduce launched power.','Actual loss depends on fibre construction, wavelength, bend radius and installation.'],
    ['Transmitter and receiver','A laser or LED converts an electrical signal into modulated light. At the far end, a photodiode detects light and converts it into an electrical signal for processing.','This is a simplified communication link, not a complete modem.']
  ];
  return <div className="content-page"><SectionHeading eyebrow="THEORY / FIRST-YEAR ENGINEERING" title="The physics behind the light" copy="Short explanations, equations and assumptions for your project presentation."/>
    <div className="theory-grid">{concepts.map((c,i)=><article className="theory-card" key={c[0]}><div className="theory-number">{String(i+1).padStart(2,'0')}</div><h3>{c[0]}</h3><p>{c[1]}</p><div className="formula-note">{c[2]}</div></article>)}</div>
    <div className="formula-board"><h3>Formula sheet</h3><div className="formula-list"><div><b>Critical angle</b><code>θc = sin⁻¹(n₂ / n₁)</code></div><div><b>Numerical aperture</b><code>NA = √(n₁² − n₂²)</code></div><div><b>Acceptance angle</b><code>θmax = sin⁻¹(NA / n₀)</code></div><div><b>Baseline loss</b><code>Lbaseline = α × L</code></div><div><b>Received power</b><code>Pout = Pin × 10^(−Ltotal / 10)</code></div><div><b>Percentage loss</b><code>100 × (Pin − Pout) / Pin</code></div></div></div>
  </div>;
}
function Applications() {
  const items = [
    ['01','Internet & telecom','Fibre carries high data rates between homes, data centres and network exchanges.'],
    ['02','Undersea cables','Submarine fibre systems connect continents; optical amplifiers compensate for transmission loss.'],
    ['03','Medical endoscopy','Flexible fibre bundles and fibre-based imaging systems help illuminate and inspect internal spaces.'],
    ['04','Industrial inspection','Optical probes can inspect engines, pipes and confined equipment where direct viewing is difficult.'],
    ['05','Fibre-optic sensors','Changes in light can be used to infer strain, temperature, pressure or vibration.'],
    ['06','Aerospace & automotive','Optical links and sensors can reduce electromagnetic interference and support lightweight instrumentation.'],
    ['07','Fibre-optic gyroscopes','Interferometric fibre coils measure rotation by comparing counter-propagating light.'],
    ['08','Secure data links','Fibre is difficult to tap without some disturbance, but it is not automatically immune to interception.']
  ];
  return <div className="content-page"><SectionHeading eyebrow="REAL-WORLD USES" title="Where guided light matters" copy="From global internet links to medical instruments, fibre optics turns light into a practical information channel."/><div className="application-grid">{items.map(x=><article className="application-card" key={x[0]}><span>{x[0]}</span><h3>{x[1]}</h3><p>{x[2]}</p></article>)}</div><div className="signal-flow"><div><Zap size={20}/><b>Electrical data</b><small>Information signal</small></div><i>→</i><div><Lightbulb size={20}/><b>Optical transmitter</b><small>Laser / LED</small></div><i>→</i><div><Cable size={20}/><b>Optical fibre</b><small>Guided light</small></div><i>→</i><div><Activity size={20}/><b>Photodetector</b><small>Light to current</small></div><i>→</i><div><Atom size={20}/><b>Electrical output</b><small>Recovered data</small></div></div></div>;
}
function Viva() {
  const [open,setOpen] = useState(0);
  return <div className="content-page"><SectionHeading eyebrow="PRESENTATION PREP" title="Viva questions & answers" copy="Practice concise answers to common first-year engineering physics questions."/><div className="viva-list">{viva.map((q,i)=><article className={`viva-item ${open===i?'open':''}`} key={q[0]}><button onClick={()=>setOpen(open===i?-1:i)}><span className="viva-n">{String(i+1).padStart(2,'0')}</span><b>{q[0]}</b><ChevronDown size={17}/></button>{open===i&&<p>{q[1]}</p>}</article>)}</div><div className="pitch-card"><div className="eyebrow">2-MINUTE PROJECT EXPLANATION</div><h3>Suggested presentation script</h3><p>“Our project demonstrates how an optical fibre transmits information using light. The fibre has a higher-refractive-index core and a lower-index cladding. Under suitable conditions, light is guided by total internal reflection. The simulation lets us change the core and cladding indices, incident angle, wavelength, fibre length and attenuation to see how the critical angle, numerical aperture and received optical power change. We also compare straight and bent fibres. The dashboard uses the standard attenuation relation to calculate received power, while the bend-loss curve is clearly labelled as an educational approximation. This model helps us connect the equations from engineering physics with a visual communication system.”</p></div></div>;
}

export default function App() {
  const [params,setParams] = useState(initial);
  const [tab,setTab] = useState('simulation');
  const [playing,setPlaying] = useState(true);
  const [step,setStep] = useState(0);
  const [preset,setPreset] = useState('standard');
  const [showBreakdown,setShowBreakdown] = useState(false);
  const [reportMessage,setReportMessage] = useState('');
  const update = (key,value) => setParams(p => {
    const next = { ...p, [key]: value };
    if (key === 'nCore' && value <= p.nClad) next.nCore = p.nClad + .001;
    if (key === 'nClad' && value >= p.nCore) next.nClad = p.nCore - .001;
    return next;
  });
  const physics = useMemo(() => calculatePhysics(params), [params]);
  const updateControlPoint = (index, y) => setParams(p => {
    const points = [...(p.controlPoints ?? [-.1, p.curvature, -.1])];
    points[index] = y;
    return { ...p, bend: true, controlPoints: points, curvature: Math.max(...points.map(v => Math.abs(v))) };
  });
  const critical = physics.criticalAngle ?? 0;
  const internalAngle = params.rayMode === 'manual' ? params.incidence : Math.max(0, 90 - params.entrance);
  const rayStatus = classifyInternalRay(internalAngle, critical);
  const graphData = useMemo(() => ({
    angle: makeAngleGraph(params),
    bend: makeBendGraph(params),
    length: makeLengthGraph(params),
    power: makePowerGraph(params),
    curvature: [0,.1,.2,.3,.4,.5,.6,.7,.8].map(severity => {
      const radius = Math.max(1, 50 - severity * 60);
      return { severity: Number(severity.toFixed(1)), power: Number(calculatePhysics({ ...params, bendRadius: radius, bendEnabled: true }).receivedPower.toFixed(5)) };
    }),
    attenuation: makeAttenuationGraph(params)
  }), [params]);
  const setPresetNow = () => {
    const presets = {
      standard: { ...initial },
      below: { ...initial, incidence: 65, rayMode: 'manual' },
      above: { ...initial, incidence: 85, rayMode: 'manual' },
      tight: { ...initial, bend: true, curvature: .62, bendRadius: 2, length: 8, attenuation: .35 },
      long: { ...initial, length: 50, attenuation: .2 },
      index: { ...initial, nCore: 1.50, nClad: 1.44 }
    };
    setParams({...presets[preset], controlPoints: preset==='tight'?[-.25,.62,-.25]:[-.1,.32,-.1]});
    setPlaying(true); setStep(0);
  };
  const reset = () => { setParams(initial); setPlaying(true); setStep(0); setPreset('standard'); };
  const report = () => {
    const rows = [
      { parameter:'Core refractive index', value:params.nCore, unit:'dimensionless' },
      { parameter:'Cladding refractive index', value:params.nClad, unit:'dimensionless' },
      { parameter:'External medium index', value:params.nExternal, unit:'dimensionless' },
      { parameter:'Wavelength', value:params.wavelength, unit:'nm' },
      { parameter:'Internal incidence angle', value:internalAngle, unit:'degrees' },
      { parameter:'Critical angle', value:physics.criticalAngle, unit:'degrees' },
      { parameter:'Numerical aperture', value:physics.numericalAperture, unit:'dimensionless' },
      { parameter:'Acceptance angle', value:physics.acceptanceAngle, unit:'degrees' },
      { parameter:'Input power', value:params.inputPower, unit:'mW' },
      { parameter:'Length', value:params.length, unit:'km' },
      { parameter:'Baseline attenuation', value:params.attenuation, unit:'dB/km' },
      { parameter:'Bend radius', value:params.bendRadius, unit:'model units' },
      { parameter:'Predicted bend loss', value:physics.bendLoss, unit:'dB (educational approximation)' },
      { parameter:'Total loss', value:physics.totalLoss, unit:'dB' },
      { parameter:'Received power', value:physics.receivedPower, unit:'mW' },
      { parameter:'Power loss', value:physics.powerLossPercent, unit:'%' },
      { parameter:'Ray status', value:rayStatus, unit:'' }
    ];
    downloadCsv('fiberlab-simulation-report.csv', rows);
    setReportMessage('CSV report exported.');
    setTimeout(() => setReportMessage(''), 2500);
  };
  const displayPower = `${physics.receivedPower.toFixed(4)} mW`;
  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#" onClick={e=>{e.preventDefault();setTab('simulation')}}><span className="brand-icon"><Waves size={22}/></span><span>FIBERLAB <small>3D PHYSICS LABORATORY</small></span></a>
      <div className="top-status"><span className="status-dot"/>{playing?'SIMULATION READY':'SIMULATION PAUSED'}</div>
      <button className="btn btn-ghost top-reset" onClick={reset}><RotateCcw size={15}/> Reset lab</button>
    </header>
    <main className="main-shell">
      <section className="hero">
        <div><div className="eyebrow"><span className="eyebrow-rule"/> ENGINEERING PHYSICS / OPTICAL COMMUNICATION</div><h1>Transmission of signals<br/>through <span>light.</span></h1><p>Explore the physics of fibre optics in an interactive 3D laboratory. Change the material, bend the fibre, test ray conditions and watch the link budget respond.</p></div>
        <div className="hero-chip"><span className="chip-icon"><FlaskConical size={19}/></span><span><b>INTERACTIVE LAB</b><small>Live calculations · 3D model</small></span></div>
      </section>
      <nav className="tabs" aria-label="Project sections">{tabs.map(t=>{const Icon=t.icon;return <button key={t.id} className={tab===t.id?'tab active':'tab'} onClick={()=>setTab(t.id)}><Icon size={16}/>{t.label}</button>})}</nav>

      {tab==='simulation' && <div className="simulation-layout">
        <section className="left-column">
          <div className="scene-card">
            <div className="card-top"><div><span className="live-dot"/><b>LIVE OPTICAL BENCH</b><small>Drag to orbit · scroll to zoom</small></div><div className="scene-pills"><span>{params.bend?'CURVED FIBRE':'STRAIGHT FIBRE'}</span><span>{params.wavelength} nm</span></div></div>
            <div className="scene-viewport"><FibreScene {...params} criticalAngle={critical} angle={internalAngle} rayMode={params.rayMode} onControlPointChange={updateControlPoint}/></div>
            <div className="scene-legend"><span><i className="legend-laser"/>Laser source</span><span><i className="legend-core"/>Core</span><span><i className="legend-clad"/>Cladding</span><span><i className="legend-ray"/>Schematic ray path</span><span><i className="legend-receiver"/>Photodetector</span></div>
            <div className="scene-footer"><span>RAY PATH IS SCHEMATIC · NOT FULL-WAVE ELECTROMAGNETIC SIMULATION</span><button onClick={()=>update('bend',!params.bend)}>{params.bend?'Straighten fibre':'Bend fibre'} ↗</button></div>
          </div>
          <div className="metrics-panel">
            <div className="panel-heading"><div><div className="eyebrow">LIVE MEASUREMENTS</div><h2>Physics readout</h2></div><span className="live-tag"><span className="status-dot"/> UPDATED LIVE</span></div>
            <div className="metrics-grid">
              <Metric label="Critical angle" value={physics.criticalAngle==null?'Invalid':`${physics.criticalAngle.toFixed(2)}°`} note="from the normal"/>
              <Metric label="Numerical aperture" value={physics.numericalAperture?.toFixed(3) ?? '—'} note="step-index model" accent="violet"/>
              <Metric label="Acceptance half-angle" value={physics.acceptanceAngle==null?'Not real':`${physics.acceptanceAngle.toFixed(2)}°`} note="in selected medium" accent="green"/>
              <Metric label="Received power" value={displayPower} note={`${physics.powerLossPercent.toFixed(1)}% power loss`} accent="orange"/>
            </div>
            <div className="power-row"><div className="power-label"><span>RECEIVED / INPUT POWER</span><b>{params.inputPower>0?(physics.receivedPower/params.inputPower*100).toFixed(1):'0.0'}%</b></div><div className="power-track"><div style={{width:`${params.inputPower>0?Math.max(0,Math.min(100,physics.receivedPower/params.inputPower*100)):0}%`}}/></div><div className="power-foot"><span>Total link loss: {physics.totalLoss.toFixed(3)} dB</span><span>{params.inputPower.toFixed(2)} mW input → {displayPower}</span></div></div>
            <div className={`ray-result ${rayStatus}`}><span className="result-dot"/><div><b>{rayStatus==='total-internal-reflection'?'Total internal reflection':rayStatus==='critical'?'Critical-angle condition':rayStatus==='refracts'?'Refraction / possible leakage':'Invalid ray condition'}</b><small>{rayStatus==='total-internal-reflection'?'Internal incidence exceeds the critical angle in the ideal ray model.':rayStatus==='critical'?'At the critical angle, the refracted ray travels along the interface.':'Incidence is below critical; the ray can refract into the cladding. This is not a direct prediction of total link loss.'}</small></div></div>
            <button className="breakdown-toggle" onClick={()=>setShowBreakdown(!showBreakdown)}>{showBreakdown?'Hide':'Show'} calculation breakdown <ChevronDown size={15} className={showBreakdown?'rotated':''}/></button>
            {showBreakdown&&<div className="calculation-breakdown">
              <p><b>Critical angle:</b> sin⁻¹({params.nClad.toFixed(3)} / {params.nCore.toFixed(3)}) = {physics.criticalAngle?.toFixed(3)??'invalid'}°</p>
              <p><b>Numerical aperture:</b> √({params.nCore.toFixed(3)}² − {params.nClad.toFixed(3)}²) = {physics.numericalAperture?.toFixed(5)??'invalid'}</p>
              <p><b>Acceptance angle:</b> sin⁻¹({(physics.numericalAperture/params.nExternal).toFixed(5)}) = {physics.acceptanceAngle?.toFixed(3)??'no real angle'}°</p>
              <p><b>Baseline loss:</b> {params.attenuation.toFixed(3)} dB/km × {params.length.toFixed(2)} km = {physics.baselineLoss.toFixed(3)} dB</p>
              <p><b>Total loss:</b> {physics.baselineLoss.toFixed(3)} + {physics.bendLoss.toFixed(3)} bend + {physics.couplingLoss.toFixed(3)} coupling = {physics.totalLoss.toFixed(3)} dB</p>
              <p><b>Received power:</b> {params.inputPower.toFixed(3)} × 10^(−{physics.totalLoss.toFixed(3)}/10) = {physics.receivedPower.toFixed(5)} mW</p>
            </div>}
          </div>
          <div className="experiment-panel"><SectionHeading eyebrow="GUIDED DEMONSTRATIONS" title="Run an experiment" copy="Presets set up a useful condition so you can explain what changes and why."/><div className="preset-cards">{[['below','01','Below critical angle','Observe refraction in the ideal ray model.'],['above','02','Above critical angle','Observe the total internal reflection condition.'],['tight','03','Tight bend','Compare predicted bend loss with a straighter fibre.'],['long','04','Long-distance link','See how baseline attenuation accumulates with distance.']].map(x=><button className="preset-card" key={x[0]} onClick={()=>{setPreset(x[0]);const p={below:{...initial,incidence:65},above:{...initial,incidence:85},tight:{...initial,bend:true,bendRadius:2,length:8,attenuation:.35,curvature:.62},long:{...initial,length:50}};setParams({...p[x[0]], controlPoints: x[0]==='tight'?[-.25,.62,-.25]:[-.1,.32,-.1]});}}><span>{x[1]}</span><b>{x[2]}</b><small>{x[3]}</small></button>)}</div></div>
        </section>
        <aside className="right-column">
          <section className="panel controls-panel">
            <div className="panel-heading"><div><div className="eyebrow">01 / CONFIGURATION</div><h2>Lab controls</h2></div><Gauge size={19} color="#71dff4"/></div>
            <div className="control">
              <div className="control-head"><label>Ray experiment mode</label></div>
              <div className="segmented"><button className={params.rayMode==='manual'?'selected':''} onClick={()=>update('rayMode','manual')}>Internal angle</button><button className={params.rayMode==='entrance'?'selected':''} onClick={()=>update('rayMode','entrance')}>Entrance angle</button></div>
              <small className="control-help">Internal angle is measured from the core–cladding normal. Entrance angle is measured from the fibre axis; they are not interchangeable.</small>
            </div>
            {params.rayMode==='manual'?<Slider label="Internal incidence angle" value={params.incidence} min={0} max={90} step={1} unit="°" onChange={v=>update('incidence',v)} digits={0}/>:<Slider label="Entrance half-angle" value={params.entrance} min={0} max={Math.max(1,physics.acceptanceAngle??30)} step={.5} unit="°" onChange={v=>update('entrance',v)} digits={1}/>}
            <div className="angle-summary"><span>Current internal angle</span><b>{internalAngle.toFixed(1)}°</b><span>Critical angle</span><b>{physics.criticalAngle?.toFixed(1)??'—'}°</b></div>
            <div className="control-divider"/>
            <div className="control"><div className="control-head"><label>Core refractive index (n₁)</label><output>{params.nCore.toFixed(3)}</output></div><input type="range" min="1.45" max="1.60" step=".001" value={params.nCore} onChange={e=>update('nCore',Number(e.target.value))}/><div className="range-labels"><span>1.450</span><span>1.600</span></div></div>
            <div className="control"><div className="control-head"><label>Cladding refractive index (n₂)</label><output>{params.nClad.toFixed(3)}</output></div><input type="range" min="1.40" max="1.59" step=".001" value={params.nClad} onChange={e=>update('nClad',Number(e.target.value))}/><div className="range-labels"><span>1.400</span><span>1.590</span></div></div>
            <div className="control"><div className="control-head"><label>External medium (n₀)</label><output>{params.nExternal.toFixed(2)}</output></div><input type="range" min=".5" max="1.5" step=".01" value={params.nExternal} onChange={e=>update('nExternal',Number(e.target.value))}/><div className="range-labels"><span>0.50</span><span>1.50</span></div></div>
            <div className="control"><div className="control-head"><label>Wavelength</label><output>{params.wavelength} nm</output></div><div className="segmented"><button className={params.wavelength===850?'selected':''} onClick={()=>update('wavelength',850)}>850 nm</button><button className={params.wavelength===1310?'selected':''} onClick={()=>update('wavelength',1310)}>1310 nm</button><button className={params.wavelength===1550?'selected':''} onClick={()=>update('wavelength',1550)}>1550 nm</button></div></div>
            <div className="control-divider"/>
            <Slider label="Input optical power" value={params.inputPower} min={0} max={10} step={.1} unit=" mW" onChange={v=>update('inputPower',v)} digits={1}/>
            <Slider label="Fibre length" value={params.length} min={0} max={100} step={.5} unit=" km" onChange={v=>update('length',v)} digits={1}/>
            <Slider label="Baseline attenuation" value={params.attenuation} min={0} max={5} step={.05} unit=" dB/km" onChange={v=>update('attenuation',v)} digits={2}/>
            <Slider label="Bend radius" value={params.bendRadius} min={1} max={50} step={1} unit=" units" onChange={v=>update('bendRadius',v)} digits={0}/>
            <div className="control"><div className="control-head"><label>Bend curvature (visual)</label><output>{params.curvature.toFixed(2)}</output></div><input type="range" min="0" max=".8" step=".02" value={params.curvature} onChange={e=>{update('curvature',Number(e.target.value));update('bend',Number(e.target.value)>.02)}}/><div className="range-labels"><span>Straight</span><span>Curved</span></div></div>
            <div className="toggle-list">
              {[['bendEnabled','Include predicted bend loss'],['realistic','Realistic link-loss mode'],['showCore','Show fibre core'],['showCladding','Show transparent cladding'],['showRay','Show animated ray path']].map(([key,label])=><label className="toggle-row" key={key}><span>{label}</span><input type="checkbox" checked={params[key]} onChange={e=>update(key,e.target.checked)}/><i/></label>)}
            </div>
            <div className="control"><div className="control-head"><label>Quick preset</label></div><select value={preset} onChange={e=>setPreset(e.target.value)}><option value="standard">Standard fibre</option><option value="below">Below critical angle</option><option value="above">Above critical angle</option><option value="tight">Tight bend</option><option value="long">Long-distance link</option><option value="index">High index contrast</option></select><button className="btn btn-secondary full-btn" onClick={setPresetNow}>Apply preset</button></div>
            <div className="control-actions"><button className="btn btn-primary" onClick={()=>{setPlaying(!playing);setStep(step+1)}}>{playing?<Pause size={15}/>:<Play size={15}/>} {playing?'Pause demo':'Play demo'}</button><button className="btn btn-secondary" onClick={()=>{setStep(0);setPlaying(true)}}><RotateCcw size={15}/> Reset pulse</button></div>
          </section>
          <section className="panel loss-panel"><div className="eyebrow">LINK BUDGET</div><h3>Where power goes</h3><div className="loss-row"><span>Baseline attenuation</span><b>{physics.baselineLoss.toFixed(3)} dB</b></div><div className="loss-row"><span>Predicted bend loss <em>approx.</em></span><b>{physics.bendLoss.toFixed(3)} dB</b></div><div className="loss-row"><span>Coupling loss (example)</span><b>{physics.couplingLoss.toFixed(3)} dB</b></div><div className="loss-row total"><span>Total link loss</span><b>{physics.totalLoss.toFixed(3)} dB</b></div><p>Coupling loss is an example assumption. Bend loss is an educational approximation and not a validated fibre-specific prediction.</p><button className="btn btn-secondary full-btn" onClick={report}><Download size={15}/> Export simulation CSV</button>{reportMessage&&<div className="export-message"><Check size={14}/>{reportMessage}</div>}</section>
        </aside>
      </div>}
      {tab==='theory'&&<Theory/>}
      {tab==='graphs'&&<div className="content-page"><SectionHeading eyebrow="CALCULATED FROM LIVE PARAMETERS" title="See the relationships" copy="Graphs update from the same material and link parameters used in the dashboard. Angle transmission is a schematic ray-model indicator; bend loss is an educational approximation."/><Graphs physics={physics} params={params} data={graphData}/></div>}
      {tab==='applications'&&<Applications/>}
      {tab==='viva'&&<Viva/>}
      <footer className="footer"><span>FIBERLAB 3D <i>·</i> ENGINEERING PHYSICS</span><span>EDUCATIONAL MODEL · ASSUMPTIONS DISCLOSED</span></footer>
    </main>
  </div>;
}