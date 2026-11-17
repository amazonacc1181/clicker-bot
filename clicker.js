/* Clicker Bot runtime. Loaded only when the user taps their saved bookmarklet. */
function runClicker(){
    // Change interval defaults and allowed range here; the UI, validation and timer share this config.
    const INTERVAL_CONFIG = Object.freeze({
      minMs: 1,
      maxMs: 60000,
      defaultMs: 1000,
      stepMs: 1
    });

    const existing = document.getElementById('__clicker_bot_host__');
    if(existing){ existing.remove(); return; }
    const host = document.createElement('div');
    host.id = '__clicker_bot_host__';
    host.style.cssText = 'all:initial;position:fixed;z-index:2147483647;right:14px;bottom:14px;';
    (document.documentElement || document.body).appendChild(host);
    const root = host.attachShadow({mode:'open'});
    root.innerHTML =
      '<style>' +
      ':host{all:initial;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#eef4ff}' +
      '*{box-sizing:border-box} .panel{width:min(340px,calc(100vw - 28px));background:#101b2c;color:#eef4ff;border:1px solid #435675;border-radius:15px;box-shadow:0 12px 40px #0008;overflow:hidden;font:13px/1.45 system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}' +
      '.head{display:flex;align-items:center;gap:8px;padding:12px 13px;background:#1a2a43;font-weight:800;letter-spacing:.04em}.head button{margin-left:auto}.head button+button{margin-left:0}.head #minimize{min-width:54px;padding:9px 12px;background:#77aaff;color:#071427;border:1px solid #d7e7ff;font-size:12px;font-weight:900;letter-spacing:.05em}.head #hide{min-width:36px;padding:9px 11px}' +
      '.panel.minimized{width:56px;height:56px;border-radius:50%}.panel.minimized .head{width:56px;height:56px;padding:0;justify-content:center;border-radius:50%}.panel.minimized .brand,.panel.minimized .body,.panel.minimized #hide{display:none}.panel.minimized #minimize{width:42px;height:42px;margin:0;border-radius:50%;font-size:19px;padding:0}' +
      '.body{padding:13px}.target{padding:9px;background:#0a1423;border:1px solid #30425d;border-radius:8px;color:#c7d8f2;overflow-wrap:anywhere;margin:5px 0 11px;max-height:58px;overflow:auto}' +
      'label{display:block;font-size:12px;color:#c1cde0;font-weight:700;margin:9px 0 5px}input{width:100%;padding:9px;border-radius:8px;background:#091322;border:1px solid #354865;color:white;font:inherit}' +
      '.row{display:grid;grid-template-columns:1fr 1fr;gap:9px}.actions{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;margin-top:12px}' +
      'button{border:0;border-radius:8px;padding:9px 10px;background:#77aaff;color:#071427;font-weight:800;font-size:12px;cursor:pointer}button.alt{background:#293c58;color:#f1f6ff}button.stop{background:#70343d;color:#fff}' +
      '.stats{display:flex;justify-content:space-between;gap:8px;color:#b8c6da;margin-top:12px;font-size:12px}.msg{margin-top:9px;color:#82e1ae;min-height:18px}.small{font-size:11px;color:#91a2bb;margin-top:10px}' +
      '</style>' +
      '<div class="panel" id="panel" role="region" aria-label="Auto clicker controls">' +
      '<div class="head"><span class="brand">⌁ AUTO CLICKER</span><button id="minimize" title="Minimize" aria-label="Minimize">MIN</button><button class="alt" id="hide" title="Close">✕</button></div>' +
      '<div class="body">' +
      '<div style="font-weight:700">Selected page element</div><div class="target" id="target">No button selected</div>' +
      '<button id="pick" style="width:100%">Pick button on page</button>' +
      '<div class="row"><div><label for="interval">Interval (ms)</label><input id="interval" type="number" min="' + INTERVAL_CONFIG.minMs + '" max="' + INTERVAL_CONFIG.maxMs + '" step="' + INTERVAL_CONFIG.stepMs + '" value="' + INTERVAL_CONFIG.defaultMs + '"></div>' +
      '<div><label for="limit">Max clicks (0 = unlimited)</label><input id="limit" type="number" min="0" step="1" value="0"></div></div>' +
      '<div class="actions"><button id="start">Start</button><button class="alt" id="pause">Pause</button><button class="stop" id="stop">Stop</button></div>' +
      '<div class="stats"><span>Clicks: <b id="count">0</b></span><span>Status: <b id="state">Ready</b></span></div>' +
      '<div class="msg" id="msg" aria-live="polite">Pick a button to begin.</div>' +
      '<div class="small">Tip: Press Escape to stop. Close ✕ to remove this panel.</div>' +
      '</div></div>';

    const el = (id) => root.getElementById(id);
    let selector = '', total = 0, timer = null, active = false, paused = false, picking = false;
    function describe(node){
      if(!node) return 'No button selected';
      let s = node.tagName.toLowerCase();
      if(node.id) s += '#' + node.id;
      if(node.classList && node.classList.length) s += '.' + Array.from(node.classList).slice(0,2).join('.');
      const label = (node.innerText || node.getAttribute('aria-label') || node.getAttribute('title') || '').trim().replace(/\s+/g,' ').slice(0,42);
      return s + (label ? ' — ' + label : '');
    }
    function makeSelector(node){
      if(node.id) return '#' + CSS.escape(node.id);
      const parts = [];
      let current = node;
      while(current && current.nodeType === 1 && current !== document.documentElement && parts.length < 7){
        let part = current.localName;
        if(current.classList && current.classList.length){
          part += '.' + Array.from(current.classList).slice(0,2).map(c => CSS.escape(c)).join('.');
        }
        const parent = current.parentElement;
        if(parent){
          const same = Array.from(parent.children).filter(x => x.localName === current.localName);
          if(same.length > 1) part += ':nth-of-type(' + (same.indexOf(current) + 1) + ')';
        }
        parts.unshift(part);
        current = parent;
      }
      return parts.join(' > ');
    }
    function setMessage(message, state){ el('msg').textContent = message; if(state) el('state').textContent = state; }
    function readIntervalMs(){
      const value = Number(el('interval').value);
      if(!Number.isFinite(value) || value < INTERVAL_CONFIG.minMs || value > INTERVAL_CONFIG.maxMs) return null;
      return value;
    }
    function intervalErrorMessage(){
      return 'Interval must be between ' + INTERVAL_CONFIG.minMs + ' and ' + INTERVAL_CONFIG.maxMs + ' ms.';
    }
    function setMinimized(value){
      const minimized = !!value;
      el('panel').classList.toggle('minimized', minimized);
      el('minimize').textContent = minimized ? 'OPEN' : 'MIN';
      el('minimize').title = minimized ? 'Restore controls' : 'Minimize';
      el('minimize').setAttribute('aria-label', minimized ? 'Restore controls' : 'Minimize');
    }
    function clearTimer(){ if(timer !== null){ clearTimeout(timer); timer = null; } }
    function stop(message){
      active = false; paused = false; clearTimer();
      el('state').textContent = 'Stopped';
      el('start').textContent = 'Start';
      setMessage(message || 'Stopped.', 'Stopped');
    }
    function clickOnce(){
      if(!active) return;
      let target = null;
      try { target = selector ? document.querySelector(selector) : null; } catch(e){}
      if(!target || !target.isConnected){ stop('Target button is no longer on the page. Pick it again.'); return; }
      try { target.click(); total++; el('count').textContent = String(total); }
      catch(e){ stop('The page did not accept the click: ' + e.message); return; }
      const limit = Math.max(0, Number(el('limit').value) || 0);
      if(limit > 0 && total >= limit){ stop('Click limit reached.'); return; }
      const delay = readIntervalMs();
      if(delay === null){ stop(intervalErrorMessage()); return; }
      timer = setTimeout(clickOnce, delay);
    }
    function pickHandler(event){
      if(!picking) return;
      if(event.composedPath && event.composedPath().includes(host)) return;
      const node = event.target && event.target.nodeType === 1 ? event.target : event.target && event.target.parentElement;
      if(!node || node === document.documentElement || node === document.body) return;
      event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      selector = makeSelector(node);
      el('target').textContent = describe(node) + ' | ' + selector;
      picking = false; el('pick').textContent = 'Pick another button';
      setMessage('Button selected. Set interval and press Start.', 'Ready');
      document.removeEventListener('click', pickHandler, true);
    }
    el('minimize').addEventListener('click', function(){
      setMinimized(!el('panel').classList.contains('minimized'));
    });
    el('pick').addEventListener('click', function(){
      if(active) stop('Stopped so you can choose a new target.');
      picking = true; el('pick').textContent = 'Now click the target on the page…';
      setMessage('Click the button or element you want to repeat. That one selection click is cancelled.', 'Picking');
      document.addEventListener('click', pickHandler, true);
    });
    el('start').addEventListener('click', function(){
      if(!selector){ setMessage('Pick a button first.', 'Ready'); return; }
      if(active) return;
      const delay = readIntervalMs();
      if(delay === null){ setMessage(intervalErrorMessage(), 'Ready'); return; }
      active = true; paused = false; el('start').textContent = 'Running';
      setMessage('Auto clicking. Use Pause or Stop at any time.', 'Running');
      setMinimized(true);
      clickOnce();
    });
    el('pause').addEventListener('click', function(){
      if(!active){ if(paused){ active = true; paused = false; el('start').textContent = 'Running'; setMessage('Resumed.', 'Running'); clickOnce(); } return; }
      active = false; paused = true; clearTimer(); el('start').textContent = 'Resume'; setMessage('Paused.', 'Paused');
    });
    el('stop').addEventListener('click', function(){ stop('Stopped by user.'); });
    el('hide').addEventListener('click', function(){
      stop('Closed.'); document.removeEventListener('click', pickHandler, true);
      document.removeEventListener('keydown', keyHandler, true); host.remove();
    });
    function keyHandler(event){ if(event.key === 'Escape'){ stop('Stopped with Escape.'); picking = false; document.removeEventListener('click', pickHandler, true); } }
    document.addEventListener('keydown', keyHandler, true);
  }

runClicker();
