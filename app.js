console.log('  window.HEIC_DETAILS available:', !!window.HEIC_DETAILS);
console.log('   Items count:', window.HEIC_DETAILS ? Object.keys(window.HEIC_DETAILS).length : 0);

/* Main builder logic using embedded details data */
let RAW_DATA = {};
let DATA_ARR = [];
async function loadData() {
  try {
    console.log('   Starting robust data load...');
    
    // Start with any pre-bundled details (file:// safe)
    RAW_DATA = (window.HEIC_DETAILS && typeof window.HEIC_DETAILS === 'object') ? window.HEIC_DETAILS : {};
    console.log(`  Initial RAW_DATA has ${Object.keys(RAW_DATA).length} items`);
    
    // Try multiple loading strategies
    if (Object.keys(RAW_DATA).length === 0) {
      console.log('   No bundled data, attempting network loading...');
      
      // Strategy 1: Direct fetch with better error handling and shorter timeout
      const loadPromises = [
        './compiled_details.json',
        './details.json',
        `${location.origin}/compiled_details.json`,
        `${location.origin}/details.json`
      ].map(async (url) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        try {
          console.log(`   Trying: ${url}`);
          const response = await fetch(url, { 
            signal: controller.signal,
            cache: 'no-store',
            credentials: 'same-origin'
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const data = await response.json();
          const itemCount = Object.keys(data || {}).length;
          
          if (itemCount === 0) {
            throw new Error('Empty data file');
          }
          
          console.log(`  Successfully loaded ${itemCount} items from: ${url}`);
          return data;
          
        } catch (error) {
          clearTimeout(timeoutId);
          console.log(`  ${url} failed: ${error.message}`);
          throw error;
        }
      });
      
      // Try all URLs in parallel, use the first successful one
      try {
        const results = await Promise.allSettled(loadPromises);
        const successful = results.find(result => result.status === 'fulfilled');
        
        if (successful) {
          RAW_DATA = Object.assign({}, RAW_DATA, successful.value);
          console.log(`  Network loading successful: ${Object.keys(RAW_DATA).length} items`);
        } else {
          console.log('  All network loading attempts failed');
          // Log all errors for debugging
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              console.log(`  - URL ${index}: ${result.reason.message}`);
            }
          });
        }
      } catch (parallelError) {
        console.error('  Parallel loading error:', parallelError);
      }
    }
    
    // If no network data loaded, check if we have any bundled data
    const totalItems = Object.keys(RAW_DATA).length;
    
    if (totalItems === 0) {
      const errorMsg = `  Failed to load compendium data. Tried:\n${errors.join('\n')}\n\nTip: Ensure details.json is in the root directory or /public folder`;
      console.error(errorMsg);
      
      // Show detailed error in UI
      const compendiumGrid = document.getElementById('itemGrid');
      if (compendiumGrid) {
        compendiumGrid.innerHTML = `
          <div style="grid-column: 1/-1; padding: 20px; background: #1a0000; border: 2px solid #f33; border-radius: 12px; margin: 20px;">
            <h3 style="color: #f33; margin: 0 0 16px 0;">  Data Loading Failed</h3>
            <p style="color: #fa0; margin: 0 0 16px 0; font-weight: 600;">Could not load compendium data from any source.</p>
            <details style="color: #ccc; font-size: 11px; font-family: monospace;">
              <summary style="color: #f33; cursor: pointer; margin-bottom: 8px;">   Debugging Info (click to expand)</summary>
              <pre style="background: #000; padding: 12px; border-radius: 6px; overflow-x: auto; white-space: pre-wrap;">${errors.join('\n')}</pre>
            </details>
            <p style="color: #aaa; font-size: 12px; margin: 16px 0 0 0;">
                 <strong>Fix:</strong> Place <code>details.json</code> in your project's root directory or <code>/public</code> folder
            </p>
          </div>
        `;
      }
      
      // Also show error in other parts of the UI
      const facetPanel = document.querySelector('.facet-panel');
      if (facetPanel) {
        facetPanel.innerHTML = '<div style="color: #f33; padding: 16px; text-align: center;">   Data not loaded</div>';
      }
      
      return; // Stop initialization
    }
    
    if (!loadedFromNetwork && totalItems > 0) {
      console.log(`   Using bundled data (${totalItems} items) - network loading failed`);
    }
    
    // Try to load stats overrides if using fallback data
    if (!loadedFromNetwork) {
      try {
        const resO = await fetch('stats_overrides.json', { cache: 'no-store' });
        if (resO.ok) {
          const overrides = await resO.json();
          for (const [k, statObj] of Object.entries(overrides || {})) {
            if (RAW_DATA[k]) {
              const baseStats = RAW_DATA[k].stats || {};
              RAW_DATA[k].stats = Object.assign({}, baseStats, statObj);
            }
          }
          console.log('  Applied stats overrides');
        }
      } catch (e) {
        console.warn('Failed to load stats overrides:', e.message);
      }
    }

    // Merge generated effects patch (from "New folder" sources) if present
    try {
      const resP = await fetch('effects_patch.generated.json', { cache: 'no-store' });
      if (resP.ok) {
        const patch = await resP.json();
        const entries = patch && patch.entries ? patch.entries : {};
        let mergedCount = 0;
        const alias = (s) => {
          const map = {
            'weapons/bloodlords_axe': 'weapons/bloodlord_s_axe',
            'weapons/dashmasters_dagger': 'weapons/dashmaster_s_dagger'
          };
          return map[s] || s;
        };
        for (const [slugRaw, effects] of Object.entries(entries)) {
          const slug = alias(slugRaw);
          if (!RAW_DATA[slug]) {
            // Create a minimal shell if missing
            RAW_DATA[slug] = {
              bucket: slug.startsWith('weapons/') ? 'weapons' : slug.startsWith('items/') ? 'items' : undefined,
              name: slug.split('/').slice(-1)[0].replace(/_/g, ' '),
              slug: slug.split('/').slice(-1)[0],
              stats: { armor: 0, attack: 0, health: 0, speed: 0 },
              effects: []
            };
          }
          const arr = Array.isArray(RAW_DATA[slug].effects) ? RAW_DATA[slug].effects : (RAW_DATA[slug].effects = []);
          // Append, do not dedupe to preserve author ordering
          arr.push(...effects);
          mergedCount++;
        }
        console.log(`  Merged effects patch: ${mergedCount} slugs`);
      } else {
        console.log('  effects_patch.generated.json not found (skip)');
      }
    } catch (e) {
      console.warn('Failed to merge effects patch:', e.message);
    }

    try { window.HEIC_DETAILS = RAW_DATA; } catch(_) {}

    // Make data iterable
    console.log('   About to create DATA_ARR from RAW_DATA');
    console.log('   RAW_DATA type:', typeof RAW_DATA);
    console.log('   RAW_DATA has keys:', !!RAW_DATA && Object.keys(RAW_DATA).length);
    console.log('   RAW_DATA sample keys:', RAW_DATA ? Object.keys(RAW_DATA).slice(0, 3) : 'none');
    
    DATA_ARR = Object.entries(RAW_DATA).map(([key,val]) => { 
      val.key = key; 
      
      // Set bucket based on the key's prefix
      if (key.startsWith('weapons/')) {
        val.bucket = 'weapons';
      } else if (key.startsWith('items/')) {
        val.bucket = 'items';
      } else if (key.startsWith('upgrades/')) {
        val.bucket = 'upgrades';
      } else if (key.startsWith('sets/')) {
        val.bucket = 'sets';
      }
      
      return val; 
    });
    
    console.log('  DATA_ARR created successfully');
    console.log('  DATA_ARR length:', DATA_ARR.length);
    console.log('  First DATA_ARR item:', DATA_ARR[0]);
    
    // Count and log the number of items by bucket for verification
    const itemsCount = DATA_ARR.filter(item => item.bucket === 'items').length;
    const weaponsCount = DATA_ARR.filter(item => item.bucket === 'weapons').length;
    const upgradesCount = DATA_ARR.filter(item => item.bucket === 'upgrades').length;
    const setsCount = DATA_ARR.filter(item => item.bucket === 'sets').length;
    const noBucketCount = DATA_ARR.filter(item => !item.bucket).length;
    const totalCount = DATA_ARR.length;
    
    console.log(`Data loaded: ${totalCount} total items`);
    console.log(`  - Items: ${itemsCount}`);
    console.log(`  - Weapons: ${weaponsCount}`);
    console.log(`  - Upgrades: ${upgradesCount}`);
    console.log(`  - Sets: ${setsCount}`);
    console.log(`  - No bucket: ${noBucketCount}`);
    
    // Log first few items to check bucket values
    console.log('Sample items:', DATA_ARR.slice(0, 5).map(item => ({ key: item.key, name: item.name, bucket: item.bucket })));
    
    // Check if RAW_DATA has more entries than DATA_ARR
    const rawDataCount = Object.keys(RAW_DATA).length;
    console.log(`RAW_DATA has ${rawDataCount} entries, DATA_ARR has ${totalCount} entries`);
    
    // Check for items that might not have standard bucket values
    const bucketTypes = {};
    DATA_ARR.forEach(item => {
      const bucket = item.bucket || 'undefined';
      bucketTypes[bucket] = (bucketTypes[bucket] || 0) + 1;
    });
    console.log('All bucket types:', bucketTypes);
    
    // Build a set of keys that support Gold/Diamond tiers either because:
    // - effect text mentions Gold/Diamond, or
    // - sibling variant slugs *_gold or *_diamond exist.
    window.TIERABLE = new Set();
    const keys = Object.keys(RAW_DATA);
    const hasVariant = (slug) => keys.some(k => /^(items|weapons)\//.test(k) && (k.endsWith(slug+"_gold") || k.endsWith(slug+"_diamond")));
    for (const [k, v] of Object.entries(RAW_DATA)){
      if (!v || typeof v !== 'object') continue;
      const eff = (v.effect||'');
      const m = /^(items|weapons)\/(.+)$/.exec(k);
      const baseSlug = m ? m[2] : '';
      if (/gold|diamond/i.test(eff) || hasVariant(baseSlug)) {
        window.TIERABLE.add(k);
      }
    }
    // Populate edge selects once data is ready
    populateEdges();
    // Build empty item grids for both sides
    initSlots();
    // Render the compendium grid
    console.log('   About to call initializeCompendiumData');
    console.log('   RAW_DATA keys count:', Object.keys(RAW_DATA).length);
    console.log('   DATA_ARR length:', DATA_ARR.length);
    console.log('   window.HEIC_DETAILS exists at init time:', !!window.HEIC_DETAILS);
    if (Array.isArray(window.DATA_ARR) && window.DATA_ARR.length) {
      initializeCompendiumData();
    }
    // Compute initial totals for player and opponent (empty builds)
    updateTotals('P');
    updateTotals('O');
  } catch(err) {
    console.error('Error loading details.json', err);
    const msg = document.createElement('div');
    msg.style.color = '#f66';
    msg.style.padding = '8px';
    msg.textContent = 'Failed to load details.json. Please serve files via a local server (e.g., python -m http.server) instead of opening via file://';
    document.body.insertBefore(msg, document.body.firstChild);
  }
}
// Non-fatal JSON fetch helper
async function fetchJson(url) {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    const text = await res.text();
    throw new Error(`Expected JSON, got ${ct || 'unknown'} @ ${url}. First 120: ${text.slice(0,120)}`);
  }
  return res.json();
}

// Script loading fallback for CORS-free access
function loadViaScript(src, globalKey) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.defer = true;
    s.src = src;
    s.onload = () => {
      const data = window[globalKey];
      data ? resolve(data) : reject(new Error(`Global ${globalKey} missing after ${src}`));
    };
    s.onerror = () => reject(new Error(`Failed to load script ${src}`));
    document.head.appendChild(s);
  });
}

// Non-blocking error display
function showNonBlockingError(message) {
  const banner = document.createElement('div');
  banner.id = 'nonBlockingErrorBanner';
  banner.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background: linear-gradient(135deg, #1a0000, #330000);
    border-bottom: 2px solid #f33;
    color: #f33;
    padding: 8px 16px;
    font-size: 12px;
    text-align: center;
    pointer-events: none;
    box-shadow: 0 2px 8px rgba(255, 51, 51, 0.3);
  `;
  
  banner.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
      <span>   ${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="pointer-events: auto; background: #f33; color: #fff; border: none; padding: 2px 8px; border-radius: 4px; cursor: pointer; font-size: 10px;">
        Dismiss
      </button>
    </div>
  `;
  
  document.body.prepend(banner);
  
  // Auto-dismiss after 10 seconds
  setTimeout(() => {
    if (banner.parentNode) {
      banner.remove();
    }
  }, 10000);
}

// NON-FATAL data loader - never blocks the UI
async function loadData() {
  console.log('   Starting non-fatal data load...');
  
  // Initialize with any pre-bundled data
  RAW_DATA = (window.HEIC_DETAILS && typeof window.HEIC_DETAILS === 'object') ? window.HEIC_DETAILS : {};
  console.log(`   Initial RAW_DATA has ${Object.keys(RAW_DATA).length} items`);
  
  // Only try network loading if we don't have data yet
  if (Object.keys(RAW_DATA).length === 0) {
    console.log('   No bundled data, trying multiple sources...');
    
    const base = location.origin + '/';
    const tries = [
      () => fetchJson(`${base}compiled_details.json`),
      () => fetchJson(`${base}details.json`),
      () => fetchJson('./compiled_details.json'),
      () => fetchJson('./details.json'),
      () => loadViaScript(`${base}compiled_details.js`, '__COMPILED_DETAILS__'),
      () => loadViaScript(`${base}details.js`, '__DETAILS__'),
      () => loadViaScript('./compiled_details.js', '__COMPILED_DETAILS__'),
      () => loadViaScript('./details.js', '__DETAILS__')
    ];
    
    let lastErr;
    let loadedSource = null;
    
    for (let i = 0; i < tries.length; i++) {
      const attempt = tries[i];
      try {
        console.log(`   Attempting source ${i + 1}/${tries.length}...`);
        const data = await attempt();
        const itemCount = Object.keys(data || {}).length;
        
        if (itemCount > 0) {
          RAW_DATA = Object.assign({}, RAW_DATA, data);
          loadedSource = `source ${i + 1}`;
          console.log(`  Successfully loaded ${itemCount} items from ${loadedSource}`);
          break;
        } else {
          console.log(`   Source ${i + 1} returned empty data, trying next...`);
        }
      } catch (e) {
        lastErr = e;
        console.log(`  Source ${i + 1} failed: ${e.message}`);
      }
    }
    
    // Store debug info globally
    window.__COMPENDIUM_DEBUG__ = {
      ok: Object.keys(RAW_DATA).length > 0,
      source: loadedSource,
      error: lastErr ? String(lastErr) : null,
      totalItems: Object.keys(RAW_DATA).length
    };
  }

  // Final check - if we still have no data, show a NON-BLOCKING error
  const totalItems = Object.keys(RAW_DATA).length;
  
  if (totalItems === 0) {
    console.warn(`   No data loaded from any source - continuing with empty state`);
    
    // Show non-blocking error banner with pointer-events: none - only in dev
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') {
      showNonBlockingError('No compendium data could be loaded. The app will continue with limited functionality.');
    }
    
    // Set up empty arrays so the rest of the app doesn't crash
    DATA_ARR = [];
    window.TIERABLE = new Set();
    
    // Still try to initialize the UI (it will show empty state)
    try {
      populateEdges();
      initSlots();
      if (Array.isArray(window.DATA_ARR) && window.DATA_ARR.length) {
        initializeCompendiumData();
      }
      updateTotals('P');
      updateTotals('O');
    } catch (initError) {
      console.warn('UI initialization failed with empty data:', initError);
    }
    
    return; // Continue execution, don't throw
  }

  console.log(`  Proceeding with ${totalItems} items`);

  // Try to load stats overrides
  try {
    const resO = await fetch('stats_overrides.json', { cache: 'no-store' });
    if (resO.ok) {
      const overrides = await resO.json();
      for (const [k, statObj] of Object.entries(overrides || {})) {
        if (RAW_DATA[k]) {
          const baseStats = RAW_DATA[k].stats || {};
          RAW_DATA[k].stats = Object.assign({}, baseStats, statObj);
        }
      }
      console.log('  Applied stats overrides');
    }
  } catch (e) {
    console.warn('Failed to load stats overrides:', e.message);
  }

  try { window.HEIC_DETAILS = RAW_DATA; } catch(_) {}

  // Make data iterable
  DATA_ARR = Object.entries(RAW_DATA).map(([key,val]) => { 
    val.key = key; 
    
    // Set bucket based on the key's prefix
    if (key.startsWith('weapons/')) {
      val.bucket = 'weapons';
    } else if (key.startsWith('items/')) {
      val.bucket = 'items';
    } else if (key.startsWith('upgrades/')) {
      val.bucket = 'upgrades';
    } else if (key.startsWith('sets/')) {
      val.bucket = 'sets';
    }
    
    return val; 
  });
  
  // Count and log the number of items by bucket for verification
  const itemsCount = DATA_ARR.filter(item => item.bucket === 'items').length;
  const weaponsCount = DATA_ARR.filter(item => item.bucket === 'weapons').length;
  const upgradesCount = DATA_ARR.filter(item => item.bucket === 'upgrades').length;
  const setsCount = DATA_ARR.filter(item => item.bucket === 'sets').length;
  const noBucketCount = DATA_ARR.filter(item => !item.bucket).length;
  const totalCount = DATA_ARR.length;
  
  console.log(`Data loaded: ${totalCount} total items`);
  console.log(`  - Items: ${itemsCount}`);
  console.log(`  - Weapons: ${weaponsCount}`);
  console.log(`  - Upgrades: ${upgradesCount}`);
  console.log(`  - Sets: ${setsCount}`);
  console.log(`  - No bucket: ${noBucketCount}`);
  
  // Log first few items to check bucket values
  console.log('Sample items:', DATA_ARR.slice(0, 5).map(item => ({ key: item.key, name: item.name, bucket: item.bucket })));
  
  // Check if RAW_DATA has more entries than DATA_ARR
  const rawDataCount = Object.keys(RAW_DATA).length;
  console.log(`RAW_DATA has ${rawDataCount} entries, DATA_ARR has ${totalCount} entries`);
  
  // Check for items that might not have standard bucket values
  const bucketTypes = {};
  DATA_ARR.forEach(item => {
    const bucket = item.bucket || 'undefined';
    bucketTypes[bucket] = (bucketTypes[bucket] || 0) + 1;
  });
  console.log('All bucket types:', bucketTypes);
  
  // Build a set of keys that support Gold/Diamond tiers
  window.TIERABLE = new Set();
  const keys = Object.keys(RAW_DATA);
  const hasVariant = (slug) => keys.some(k => /^(items|weapons)\//.test(k) && (k.endsWith(slug+"_gold") || k.endsWith(slug+"_diamond")));
  for (const [k, v] of Object.entries(RAW_DATA)){
    if (!v || typeof v !== 'object') continue;
    const eff = (v.effect||'');
    const m = /^(items|weapons)\/(.+)$/.exec(k);
    const baseSlug = m ? m[2] : '';
    if (/gold|diamond/i.test(eff) || hasVariant(baseSlug)) {
      window.TIERABLE.add(k);
    }
  }
  
  // Populate edge selects once data is ready
  populateEdges();
  // Build empty item grids for both sides
  initSlots();
  // Render the compendium grid
  if (Array.isArray(window.DATA_ARR) && window.DATA_ARR.length) {
    initializeCompendiumData();
  }
  // Compute initial totals for player and opponent (empty builds)
  updateTotals('P');
  updateTotals('O');
}

// Wrapper for robust error handling
async function safeLoadData() {
  try {
    await loadData();
  } catch(err) {
    // This should rarely happen with the new non-fatal approach, but just in case
    console.error('Unexpected critical error in loadData:', err);
    showNonBlockingError(`Critical loading error: ${err.message}`);
    
    // Initialize with empty state
    RAW_DATA = {};
    DATA_ARR = [];
    window.TIERABLE = new Set();
    
    try {
      populateEdges();
      initSlots();
      if (Array.isArray(window.DATA_ARR) && window.DATA_ARR.length) {
        initializeCompendiumData();
      }
      updateTotals('P');
      updateTotals('O');
    } catch (fallbackError) {
      console.error('Fallback initialization also failed:', fallbackError);
      showNonBlockingError('Complete initialization failure - please refresh the page');
    }
  }
}

// Disabled: legacy bunded-data kickstart (replaced by a single boot at the end)
// setTimeout(initializeFromBundledData, 100);

// Simple initialization using generated details.js
// Disabled path: superseded by __compendiumBoot. Keeping for reference only.
async function initializeFromBundledData() {
  return; // no-op
  try {
    console.log('   Initializing from window.HEIC_DETAILS...');
    
    if (!window.HEIC_DETAILS) {
      throw new Error('window.HEIC_DETAILS not found - run "npm run gen:details" to generate details.js');
    }
    
    const itemCount = Object.keys(window.HEIC_DETAILS).length;
    if (itemCount === 0) {
      throw new Error('window.HEIC_DETAILS is empty');
    }
    
    console.log(`  Found ${itemCount} items in bundled data`);
    
    // Set global data
    RAW_DATA = window.HEIC_DETAILS;
    
    // Convert to array format for the UI
    DATA_ARR = Object.entries(RAW_DATA).map(([key, val]) => { 
      val.key = key; 
      return val; 
    });
    
    const bucketCounts = {
      items: DATA_ARR.filter(item => item.bucket === 'items').length,
      weapons: DATA_ARR.filter(item => item.bucket === 'weapons').length,
      upgrades: DATA_ARR.filter(item => item.bucket === 'upgrades').length,
      sets: DATA_ARR.filter(item => item.bucket === 'sets').length
    };
    
    console.log(`  Data processed: ${DATA_ARR.length} items`, bucketCounts);
    
    // Build tierable set (for gold/diamond variants)
    window.TIERABLE = new Set();
    for (const item of DATA_ARR) {
      if (item.effect && item.effect.includes('Gold')) {
        window.TIERABLE.add(item.slug);
      }
    }
    
    // Initialize UI components
    populateEdges();
    initSlots();
    console.log('   Calling initializeCompendiumData...');
    if (Array.isArray(window.DATA_ARR) && window.DATA_ARR.length) {
      initializeCompendiumData();
    }
    updateTotals('P');
    updateTotals('O');
    
    console.log('   Initialization complete!');
    
  } catch (error) {
    console.error('  Initialization failed:', error.message);
    
    // Show error in UI but don't crash
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #1a0000; border: 2px solid #f33; color: #fff; padding: 20px; border-radius: 8px; z-index: 10000; max-width: 400px;';
    errorDiv.innerHTML = `
      <h3 style="color: #f33; margin: 0 0 12px 0;">   Initialization Error</h3>
      <p style="margin: 0 0 12px 0;">${error.message}</p>
      <p style="margin: 0; font-size: 12px; color: #aaa;">
           Try running: <code style="background: #333; padding: 2px 4px; border-radius: 2px;">npm run gen:details</code>
      </p>
    `;
    document.body.appendChild(errorDiv);
    
    // Set empty data so UI doesn't break
    RAW_DATA = {};
    DATA_ARR = [];
    window.TIERABLE = new Set();
  }
}

// Initialize Battle Replay System (guarded)
try { if (typeof BattleReplayController !== 'undefined' && BattleReplayController && BattleReplayController.init) { BattleReplayController.init(); } } catch(_) {}

// Icons for stats
const ICONS = { attack:'attack.png', health:'health.png', armor:'armor.png', speed:'speed.png' };

const $ = sel => document.querySelector(sel);
const grid = $('#grid');
const countSpan = $('#count');
const searchIn = $('#q');
const bucketSel = $('#bucket');
const catSel = $('#cat');

// Force the bucket selector to "All" to ensure it shows all items by default (guard for missing legacy UI)
if (bucketSel) bucketSel.value = 'All';
const detailModal = $('#detailModal');
const detailName = $('#detailName');
const detailEffect = $('#detailEffect');
const detailStats = $('#detailStats');
$('#detailClose').addEventListener('click', () => detailModal.style.display='none');
detailModal.addEventListener('click', e => { if (e.target === detailModal) detailModal.style.display='none'; });

// Number of item slots available per side.  Displayed as empty dashed boxes until filled.
const SLOT_COUNT = 12;

// Selection target for slot-aware actions
let activeTarget = { side: null, idx: -1 };

// Player and opponent state
const sides = {
  P: { hpBase:10, atkBase:0, armBase:0, spdBase:0, weapon:null, items:new Array(SLOT_COUNT).fill(null), edge:null, oils:new Set() },
  O: { hpBase:10, atkBase:0, armBase:0, spdBase:0, weapon:null, items:new Array(SLOT_COUNT).fill(null), edge:null, oils:new Set() }
};

function updateTotals(sideKey) {
  const side = sides[sideKey];
  let hp = side.hpBase, atk = side.atkBase, arm = side.armBase, spd = side.spdBase;
  const addStats = obj => {
    if (!obj) return;
    const s = obj.stats || {};
    hp += (s.health || 0);
    atk += (s.attack || 0);
    arm += (s.armor  || 0);
    spd += (s.speed  || 0);
  };
  addStats(side.weapon);
    side.items.forEach(addStats);
    if (side.weapon) {
      if (side.oils.has('attack')) atk += 1;
      if (side.oils.has('armor')) arm += 1;
      if (side.oils.has('speed')) spd += 1;
    }
  const prefix = sideKey === 'P' ? 'p' : 'o';
  $('#'+prefix+'H').textContent = hp;
  $('#'+prefix+'A').textContent = atk;
  $('#'+prefix+'R').textContent = arm;
  $('#'+prefix+'S').textContent = spd;

  // Render set bonuses summary
  try {
    const allSlugs = [];
    if (side.weapon) allSlugs.push(`${side.weapon.bucket}/${side.weapon.slug}`);
    for (const it of side.items) if (it) allSlugs.push(`${it.bucket}/${it.slug}`);
    const defs = (window.HeICSets && window.HeICSets.computeActive) ? window.HeICSets.computeActive(allSlugs) : [];
    const box = sideKey === 'P' ? document.getElementById('setsP') : document.getElementById('setsO');
    if (box) {
      box.innerHTML = '';
      if (!defs || !defs.length) {
        const span = document.createElement('span');
        span.textContent = 'No set bonuses';
        span.style.color = '#f88';
        box.appendChild(span);
      } else {
        defs.forEach(d => {
          const chip = document.createElement('span');
          chip.className = 'setChip';
          const iconSlug = d.effectSlug || (`sets/${d.key}`);
          chip.innerHTML = `<img src="${iconSlug}/icon.png" alt="${d.name}"><span class="name">${d.name}</span><span class="desc">- ${d.desc}</span>`;
          box.appendChild(chip);
        });
      }
    }
  } catch(_) {}
  
  // Update analysis if currently visible
  if (typeof analysisTab !== 'undefined' && analysisTab && analysisTab.style.display !== 'none') {
    renderAnalysis();
  }

  // Update simulation preview if simulation tab is visible
  if (typeof simulationTab !== 'undefined' && simulationTab && simulationTab.style.display !== 'none') {
    updateSimulationPreview();
  }
}

// Initialise the item slot grids for both player and opponent.  This creates SLOT_COUNT
// placeholder cells with a dashed border.  When items are added later via drag-and-drop
// or the random build function, these placeholders are filled in (the border becomes
// solid and the item name is written in the cell).  Without this, the grids would
// appear empty on page load, which confused some users.
function initSlots() {
  ['P','O'].forEach(sk => {
    const gridEl = sk === 'P' ? $('#gridP') : $('#gridO');
    gridEl.innerHTML = '';
    for (let i = 0; i < SLOT_COUNT; i++) {
      const cell = document.createElement('div');
      cell.className = 'slot';
      cell.dataset.idx = String(i);
      
      cell.addEventListener('click', () => {
        const idx = Number(cell.dataset.idx);
        const side = sides[sk];
        selectSlot(sk, idx);
        if (cell.classList.contains('filled')) {
          side.items[idx] = null;
          cell.classList.remove('filled');
          cell.innerHTML = '';
          updateTotals(sk);
        }
      });
      gridEl.appendChild(cell);
    }
  });
}

// Reset the slots for a single side.  Clears the grid and adds back SLOT_COUNT empty cells.
function resetSlots(sideKey) {
  const gridEl = sideKey === 'P' ? $('#gridP') : $('#gridO');
  gridEl.innerHTML = '';
  for (let i = 0; i < SLOT_COUNT; i++) {
    const cell = document.createElement('div');
    cell.className = 'slot';
    cell.dataset.idx = String(i);
    
    cell.addEventListener('click', () => {
      const idx = Number(cell.dataset.idx);
      const side = sides[sideKey];
      selectSlot(sideKey, idx);
      if (cell.classList.contains('filled')) {
        side.items[idx] = null;
        cell.classList.remove('filled');
        cell.innerHTML = '';
        updateTotals(sideKey);
      }
    });
    gridEl.appendChild(cell);
  }
}

// Highlight selection and track active slot
function selectSlot(sideKey, idx){
  const container = sideKey === 'P' ? $('#gridP') : $('#gridO');
  if (container) {
    container.querySelectorAll('.slot.active').forEach(el => el.classList.remove('active'));
    const el = container.querySelector(`.slot[data-idx="${idx}"]`);
    if (el) { el.classList.add('active'); el.focus(); }
  }
  activeTarget = { side: sideKey, idx };
  updateSelIndicators();
}

// Mini card HTML
function resolveIconCandidates(obj){
  const arr=[];
  if (obj && obj.key) arr.push(`${obj.key}/icon.png`);
  if (obj && obj.bucket && obj.slug) arr.push(`${obj.bucket}/${obj.slug}/icon.png`);
  if (obj && obj.slug){ arr.push(`items/${obj.slug}/icon.png`); arr.push(`weapons/${obj.slug}/icon.png`); }
  return arr;
}

function mini(it){
  const cands = resolveIconCandidates(it);
  const first = cands[0] || 'placeholder.png';
  // inline onerror fallback to keep markup simple
  const onerr = `(function(el){var c=['${(cands.map(c=>c.replace(/"/g,'&quot;'))).join("','")}'];var i=1;el.onerror=function(){if(i<c.length){el.src=c[i++];}else{el.onerror=null;el.src='placeholder.png';}}})(this)`;
  return `<div class="miniCard"><img src="${first}" onerror="${onerr}" alt="${it.name}"><span class="name">${it.name}</span></div>`;
}

function firstEmptyIndex(side){
  const i = side.items.findIndex(x => !x);
  return i === -1 ? 0 : i;
}

// Quick add helpers (used by keyboard nav and UI hooks)
function quickAdd(sideKey, item, tier){
  if (!item) return;
  const side = sides[sideKey];
  if (item.bucket === 'weapons'){
    side.weapon = item;
    const wSlot = sideKey === 'P' ? $('#weaponP') : $('#weaponO');
    if (wSlot) wSlot.innerHTML = mini(item);
    updateTotals(sideKey);
    return;
  }
  if (item.bucket === 'items' || item.bucket === 'upgrades'){
    const idx = firstEmptyIndex(side);
    const annotated = Object.assign({}, item, { tier: tier || 'base' });
    side.items[idx] = annotated;
    const gridEl = sideKey === 'P' ? $('#gridP') : $('#gridO');
    const el = gridEl?.querySelector(`.slot[data-idx="${idx}"]`);
    if (el){ el.innerHTML = mini(item); el.classList.add('filled'); }
    selectSlot(sideKey, idx);
    updateTotals(sideKey);
  }
}

function quickAddToActive(item){
  if (activeTarget.side){
    quickAdd(activeTarget.side, item);
  } else {
    quickAdd('P', item);
  }
}

// Update selected slot labels
function updateSelIndicators(){
  const pi = document.getElementById('selPI');
  const oi = document.getElementById('selOI');
  if (pi) pi.textContent = (activeTarget.side === 'P' && activeTarget.idx >= 0) ? `Selected: P slot ${activeTarget.idx+1}` : 'Selected: None';
  if (oi) oi.textContent = (activeTarget.side === 'O' && activeTarget.idx >= 0) ? `Selected: O slot ${activeTarget.idx+1}` : 'Selected: None';
}

// Clear the currently active slot
function clearActiveSlot(){
  if (!activeTarget.side || activeTarget.idx < 0) return;
  const sideKey = activeTarget.side;
  const idx = activeTarget.idx;
  const side = sides[sideKey];
  if (!side) return;
  side.items[idx] = null;
  const gridEl = sideKey === 'P' ? $('#gridP') : $('#gridO');
  const cell = gridEl?.querySelector(`.slot[data-idx="${idx}"]`);
  if (cell){ cell.classList.remove('filled'); cell.innerHTML = ''; }
  updateTotals(sideKey);
}

// (Delete/Backspace clear shortcut removed as requested)

// (Keyboard shortcuts removed as requested)

function showDetail(entry) {
  detailName.textContent = entry.name;
  detailEffect.textContent = entry.effect || '';
  detailStats.innerHTML = '';
  ['attack','health','armor','speed'].forEach(st => {
    const val = entry.stats && typeof entry.stats[st] === 'number' ? entry.stats[st] : 0;
    const pill = document.createElement('span'); pill.className='pill';
    const pImg = document.createElement('img'); pImg.src = ICONS[st];
    const pTxt = document.createElement('span'); pTxt.textContent = `${st[0].toUpperCase()+st.slice(1)}: ${val}`;
    pill.append(pImg, pTxt);
    detailStats.appendChild(pill);
  });
  detailModal.style.display = 'flex';
}

// ============================================================================
// Advanced Compendium System
// ============================================================================

// Global compendium state
let compendiumState = {
  currentView: 'cards', // 'cards' | 'table' | 'compare'
  currentTier: 'base', // 'base' | 'gold' | 'diamond'
  selectedItems: new Set(),
  filters: {
    search: '',
    buckets: new Set(['all']),
    tags: new Set(),
    triggers: new Set(),
    sets: new Set()
  },
  data: {
    allItems: [],
    filteredItems: [],
    itemCounts: {
      total: 0,
      shown: 0,
      selected: 0
    }
  }
};

// Initialize Advanced Compendium
function initializeAdvancedCompendium() {
  console.log('initializeAdvancedCompendium called');
  setupCompendiumEventListeners();
  updateCompendiumCounts();
  
  // Set cards as the default active view
  switchCompendiumView('cards');
}

// Setup all event listeners for the advanced compendium
function setupCompendiumEventListeners() {
  try {
    // Global Search
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
      globalSearch.addEventListener('input', debounce(() => {
        compendiumState.filters.search = globalSearch.value.trim();
        renderCompendium();
      }, 300));
    } else {
      console.warn('Global search element not found');
    }
  
  // View Switch
  const viewButtons = ['viewCards', 'viewTable'];
  viewButtons.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        switchCompendiumView(id.replace('view', '').toLowerCase());
      });
    }
  });
  
  // Tier Switch removed
  
  // Review system removed

  // Sets filter (built dynamically once HeICSets is present)
  try {
    const container = document.getElementById('setsFilterContainer');
    if (container && window.HeICSets && Array.isArray(window.HeICSets.definitions)) {
      container.innerHTML = '';
      const defs = window.HeICSets.definitions.slice().sort((a,b)=>a.name.localeCompare(b.name));
      defs.forEach(def => {
        const id = `set_${def.key}`;
        const label = document.createElement('label');
        label.className = 'facet-option';
        label.style.cssText = 'display:flex; align-items:center; gap:8px; padding:4px 8px; border-radius:4px; cursor:pointer; font-size:11px;';
        label.innerHTML = `<input type="checkbox" id="${id}" value="${def.key}" style="accent-color:#f33;"> <span>${def.name}</span>`;
        container.appendChild(label);
        const cb = label.querySelector('input');
        cb.addEventListener('change', () => {
          if (cb.checked) compendiumState.filters.sets.add(def.key); else compendiumState.filters.sets.delete(def.key);
          renderCompendium();
        });
      });
    }
  } catch(e) { console.warn('Sets filter init failed', e); }
  
  // Facet Filters
  setupFacetFilters();
  
  // Clear All Filters
  const clearFilters = document.getElementById('clearAllFilters');
  if (clearFilters) {
    clearFilters.addEventListener('click', clearAllFilters);
  }
  
  // QA & Authoring Tools
  const bulkSelectAll = document.getElementById('bulkSelectAll');
  const bulkSelectNone = document.getElementById('bulkSelectNone');
  const exportSelected = document.getElementById('exportSelected');
  // QA validation button removed
  
  if (bulkSelectAll) {
    bulkSelectAll.addEventListener('click', () => {
      compendiumState.data.filteredItems.forEach(item => {
        compendiumState.selectedItems.add(item.key);
      });
      updateCompendiumCounts();
      renderCurrentView(); // Refresh to show selected state
    });
  }
  
  if (bulkSelectNone) {
    bulkSelectNone.addEventListener('click', () => {
      compendiumState.selectedItems.clear();
      updateCompendiumCounts();
      renderCurrentView(); // Refresh to show unselected state
    });
  }
  
  if (exportSelected) {
    exportSelected.addEventListener('click', exportSelectedItems);
  }
  
  // no QA validation binding
  } catch (error) {
    console.error('Error setting up compendium event listeners:', error);
  }
}

// Setup facet filter listeners
function setupFacetFilters() {
  // Bucket filters
  const bucketInputs = document.querySelectorAll('input[name="bucket"]');
  bucketInputs.forEach(input => {
    input.addEventListener('change', () => {
      updateBucketFilters();
      renderCompendium();
    });
  });
  
  // Tag filters
  const tagInputs = document.querySelectorAll('input[name="tag"]');
  tagInputs.forEach(input => {
    input.addEventListener('change', () => {
      updateTagFilters();
      renderCompendium();
    });
  });
  
  // Trigger filters
  const triggerInputs = document.querySelectorAll('input[name="trigger"]');
  triggerInputs.forEach(input => {
    input.addEventListener('change', () => {
      updateTriggerFilters();
      renderCompendium();
    });
  });
}

// Update bucket filter state
function updateBucketFilters() {
  const bucketInputs = document.querySelectorAll('input[name="bucket"]');
  const newBuckets = new Set();
  
  bucketInputs.forEach(input => {
    if (input.checked) {
      if (input.value === 'all') {
        newBuckets.clear();
        newBuckets.add('all');
        // Uncheck other buckets when 'all' is selected
        bucketInputs.forEach(otherInput => {
          if (otherInput.value !== 'all') {
            otherInput.checked = false;
          }
        });
      } else {
        // If specific bucket is selected, uncheck 'all'
        const allInput = document.querySelector('input[name="bucket"][value="all"]');
        if (allInput) allInput.checked = false;
        newBuckets.delete('all');
        newBuckets.add(input.value);
      }
    }
  });
  
  // If nothing is selected, default to 'all'
  if (newBuckets.size === 0) {
    const allInput = document.querySelector('input[name="bucket"][value="all"]');
    if (allInput) {
      allInput.checked = true;
      newBuckets.add('all');
    }
  }
  
  compendiumState.filters.buckets = newBuckets;
  updateFacetStyles();
}

// Update tag filter state
function updateTagFilters() {
  const tagInputs = document.querySelectorAll('input[name="tag"]');
  const newTags = new Set();
  
  tagInputs.forEach(input => {
    if (input.checked) {
      newTags.add(input.value);
    }
  });
  
  compendiumState.filters.tags = newTags;
  updateFacetStyles();
}

// Update trigger filter state
function updateTriggerFilters() {
  const triggerInputs = document.querySelectorAll('input[name="trigger"]');
  const newTriggers = new Set();
  
  triggerInputs.forEach(input => {
    if (input.checked) {
      newTriggers.add(input.value);
    }
  });
  
  compendiumState.filters.triggers = newTriggers;
  updateFacetStyles();
}

// Update visual styling for active facets
function updateFacetStyles() {
  // Update bucket facet styles
  const bucketOptions = document.querySelectorAll('.facet-option:has(input[name="bucket"])');
  bucketOptions.forEach(option => {
    const input = option.querySelector('input');
    if (input.checked) {
      option.style.background = 'rgba(255,51,51,0.1)';
      option.style.borderLeft = '3px solid #f33';
    } else {
      option.style.background = '';
      option.style.borderLeft = '';
    }
  });
  
  // Update tag facet styles
  const tagOptions = document.querySelectorAll('.facet-option:has(input[name="tag"])');
  tagOptions.forEach(option => {
    const input = option.querySelector('input');
    if (input.checked) {
      option.style.background = 'rgba(255,165,0,0.1)';
      option.style.borderLeft = '3px solid #ffa500';
    } else {
      option.style.background = '';
      option.style.borderLeft = '';
    }
  });
  
  // Update trigger facet styles
  const triggerOptions = document.querySelectorAll('.facet-option:has(input[name="trigger"])');
  triggerOptions.forEach(option => {
    const input = option.querySelector('input');
    if (input.checked) {
      option.style.background = 'rgba(0,255,51,0.1)';
      option.style.borderLeft = '3px solid #0f3';
    } else {
      option.style.background = '';
      option.style.borderLeft = '';
    }
  });
}

// Switch compendium view
function switchCompendiumView(viewName) {
  compendiumState.currentView = viewName;
  
  // Update button states
  ['viewCards', 'viewTable', 'viewCompare'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      if (id === `view${viewName.charAt(0).toUpperCase() + viewName.slice(1)}`) {
        btn.style.background = '#f33';
        btn.style.color = '#000';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = '#f33';
      }
    }
  });
  
  // Show appropriate view
  const views = ['cardsView', 'tableView', 'compareView'];
  views.forEach(id => {
    const view = document.getElementById(id);
    if (view) {
      view.style.display = id === `${viewName}View` ? 'block' : 'none';
    }
  });
  
  // Render content for the active view
  renderCurrentView();
}

// Switch tier
function switchTier(tierName) {
  compendiumState.currentTier = tierName;
  
  // Update button states
  ['tierBase', 'tierGold', 'tierDiamond'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      if (id === `tier${tierName.charAt(0).toUpperCase() + tierName.slice(1)}`) {
        btn.style.background = '#ffd166';
        btn.style.color = '#000';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = '#ffd166';
      }
    }
  });
  
  // Re-render current view with new tier
  renderCurrentView();
}

// Clear all filters
function clearAllFilters() {
  // Reset filter state
  compendiumState.filters = {
    search: '',
    buckets: new Set(['all']),
    tags: new Set(),
    triggers: new Set()
  };
  
  // Reset UI
  const globalSearch = document.getElementById('globalSearch');
  if (globalSearch) globalSearch.value = '';
  
  // Review toggle removed
  
  // Reset all checkboxes
  const allInputs = document.querySelectorAll('.facet-panel input[type="checkbox"]');
  allInputs.forEach(input => {
    input.checked = input.name === 'bucket' && input.value === 'all';
  });
  
  updateFacetStyles();
  renderCompendium();
}

// Filter items based on current state
function filterItems() {
  const { search, buckets, tags, triggers, sets } = compendiumState.filters;
  
  let filtered = compendiumState.data.allItems;
  
  // Search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(item => {
      const searchText = `${item.name} ${item.effect || ''} ${item.key} ${(item.tags || []).join(' ')}`.toLowerCase();
      return searchText.includes(searchLower);
    });
  }
  
  // Bucket filter
  if (!buckets.has('all')) {
    filtered = filtered.filter(item => {
      return buckets.has(item.bucket);
    });
  }
  
  // Tag filters
  if (tags.size > 0) {
    filtered = filtered.filter(item => {
      if (!item.tags || item.tags.length === 0) return false;
      return Array.from(tags).some(tag => item.tags.includes(tag));
    });
  }
  
  // Trigger filters
  if (triggers.size > 0) {
    filtered = filtered.filter(item => {
      if (!item.effects || item.effects.length === 0) return false;
      return item.effects.some(effect => Array.from(triggers).includes(normalizeTrigger(effect.trigger)));
    });
  }

  // Sets filter
  if (sets && sets.size > 0 && window.HeICSets && Array.isArray(window.HeICSets.definitions)) {
    const defs = window.HeICSets.definitions;
    const reqMap = new Map();
    defs.forEach(d => {
      const arr = [];
      (d.reqs || []).forEach(r => { if (r.kind === 'slugs') arr.push(...(r.all || [])); });
      reqMap.set(d.key, arr);
    });
    const allowed = new Set();
    sets.forEach(k => { (reqMap.get(k) || []).forEach(s => allowed.add(s)); allowed.add(`sets/${k}`); });
    filtered = filtered.filter(it => allowed.has(it.key));
  }
  
  // Review filter removed
  
  compendiumState.data.filteredItems = filtered;
  updateCompendiumCounts();
}

// Review system removed

// Update compendium counts
function updateCompendiumCounts() {
  const counts = {
    total: compendiumState.data.allItems.length,
    shown: compendiumState.data.filteredItems.length,
    selected: compendiumState.selectedItems.size
  };
  
  compendiumState.data.itemCounts = counts;
  
  // Update UI elements
  const shownCount = document.getElementById('shownCount');
  const totalCount = document.getElementById('totalCount');
  const selectedCount = document.getElementById('selectedCount');
  // Review count removed
  
  if (shownCount) shownCount.textContent = counts.shown;
  if (totalCount) totalCount.textContent = counts.total;
  if (selectedCount) selectedCount.textContent = counts.selected;
  
  // no reviewCount updates
  
  // Update health indicator
  updateDataHealthIndicator(counts.total > 0);
  
  // Update facet counts
  updateFacetCounts();
}

// Safe no-op when header indicators are absent
function updateDataHealthIndicator(isHealthy) {
  var dot = document.getElementById("healthDot");
  var txt = document.getElementById("healthText");
  if (!dot || !txt) return; // header removed; silently skip
  if (isHealthy) { dot.style.background = "#0f3"; txt.textContent = "Data OK"; txt.style.color = "#0f3"; }
  else { dot.style.background = "#f33"; txt.textContent = "No Data"; txt.style.color = "#f33"; }
}




// Normalize effect trigger names to match facet values
function normalizeTrigger(t) {
  switch (t) {
    case 'battle_start':
    case 'battleStart': return 'battleStart';
    case 'turn_start':
    case 'turnStart': return 'turnStart';
    case 'onHit':
    case 'hit': return 'hit';
    case 'onWounded':
    case 'wounded': return 'wounded';
    case 'onExposed':
    case 'exposed': return 'exposed';
    case 'passive': return 'passive';
    default: return t || '';
  }
}
function updateFacetCounts() {
  const allItems = compendiumState.data.allItems;
  
  // Update bucket counts
  const bucketCounts = {
    all: allItems.length,
    items: allItems.filter(item => item.bucket === 'items').length,
    weapons: allItems.filter(item => item.bucket === 'weapons').length,
    upgrades: allItems.filter(item => item.bucket === 'upgrades').length
  };
  
  Object.entries(bucketCounts).forEach(([bucket, count]) => {
    const option = document.querySelector(`input[name="bucket"][value="${bucket}"]`);
    if (option) {
      const countEl = option.parentElement.querySelector('.count');
      if (countEl) countEl.textContent = count;
    }
  });
  
  // Update tag counts
  const tagCounts = {};
  allItems.forEach(item => {
    if (item.tags) {
      item.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  // Drive counts from whatever tag checkboxes exist in the DOM,
  // rather than a hard-coded subset. This keeps the UI in sync
  // when tags are added/renamed (e.g., Mythic, Sanguine, Edge).
  const tagInputs = document.querySelectorAll('input[name="tag"]');
  tagInputs.forEach(input => {
    const tag = input.value;
    const countEl = input.parentElement && input.parentElement.querySelector('.count');
    if (countEl) countEl.textContent = tagCounts[tag] || 0;
  });
  
  // Update trigger counts
  const triggerCounts = {};
  allItems.forEach(item => {
    if (item.effects) {
      item.effects.forEach(effect => {
        const trigger = effect.trigger;
        if (trigger) {
          triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
        }
      });
    }
  });
  
  ['battleStart', 'turnStart', 'hit', 'wounded', 'exposed', 'passive'].forEach(trigger => {
    const option = document.querySelector(`input[name="trigger"][value="${trigger}"]`);
    if (option) {
      const countEl = option.parentElement.querySelector('.count');
      if (countEl) countEl.textContent = triggerCounts[trigger] || 0;
    }
  });
}

// Main render function
function renderCompendium() {
  try {
    filterItems();
    renderCurrentView();
  } catch (error) {
    console.error('Error rendering compendium:', error);
    const itemGrid = document.getElementById('itemGrid');
    if (itemGrid) {
      itemGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #f33;">
          <h3>Error rendering compendium</h3>
          <p style="color: #fa0; margin: 16px 0;">Please refresh the page or check the console</p>
        </div>
      `;
    }
  }
}

// Render the current view
function renderCurrentView() {
  try {
    switch (compendiumState.currentView) {
      case 'cards':
        renderCardsView();
        break;
      case 'table':
        renderTableView();
        break;
      case 'compare':
        renderCompareView();
        break;
      default:
        console.warn('Unknown view:', compendiumState.currentView);
        renderCardsView(); // Fallback to cards view
    }
  } catch (error) {
    console.error('Error rendering current view:', error);
    // Fallback to cards view
    compendiumState.currentView = 'cards';
    try {
      renderCardsView();
    } catch (fallbackError) {
      console.error('Error in fallback render:', fallbackError);
    }
  }
}

// Render cards view
function renderCardsView() {
  const itemGrid = document.getElementById('itemGrid');
  if (!itemGrid) return;
  
  itemGrid.innerHTML = '';
  
  if (compendiumState.data.filteredItems.length === 0) {
    itemGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666; font-style: italic;">
        <h3 style="color: #f33; margin-bottom: 16px;">No items found</h3>
        <p>Try adjusting your filters or search terms</p>
      </div>
    `;
    return;
  }
  let appended = 0;
  compendiumState.data.filteredItems.forEach(item => {
    try {
      const card = createAdvancedCard(item);
      if (card) { itemGrid.appendChild(card); appended++; }
    } catch (e) {
      console.error('createAdvancedCard failed for', item?.key, e);
    }
  });

  // Fallback: if nothing rendered (e.g., due to a CSS/HTML quirk), render a simple list
  if (appended === 0) {
    console.warn('No cards appended to #itemGrid; rendering simple fallback list');
    itemGrid.innerHTML = compendiumState.data.filteredItems.map(it => `
      <div style="background:#111;border:2px solid #f33;border-radius:12px;padding:12px;color:#fff;">
        <div style="font-weight:600">${it.name || it.slug || it.key}</div>
        <div style="color:#888;font-size:11px">${it.key}</div>
      </div>
    `).join('');
  }
  console.log('renderCardsView appended', appended, 'cards');
}

// Create an advanced item card
function createAdvancedCard(item) {
  const card = document.createElement('div');
  card.className = 'advanced-card';
  card.dataset.key = item.key;
  card.draggable = true;
  
  // Card styling based on bucket and tags
  let borderColor = '#f33';
  if (item.bucket === 'weapons') borderColor = '#ff9900';
  if (item.tags?.includes('Jewelry')) borderColor = '#ffd166';
  if (item.tags?.includes('Tome')) borderColor = '#73d2de';
  if (item.tags?.includes('Food')) borderColor = '#95d5b2';
  
  card.style.cssText = `
    background: #111;
    border: 2px solid ${borderColor};
    border-radius: 12px;
    padding: 14px;
    color: #fff;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
  `;
  
  // Hover effect
  card.addEventListener('mouseenter', () => {
    card.style.transform = 'translateY(-2px)';
    card.style.boxShadow = `0 6px 20px ${borderColor}40`;
  });
  
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.boxShadow = '';
  });
  
  // Trust badges
  const trustBadges = getTrustBadges(item);
  const trustBadgeHtml = trustBadges.map(badge => 
    `<span class="trust-badge ${badge.type}" style="
      background: ${badge.bg}; 
      color: ${badge.color}; 
      padding: 2px 6px; 
      border-radius: 8px; 
      font-size: 10px; 
      margin-left: 4px;
    ">${badge.icon} ${badge.text}</span>`
  ).join('');
  
  // Build card content
  const iconCandidates = resolveIconCandidates(item);
  const iconPath = iconCandidates[0] || 'assets/placeholder.png';
  
  // Plain English effect
  const plainEffect = generatePlainEnglishEffect(item);
  
  // Trigger indicators
  const triggerIndicators = getTriggerIndicators(item);
  
  // Tier support indicator
  const supportsTier = window.TIERABLE && window.TIERABLE.has(item.key);
  const tierIndicator = supportsTier ? '<span style="color: #ffd166; font-size: 10px;"> </span>' : '';
  const isSet = item.bucket === 'sets';
  const setBadge = isSet ? '<span class="chip" style="background:#210; border:1px solid #f33; color:#faa; font-size:10px; padding:1px 6px; border-radius:8px;">SET</span>' : '';
  
  card.innerHTML = `
    <!-- Header -->
    <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px;">
      <img src="${iconPath}" alt="${item.name}" style="
        width: 48px; 
        height: 48px; 
        image-rendering: pixelated; 
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.2);
      " onerror="this.src='assets/placeholder.png'">
      
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <h4 style="margin: 0; color: ${borderColor}; font-size: 14px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</h4>
          ${tierIndicator}
          ${setBadge}
          ${trustBadgeHtml}
        </div>
        <div style="color: #888; font-size: 10px; margin-bottom: 6px;">${item.key}</div>
        <div style="display: flex; flex-wrap: wrap; gap: 4px;">
          ${triggerIndicators.map(t => `<span class="trigger-chip ${t.class}" style="
            background: ${t.bg}; 
            color: ${t.color}; 
            padding: 1px 6px; 
            border-radius: 8px; 
            font-size: 10px;
            font-weight: 500;
          ">${t.icon} ${t.name}</span>`).join('')}
        </div>
      </div>
      
      <div class="card-actions" style="display: flex; align-items: center; gap: 4px;">
        <button class="select-btn" style="
          background: ${compendiumState.selectedItems.has(item.key) ? '#fa0' : 'transparent'}; 
          color: ${compendiumState.selectedItems.has(item.key) ? '#000' : '#fa0'}; 
          border: 1px solid #fa0; 
          border-radius: 4px; 
          padding: 4px 8px; 
          cursor: pointer; 
          font-size: 10px;
        ">${compendiumState.selectedItems.has(item.key) ? ' ' : '+'}</button>
      </div>
    </div>
    
    <!-- Plain English Effect -->
    <div style="
      background: rgba(255,255,255,0.05); 
      padding: 8px; 
      border-radius: 6px; 
      margin-bottom: 10px; 
      font-size: 11px; 
      line-height: 1.4;
      color: #ccc;
    ">${plainEffect}</div>
    
    <!-- Stats Row -->
    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;">
      ${['attack', 'armor', 'health', 'speed'].map(stat => {
        const value = item.stats?.[stat] || 0;
        const icon = stat === 'health' ? 'health' : stat;
        return `
          <div style="display: flex; align-items: center; justify-content: center; gap: 4px; 
                      background: rgba(255,255,255,0.05); padding: 6px 4px; border-radius: 4px;
                      ${value > 0 ? `border: 1px solid ${getStatColor(stat)};` : ''}">
            <img src="assets/${icon}.png" style="width: 12px; height: 12px; image-rendering: pixelated;">
            <span style="font-size: 11px; font-weight: 600; color: ${value > 0 ? getStatColor(stat) : '#666'};">${value}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  // Event listeners
  card.addEventListener('click', (e) => {
    if (e.target.classList.contains('select-btn')) {
      toggleItemSelection(item.key);
      e.stopPropagation();
    } else {
      showAdvancedDetail(item);
    }
  });
  
  // Drag and drop
  card.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', item.key);
    const tierData = { key: item.key, tier: compendiumState.currentTier };
    e.dataTransfer.setData('application/json', JSON.stringify(tierData));
  });
  
  return card;
}

// Generate plain English effect description
function generatePlainEnglishEffect(item) {
  // Prefer authored wiki text when present
  if (item.effect && item.effect.trim() && item.effect.trim() !== '-') {
    // If the wiki text embeds Gold/Diamond variants, select the active tier text
    const eff = item.effect.trim();
    const tiered = parseTieredEffect(eff);
    if (tiered.hasTier) {
      const active = (window.compendiumState && window.compendiumState.currentTier) || 'base';
      if (active === 'gold' && tiered.gold) return tiered.renderGold();
      if (active === 'diamond' && tiered.diamond) return tiered.renderDiamond();
      return tiered.base; // default to base
    }
    return eff;
  }

  if (!item.effects || !Array.isArray(item.effects) || item.effects.length === 0) {
    return 'No effect description available.';
  }

  // Fallback: derive from structured effects
  const sentences = item.effects.map(effect => {
    const trigger = getTriggerName(effect.trigger);
    const actionsArr = Array.isArray(effect.actions) ? effect.actions : [];
    const actions = actionsArr.length
      ? actionsArr.map(action => getActionDescription(action)).join(', ')
      : 'effect';
    return `<strong>${trigger}:</strong> ${actions}.`;
  });

  return sentences.join(' ');
}

// Parse wiki-style tier annotations like:
//   "... â€” at Gold: 4 , at Diamond: 8"
//   or longer fragments: "â€” at Gold: take 6 for 2 swords, at Diamond: take 12 for 4"
function parseTieredEffect(text) {
  const s = String(text || '');
  const lower = s.toLowerCase();
  const hasGold = lower.includes('at gold:');
  const hasDiamond = lower.includes('at diamond:');

  // Extract gold segment (text between 'at Gold:' and either ',' before Diamond, or end)
  const goldM = s.match(/at\s+Gold:\s*([^,]+?)(?:\s*,\s*at\s+Diamond:|$)/i);
  const diamondM = s.match(/at\s+Diamond:\s*([^,]+?)\s*$/i);

  // Base = text before the first tier marker
  let base = s;
  const firstIdx = Math.min(
    hasGold ? lower.indexOf('at gold:') : s.length,
    hasDiamond ? lower.indexOf('at diamond:') : s.length
  );
  if (firstIdx !== s.length) {
    // Trim any dash that precedes the tier section
    base = s.slice(0, firstIdx).replace(/\s*[â€”â€“-]\s*$/,'').trim();
  }

  const gold = goldM ? goldM[1].trim() : '';
  const diamond = diamondM ? diamondM[1].trim() : '';

  function isNumeric(x){ return /^-?\d+(?:\.\d+)?$/.test((x||'').trim()); }
  function replaceLastNumber(str, num){
    return String(str).replace(/(.*?)(-?\d+)(?!.*\d)/, (_m, a, _b) => a + String(num));
  }

  return {
    hasTier: !!(gold || diamond),
    base,
    gold,
    diamond,
    renderGold(){
      if (!gold) return base;
      if (isNumeric(gold)) return replaceLastNumber(base, gold);
      return `${base} â€” ${gold}`;
    },
    renderDiamond(){
      if (!diamond) return base;
      if (isNumeric(diamond)) return replaceLastNumber(base, diamond);
      return `${base} â€” ${diamond}`;
    }
  };
}

// Get trigger display name
function getTriggerName(trigger) {
  const triggerNames = {
    // canonical
    battleStart: 'Battle Start',
    battle_start: 'Battle Start',
    turnStart: 'Turn Start',
    turn_start: 'Turn Start',
    turn_end: 'Turn End',
    first_turn: 'First Turn',
    first_time: 'First Time',
    every_other_turn: 'Every Other Turn',
    countdown: 'Countdown',
    whenever: 'Whenever',
    while: 'While',
    if: 'If',
    hit: 'On Hit',
    onHit: 'On Hit',
    wounded: 'Wounded',
    onWounded: 'Wounded',
    exposed: 'Exposed',
    onExposed: 'Exposed',
    symphony: 'Symphony',
    passive: 'Passive'
  };
  return triggerNames[trigger] || (typeof trigger === 'string' ? trigger.replace(/_/g, ' ') : '');
}

// Get action description
function getActionDescription(action) {
  if (!action || !action.type) return 'effect';

  const val = (n) => (n !== undefined && n !== null ? n : '');
  const key = action.key || action.status || '';

  const descriptions = {
    deal_damage: `deal ${val(action.value) || 1} damage`,
    heal: `heal ${val(action.value) || 1} HP`,
    gain_armor: `gain ${val(action.value) || 1} armor`,
    gain_attack: `gain ${val(action.value) || 1} attack`,
    gain_speed: `gain ${val(action.value) || 1} speed`,
    add_speed: `gain ${val(action.value) || 1} speed`,
    add_attack: `gain ${val(action.value) || 1} attack`,
    add_armor: `gain ${val(action.value) || 1} armor`,
    add_health: `gain ${val(action.value) || 1} health`,
    apply_poison: `apply poison (${val(action.value) || 1})`,
    apply_thorns: `apply thorns (${val(action.value) || 1})`,
    apply_regen: `apply regeneration (${val(action.value) || 1})`,
    add_status: key ? `gain ${key}${action.value ? ' (' + action.value + ')' : ''}` : 'gain status',
    add_status_to_enemy: key ? `give enemy ${key}${action.value ? ' (' + action.value + ')' : ''}` : 'give enemy status'
  };

  return descriptions[action.type] || action.type.replace(/_/g, ' ');
}

// Render effect with tier bullets if Gold/Diamond are present
function renderTieredEffectBlock(item){
  const effText = (item.effect || '').trim();
  if (!effText) return generatePlainEnglishEffect(item);
  const parsed = parseTieredEffect(effText);
  if (!parsed.hasTier) return generatePlainEnglishEffect(item);

  const active = (window.compendiumState && window.compendiumState.currentTier) || 'base';
  const activeText = active === 'gold' && parsed.gold ? parsed.renderGold()
                    : active === 'diamond' && parsed.diamond ? parsed.renderDiamond()
                    : parsed.base;

  const lines = [];
  lines.push(`<div style=\"margin-bottom:6px;\">${activeText}</div>`);
  lines.push('<div style=\"font-size:10px; color:#aaa;\">Tiers</div>');
  lines.push('<ul style=\"margin:4px 0 0 16px; padding:0;\">');
  lines.push(`<li>Base: ${parsed.base}</li>`);
  if (parsed.gold) lines.push(`<li>Gold: ${/^-?\\d+(?:\\.\\d+)?$/.test(parsed.gold) ? parsed.renderGold() : parsed.gold}</li>`);
  if (parsed.diamond) lines.push(`<li>Diamond: ${/^-?\\d+(?:\\.\\d+)?$/.test(parsed.diamond) ? parsed.renderDiamond() : parsed.diamond}</li>`);
  lines.push('</ul>');
  return lines.join('');
}

// Get trust badges for an item
function getTrustBadges(item) {
  const badges = [];
  // Only show tier support; review/valid removed
  if (window.TIERABLE && window.TIERABLE.has(item.key)) {
    badges.push({
      type: 'tiered',
      icon: ' ',
      text: 'Tiered',
      bg: '#ffd166',
      color: '#000'
    });
  }
  
  return badges;
}

// Get trigger indicators for an item
function getTriggerIndicators(item) {
  if (!item.effects || item.effects.length === 0) {
    return [];
  }
  
  const triggerMap = {
    battleStart: { name: 'Start', icon: '  ', bg: '#0f3', color: '#000', class: 'battle-start' },
    turnStart: { name: 'Turn', icon: ' ', bg: '#fa0', color: '#000', class: 'turn-start' },
    hit: { name: 'Hit', icon: '  ', bg: '#f33', color: '#fff', class: 'hit' },
    wounded: { name: 'Wound', icon: '  ', bg: '#f0a', color: '#fff', class: 'wounded' },
    exposed: { name: 'Expose', icon: '   ', bg: '#af5', color: '#000', class: 'exposed' },
    passive: { name: 'Passive', icon: ' ', bg: '#888', color: '#fff', class: 'passive' }
  };
  
  const triggers = [...new Set(item.effects.map(e => e.trigger))];
  return triggers.map(trigger => triggerMap[trigger] || {
    name: trigger,
    icon: '?',
    bg: '#666',
    color: '#fff',
    class: 'unknown'
  });
}

// Get stat color
function getStatColor(stat) {
  const colors = {
    attack: '#f33',
    armor: '#4a9eff',
    health: '#26de81',
    speed: '#ffd166'
  };
  return colors[stat] || '#fff';
}

// Toggle item selection
function toggleItemSelection(itemKey) {
  if (compendiumState.selectedItems.has(itemKey)) {
    compendiumState.selectedItems.delete(itemKey);
  } else {
    compendiumState.selectedItems.add(itemKey);
  }
  
  updateCompendiumCounts();
  
  // Update the button visual state
  const card = document.querySelector(`[data-key="${itemKey}"]`);
  if (card) {
    const btn = card.querySelector('.select-btn');
    if (btn) {
      const isSelected = compendiumState.selectedItems.has(itemKey);
      btn.style.background = isSelected ? '#fa0' : 'transparent';
      btn.style.color = isSelected ? '#000' : '#fa0';
      btn.textContent = isSelected ? ' ' : '+';
    }
  }
  
  // Update compare view if it's active
  if (compendiumState.currentView === 'compare') {
    renderCompareView();
  }
}

// Show advanced detail modal/panel
function showAdvancedDetail(item) {
  // For now, use the existing detail modal
  // This could be enhanced with the full entry page system
  showDetail(item);
}

// Render table view
function renderTableView() {
  const tableBody = document.getElementById('tableBody');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  if (compendiumState.data.filteredItems.length === 0) {
    const row = tableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 9;
    cell.style.textAlign = 'center';
    cell.style.padding = '40px';
    cell.style.color = '#666';
    cell.style.fontStyle = 'italic';
    cell.textContent = 'No items found';
    return;
  }
  
  compendiumState.data.filteredItems.forEach(item => {
    const row = tableBody.insertRow();
    row.style.borderBottom = '1px solid #333';
    row.style.fontSize = '11px';
    row.style.color = '#ccc';
    
    // Name
    const nameCell = row.insertCell();
    nameCell.style.padding = '8px';
    nameCell.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <img src="${resolveIconCandidates(item)[0] || 'assets/placeholder.png'}" 
             style="width: 20px; height: 20px; image-rendering: pixelated;" 
             onerror="this.src='assets/placeholder.png'">
        <span style="color: #fff; font-weight: 500;">${item.name}</span>
      </div>
    `;
    
    // Bucket
    const bucketCell = row.insertCell();
    bucketCell.style.padding = '8px';
    bucketCell.textContent = item.bucket || '-';
    
    // Tags
    const tagsCell = row.insertCell();
    tagsCell.style.padding = '8px';
    tagsCell.innerHTML = item.tags ? item.tags.map(tag => 
      `<span style="background: rgba(255,255,255,0.1); padding: 1px 4px; border-radius: 8px; margin-right: 2px; font-size: 10px;">${tag}</span>`
    ).join('') : '-';
    
    // Triggers
    const triggersCell = row.insertCell();
    triggersCell.style.padding = '8px';
    triggersCell.style.textAlign = 'center';
    const triggerIcons = getTriggerIndicators(item);
    triggersCell.innerHTML = triggerIcons.map(t => t.icon).join(' ');
    
    // Stats
    ['attack', 'armor', 'health', 'speed'].forEach(stat => {
      const statCell = row.insertCell();
      statCell.style.padding = '8px';
      statCell.style.textAlign = 'center';
      const value = item.stats?.[stat] || 0;
      statCell.innerHTML = value > 0 ? 
        `<span style="color: ${getStatColor(stat)}; font-weight: 600;">${value}</span>` : 
        '<span style="color: #666;">0</span>';
    });
    
    // Effect
    const effectCell = row.insertCell();
    effectCell.style.padding = '8px';
    effectCell.style.maxWidth = '200px';
    effectCell.style.overflow = 'hidden';
    effectCell.style.textOverflow = 'ellipsis';
    effectCell.style.whiteSpace = 'nowrap';
    effectCell.textContent = item.effect || '-';
    effectCell.title = item.effect || '';
    
    // Click handler
    row.style.cursor = 'pointer';
    row.addEventListener('click', () => showAdvancedDetail(item));
  });
}

// Render compare view
function renderCompareView() {
  const compareContent = document.getElementById('compareContent');
  if (!compareContent) return;
  
  const selectedItemKeys = Array.from(compendiumState.selectedItems);
  
  if (selectedItemKeys.length === 0) {
    compareContent.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666; font-style: italic;">
        <h3 style="color: #f33; margin-bottom: 16px;">No items selected</h3>
        <p>Select 2-3 items from the Cards view to compare them side-by-side</p>
      </div>
    `;
    return;
  }
  
  if (selectedItemKeys.length > 3) {
    compareContent.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #fa0;">
        <h3 style="margin-bottom: 16px;">Too many items selected</h3>
        <p>Please select only 2-3 items for comparison</p>
      </div>
    `;
    return;
  }
  
  // Render comparison cards
  compareContent.innerHTML = '';
  
  selectedItemKeys.forEach(itemKey => {
    const item = compendiumState.data.allItems.find(i => i.key === itemKey);
    if (!item) return;
    
    const compareCard = createCompareCard(item, selectedItemKeys);
    compareContent.appendChild(compareCard);
  });
}

// Create a comparison card
function createCompareCard(item, allSelectedKeys) {
  const card = document.createElement('div');
  card.style.cssText = `
    background: #111;
    border: 2px solid #f33;
    border-radius: 12px;
    padding: 16px;
    color: #fff;
  `;
  
  const iconPath = resolveIconCandidates(item)[0] || 'assets/placeholder.png';
  
  card.innerHTML = `
    <div style="text-align: center; margin-bottom: 16px;">
      <img src="${iconPath}" style="width: 64px; height: 64px; image-rendering: pixelated; margin-bottom: 8px;" 
           onerror="this.src='assets/placeholder.png'">
      <h3 style="margin: 0; color: #f33;">${item.name}</h3>
      <div style="color: #888; font-size: 11px; margin-top: 4px;">${item.key}</div>
    </div>
    
    <div style="margin-bottom: 16px;">
      <h4 style="color: #fa0; font-size: 12px; margin: 0 0 8px 0;">Stats</h4>
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
        ${['attack', 'armor', 'health', 'speed'].map(stat => {
          const value = item.stats?.[stat] || 0;
          const icon = stat === 'health' ? 'health' : stat;
          return `
            <div style="display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: rgba(255,255,255,0.05); border-radius: 4px;">
              <img src="assets/${icon}.png" style="width: 16px; height: 16px; image-rendering: pixelated;">
              <span style="font-size: 12px; color: ${getStatColor(stat)}; font-weight: 600;">${value}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    
    <div style="margin-bottom: 16px;">
      <h4 style="color: #fa0; font-size: 12px; margin: 0 0 8px 0;">Effect</h4>
      <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; font-size: 11px; line-height: 1.4; color: #ccc;">
        ${renderTieredEffectBlock(item)}
      </div>
    </div>
    
    <div>
      <h4 style="color: #fa0; font-size: 12px; margin: 0 0 8px 0;">Tags</h4>
      <div style="display: flex; flex-wrap: wrap; gap: 4px;">
        ${(item.tags || []).map(tag => 
          `<span style="background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 8px; font-size: 10px;">${tag}</span>`
        ).join('') || '<span style="color: #666; font-style: italic;">No tags</span>'}
      </div>
    </div>
    
    <button onclick="toggleItemSelection('${item.key}')" style="
      margin-top: 16px; 
      width: 100%; 
      background: #f33; 
      color: #000; 
      border: none; 
      border-radius: 6px; 
      padding: 8px; 
      cursor: pointer; 
      font-size: 11px; 
      font-weight: 600;
    ">Remove from Compare</button>
  `;
  
  return card;
}

// Update legacy functions to work with new system
function renderGrid() {
  renderCompendium();
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export selected items as JSON
function exportSelectedItems() {
  if (compendiumState.selectedItems.size === 0) {
    alert('No items selected for export. Please select some items first.');
    return;
  }
  
  const selectedItemKeys = Array.from(compendiumState.selectedItems);
  const selectedData = selectedItemKeys.map(key => {
    const item = compendiumState.data.allItems.find(i => i.key === key);
    return item ? { 
      key: item.key,
      name: item.name,
      bucket: item.bucket,
      stats: item.stats,
      effects: item.effects,
      tags: item.tags,
      tier: compendiumState.currentTier
    } : null;
  }).filter(Boolean);
  
  const exportData = {
    exported_at: new Date().toISOString(),
    tier: compendiumState.currentTier,
    total_items: selectedData.length,
    items: selectedData
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `heic_export_${compendiumState.currentTier}_${selectedData.length}items_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  console.log(`Exported ${selectedData.length} items`);
}

// QA/Review system removed

// Diagnostic tool for debugging data loading issues (accessible from console)
window.debugCompendium = async function() {
  console.log('   Compendium Diagnostics');
  console.log('========================');
  
  const results = {
    currentData: {
      RAW_DATA_keys: Object.keys(window.RAW_DATA || {}).length,
      DATA_ARR_length: Array.isArray(window.DATA_ARR) ? window.DATA_ARR.length : 'not array',
      compendiumState: window.compendiumState?.data?.allItems?.length || 'not initialized'
    },
    urlTests: []
  };
  
  console.log('Current data state:', results.currentData);
  
  const testUrls = [
    `${location.origin}/details.json`,
    `${location.origin}/compiled_details.json`,
    './details.json',
    './compiled_details.json'
  ];
  
  for (const url of testUrls) {
    try {
      const start = performance.now();
      const res = await fetch(url, { cache: 'no-cache' });
      const time = Math.round(performance.now() - start);
      
      if (res.ok) {
        const json = await res.json();
        const itemCount = Object.keys(json || {}).length;
        results.urlTests.push({
          url,
          status: `  ${res.status} (${time}ms) - ${itemCount} items`,
          working: true
        });
        console.log(`  ${url}   ${res.status} (${time}ms) - ${itemCount} items`);
      } else {
        results.urlTests.push({
          url,
          status: `  ${res.status} ${res.statusText} (${time}ms)`,
          working: false
        });
        console.log(`  ${url}   ${res.status} ${res.statusText} (${time}ms)`);
      }
    } catch (e) {
      results.urlTests.push({
        url,
        status: `  ${e.message}`,
        working: false
      });
      console.log(`  ${url}   ${e.message}`);
    }
  }
  
  console.log('\n   Usage: window.debugCompendium() to run again');
  return results;
};

// Generate effect description from effects array
function generateEffectDescription(effects) {
  if (!effects || effects.length === 0) return '';
  
  return effects.map(effect => {
    const trigger = getTriggerName(effect.trigger);
    const actions = effect.actions?.map(action => getActionDescription(action)).join(', ') || 'unknown effect';
    return `${trigger}: ${actions}`;
  }).join('. ');
}

// Resolve icon path candidates for an item
function resolveIconCandidates(item) {
  const iconCandidates = [];
  if (item.key) iconCandidates.push(`${item.key}/icon.png`);
  if (item.bucket && item.slug) iconCandidates.push(`${item.bucket}/${item.slug}/icon.png`);
  if (item.slug) {
    iconCandidates.push(`items/${item.slug}/icon.png`);
    iconCandidates.push(`weapons/${item.slug}/icon.png`);
  }
  iconCandidates.push('assets/placeholder.png');
  return iconCandidates;
}

// Initialize the advanced compendium after data loads
function initializeCompendiumData() {
  try {
    console.log('   initializeCompendiumData called');
    
    if (!Array.isArray(DATA_ARR)) {
      console.error('DATA_ARR is not an array:', typeof DATA_ARR, DATA_ARR);
      showCompendiumError('Invalid data format - DATA_ARR is not an array');
      return;
    }
    
    if (DATA_ARR.length === 0) {
      console.error('DATA_ARR is empty - no items to display');
      showCompendiumError('No items loaded - check data file loading');
      return;
    }
    
    // Convert DATA_ARR to the new format
    compendiumState.data.allItems = DATA_ARR.map(item => {
      // Start with normalized tags
      const baseTags = Array.isArray(item.tags) ? item.tags.slice() : [];

      // Policy: mark all Mythic items as Illegal for the battle simulator
      // so they are excluded from the randomizer. Keep it data-local so
      // other parts of the app can still see Mythic as usual.
      if (baseTags.includes('Mythic') && !baseTags.includes('Illegal')) {
        baseTags.push('Illegal');
      }

      return {
        ...item,
        // Ensure all items have the required properties
        name: item.name || item.slug || 'Unknown',
        bucket: item.bucket || 'items',
        tags: baseTags,
        effects: item.effects || [],
        stats: item.stats || { attack: 0, armor: 0, health: 0, speed: 0 }
      };
    });
    
    compendiumState.data.filteredItems = [...compendiumState.data.allItems];
    
    console.log(`  Advanced compendium initialized with ${compendiumState.data.allItems.length} items`);
    
    // Only initialize UI after we have valid data
    initializeAdvancedCompendium();
    renderCompendium();
    
  } catch (error) {
    console.error('Error initializing compendium data:', error);
    showCompendiumError(`Failed to initialize: ${error.message}`);
  }
}

// Expose renderer for manual calls during debugging
try { window.renderCompendium = renderCompendium; } catch(_) {}

// Expose key functions on window for easier debugging/manual boot
try {
  window.initializeCompendiumData = initializeCompendiumData;
} catch (_) {}

// Show error state in compendium UI
function showCompendiumError(message) {
  const compendiumGrid = document.getElementById('itemGrid');
  if (compendiumGrid) {
    compendiumGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #f33;">
        <h3>   Compendium Error</h3>
        <p style="color: #fa0; margin: 16px 0;">${message}</p>
        <p style="color: #ccc;">Check the browser console for details</p>
      </div>
    `;
  }
  
  // Also update the counts to show the error state
  const elements = ['shownCount', 'totalCount', 'selectedCount'];
  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '!';
  });
}

// Filter listeners
// Legacy filter listeners (guard if elements are missing)
[searchIn, bucketSel, catSel].filter(Boolean).forEach(el => {
  el.addEventListener('input', renderGrid);
  el.addEventListener('change', renderGrid);
});

// Drag and drop helpers
function setupDrop(zoneSel, sideKey, type) {
  const zone = $(zoneSel);
  zone.addEventListener('dragover', e=>{ e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', ()=> zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('drag-over');
    const key = e.dataTransfer.getData('text/plain');
    let tier = 'base';
    try { const j = e.dataTransfer.getData('application/json'); if (j) { const obj = JSON.parse(j); if (obj && obj.tier) tier = obj.tier; } } catch(_){}
    const item = RAW_DATA[key];
    if (!item) return;
    const side = sides[sideKey];
  if (type === 'weapon') {
      // Only accept weapons in the weapon slot.  Replace any existing weapon.
      if (item.bucket !== 'weapons') return;
      side.weapon = item;

  zone.innerHTML = mini(item);

    } else if (type === 'items') {
      // Only accept items in the item grid.  Do not allow duplicates and do not exceed SLOT_COUNT.
      if (item.bucket !== 'items') return;
      // Determine the intended slot
      let slotEl = e.target.closest('.slot');
      let idx = -1;
      if (slotEl && zone.contains(slotEl)) {
        idx = Number(slotEl.dataset.idx);
      } else {
        idx = side.items.findIndex(x => !x);
        if (idx === -1) idx = 0; // replace first if full
        slotEl = zone.querySelector(`.slot[data-idx="${idx}"]`);
      }
      const annotated = Object.assign({}, item, { tier });
      side.items[idx] = annotated;
      if (slotEl) {
  slotEl.innerHTML = mini(item);
        slotEl.classList.add('filled');
        selectSlot(sideKey, idx);
      }
    }
    updateTotals(sideKey);
  });
}
setupDrop('#weaponP','P','weapon');
setupDrop('#gridP','P','items');
setupDrop('#weaponO','O','weapon');
setupDrop('#gridO','O','items');

// Oils toggles
function setupOils(sel, sideKey) {
  $(sel).querySelectorAll('.oil').forEach(el => {
    el.addEventListener('click', () => {
      const kind = el.dataset.kind;
      const side = sides[sideKey];
      if (side.oils.has(kind)) {
        side.oils.delete(kind);
        el.classList.remove('active');
      } else {
        side.oils.add(kind);
        el.classList.add('active');
      }
      updateTotals(sideKey);
    });
  });
}
setupOils('#oilsP','P');
setupOils('#oilsO','O');

// Populate edge selects after data loaded
function populateEdges() {
  const edges = DATA_ARR.filter(e => e.bucket === 'upgrades' && /edge/i.test(e.slug) && !(/_used$/i.test(e.slug) || /_darkened$/i.test(e.slug)));
  const selects = [$('#edgeP'), $('#edgeO')];
  const effects  = [$('#edgePEffect'), $('#edgeOEffect')];
  const icons    = [$('#edgePIcon'), $('#edgeOIcon')];
  selects.forEach((sel, idx) => {
    // Clear existing options except the first placeholder
    while (sel.options.length > 1) sel.remove(1);
    edges.forEach(e => {
      const opt = document.createElement('option');
      opt.value = e.slug;
      opt.textContent = e.name;
      sel.appendChild(opt);
    });
    // When the user changes the selected edge, update the underlying state, effect text
    // and the displayed icon.  If no edge is selected, fall back to the placeholder icon.
    sel.addEventListener('change', () => {
      const pick = edges.find(e => e.slug === sel.value);
      const sideKey = idx === 0 ? 'P' : 'O';
      sides[sideKey].edge = pick || null;
      effects[idx].textContent = pick ? (pick.effect || '') : '';
      const iconEl = icons[idx];
      if (pick) {
  // Prefer key-based path then fallbacks
  const cands = resolveIconCandidates(pick);
  let i=0; iconEl.src = cands[i] || 'placeholder.png';
  iconEl.onerror = () => { i+=1; if (i<cands.length) { iconEl.src=cands[i]; } else { iconEl.onerror=null; iconEl.src='placeholder.png'; } };
      } else {
        iconEl.src = 'assets/placeholder.png';
      }
    });
  });
}
// populateEdges is invoked from loadData() once DATA_ARR is ready

// Randomize a side's loadout
function randomizeSide(targetSide){
  const side = sides[targetSide];
  // Reset state: clear weapon, items, oils and edge selection
  side.weapon = null;
  side.items = new Array(SLOT_COUNT).fill(null);
  side.oils.clear();
  side.edge = null;
  // Reset DOM: weapon slot text, clear oils active class, reset edge select and effect, and rebuild empty item slots
  const wSlot = targetSide === 'P' ? $('#weaponP') : $('#weaponO');
  wSlot.textContent = 'Drop a Weapon';
  const oilsEl = targetSide === 'P' ? $('#oilsP') : $('#oilsO');
  oilsEl.querySelectorAll('.oil.active').forEach(el => el.classList.remove('active'));
  if (targetSide === 'P') {
    $('#edgeP').value = '';
    $('#edgePEffect').textContent = '';
    $('#edgePIcon').src = 'assets/placeholder.png';
  } else {
    $('#edgeO').value = '';
    $('#edgeOEffect').textContent = '';
    $('#edgeOIcon').src = 'assets/placeholder.png';
  }
  resetSlots(targetSide);
  const gridEl = targetSide === 'P' ? $('#gridP') : $('#gridO');
  const weapons = DATA_ARR.filter(e => e.bucket === 'weapons');
  const itemsList = DATA_ARR.filter(e => e.bucket === 'items' && !(Array.isArray(e.tags) && e.tags.includes('Illegal')));
  const edges = DATA_ARR.filter(e => e.bucket === 'upgrades' && /edge/i.test(e.slug) && !(/_used$/i.test(e.slug) || /_darkened$/i.test(e.slug)));
  
  if (weapons.length) {
    const w = weapons[Math.floor(Math.random()*weapons.length)];
    side.weapon = w;

    // Build mini card icon with fallbacks using key first
    const wIconCandidates = [];
    if (w.key) wIconCandidates.push(`${w.key}/icon.png`);
    if (w.bucket && w.slug) wIconCandidates.push(`${w.bucket}/${w.slug}/icon.png`);
    if (w.slug) {
      wIconCandidates.push(`items/${w.slug}/icon.png`);
      wIconCandidates.push(`weapons/${w.slug}/icon.png`);
    }
    const wFirstIcon = wIconCandidates[0] || 'placeholder.png';
    wSlot.innerHTML = `<div class="miniCard"><img src="${wFirstIcon}" onerror="(function(el){var c=['${wIconCandidates.map(c=>c.replace(/"/g,'&quot;')).join("','")}'];var i=1;el.onerror=function(){if(i<c.length){el.src=c[i++];}else{el.onerror=null;el.src='placeholder.png';}}})(this)" alt="${w.name}"><span class="name">${w.name}</span></div>`;

  }
  
  // Randomly select an edge
  if (edges.length) {
    const randomEdge = edges[Math.floor(Math.random() * edges.length)];
    side.edge = randomEdge;
    
    // Update the edge select dropdown
    const edgeSelect = targetSide === 'P' ? $('#edgeP') : $('#edgeO');
    const edgeEffect = targetSide === 'P' ? $('#edgePEffect') : $('#edgeOEffect');
    const edgeIcon = targetSide === 'P' ? $('#edgePIcon') : $('#edgeOIcon');
    
    edgeSelect.value = randomEdge.slug;
    edgeEffect.textContent = randomEdge.effect || '';
    {
      const cands = resolveIconCandidates(randomEdge);
      let i=0; edgeIcon.src = cands[i] || 'placeholder.png';
      edgeIcon.onerror = () => { i+=1; if (i<cands.length) { edgeIcon.src=cands[i]; } else { edgeIcon.onerror=null; edgeIcon.src='placeholder.png'; } };
    }
  }
  const copy = itemsList.slice();
  const chosen = [];
  for (let i = 0; i < SLOT_COUNT && copy.length; i++) {
    const idxPick = Math.floor(Math.random() * copy.length);
    const pick = copy.splice(idxPick, 1)[0];
    chosen.push(pick);
  }
  const cells = gridEl.querySelectorAll('.slot');
  chosen.forEach((it, idxItem) => {
    side.items[idxItem] = it;
    const cell = cells[idxItem];
  cell.innerHTML = mini(it);
    cell.classList.add('filled');
  });
  updateTotals(targetSide);
  // Select first slot for clarity
  if (chosen.length > 0) selectSlot(targetSide, 0);
}
document.getElementById('randBuildBtn')?.addEventListener('click', () => randomizeSide('P'));
document.getElementById('randEnemyBtn')?.addEventListener('click', () => randomizeSide('O'));

// Collect the current loadout and computed statistics for simulation.  The simulator
// expects an object with a name, a stats object (hp, atk, armor, speed), the
// weapon slug (empty string if none) and a list of item slugs.  This helper reads
// the aggregated numbers from the DOM and extracts the slugs from our side state.
function collectEntityData(sideKey) {
  const prefix = sideKey === 'P' ? 'p' : 'o';
  const hp = parseInt($('#' + prefix + 'H').textContent, 10) || 0;
  const items = (sides[sideKey].items || []).filter(Boolean).map(it => ({ slug: `${it.bucket}/${it.slug}`, tier: it.tier || 'base' }));
  if (sides[sideKey].edge) {
    items.push({ slug: `${sides[sideKey].edge.bucket}/${sides[sideKey].edge.slug}`, tier: 'base' });
  }
  // Inject active set pseudo-items so their hooks participate in the sim
  try {
    const allSlugs = [];
    if (sides[sideKey].weapon) allSlugs.push(`${sides[sideKey].weapon.bucket}/${sides[sideKey].weapon.slug}`);
    for (const it of (sides[sideKey].items||[])) if (it) allSlugs.push(`${it.bucket}/${it.slug}`);
    const setSlugs = (window.HeICSets && window.HeICSets.computeActiveEffectSlugs) ? window.HeICSets.computeActiveEffectSlugs(allSlugs) : [];
    for (const s of (setSlugs||[])) items.push({ slug: s, tier: 'base' });
  } catch(_) {}
  return {
    name: sideKey === 'P' ? 'Player' : 'Opponent',
    hp,
    hpMax: hp,
    atk: parseInt($('#' + prefix + 'A').textContent, 10) || 0,
    armor: parseInt($('#' + prefix + 'R').textContent, 10) || 0,
    speed: parseInt($('#' + prefix + 'S').textContent, 10) || 0,
    weaponSlug: sides[sideKey].weapon ? `${sides[sideKey].weapon.bucket}/${sides[sideKey].weapon.slug}` : null,
    items
  };
}

// -----------------------------------------------------------------------------
// Simulation UI wiring
//
// The simulation panel is a floating box (#simPanel) anchored at the bottom
// right of the viewport. It contains buttons to run a battle, clear the log
// and adjust the number of turns. When the Simulate button is clicked we
// collect the current loadouts, run the simulation via HeICSim and print the
// result and log lines into #simLog. Clear Log simply wipes the log container.

// Simulation UI wiring and enhancements
function updateSimulationPreview() {
  const createSideHtml = (sideKey) => {
    const side = sides[sideKey];
    const prefix = sideKey === 'P' ? 'p' : 'o';
    const hp = parseInt(document.getElementById(`${prefix}H`).textContent) || 10;
    const atk = parseInt(document.getElementById(`${prefix}A`).textContent) || 0;
    const arm = parseInt(document.getElementById(`${prefix}R`).textContent) || 0;
    const spd = parseInt(document.getElementById(`${prefix}S`).textContent) || 0;

    const color = sideKey === 'P' ? '#0f3' : '#f33';
    const bgColor = sideKey === 'P' ? 'rgba(0,255,51,0.1)' : 'rgba(255,51,51,0.1)';

    let weaponHtml = `
      <div class="analysisItem weapon" style="background:${bgColor}; border-color:${color}; margin-bottom:0;">
        <div class="analysisItemHeader">
          <img src="assets/placeholder.png" alt="No Weapon">
          <div class="analysisItemName">No Weapon</div>
        </div>
        <div class="analysisItemStats">
          <div class="pill"><img src="assets/health.png" alt="health"><span>${hp}</span></div>
          <div class="pill"><img src="assets/attack.png" alt="attack"><span>${atk}</span></div>
          <div class="pill"><img src="assets/armor.png" alt="armor"><span>${arm}</span></div>
          <div class="pill"><img src="assets/speed.png" alt="speed"><span>${spd}</span></div>
        </div>
      </div>
    `;
    if (side.weapon) {
      weaponHtml = renderAnalysisItem(side.weapon, 'weapon', {bgColor, color});
    }

    let edgeHtml = '';
    if (side.edge) {
      edgeHtml = renderAnalysisItem(side.edge, 'edge', {bgColor, color});
    }

    const items = side.items.filter(Boolean);
    const itemsHtml = items.length > 0 
      ? items.map(item => renderAnalysisItem(item, 'item', {bgColor, color})).join('')
      : '<div class="emptySlot">No items equipped</div>';

    return `
      ${weaponHtml}
      ${edgeHtml}
      <div style="border-top: 2px solid ${color}; margin: 8px 0;"></div>
      ${itemsHtml}
    `;
  };

  const playerPreview = document.getElementById('simPlayerPreview');
  const opponentPreview = document.getElementById('simOpponentPreview');

  if (playerPreview) {
    playerPreview.innerHTML = createSideHtml('P');
  }
  if (opponentPreview) {
    opponentPreview.innerHTML = createSideHtml('O');
  }
}

// --- merge conflict resolved: keep enhanced simulation preview + helpers ---
// Function to update the three-pane simulation interface
function updateSimulationPreview() {
  updateFighterCards();
  updateLoadoutTrays();
  updatePinnedMetrics();
}

// Update fighter stat cards
function updateFighterCards() {
  // Player card
  const playerHP = document.getElementById('playerHP');
  const playerMaxHP = document.getElementById('playerMaxHP');
  const playerArmor = document.getElementById('playerArmor');
  const playerAttack = document.getElementById('playerAttack');
  const playerSpeed = document.getElementById('playerSpeed');
  const playerStatusEffects = document.getElementById('playerStatusEffects');
  
  if (playerHP) {
    const side = sides.P;
    let hp = side.hpBase, atk = side.atkBase, arm = side.armBase, spd = side.spdBase;
    
    // Calculate stats
    const addStats = obj => {
      if (!obj) return;
      const s = obj.stats || {};
      hp += (s.health || 0);
      atk += (s.attack || 0);
      arm += (s.armor || 0);
      spd += (s.speed || 0);
    };
    
    addStats(side.weapon);
    side.items.forEach(addStats);
    if (side.weapon) {
      if (side.oils.has('attack')) atk += 1;
      if (side.oils.has('armor')) arm += 1;
      if (side.oils.has('speed')) spd += 1;
    }
    
    playerHP.textContent = hp;
    playerMaxHP.textContent = hp;
    playerArmor.textContent = arm;
    playerAttack.textContent = atk;
    playerSpeed.textContent = spd;
    
    // Update status effects with enhanced chips
    if (playerStatusEffects) {
      // This is placeholder - real status effects would come from battle simulation
      playerStatusEffects.innerHTML = '';
      
      // Example enhanced status chips (would be populated with actual data)
      const exampleStatuses = [
        { name: 'Poison', value: 5, trend: 2, icon: '  ' },
        { name: 'Regen', value: 3, trend: -1, icon: '  ' }
      ];
      
      if (exampleStatuses.length === 0) {
        playerStatusEffects.innerHTML = '<div style="color: #666; font-size: 11px; font-style: italic;">No status effects</div>';
      } else {
        exampleStatuses.forEach(status => {
          const chip = createEnhancedStatusChip(status.name, status.value, status.trend, status.icon);
          playerStatusEffects.appendChild(chip);
        });
      }
    }
  }
  
  // Opponent card
  const opponentHP = document.getElementById('opponentHP');
  const opponentMaxHP = document.getElementById('opponentMaxHP');
  const opponentArmor = document.getElementById('opponentArmor');
  const opponentAttack = document.getElementById('opponentAttack');
  const opponentSpeed = document.getElementById('opponentSpeed');
  const opponentStatusEffects = document.getElementById('opponentStatusEffects');
  
  if (opponentHP) {
    const side = sides.O;
    let hp = side.hpBase, atk = side.atkBase, arm = side.armBase, spd = side.spdBase;
    
    // Calculate stats
    const addStats = obj => {
      if (!obj) return;
      const s = obj.stats || {};
      hp += (s.health || 0);
      atk += (s.attack || 0);
      arm += (s.armor || 0);
      spd += (s.speed || 0);
    };
    
    addStats(side.weapon);
    side.items.forEach(addStats);
    if (side.weapon) {
      if (side.oils.has('attack')) atk += 1;
      if (side.oils.has('armor')) arm += 1;
      if (side.oils.has('speed')) spd += 1;
    }
    
    opponentHP.textContent = hp;
    opponentMaxHP.textContent = hp;
    opponentArmor.textContent = arm;
    opponentAttack.textContent = atk;
    opponentSpeed.textContent = spd;
    
    // Update status effects with enhanced chips
    if (opponentStatusEffects) {
      opponentStatusEffects.innerHTML = '';
      
      // Example enhanced status chips (would be populated with actual data)
      const exampleStatuses = [
        { name: 'Thorns', value: 2, trend: 0, icon: '  ' }
      ];
      
      if (exampleStatuses.length === 0) {
        opponentStatusEffects.innerHTML = '<div style="color: #666; font-size: 11px; font-style: italic;">No status effects</div>';
      } else {
        exampleStatuses.forEach(status => {
          const chip = createEnhancedStatusChip(status.name, status.value, status.trend, status.icon);
          opponentStatusEffects.appendChild(chip);
        });
      }
    }
  }
}

// Enhanced micro-pattern helper functions
function createEnhancedStatusChip(statusName, value, trend, icon) {
  const chip = document.createElement('div');
  chip.className = `status-chip ${statusName.toLowerCase()}`;
  
  let content = '';
  if (icon) {
    content += `<span class="status-chip-icon">${icon}</span>`;
  }
  content += `<span class="status-chip-value">${statusName} ${value}</span>`;
  
  if (trend !== undefined && trend !== 0) {
    const trendClass = trend > 0 ? 'positive' : 'negative';
    const trendSymbol = trend > 0 ? '+' : '';
    content += `<span class="status-chip-trend ${trendClass}">${trendSymbol}${trend}</span>`;
  }
  
  chip.innerHTML = content;
  return chip;
}

function createEnhancedPhaseHeader(phaseName, triggerCount, metadata) {
  const header = document.createElement('div');
  header.className = 'log-phase-header';
  
  const title = document.createElement('div');
  title.className = 'phase-title';
  title.textContent = phaseName;
  
  const meta = document.createElement('div');
  meta.className = 'phase-meta';
  
  if (triggerCount > 0) {
    const triggers = document.createElement('span');
    triggers.className = 'trigger-count';
    triggers.textContent = `${triggerCount} triggers`;
    meta.appendChild(triggers);
  }
  
  if (metadata) {
    const metaText = document.createElement('span');
    metaText.textContent = metadata;
    meta.appendChild(metaText);
  }
  
  header.appendChild(title);
  header.appendChild(meta);
  return header;
}

function createEffectRow(source, target, description) {
  const row = document.createElement('div');
  row.className = 'effect-row';
  
  row.innerHTML = `
    <span class="effect-source">${source}</span>
    <span class="effect-arrow"> </span>
    <span class="effect-target">${target}:</span>
    <span class="effect-description">${description}</span>
  `;
  
  return row;
}

function createSynergyTag(type, count) {
  const tag = document.createElement('span');
  tag.className = `synergy-tag ${type.toLowerCase()}`;
  tag.textContent = `${type}  ${count}`;
  return tag;
}

function createSummaryStrip(stats) {
  const strip = document.createElement('div');
  strip.className = 'summary-strip';
  
  Object.entries(stats).forEach(([key, value]) => {
    const stat = document.createElement('div');
    stat.className = `summary-stat ${key.toLowerCase()}`;
    stat.innerHTML = `
      <span>${key.charAt(0).toUpperCase() + key.slice(1)}</span>
      <span class="summary-stat-value">${value}</span>
    `;
    strip.appendChild(stat);
  });
  
  return strip;
}

// Update loadout trays
function updateLoadoutTrays() {
  updateLoadoutTray('Player', sides.P, 'playerLoadoutDisplay');
  updateLoadoutTray('Opponent', sides.O, 'opponentLoadoutDisplay');
}

function updateLoadoutTray(sideName, side, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const items = [];
  
  // Add weapon
  if (side.weapon) {
    items.push({
      type: 'weapon',
      name: side.weapon.name,
      slug: side.weapon.key || side.weapon.slug,
      tier: 'base'
    });
  }
  
  // Add items
  side.items.forEach((item, idx) => {
    if (item) {
      items.push({
        type: 'item',
        name: item.name,
        slug: item.key || item.slug,
        tier: item.tier || 'base'
      });
    }
  });
  
  // Add edge
  if (side.edge) {
    const edgeData = RAW_DATA[side.edge];
    if (edgeData) {
      items.push({
        type: 'edge',
        name: edgeData.name,
        slug: edgeData.key || edgeData.slug,
        tier: 'base'
      });
    }
  }
  
  if (items.length === 0) {
    container.innerHTML = '<div style="color: #666; font-size: 11px; font-style: italic; text-align: center; padding: 12px;">No items equipped</div>';
    return;
  }
  
  container.innerHTML = items.map(item => {
    const iconPath = `${item.slug}/icon.png`;
    const tierClass = item.tier !== 'base' ? ` tier-${item.tier}` : '';
    const typeClass = item.type === 'weapon' ? ' weapon' : '';
    const data = (typeof RAW_DATA !== 'undefined' && RAW_DATA[item.slug]) ? RAW_DATA[item.slug] : null;
    const eff = data && data.effect ? String(data.effect) : '';
    const st = (data && data.stats) ? data.stats : { attack:0, armor:0, health:0, speed:0 };
    const esc = (s) => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    
    return `
      <div class="loadout-item${tierClass}${typeClass}" title="${item.name}${item.tier !== 'base' ? ` (${item.tier})` : ''}">
        <img src="${iconPath}" alt="${item.name}" onerror="this.src='assets/placeholder.png'">
        <span>${item.name}</span>
        ${item.tier !== 'base' ? `<span style="font-size: 9px; color: #fa0; margin-left: 4px;">${item.tier}</span>` : ''}
        <div class="item-tooltip">
          <div class="name">${esc(item.name)}</div>
          ${eff ? `<div class="effect">${esc(eff)}</div>` : ''}
          <div class="stats">ATK ${st.attack||0} â€¢ ARM ${st.armor||0} â€¢ HP ${st.health||0} â€¢ SPD ${st.speed||0}</div>
        </div>
      </div>
    `;
  }).join('');
}

// Update pinned metrics (placeholder for now)
function updatePinnedMetrics(battleSummary) {
  // Get or create the pinned metrics container
  const pinnedMetrics = document.getElementById('pinnedMetrics');
  if (!pinnedMetrics) return;
  
  if (battleSummary && battleSummary.left && battleSummary.right) {
    // Clear existing content
    pinnedMetrics.innerHTML = '';
    
    // Create summary strip with actual battle data
    const summaryStats = {
      'Dmg Dealt': battleSummary.left.damageDealt || 0,
      'Dmg Taken': battleSummary.left.damageTaken || 0,
      'Healing': battleSummary.left.healingReceived || 0,
      'Effects': battleSummary.left.effectsTriggered || 0
    };
    
    const summaryStrip = createSummaryStrip(summaryStats);
    pinnedMetrics.appendChild(summaryStrip);
    
    // Add synergy tags if available
    const synergyContainer = document.createElement('div');
    synergyContainer.style.marginTop = '8px';
    
    // Example synergy detection (would need actual implementation)
    const playerItems = sides.P.items.concat([sides.P.weapon]).filter(Boolean);
    const symphonyCount = playerItems.filter(item => item.tags && item.tags.includes('Symphony')).length;
    const bombCount = playerItems.filter(item => item.tags && item.tags.includes('Bomb')).length;
    const fruitCount = playerItems.filter(item => item.tags && item.tags.includes('Fruit')).length;
    
    if (symphonyCount >= 2) {
      synergyContainer.appendChild(createSynergyTag('Symphony', symphonyCount));
    }
    if (bombCount >= 2) {
      synergyContainer.appendChild(createSynergyTag('Bomb', bombCount));
    }
    if (fruitCount >= 2) {
      synergyContainer.appendChild(createSynergyTag('Fruit', fruitCount));
    }
    
    if (synergyContainer.children.length > 0) {
      pinnedMetrics.appendChild(synergyContainer);
    }
  } else {
    // Default placeholder content
    pinnedMetrics.innerHTML = `
      <div class="summary-strip">
        <div class="summary-stat">
          <span>Dmg Dealt</span>
          <span class="summary-stat-value">0</span>
        </div>
        <div class="summary-stat">
          <span>Dmg Taken</span>
          <span class="summary-stat-value">0</span>
        </div>
        <div class="summary-stat">
          <span>Healing</span>
          <span class="summary-stat-value">0</span>
        </div>
        <div class="summary-stat">
          <span>Effects</span>
          <span class="summary-stat-value">0</span>
        </div>
      </div>
    `;
  }
}

// Enhanced log rendering for new three-pane layout
function renderCardifiedLog(logEntries) {
  const simLog = document.getElementById('simLog');
  if (!simLog || !logEntries) return;
  
  // Clear existing content
  simLog.innerHTML = '';
  
  // Group log entries by phase
  const phases = [];
  let currentPhase = null;
  
  logEntries.forEach((entry, index) => {
    const entryStr = String(entry);
    
    // Detect phase headers
    if (entryStr.match(/^\d+\.\s*--\s*Turn\s+\d+\s*--/) || entryStr.includes('Battle Start') || entryStr.includes('BATTLE')) {
      if (currentPhase) {
        phases.push(currentPhase);
      }
      
      currentPhase = {
        header: entryStr,
        type: entryStr.includes('Turn') ? 'turn-start' : 'battle-start',
        entries: [],
        triggers: 0,
        changes: 0
      };
    } else if (currentPhase) {
      currentPhase.entries.push(entry);
      
      // Count triggers and changes (simple heuristic)
      if (entryStr.includes('::icon:')) currentPhase.triggers++;
      if (entryStr.includes('gains') || entryStr.includes('loses') || entryStr.includes('deals')) currentPhase.changes++;
    }
  });
  
  // Add final phase
  if (currentPhase) {
    phases.push(currentPhase);
  }
  
  // Render phases as cards
  phases.forEach(phase => {
    const phaseCard = document.createElement('div');
    phaseCard.className = 'log-phase-card';
    
    // Use enhanced phase header with micro-patterns
    const phaseName = phase.header.replace(/^\d+\.\s*--\s*/, '').replace(/\s*--.*$/, '');
    let metadata = '';
    if (phase.type === 'turn-start') {
      metadata = `On Hit (${phase.triggers} triggers)`;
    } else {
      metadata = phase.triggers > 0 ? `${phase.triggers} effects` : '';
    }
    
    const header = createEnhancedPhaseHeader(phaseName, phase.triggers, metadata);
    
    const content = document.createElement('div');
    content.className = 'log-phase-content';
    
    // Render entries with enhanced effect rows
    phase.entries.forEach(entry => {
      const entryDiv = document.createElement('div');
      entryDiv.style.marginBottom = '4px';
      entryDiv.style.fontSize = '12px';
      entryDiv.style.color = '#ccc';
      
      const entryStr = String(entry);
      const iconMatch = entryStr.match(/^::icon:([^:]+)::\s*(.*)$/);
      
      if (iconMatch) {
        const slug = iconMatch[1];
        const text = iconMatch[2];
        
        // Try to create an enhanced effect row
        const effectMatch = text.match(/(.+?)\s+(gains?|loses?|deals?)\s+(.+)/);
        if (effectMatch) {
          const itemName = slug.split('/').pop().replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          const target = effectMatch[1];
          const action = effectMatch[2];
          const effect = effectMatch[3];
          
          const effectRow = createEffectRow(itemName, target, `${action} ${effect}`);
          entryDiv.appendChild(effectRow);
        } else {
          entryDiv.innerHTML = `
            <img src="${slug}/icon.png" style="width: 16px; height: 16px; image-rendering: pixelated; margin-right: 6px; vertical-align: middle;" onerror="this.style.display='none'">
            <span>${enhancePlayerNames(text)}</span>
          `;
        }
      } else {
        entryDiv.innerHTML = enhancePlayerNames(entryStr);
      }
      
      content.appendChild(entryDiv);
    });
    
    // Toggle functionality
    let expanded = false;
    header.addEventListener('click', () => {
      expanded = !expanded;
      if (expanded) {
        content.style.display = 'block';
        content.classList.add('expanded');
        header.querySelector('div:last-child').textContent = ' ';
        phaseCard.classList.add('expanded');
      } else {
        content.style.display = 'none';
        content.classList.remove('expanded');
        header.querySelector('div:last-child').textContent = ' ';
        phaseCard.classList.remove('expanded');
      }
    });
    
    phaseCard.appendChild(header);
    phaseCard.appendChild(content);
    simLog.appendChild(phaseCard);
  });
  
  simLog.scrollTop = simLog.scrollHeight;
}

// Function to enhance player names in battle log text
function enhancePlayerNames(text) {
  if (!text) return text;
  
  // Enhanced Player name styling - make it bigger and more prominent
  text = text.replace(/\bPlayer\b/g, '<span class="player-name player-1">Player</span>');
  
  // Enhanced Opponent name styling - make it bigger and more prominent  
  text = text.replace(/\bOpponent\b/g, '<span class="player-name player-2">Opponent</span>');
  
  // Also handle Fighter names if they appear
  text = text.replace(/\bFighter\b(?=\s+(hits|deals|gains|loses))/g, '<span class="player-name player-1">Fighter</span>');
  
  return text;
}

// --- end resolved merge conflict marker ---
function uiLogClear() {
  const log = document.getElementById('simLog');
  const battleStatus = document.getElementById('battleStatus');
  const battleSummary = document.getElementById('battleSummary');
  
  if (log) {
    log.innerHTML = `
      <div style="text-align:center; color:#666; font-style:italic; font-size:18px; padding:60px 20px;">
        <img src="assets/attack.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> Ready to witness epic battles!<br><br>
        Configure your loadouts and hit <strong style="color:#0f3;">"START BATTLE"</strong> to begin the simulation.
      </div>
    `;
  }
  
  if (battleStatus) battleStatus.textContent = 'Ready for Battle';
  if (battleSummary) battleSummary.style.display = 'none';
}

function uiLog(lines) {
  const log = document.getElementById('simLog');
  if (!log) return;
  
  // Clear initial message if it's the first log entry
  if (log.innerHTML.includes('Ready to witness epic battles')) {
    log.innerHTML = '';
  }
  
  const renderLine = (line) => {
    if (line == null) return;
    const div = document.createElement('div');
    div.className = 'logLine battle-log-line';
    
    const lineStr = String(line);
    
    // Determine line type for styling
    if (lineStr.includes('Player') || lineStr.includes('Fighter')) {
      div.classList.add('player');
    } else if (lineStr.includes('Opponent') || lineStr.includes('Enemy')) {
      div.classList.add('opponent');
    } else if (lineStr.includes('Turn') || lineStr.includes('Result') || lineStr.includes('Summary')) {
      div.classList.add('system');
    }
    
    const m = lineStr.match(/^::icon:([^:]+)::\s*(.*)$/);
    if (m) {
      const slug = m[1];
      const text = m[2];
      const img = document.createElement('img');
      img.src = slug + '/icon.png';
      img.alt = '';
      img.style.width = '24px';
      img.style.height = '24px';
      img.style.imageRendering = 'pixelated';
      img.style.marginRight = '8px';
      img.style.verticalAlign = 'middle';
      img.style.border = '1px solid rgba(0,255,51,0.3)';
      img.style.borderRadius = '4px';
      img.style.backgroundColor = 'rgba(0,0,0,0.2)';
      img.onerror = () => {
        img.style.display = 'none';
      };
      div.appendChild(img);
      
      // Add item name if we can find it
      const itemData = (window.HEIC_DETAILS || {})[slug];
      if (itemData && itemData.name) {
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `[${itemData.name}] `;
        nameSpan.style.color = '#fa0';
        nameSpan.style.fontWeight = 'bold';
        div.appendChild(nameSpan);
      }
      
      const textDiv = document.createElement('span');
      textDiv.innerHTML = text;
      div.appendChild(textDiv);
    } else {
      // Use innerHTML instead of textContent to render HTML img tags
      div.innerHTML = lineStr;
    }
    
    log.appendChild(div);
  };
  
  if (Array.isArray(lines)) { 
    for (const l of lines) renderLine(l); 
  } else { 
    renderLine(lines); 
  }
  
  log.scrollTop = log.scrollHeight;
}

function displayBattleResult(result, rounds, summary) {
  const battleStatus = document.getElementById('battleStatus');
  const battleSummary = document.getElementById('battleSummary');
  const playerSummaryContent = document.getElementById('playerSummaryContent');
  const opponentSummaryContent = document.getElementById('opponentSummaryContent');
  
  // Update battle status with result
  if (battleStatus) {
    let statusText = '';
    let statusClass = '';
    
    switch(result) {
      case 'Victory':
        statusText = '<img src="assets/health.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> VICTORY!';
        statusClass = 'result-victory';
        break;
      case 'Defeat':
        statusText = '   DEFEAT!';
        statusClass = 'result-defeat';
        break;
      case 'Draw':
        statusText = '   DRAW!';
        statusClass = 'result-draw';
        break;
      default:
        statusText = result;
        break;
    }
    
    battleStatus.innerHTML = `<span class="${statusClass}">${statusText} (${rounds} rounds)</span>`;
  }
  
  // Show summary if available
  if (summary && battleSummary) {
    battleSummary.style.display = 'block';
    
    const formatSummary = (s) => {
      let setsHtml = '';
      if (s.sets && s.sets.length > 0) {
        setsHtml = `
          <div style="margin-top:16px; padding-top:12px; border-top:2px solid rgba(255,255,255,0.2);">
            <div style="font-weight:700; font-size:18px; margin-bottom:10px; color:#f93;"><img src="assets/health.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> Active Sets</div>
            <div style="font-size:16px; line-height:1.5;">
              ${s.sets.map(set => `<div style="margin-bottom:8px; padding:8px; background:rgba(255,153,51,0.1); border-radius:6px; border-left:4px solid #f93;"><strong>${set.name}:</strong> ${set.desc}</div>`).join('')}
            </div>
          </div>
        `;
      }
      
      return `
        <div style="margin-bottom:8px;"><strong>HP Remaining:</strong> ${s.hpRemaining}</div>
        <div style="margin-bottom:8px;"><strong>Damage Dealt:</strong> ${s.hpDamageDealt}</div>
        <div style="margin-bottom:8px;"><strong>Armor Destroyed:</strong> ${s.armorDestroyedDealt}</div>
        <div style="margin-bottom:8px;"><strong>Strikes:</strong> ${s.strikesLanded}/${s.strikesAttempted}</div>
        <div style="margin-bottom:8px;"><strong>Bomb Damage:</strong> ${s.bombHpDealt || 0}</div>
        ${setsHtml}
      `;
    };
    
    if (playerSummaryContent) {
      playerSummaryContent.innerHTML = formatSummary(summary.left);
    }
    
    if (opponentSummaryContent) {
      opponentSummaryContent.innerHTML = formatSummary(summary.right);
    }
  }
}

const simBtn = document.getElementById('btnSimulate');
const simBtnTop = document.getElementById('btnSimulateTop');
const showSimBtn = document.getElementById('showSimBtn');

function startBattle() {
    // Automatically switch to the simulation tab
    showTab('simulation');

    updateTotals('P');
    updateTotals('O');
    const left = collectEntityData('P');
    const right = collectEntityData('O');
    const maxTurns = 200; // Fixed to 200 turns
    
    // Update battle status
    const battleStatus = document.getElementById('battleStatus');
    if (battleStatus) battleStatus.innerHTML = '<img src="assets/attack.png" style="width:16px; height:16px; vertical-align:middle; image-rendering:pixelated;"> Battle in Progress...';
    
    // Hide replay controls during simulation
    const timelineControls = document.getElementById('timelineControls');
    if (timelineControls) timelineControls.style.display = 'none';
    
    // Update fighter cards with initial states
    updateFighterCards();
    
    // Clear log
    uiLogClear();
    
    if (typeof HeICSim === 'undefined' || !HeICSim.simulate) {
      uiLog('  Simulation engine failed to load.');
      if (battleStatus) battleStatus.textContent = 'Error: Engine Failed';
      return;
    }
    
    try {
      const live = { lastEvent: null };
      const collectedStates = [];
      const hooks = {
        onAction: (evt) => { live.lastEvent = evt; },
        onState: (snap) => {
          try {
            snap.event = live.lastEvent || { side: null };
            // Keep a copy for replay deltas
            try { collectedStates.push(JSON.parse(JSON.stringify(snap))); } catch(_) { collectedStates.push(snap); }
            if (typeof BattleVisuals !== 'undefined') BattleVisuals.renderState(snap);
          } catch (_) {}
          live.lastEvent = null;
        }
      };
      const res = HeICSim.simulate(left, right, { maxTurns: maxTurns, includeSummary: true, hooks });
      // Attach state stream for replay (aligned 1:1 with log lines via onState calls)
      try { res.states = collectedStates; } catch(_) {}
      
      // Use new cardified log rendering
      if (res.log) {
        renderCardifiedLog(res.log);
        try { if (window.SideLogs) window.SideLogs.loadFromLog(res.log); } catch (_) {}
      }
      
      // Show timeline controls after simulation
      if (timelineControls) {
        timelineControls.style.display = 'block';
        try {
          if (typeof BattleReplayController !== 'undefined' && BattleReplayController && typeof BattleReplayController.loadBattle === 'function') {
            BattleReplayController.loadBattle(res);
          } else {
            console.warn('Replay controller not available; skipping loadBattle');
          }
        } catch (e) {
          console.warn('Replay controller error:', e?.message || e);
        }
      }
      
      // Update battle status
      if (battleStatus) {
        const resultText = res.result === 'Victory' ? 'Player Victory!' : 
                          res.result === 'Defeat' ? 'Player Defeat!' : 'Draw!';
        const resultColor = res.result === 'Victory' ? '#0f3' : 
                           res.result === 'Defeat' ? '#f33' : '#fa0';
        battleStatus.innerHTML = `<span style="color:${resultColor}">${resultText} (${res.rounds} rounds)</span>`;
      }
      
      // Update fighter results
      const playerResult = document.getElementById('playerResult');
      const opponentResult = document.getElementById('opponentResult');
      if (playerResult && opponentResult) {
        if (res.result === 'Victory') {
          playerResult.innerHTML = '<span style="color: #0f3;">WINNER</span>';
          playerResult.style.display = 'block';
          opponentResult.innerHTML = '<span style="color: #666;">LOSER</span>';
          opponentResult.style.display = 'block';
        } else if (res.result === 'Defeat') {
          playerResult.innerHTML = '<span style="color: #666;">LOSER</span>';
          playerResult.style.display = 'block';
          opponentResult.innerHTML = '<span style="color: #f33;">WINNER</span>';
          opponentResult.style.display = 'block';
        } else {
          playerResult.innerHTML = '<span style="color: #fa0;">DRAW</span>';
          playerResult.style.display = 'block';
          opponentResult.innerHTML = '<span style="color: #fa0;">DRAW</span>';
          opponentResult.style.display = 'block';
        }
      }
      
      // Update final HP/stats if available in summary
      if (res.summary) {
        updateFinalStats(res.summary);
        updatePinnedMetrics(res.summary);
      }
      
      // Noise filter removed per request
      
      // Run battle analysis with the simulation results
      runBattleAnalysis(res);
      
    } catch (ex) {
      console.error(ex);
      uiLog('  Error running simulation: ' + ex.message);
      if (battleStatus) battleStatus.textContent = 'Error: Simulation Failed';
    }
}

if (simBtn) simBtn.addEventListener('click', startBattle);
if (simBtnTop) simBtnTop.addEventListener('click', startBattle);

// Update final stats in fighter cards after simulation
function updateFinalStats(summary) {
  if (!summary || !summary.left || !summary.right) return;
  
  // Update player final stats
  const playerHP = document.getElementById('playerHP');
  const playerArmor = document.getElementById('playerArmor');
  if (playerHP) playerHP.textContent = summary.left.hpRemaining || 0;
  if (playerArmor) playerArmor.textContent = summary.left.armorRemaining || 0;
  
  // Update opponent final stats
  const opponentHP = document.getElementById('opponentHP');
  const opponentArmor = document.getElementById('opponentArmor');
  if (opponentHP) opponentHP.textContent = summary.right.hpRemaining || 0;
  if (opponentArmor) opponentArmor.textContent = summary.right.armorRemaining || 0;
}

// Noise filter removed per request

const clearBtn = document.getElementById('btnClearLog');
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    uiLogClear();
    
    // Hide timeline controls when clearing
    const timelineControls = document.getElementById('timelineControls');
    if (timelineControls) timelineControls.style.display = 'none';
    
    // Reset fighter results
    const playerResult = document.getElementById('playerResult');
    const opponentResult = document.getElementById('opponentResult');
    if (playerResult) playerResult.style.display = 'none';
    if (opponentResult) opponentResult.style.display = 'none';
    
    // Reset fighter stats to initial values
    updateFighterCards();
    
  // Reset battle analysis
  showEmptyAnalysis();

    // Clear side logs
    try {
      if (window.SideLogs) {
        window.SideLogs.events = [];
        window.SideLogs.renderAll();
      }
    } catch (_) {}
  });
}

// Noise filter removed per request

// Timeline controls functionality
function setupTimelineControls() {
  const timelineSlider = document.getElementById('timelineSlider');
  const stepBackBtn = document.getElementById('stepBackBtn');
  const stepForwardBtn = document.getElementById('stepForwardBtn');
  const replayBtn = document.getElementById('replayBtn');
  
  // For now, these are placeholders - full timeline functionality would require
  // tracking simulation state at each step
  if (stepBackBtn) {
    stepBackBtn.addEventListener('click', () => {
      console.log('Step back clicked - feature placeholder');
    });
  }
  
  if (stepForwardBtn) {
    stepForwardBtn.addEventListener('click', () => {
      console.log('Step forward clicked - feature placeholder');
    });
  }
  
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      console.log('Replay clicked - feature placeholder');
    });
  }
}

// Setup grouping toggle
function setupLogGrouping() {
  const groupToggle = document.getElementById('groupTriggersToggle');
  if (groupToggle) {
    groupToggle.addEventListener('change', () => {
      groupLogEntries(groupToggle.checked);
    });
  }
}

function groupLogEntries(shouldGroup) {
  // This is a placeholder - full grouping would require analysis of log entries
  // and restructuring them by trigger type or timing
  console.log('Log grouping toggled:', shouldGroup);
}

// Initialize all controls
setupTimelineControls();
setupLogGrouping();

// ============================================================================
// Battle Analysis System
// ============================================================================

let currentBattleAnalysis = null;
let currentSimulationLog = null;

// Initialize Battle Analysis System
function initializeBattleAnalysis() {
  // Setup panel toggle functionality
  document.querySelectorAll('.analysis-panel-header').forEach(header => {
    header.addEventListener('click', () => {
      const panel = header.parentElement;
      panel.classList.toggle('collapsed');
      const toggle = header.querySelector('.analysis-toggle');
      toggle.textContent = panel.classList.contains('collapsed') ? '+' : ' ';
    });
  });
  
  // Setup Why Inspector
  const closeBtn = document.getElementById('closeWhyInspector');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const inspector = document.getElementById('whyInspector');
      inspector.classList.remove('open');
    });
  }
}

// Main function to run battle analysis
function runBattleAnalysis(battleResult) {
  if (!battleResult || !battleResult.log || !battleResult.summary) {
    showEmptyAnalysis();
    return;
  }
  
  currentBattleAnalysis = analyzeBattle(battleResult);
  currentSimulationLog = battleResult.log;
  
  renderBattleAnalysis(currentBattleAnalysis);
}

// Analyze battle results to extract insights
function analyzeBattle(battleResult) {
  const analysis = {
    outcome: analyzeOutcome(battleResult),
    damageSources: analyzeDamageSources(battleResult),
    statusImpact: analyzeStatusImpact(battleResult),
    triggerHeatmap: analyzeTriggerHeatmap(battleResult),
    armorEconomy: analyzeArmorEconomy(battleResult),
    synergies: analyzeSynergies(battleResult),
    bottlenecks: analyzeBottlenecks(battleResult),
    recommendations: generateRecommendations(battleResult)
  };
  
  return analysis;
}

// Analyze battle outcome and key metrics
function analyzeOutcome(battleResult) {
  const summary = battleResult.summary;
  const left = summary.left || {};
  const right = summary.right || {};
  
  return {
    ttk: battleResult.rounds || 0,
    survived: battleResult.result !== 'Defeat',
    damageDealt: left.damageDealt || 0,
    damageTaken: left.damageTaken || 0,
    strikeUptime: calculateStrikeUptime(battleResult),
    netTempo: calculateNetTempo(battleResult)
  };
}

// Analyze damage sources and their contributions
function analyzeDamageSources(battleResult) {
  const log = battleResult.log || [];
  const sources = {};
  let totalDamage = 0;
  
  // Parse log for damage sources (simplified implementation)
  log.forEach(entry => {
    const entryStr = String(entry);
    
    // Match damage entries like "::icon:items/cherry_bomb:: Fighter deals 2 damage"
    const damageMatch = entryStr.match(/::icon:([^:]+)::\s*\w+\s+deals\s+(\d+)\s+damage/);
    if (damageMatch) {
      const source = damageMatch[1].split('/').pop().replace(/_/g, ' ');
      const damage = parseInt(damageMatch[2]);
      
      sources[source] = (sources[source] || 0) + damage;
      totalDamage += damage;
    }
    
    // Match strike damage
    const strikeMatch = entryStr.match(/  .*hits.*for\s+(\d+)/);
    if (strikeMatch) {
      const damage = parseInt(strikeMatch[1]);
      sources['Weapon Strike'] = (sources['Weapon Strike'] || 0) + damage;
      totalDamage += damage;
    }
  });
  
  // Convert to array with percentages
  const sourceArray = Object.entries(sources).map(([name, damage]) => ({
    name: name.replace(/\b\w/g, l => l.toUpperCase()),
    damage,
    percentage: totalDamage > 0 ? Math.round((damage / totalDamage) * 100) : 0
  })).sort((a, b) => b.damage - a.damage);
  
  return { sources: sourceArray, totalDamage };
}

// Analyze status effect impact
function analyzeStatusImpact(battleResult) {
  const log = battleResult.log || [];
  const statusEffects = {};
  
  log.forEach(entry => {
    const entryStr = String(entry);
    
    // Match status applications
    const statusMatch = entryStr.match(/(gains?|applies?)\s+(\d+)\s+(\w+)/i);
    if (statusMatch) {
      const amount = parseInt(statusMatch[2]);
      const status = statusMatch[3].toLowerCase();
      
      if (!statusEffects[status]) {
        statusEffects[status] = {
          applications: 0,
          totalValue: 0,
          avgValue: 0,
          damage: 0
        };
      }
      
      statusEffects[status].applications++;
      statusEffects[status].totalValue += amount;
    }
    
    // Match status damage
    const statusDamageMatch = entryStr.match(/(\w+)\s+deals\s+(\d+)\s+damage/);
    if (statusDamageMatch) {
      const status = statusDamageMatch[1].toLowerCase();
      const damage = parseInt(statusDamageMatch[2]);
      
      if (statusEffects[status]) {
        statusEffects[status].damage += damage;
      }
    }
  });
  
  // Calculate averages
  Object.values(statusEffects).forEach(effect => {
    effect.avgValue = effect.applications > 0 ? 
      Math.round(effect.totalValue / effect.applications) : 0;
  });
  
  return statusEffects;
}

// Create trigger heatmap
function analyzeTriggerHeatmap(battleResult) {
  // This would require detailed simulation data tracking
  // For now, return mock data structure
  return {
    phases: ['Battle Start', 'Turn Start', 'On Hit', 'On Wounded', 'On Exposed'],
    items: getCurrentPlayerItems(),
    matrix: {} // Would be filled with actual trigger counts
  };
}

// Analyze armor economy
function analyzeArmorEconomy(battleResult) {
  const log = battleResult.log || [];
  let armorGained = 0;
  let armorLost = 0;
  let preventedDamage = 0;
  
  log.forEach(entry => {
    const entryStr = String(entry);
    
    const armorGainMatch = entryStr.match(/gains?\s+(\d+)\s+armor/i);
    if (armorGainMatch) {
      armorGained += parseInt(armorGainMatch[1]);
    }
    
    const armorLossMatch = entryStr.match(/loses?\s+(\d+)\s+armor/i);
    if (armorLossMatch) {
      armorLost += parseInt(armorLossMatch[1]);
    }
  });
  
  return {
    gained: armorGained,
    lost: armorLost,
    net: armorGained - armorLost,
    efficiency: armorGained > 0 ? Math.round((preventedDamage / armorGained) * 100) : 0
  };
}

// Analyze synergies and anti-synergies
function analyzeSynergies(battleResult) {
  const playerItems = getCurrentPlayerItems();
  const synergies = [];
  const antiSynergies = [];
  
  // Detect symphony synergy
  const symphonyItems = playerItems.filter(item => 
    item.tags && item.tags.includes('Symphony')
  );
  if (symphonyItems.length >= 2) {
    synergies.push({
      type: 'Symphony',
      count: symphonyItems.length,
      description: `Symphony chain  ${symphonyItems.length} (${symphonyItems.map(i => i.name).join(', ')})`,
      items: symphonyItems
    });
  }
  
  // Detect bomb synergy
  const bombItems = playerItems.filter(item => 
    item.tags && item.tags.includes('Bomb')
  );
  if (bombItems.length >= 2) {
    synergies.push({
      type: 'Bomb',
      count: bombItems.length,
      description: `Bomb synergy  ${bombItems.length} detected`,
      items: bombItems
    });
  }
  
  // Detect potential anti-synergies
  const healingItems = playerItems.filter(item => 
    item.effects && item.effects.some(effect => 
      effect.actions && effect.actions.some(action => 
        action.type && action.type.includes('heal')
      )
    )
  );
  
  if (healingItems.length > 0) {
    // Check for healing blockers (this would need more sophisticated detection)
    antiSynergies.push({
      type: 'Healing Conflict',
      description: 'Healing items present but may be underperforming',
      severity: 'warning'
    });
  }
  
  return { synergies, antiSynergies };
}

// Analyze bottlenecks and risks
function analyzeBottlenecks(battleResult) {
  const bottlenecks = [];
  const risks = [];
  
  // Speed deficit analysis
  const playerStats = calculatePlayerStats();
  const opponentStats = calculateOpponentStats();
  
  if (playerStats.speed < opponentStats.speed) {
    bottlenecks.push({
      type: 'Speed Deficit',
      description: `Speed disadvantage: ${opponentStats.speed - playerStats.speed}`,
      severity: 'high'
    });
  }
  
  // Armor overcap analysis
  if (playerStats.armor > 10) {
    bottlenecks.push({
      type: 'Armor Overcap',
      description: 'Excess armor may indicate inefficient stat distribution',
      severity: 'medium'
    });
  }
  
  // Low HP risk
  if (playerStats.health < 15) {
    risks.push({
      type: 'Low HP',
      description: 'Low health pool increases vulnerability to burst damage',
      severity: 'high'
    });
  }
  
  return { bottlenecks, risks };
}

// Generate recommendations
function generateRecommendations(battleResult) {
  const recommendations = [];
  const analysis = currentBattleAnalysis || {};
  
  // Speed recommendations
  if (analysis.bottlenecks && analysis.bottlenecks.bottlenecks.some(b => b.type === 'Speed Deficit')) {
    recommendations.push({
      title: 'Increase Speed',
      gain: '+2-3 TTK improvement',
      description: 'Consider adding speed items like Swift Boots or Featherweight Helmet to gain turn priority.',
      priority: 'high'
    });
  }
  
  // Synergy recommendations
  const playerItems = getCurrentPlayerItems();
  const symphonyItems = playerItems.filter(item => 
    item.tags && item.tags.includes('Symphony')
  );
  
  if (symphonyItems.length === 1) {
    recommendations.push({
      title: 'Complete Symphony Chain',
      gain: '+15-20% damage boost',
      description: 'Add more Symphony items (Grand Crescendo, Arcane Bell, Sheet Music) to activate synergy bonus.',
      priority: 'medium'
    });
  }
  
  // Generic efficiency recommendation
  recommendations.push({
    title: 'Optimize Item Synergies',
    gain: '+5-10% overall performance',
    description: 'Review item combinations for potential synergies and remove conflicting effects.',
    priority: 'low'
    });
  
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// Helper functions
function getCurrentPlayerItems() {
  const items = [];
  
  // Get weapon
  if (sides.P.weapon) {
    items.push(sides.P.weapon);
  }
  
  // Get items
  sides.P.items.forEach(item => {
    if (item) items.push(item);
  });
  
  return items;
}

function calculatePlayerStats() {
  const side = sides.P;
  let hp = side.hpBase, atk = side.atkBase, arm = side.armBase, spd = side.spdBase;
  
  const addStats = obj => {
    if (!obj || !obj.stats) return;
    const s = obj.stats;
    hp += (s.health || 0);
    atk += (s.attack || 0);
    arm += (s.armor || 0);
    spd += (s.speed || 0);
  };
  
  addStats(side.weapon);
  side.items.forEach(addStats);
  
  return { health: hp, attack: atk, armor: arm, speed: spd };
}

function calculateOpponentStats() {
  const side = sides.O;
  let hp = side.hpBase, atk = side.atkBase, arm = side.armBase, spd = side.spdBase;
  
  const addStats = obj => {
    if (!obj || !obj.stats) return;
    const s = obj.stats;
    hp += (s.health || 0);
    atk += (s.attack || 0);
    arm += (s.armor || 0);
    spd += (s.speed || 0);
  };
  
  addStats(side.weapon);
  side.items.forEach(addStats);
  
  return { health: hp, attack: atk, armor: arm, speed: spd };
}

function calculateStrikeUptime(battleResult) {
  // Simplified calculation - would need detailed tracking in actual implementation
  return Math.floor(Math.random() * 100); // Placeholder
}

function calculateNetTempo(battleResult) {
  const playerStats = calculatePlayerStats();
  const opponentStats = calculateOpponentStats();
  return playerStats.speed - opponentStats.speed;
}

// Render the complete battle analysis
function renderBattleAnalysis(analysis) {
  renderOutcomeKPIs(analysis.outcome);
  renderDamageSources(analysis.damageSources);
  renderStatusImpact(analysis.statusImpact);
  renderTriggerHeatmap(analysis.triggerHeatmap);
  renderArmorEconomy(analysis.armorEconomy);
  renderSynergyAnalysis(analysis.synergies);
  renderBottlenecks(analysis.bottlenecks);
  renderRecommendations(analysis.recommendations);
}

// Render outcome KPIs
function renderOutcomeKPIs(outcome) {
  document.getElementById('kpiTTK').textContent = `${outcome.ttk} turns`;
  document.getElementById('kpiSurvived').textContent = outcome.survived ? 'Yes' : 'No';
  document.getElementById('kpiDamageDealt').textContent = outcome.damageDealt;
  document.getElementById('kpiDamageTaken').textContent = outcome.damageTaken;
  document.getElementById('kpiStrikeUptime').textContent = `${outcome.strikeUptime}%`;
  document.getElementById('kpiNetTempo').textContent = outcome.netTempo >= 0 ? `+${outcome.netTempo}` : outcome.netTempo;
  
  // Color coding
  const survivedEl = document.getElementById('kpiSurvived');
  survivedEl.style.color = outcome.survived ? '#26de81' : '#ff6b6b';
  
  const tempoEl = document.getElementById('kpiNetTempo');
  tempoEl.style.color = outcome.netTempo >= 0 ? '#26de81' : '#ff6b6b';
}

// Render damage sources
function renderDamageSources(damageSources) {
  const chartEl = document.getElementById('damageChart');
  const listEl = document.getElementById('damageList');
  
  chartEl.innerHTML = '';
  listEl.innerHTML = '';
  
  if (!damageSources || !damageSources.sources.length) {
    listEl.innerHTML = '<div style="color: #666; font-style: italic;">No damage data available</div>';
    return;
  }
  
  const maxDamage = Math.max(...damageSources.sources.map(s => s.damage));
  
  damageSources.sources.forEach(source => {
    // Create chart bar
    const bar = document.createElement('div');
    bar.className = 'damage-bar';
    const width = maxDamage > 0 ? (source.damage / maxDamage) * 100 : 0;
    bar.innerHTML = `
      <div class="damage-bar-fill" style="width: ${width}%;"></div>
      <span>${source.name}: ${source.damage}</span>
    `;
    chartEl.appendChild(bar);
    
    // Create list item
    const item = document.createElement('div');
    item.className = 'damage-source-item';
    item.innerHTML = `
      <span class="damage-source-name">${source.name}</span>
      <span>
        <span class="damage-source-value">${source.damage}</span>
        <span class="damage-source-percent">(${source.percentage}%)</span>
      </span>
    `;
    
    item.addEventListener('click', () => {
      highlightLogEntries(source.name);
    });
    
    listEl.appendChild(item);
  });
}

// Render status impact
function renderStatusImpact(statusImpact) {
  const container = document.getElementById('statusBreakdown');
  container.innerHTML = '';
  
  if (!statusImpact || Object.keys(statusImpact).length === 0) {
    container.innerHTML = '<div style="color: #666; font-style: italic;">No status effects detected</div>';
    return;
  }
  
  Object.entries(statusImpact).forEach(([status, data]) => {
    const item = document.createElement('div');
    item.className = 'status-impact-item';
    item.innerHTML = `
      <div class="status-impact-header">
        <span class="status-impact-name">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
        <span class="status-impact-total">${data.totalValue}</span>
      </div>
      <div class="status-impact-details">
        ${data.applications} applications, avg ${data.avgValue}, ${data.damage} damage dealt
      </div>
    `;
    container.appendChild(item);
  });
}

// Render trigger heatmap
function renderTriggerHeatmap(heatmapData) {
  const container = document.getElementById('heatmapMatrix');
  container.innerHTML = '<div style="color: #666; font-style: italic;">Trigger heatmap requires detailed simulation tracking</div>';
  
  // This would be implemented with actual simulation data
  // const table = document.createElement('table');
  // table.className = 'heatmap-table';
  // ... table generation code
}

// Render armor economy
function renderArmorEconomy(armorData) {
  const container = document.getElementById('armorFlow');
  container.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 12px;">
      <div>
        <div style="color: #26de81; font-weight: bold;">${armorData.gained}</div>
        <div style="color: #aaa;">Gained</div>
      </div>
      <div>
        <div style="color: #ff6b6b; font-weight: bold;">${armorData.lost}</div>
        <div style="color: #aaa;">Lost</div>
      </div>
      <div>
        <div style="color: ${armorData.net >= 0 ? '#26de81' : '#ff6b6b'}; font-weight: bold;">${armorData.net >= 0 ? '+' : ''}${armorData.net}</div>
        <div style="color: #aaa;">Net</div>
      </div>
    </div>
    <div style="margin-top: 8px; font-size: 11px; color: #aaa;">
      Efficiency: ${armorData.efficiency}% damage prevented per armor gained
    </div>
  `;
}

// Render synergy analysis
function renderSynergyAnalysis(synergyData) {
  const calloutsEl = document.getElementById('synergyCallouts');
  const warningsEl = document.getElementById('antiSynergyWarnings');
  
  calloutsEl.innerHTML = '';
  warningsEl.innerHTML = '';
  
  // Render synergies
  if (synergyData.synergies && synergyData.synergies.length > 0) {
    synergyData.synergies.forEach(synergy => {
      const callout = document.createElement('div');
      callout.className = 'synergy-callout';
      callout.innerHTML = `
        <span class="synergy-callout-icon"> </span>
        <span class="synergy-callout-text">${synergy.description}</span>
      `;
      calloutsEl.appendChild(callout);
    });
  } else {
    calloutsEl.innerHTML = '<div style="color: #666; font-style: italic;">No synergies detected</div>';
  }
  
  // Render anti-synergies
  if (synergyData.antiSynergies && synergyData.antiSynergies.length > 0) {
    synergyData.antiSynergies.forEach(antiSynergy => {
      const warning = document.createElement('div');
      warning.className = 'anti-synergy-warning';
      warning.innerHTML = `
        <span class="anti-synergy-warning-icon">  </span>
        <span class="anti-synergy-warning-text">${antiSynergy.description}</span>
      `;
      warningsEl.appendChild(warning);
    });
  }
}

// Render bottlenecks
function renderBottlenecks(bottleneckData) {
  const limitingEl = document.getElementById('limitingFactors');
  const risksEl = document.getElementById('riskAlerts');
  
  limitingEl.innerHTML = '';
  risksEl.innerHTML = '';
  
  // Render bottlenecks
  if (bottleneckData.bottlenecks && bottleneckData.bottlenecks.length > 0) {
    bottleneckData.bottlenecks.forEach((bottleneck, index) => {
      const item = document.createElement('div');
      item.style.cssText = 'padding: 8px; background: rgba(255,107,107,0.1); border-radius: 4px; margin-bottom: 6px; font-size: 12px;';
      item.innerHTML = `
        <div style="color: #ff6b6b; font-weight: 500;">#${index + 1} ${bottleneck.type}</div>
        <div style="color: #ccc; margin-top: 2px;">${bottleneck.description}</div>
      `;
      limitingEl.appendChild(item);
    });
  }
  
  // Render risks
  if (bottleneckData.risks && bottleneckData.risks.length > 0) {
    bottleneckData.risks.forEach(risk => {
      const item = document.createElement('div');
      item.style.cssText = 'padding: 6px; background: rgba(255,165,0,0.1); border-radius: 4px; margin-bottom: 4px; font-size: 11px;';
      item.innerHTML = `
        <span style="color: #ffa500; font-weight: 500;">${risk.type}:</span>
        <span style="color: #ccc; margin-left: 4px;">${risk.description}</span>
      `;
      risksEl.appendChild(item);
    });
  }
  
  if (limitingEl.children.length === 0 && risksEl.children.length === 0) {
    limitingEl.innerHTML = '<div style="color: #666; font-style: italic;">No major bottlenecks detected</div>';
  }
}

// Render recommendations
function renderRecommendations(recommendations) {
  const container = document.getElementById('recommendationList');
  container.innerHTML = '';
  
  if (!recommendations || recommendations.length === 0) {
    container.innerHTML = '<div style="color: #666; font-style: italic;">No specific recommendations available</div>';
    return;
  }
  
  recommendations.forEach(rec => {
    const item = document.createElement('div');
    item.className = 'recommendation-item';
    item.innerHTML = `
      <div class="recommendation-header">
        <span class="recommendation-title">${rec.title}</span>
        <span class="recommendation-gain">${rec.gain}</span>
      </div>
      <div class="recommendation-description">${rec.description}</div>
    `;
    container.appendChild(item);
  });
}

// Show empty analysis when no data is available
function showEmptyAnalysis() {
  // Clear all analysis sections
  ['kpiTTK', 'kpiSurvived', 'kpiDamageDealt', 'kpiDamageTaken', 'kpiStrikeUptime', 'kpiNetTempo'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '-';
  });
  
  // Show placeholder messages
  const placeholderMessage = '<div style="color: #666; font-style: italic; text-align: center; padding: 20px;">Run a simulation to see battle analysis</div>';
  
  ['damageList', 'statusBreakdown', 'heatmapMatrix', 'armorFlow', 
   'synergyCallouts', 'limitingFactors', 'recommendationList'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = placeholderMessage;
  });
}

// Highlight log entries related to a specific source
function highlightLogEntries(sourceName) {
  if (!currentSimulationLog) return;
  
  // This would highlight relevant log entries in the simulation tab
  console.log('Highlighting log entries for:', sourceName);
  
  // Could also open the why inspector
  showWhyInspector(sourceName);
}

// Show why inspector for detailed analysis
function showWhyInspector(sourceName) {
  const inspector = document.getElementById('whyInspector');
  const causalChain = document.getElementById('causalChain');
  
  // Mock causal chain data
  causalChain.innerHTML = `
    <div class="causal-step">
      <div class="causal-step-header">Source Item   Trigger</div>
      <div class="causal-step-details">${sourceName} activated on battle start trigger</div>
    </div>
    <div class="causal-step">
      <div class="causal-step-header">Condition Check</div>
      <div class="causal-step-details">No conditions required - always triggers</div>
    </div>
    <div class="causal-step">
      <div class="causal-step-header">Actions Executed</div>
      <div class="causal-step-details">Deal damage action executed successfully</div>
    </div>
    <div class="causal-step">
      <div class="causal-step-header">State Delta</div>
      <div class="causal-step-details">Enemy HP reduced, battle state updated</div>
    </div>
  `;
  
  inspector.classList.add('open');
}

// Initialize when the page loads
initializeBattleAnalysis();
if (clearBtn) {
  clearBtn.addEventListener('click', () => {
    uiLogClear();
    BattleReplayController.hide(); // Hide replay controls when clearing
  });
}

// Normalize any garbled labels from past encoding issues
(function normalizeLabels(){
  try {
    const ep = document.getElementById('edgeP');
    if (ep && ep.options && ep.options.length) ep.options[0].textContent = '- Select Edge -';
    const eo = document.getElementById('edgeO');
    if (eo && eo.options && eo.options.length) eo.options[0].textContent = '- Select Edge -';
    const rb = document.getElementById('randBuildBtn'); if (rb) rb.textContent = 'Random Build';
    const re = document.getElementById('randEnemyBtn'); if (re) re.textContent = 'Random Enemy';
    const bs = document.getElementById('btnSimulate'); if (bs) bs.textContent = 'Simulate';
  } catch (_) {}
})();

// Import-from-screenshot (alpha) removed
/*
(function setupImport(){
  const drop = document.getElementById('importDrop');
  const canvas = document.getElementById('importCanvas');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const srcCanvas = document.createElement('canvas');
  const srcCtx = srcCanvas.getContext('2d');
  const logEl = document.getElementById('importLog');
  const fileBtn = document.getElementById('btnLoadImage');
  const fileInput = document.getElementById('imageFile');
  const btnScan = document.getElementById('btnScan');
  const btnApplyBoth = document.getElementById('btnApplyBoth');
  const roiTarget = document.getElementById('roiTarget');
  const roiRows = document.getElementById('roiRows');
  const roiCols = document.getElementById('roiCols');
  const confMinInput = document.getElementById('confMin');
  const chkPreview = document.getElementById('chkPreview');
  const chkOcrEdge = document.getElementById('chkOcrEdge');
  const warnEl = document.getElementById('importWarnings');
  if (!drop || !canvas || !ctx) return;

  const ROIS = { 'left-items': null, 'left-weapon': null, 'left-oils': null, 'left-edge': null, 'right-items': null, 'right-weapon': null, 'right-oils': null, 'right-edge': null };
  let clickStart = null;
  let img = new Image();
  let iconLib = null;
  let oilsLib = null; // attack/armor/speed icons
  let lastHints = [];
  let dragging = null; // {target, kind:'nw'|'ne'|'sw'|'se', ox, oy}
  let warnings = [];
  let presetSide = null; // 'P' | 'O' when preset mode active

  function log(msg){ if (logEl) logEl.textContent += (msg+'\n'); }
  function clearLog(){ if (logEl) logEl.textContent=''; }
  function render(){
    if (!img || !img.width) return;
    const W = canvas.clientWidth|0; const ratio = img.height/img.width; canvas.width = W; canvas.height = Math.max(1, Math.floor(W*ratio));
    ctx.imageSmoothingEnabled = false; ctx.drawImage(srcCanvas && srcCanvas.width ? srcCanvas : img, 0, 0, canvas.width, canvas.height);
    const drawRect = (r, color, withGrid=false, rows=0, cols=0) => {
      if(!r) return; ctx.strokeStyle=color; ctx.lineWidth=2; ctx.strokeRect(r.x, r.y, r.w, r.h);
      if (withGrid && rows>0 && cols>0) {
        ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = 0.4; ctx.lineWidth = 1;
        const cw = r.w/cols, ch = r.h/rows;
        for (let i=1;i<cols;i++){ ctx.beginPath(); ctx.moveTo(r.x+i*cw, r.y); ctx.lineTo(r.x+i*cw, r.y+r.h); ctx.stroke(); }
        for (let j=1;j<rows;j++){ ctx.beginPath(); ctx.moveTo(r.x, r.y+j*ch); ctx.lineTo(r.x+r.w, r.y+j*ch); ctx.stroke(); }
        ctx.restore();
      }
      // draw handles if this is the active target
      if (roiTarget.value && ROIS[roiTarget.value] === r) {
        const hs = 6; const pts = [[r.x,r.y],[r.x+r.w,r.y],[r.x,r.y+r.h],[r.x+r.w,r.y+r.h]];
        ctx.fillStyle = color; for (const [px,py] of pts){ ctx.fillRect(px-hs/2, py-hs/2, hs, hs); }
      }
    };
    drawRect(ROIS['left-items'], '#0f0', roiTarget.value==='left-items', ROIS['left-items']?.rows||0, ROIS['left-items']?.cols||0);
    drawRect(ROIS['left-weapon'], '#0f0');
    drawRect(ROIS['left-oils'], '#0f0', roiTarget.value==='left-oils', ROIS['left-oils']?.rows||0, ROIS['left-oils']?.cols||0);
    drawRect(ROIS['left-edge'], '#0f0');
    drawRect(ROIS['right-items'], '#f00', roiTarget.value==='right-items', ROIS['right-items']?.rows||0, ROIS['right-items']?.cols||0);
    drawRect(ROIS['right-weapon'], '#f00');
    drawRect(ROIS['right-oils'], '#f00', roiTarget.value==='right-oils', ROIS['right-oils']?.rows||0, ROIS['right-oils']?.cols||0);
    drawRect(ROIS['right-edge'], '#f00');
    // overlay hints
    ctx.save();
    ctx.font = '12px monospace';
    for (const h of lastHints){
      ctx.strokeStyle = h.color || '#fff'; ctx.lineWidth=1; ctx.globalAlpha=0.85; ctx.strokeRect(h.x, h.y, h.w, h.h);
      const label = `${h.name||h.slug} (${h.conf||0}%)`;
      const pad=2; const tw = ctx.measureText(label).width + 2*pad; const th = 14 + 2*pad;
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(h.x, Math.max(0,h.y- (th+1)), tw, th);
      ctx.fillStyle = h.color || '#fff'; ctx.fillText(label, h.x+pad, Math.max(12, h.y-4));
    }
    ctx.restore();
  }
  async function loadImageFile(f){ return new Promise((resolve,reject)=>{ const fr=new FileReader(); fr.onload=()=>{ img=new Image(); img.onload=()=>{ try{ srcCanvas.width = img.naturalWidth || img.width; srcCanvas.height = img.naturalHeight || img.height; srcCtx.imageSmoothingEnabled = false; srcCtx.drawImage(img, 0, 0); } catch(_){ } render(); resolve(); }; img.src=fr.result; }; fr.onerror=reject; fr.readAsDataURL(f); }); }
  drop.addEventListener('dragover', e => { e.preventDefault(); drop.style.background='#112'; });
  drop.addEventListener('dragleave', e => { drop.style.background=''; });
  drop.addEventListener('drop', async e => { e.preventDefault(); drop.style.background=''; const f=e.dataTransfer.files&&e.dataTransfer.files[0]; if(f){ clearLog(); await loadImageFile(f); log('Image loaded. Drag to draw rectangles.'); } });
  document.addEventListener('paste', async e => { const it=(e.clipboardData||{}).items||[]; for(const i of it){ if(i.type && i.type.indexOf('image')===0){ const f=i.getAsFile(); clearLog(); await loadImageFile(f); log('Image pasted.'); break; } } });
  if (fileBtn && fileInput) { fileBtn.addEventListener('click', ()=>fileInput.click()); fileInput.addEventListener('change', async ()=>{ const f=fileInput.files[0]; if(f){ clearLog(); await loadImageFile(f); log('Image loaded.'); } }); }
  // Simple calibrator: drag handles at corners, or drag to create a new ROI
  canvas.addEventListener('mousedown', e => {
    const rect=canvas.getBoundingClientRect(); const x=Math.round(e.clientX-rect.left), y=Math.round(e.clientY-rect.top);
    // Preset mode: draw one rectangle for panel bounds
    if (presetSide){
      dragging = { target: '_preset_', kind: 'new', ox:x, oy:y, start: { x:x, y:y, w:1, h:1 } };
      ROIS._presetPreview = { x:x, y:y, w:1, h:1 };
      render();
      return;
    }
    if (QUICK.active){
      dragging = { target: '_quick_', kind:'new', ox:x, oy:y, start:{ x:x, y:y, w:1, h:1 } };
      ROIS._presetPreview = { x:x, y:y, w:1, h:1 };
      render();
      return;
    }
    const t=roiTarget.value; const r=ROIS[t]; const hs=8;
    if (r) {
      const corners=[{k:'nw',x:r.x,y:r.y},{k:'ne',x:r.x+r.w,y:r.y},{k:'sw',x:r.x,y:r.y+r.h},{k:'se',x:r.x+r.w,y:r.y+r.h}];
      for(const c of corners){ if (Math.abs(x-c.x)<=hs && Math.abs(y-c.y)<=hs){ dragging={target:t, kind:c.k, ox:x, oy:y, start: {...r} }; return; } }
    }
    // Not on a handle (or ROI not defined): begin creating a fresh ROI
    dragging={ target:t, kind:'new', ox:x, oy:y, start:{ x:x, y:y, w:1, h:1 } };
    ROIS[t] = { x:x, y:y, w:1, h:1, rows: parseInt(roiRows.value,10)||12, cols: parseInt(roiCols.value,10)||1 };
    render();
  });
  canvas.addEventListener('mousemove', e => {
    if (!dragging) return; const rect=canvas.getBoundingClientRect(); const x=Math.round(e.clientX-rect.left), y=Math.round(e.clientY-rect.top);
    const t=dragging.target; const r={...dragging.start};
    if (t==='_preset_'){
      r.w = x - r.x; r.h = y - r.y; r.w=Math.max(4,r.w); r.h=Math.max(4,r.h); ROIS._presetPreview = r; render(); return;
    }
    if (t==='_quick_'){
      r.w = x - r.x; r.h = y - r.y; r.w=Math.max(4,r.w); r.h=Math.max(4,r.h); ROIS._presetPreview = r; render(); return;
    }
    if (dragging.kind==='nw'){ r.w += r.x - x; r.h += r.y - y; r.x=x; r.y=y; }
    if (dragging.kind==='ne'){ r.w = x - r.x; r.h += r.y - y; r.y=y; }
    if (dragging.kind==='sw'){ r.w += r.x - x; r.x=x; r.h = y - r.y; }
    if (dragging.kind==='se' || dragging.kind==='new'){ r.w = x - r.x; r.h = y - r.y; }
    r.w=Math.max(4,r.w); r.h=Math.max(4,r.h); ROIS[t]=Object.assign(r,{ rows:ROIS[t].rows, cols:ROIS[t].cols }); render();
  });
  document.addEventListener('mouseup', ()=> {
    if (dragging && dragging.target === '_preset_' && ROIS._presetPreview) {
      const r = ROIS._presetPreview; delete ROIS._presetPreview; dragging=null; if (presetSide) { applyPanelPreset(presetSide, r); presetSide=null; const ph=document.getElementById('presetHint'); if(ph) ph.textContent=''; return; } }
    if (dragging && dragging.target === '_wiz_' && ROIS._presetPreview) {
      const r = ROIS._presetPreview; delete ROIS._presetPreview; dragging=null; if (WIZ && WIZ.active) { onWizardRect(r); return; } }
    if (dragging && dragging.target === '_quick_' && ROIS._presetPreview) {
      const r = ROIS._presetPreview; delete ROIS._presetPreview; dragging=null; if (QUICK && QUICK.active) { onQuickWeaponRect(r); return; } }
    dragging=null;
  });
  function toGray(data){ const out=new Float32Array(data.length/4); for(let i=0,j=0;i<data.length;i+=4,j++){ out[j]=(0.299*data[i]+0.587*data[i+1]+0.114*data[i+2]); } return out; }
  function hashFromCanvas(csrc){ const N=16; const c2=document.createElement('canvas'); c2.width=N; c2.height=N; const cx2=c2.getContext('2d'); cx2.imageSmoothingEnabled=true; cx2.drawImage(csrc,0,0,N,N); const d=cx2.getImageData(0,0,N,N).data; const g=toGray(d); let mean=0; for(let i=0;i<g.length;i++) mean+=g[i]; mean/=g.length; let sd=0; for(let i=0;i<g.length;i++){ const v=g[i]-mean; sd+=v*v; } sd=Math.sqrt(sd/g.length)||1; for(let i=0;i<g.length;i++) g[i]=(g[i]-mean)/sd; return g; }
  function loadCache(){ try { const meta=JSON.parse(localStorage.getItem('HEIC_FP_META')||'null'); const data=JSON.parse(localStorage.getItem('HEIC_FPCACHE_V1')||'null'); if(!meta||!data) return null; const expect=Object.keys(RAW_DATA||{}).filter(k=>/(^items\/|^weapons\/|^upgrades\/)/.test(k)).length; if (meta.len!==expect) return null; return data; } catch(_){ return null; } }
// Persist the fingerprint library to localStorage.
// Use a multi line implementation here rather than a heavily minified one to
// avoid parser confusion from comment delimiters and regular expressions.  See
// https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage for API
// details.
function saveCache(list) {
  try {
    // Count how many fingerprintable entries exist in RAW_DATA.  Only items,
    // weapons and upgrades are considered for the cache.
    const len = Object.keys(RAW_DATA || {}).filter(k => {
      return /(^items\/|^weapons\/|^upgrades\/)/.test(k);
    }).length;
    // Store a small meta record with a version and the expected length.  This
    // allows us to detect stale caches later on.
    localStorage.setItem('HEIC_FP_META', JSON.stringify({ v: 1, len }));
    // Persist the fingerprint list itself under a separate key.
    localStorage.setItem('HEIC_FPCACHE_V1', JSON.stringify(list));
  } catch (e) {
    // Intentionally ignore any storage errors (quota exceeded, disabled, etc).
    // Swallowing exceptions here prevents the cache failure from breaking the UI.
  }
}
  async function buildIconLib(){
    if(iconLib) return iconLib;
    const cached=loadCache();
    if (cached) { iconLib=cached; log(`Icon library loaded from cache (${iconLib.length}).`); return iconLib; }
    const list=[];
    for(const [k,v] of Object.entries(RAW_DATA||{})){
      if(!/(^items\/|^weapons\/|^upgrades\/)/.test(k)) continue;
      // Try key path first, then bucket/slug
      const candidates = [];
      candidates.push(`${k}/icon.png`);
      if (v && v.bucket && v.slug) candidates.push(`${v.bucket}/${v.slug}/icon.png`);
      let okPath=null;
      for (const p of candidates){
        const im=new Image();
        await new Promise(res=>{ im.onload=res; im.onerror=res; im.src=p; });
        if (im.width){ okPath=p; break; }
      }
      if (!okPath) continue;
      const tmp=document.createElement('canvas'); tmp.width=32; tmp.height=32; const tx=tmp.getContext('2d'); tx.imageSmoothingEnabled=false; tx.drawImage(im,0,0,tmp.width,tmp.height); const fp=hashFromCanvas(tmp);
      list.push({ slug:k, fp, path: okPath });
    }
    iconLib=list; saveCache(list); log(`Icon library ready (${list.length}).`); return iconLib;
  }
  async function buildOilsLib(){ if (oilsLib) return oilsLib; const entries=[{slug:'oil-attack',path:'assets/attack.png',kind:'attack'},{slug:'oil-armor',path:'assets/armor.png',kind:'armor'},{slug:'oil-speed',path:'assets/speed.png',kind:'speed'}]; const out=[]; for(const e of entries){ const im=new Image(); await new Promise(res=>{ im.onload=res; im.onerror=res; im.src=e.path; }); const tmp=document.createElement('canvas'); tmp.width=im.width||22; tmp.height=im.height||22; const tx=tmp.getContext('2d'); tx.imageSmoothingEnabled=false; tx.drawImage(im,0,0,tmp.width,tmp.height); const fp=hashFromCanvas(tmp); out.push({ slug:e.slug, fp, path:e.path, kind:e.kind }); } oilsLib=out; return out; }
  function viewToSrcRect(x,y,w,h){ if (!srcCanvas.width || !canvas.width) return {sx:0,sy:0,sw:1,sh:1}; const sx = Math.max(0, Math.round(x * srcCanvas.width / canvas.width)); const sy = Math.max(0, Math.round(y * srcCanvas.height / canvas.height)); const sw = Math.max(1, Math.round(w * srcCanvas.width / canvas.width)); const sh = Math.max(1, Math.round(h * srcCanvas.height / canvas.height)); return {sx,sy,sw,sh}; }
  function cropHash(x,y,w,h){ const r=viewToSrcRect(x,y,w,h); const tmp=document.createElement('canvas'); tmp.width=Math.max(1,r.sw); tmp.height=Math.max(1,r.sh); const tx=tmp.getContext('2d'); tx.imageSmoothingEnabled=true; tx.drawImage(srcCanvas,r.sx,r.sy,r.sw,r.sh,0,0,tmp.width,tmp.height); return hashFromCanvas(tmp); }
  function dist(a,b){ let s=0; for(let i=0;i<64;i++){ const d=a[i]-b[i]; s+=d*d; } return s; }
  function toConf(d){ const alpha=0.08; return Math.max(1, Math.min(99, Math.round(100*Math.exp(-alpha*d)))) }
  async function scanAndApply(){ await buildIconLib(); await buildOilsLib(); lastHints.length=0; warnings.length=0; const picks={ left:{items:[],weapon:null,oils:new Set(),edge:null}, right:{items:[],weapon:null,oils:new Set(),edge:null} }; const addHint=(x,y,w,h,slug,conf,color)=>{ const rec={x,y,w,h,slug,conf,color,name:(RAW_DATA[slug]?.name)||slug}; lastHints.push(rec); const min = parseInt(confMinInput?.value||'60',10)||60; if (conf < min) { warnings.push(`${slug} @ ${Math.round(conf)}% (ROI ${x},${y},${w}x${h})`); } };
    const processGrid=(roi,sideKey,isItems=true)=>{ if(!roi) return; const {x,y,w,h,rows,cols}=roi; const cw=Math.floor(w/cols), ch=Math.floor(h/rows); const padPctEl = document.getElementById('padPct'); const pct = Math.max(0, Math.min(40, parseInt(padPctEl?.value||'18',10)||18))/100; const shrink = (cx,cy,cw,ch) => { const pad=Math.floor(Math.min(cw,ch)*pct); return [cx+pad, cy+pad, Math.max(2,cw-2*pad), Math.max(2,ch-2*pad)]; }; for(let r=0;r<rows;r++){ for(let c=0;c<cols;c++){ const cx=x+c*cw, cy=y+r*ch; const [sx,sy,sw,sh]=shrink(cx,cy,cw,ch); const fp=cropHash(sx,sy,sw,sh); let best=null, bd=1e9; const lib=isItems?iconLib:oilsLib; for(const it of lib){ const d=dist(fp,it.fp); if(d<bd){ bd=d; best=it; } } const conf = toConf(bd); if(best){ if (isItems) { if (conf >= (parseInt(confMinInput?.value||'60',10)||60)) (sideKey==='P'?picks.left.items:picks.right.items).push(best.slug); addHint(sx,sy,sw,sh,best.slug,conf, sideKey==='P'?'#0f0':'#f00'); } else { const kind=best.kind; (sideKey==='P'?picks.left.oils:picks.right.oils).add(kind); addHint(sx,sy,sw,sh,kind, conf, sideKey==='P'?'#0f0':'#f00'); } } } } };
    const processRect=(roi,sideKey,onlyWeapons=false,onlyUpgrades=false)=>{ if(!roi) return; const padPctEl=document.getElementById('padPct'); const pct = Math.max(0, Math.min(40, parseInt(padPctEl?.value||'18',10)||18))/100; const pad=Math.floor(Math.min(roi.w,roi.h)*pct); const sx=roi.x+pad, sy=roi.y+pad, sw=Math.max(2,roi.w-2*pad), sh=Math.max(2,roi.h-2*pad); const fp=cropHash(sx,sy,sw,sh); let best=null, bd=1e9; for(const it of iconLib){ if (onlyWeapons && !/^weapons\//.test(it.slug)) continue; if (onlyUpgrades && !/^upgrades\//.test(it.slug)) continue; const d=dist(fp,it.fp); if(d<bd){ bd=d; best=it; } } const conf=toConf(bd); if(best){ if(onlyWeapons){ if(conf >= (parseInt(confMinInput?.value||'60',10)||60)) { if(sideKey==='P') picks.left.weapon=best.slug; else picks.right.weapon=best.slug; } } if(onlyUpgrades){ if(conf >= (parseInt(confMinInput?.value||'60',10)||60)) { if(sideKey==='P') picks.left.edge=best.slug; else picks.right.edge=best.slug; } } addHint(sx,sy,sw,sh,best.slug,conf, sideKey==='P'?'#0f0':'#f00'); } };

    // Optional OCR for edge slugs
    async function ensureTesseract(){ if (window.Tesseract) return; await new Promise((res)=>{ const s=document.createElement('script'); s.src='https://cdn.jsdelivr.net/npm/tesseract.js@v5.0.2/dist/tesseract.min.js'; s.onload=res; s.onerror=res; document.body.appendChild(s); }); }
    function lev(a,b){ a=a.toLowerCase(); b=b.toLowerCase(); const m=a.length,n=b.length; const dp=Array.from({length:m+1},()=>Array(n+1).fill(0)); for(let i=0;i<=m;i++) dp[i][0]=i; for(let j=0;j<=n;j++) dp[0][j]=j; for(let i=1;i<=m;i++){ for(let j=1;j<=n;j++){ dp[i][j]=Math.min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+(a[i-1]===b[j-1]?0:1)); } } return dp[m][n]; }
    function bestByText(text){ if(!text) return null; const names=[]; for(const [k,v] of Object.entries(RAW_DATA||{})){ if(/^upgrades\//.test(k)) names.push({slug:k, name: (v.name||k)}); } const t=text.trim().toLowerCase(); let best=null, bs=-1; for(const e of names){ const s=1 - (lev(t, e.name.toLowerCase()) / Math.max(t.length, e.name.length)); if (s>bs){ bs=s; best=e; } } return best ? { slug:best.slug, sim:best ? Math.round(best && (1 - (lev(t, best.name.toLowerCase()) / Math.max(t.length,best.name.length))) * 100) : 0 } : null; }
    async function tryOcrEdge(roi, sideKey){ if (!roi || !chkOcrEdge?.checked) return null; try { await ensureTesseract(); if (!window.Tesseract) return null; const tmp=document.createElement('canvas'); tmp.width=Math.max(1,roi.w); tmp.height=Math.max(1,roi.h); const tx=tmp.getContext('2d'); tx.drawImage(canvas, roi.x, roi.y, roi.w, roi.h, 0,0,tmp.width,tmp.height); const dataUrl=tmp.toDataURL(); const res= await window.Tesseract.recognize(dataUrl,'eng'); const text=(res && res.data && res.data.text || '').replace(/\s+/g,' ').trim(); if (!text) return null; const best=bestByText(text); if (best && best.slug){ addHint(roi.x,roi.y,roi.w,roi.h,best.slug,best.sim, sideKey==='P'?'#0f0':'#f00'); return best.slug; } } catch(_){} return null; }
    // items & weapons
    processGrid(ROIS['left-items'],'P',true); processRect(ROIS['left-weapon'],'P',true,false);
    processGrid(ROIS['right-items'],'O',true); processRect(ROIS['right-weapon'],'O',true,false);
    // oils
    processGrid(ROIS['left-oils'],'P',false); processGrid(ROIS['right-oils'],'O',false);
    // edges (if icons exist)
    processRect(ROIS['left-edge'],'P',false,true); processRect(ROIS['right-edge'],'O',false,true);
    // OCR fallback for edges
    const lOcr = await tryOcrEdge(ROIS['left-edge'],'P'); if (lOcr) picks.left.edge = lOcr;
    const rOcr = await tryOcrEdge(ROIS['right-edge'],'O'); if (rOcr) picks.right.edge = rOcr;
    render();
  function applySide(key,pred){ const side=key==='P'?sides.P:sides.O; const wSlot=key==='P'?document.getElementById('weaponP'):document.getElementById('weaponO'); if(pred.weapon && RAW_DATA[pred.weapon]){ side.weapon=RAW_DATA[pred.weapon]; if(wSlot) wSlot.innerHTML=mini(side.weapon); }
  const gridEl=key==='P'?document.getElementById('gridP'):document.getElementById('gridO'); const cells=gridEl?gridEl.querySelectorAll('.slot'):[]; const list=(pred.items||[]).filter(s=>/^items\//.test(s)).slice(0,SLOT_COUNT); for(let i=0;i<SLOT_COUNT;i++){ const slug=list[i]; const cell=cells[i]; if(slug && RAW_DATA[slug]){ const it=RAW_DATA[slug]; side.items[i]=it; if(cell){ cell.classList.add('filled'); cell.innerHTML=mini(it); } } else { side.items[i]=null; if(cell){ cell.classList.remove('filled'); cell.innerHTML=''; } } } updateTotals(key); }
    function applyOils(key,set){ const box = key==='P'?document.getElementById('oilsP'):document.getElementById('oilsO'); const kinds=['attack','armor','speed']; if (box){ kinds.forEach(k=>{ const el = box.querySelector(`.oil[data-kind="${k}"]`); if (el){ if (set.has(k)) el.classList.add('active'); else el.classList.remove('active'); } }); } const side = key==='P'?sides.P:sides.O; side.oils = new Set(set); updateTotals(key); }
  function applyEdge(key, slug){ if (!slug || !RAW_DATA[slug]) return; const side = key==='P'?sides.P:sides.O; side.edge = RAW_DATA[slug]; const sel = key==='P'?document.getElementById('edgeP'):document.getElementById('edgeO'); const eff = key==='P'?document.getElementById('edgePEffect'):document.getElementById('edgeOEffect'); const ic = key==='P'?document.getElementById('edgePIcon'):document.getElementById('edgeOIcon'); if (sel){ sel.value = side.edge.slug; } if (eff){ eff.textContent = side.edge.effect || ''; } if (ic){ const cands=resolveIconCandidates(side.edge); let i=0; ic.src=cands[i]||'placeholder.png'; ic.onerror=()=>{ i+=1; if(i<cands.length){ ic.src=cands[i]; } else { ic.onerror=null; ic.src='placeholder.png'; } }; } updateTotals(key); }
    // Fill warnings list
    if (warnEl){ warnEl.textContent = warnings.length ? ('Low-confidence matches:\n- ' + warnings.join('\n- ')) : 'No low-confidence matches.'; }
    // Preview-only toggle
    const preview = !!(chkPreview && chkPreview.checked);
    if (!preview){
      applySide('P',{weapon:picks.left.weapon,items:picks.left.items}); applySide('O',{weapon:picks.right.weapon,items:picks.right.items});
      applyOils('P', picks.left.oils||new Set()); applyOils('O', picks.right.oils||new Set());
      if (picks.left.edge) applyEdge('P', picks.left.edge);
      if (picks.right.edge) applyEdge('O', picks.right.edge);
      log('Applied best matches.');
    } else {
      log('Preview only: not applied.');
    }
  }
  if(btnScan) btnScan.addEventListener('click', scanAndApply); if(btnApplyBoth) btnApplyBoth.addEventListener('click', scanAndApply);
  // Preset buttons
  const presetHint = document.getElementById('presetHint');
  const btnPresetLeft = document.getElementById('btnPresetLeft');
  const btnPresetRight = document.getElementById('btnPresetRight');
  const btnQuickLeft = document.getElementById('btnQuickLeft');
  const btnQuickRight = document.getElementById('btnQuickRight');
  const quickHint = document.getElementById('quickHint');
  const QUICK = { active:false, side:null };
  function applyPanelPreset(sideKey, panel){
    // Normalize rect (ensure positive w/h)
    let x=panel.x, y=panel.y, w=panel.w, h=panel.h; if (w<0){ x+=w; w=-w; } if (h<0){ y+=h; h=-h; }
    const mX = Math.round(w * 0.10), mTop = Math.round(h * 0.06), mBot = Math.round(h * 0.06);
    const tile = Math.round(h * 0.06 * 1.6); // approx tile based on height
    // Weapon
    const wX = x + Math.round((w - tile)/2);
    const wY = y + mTop;
    const weapon = { x: wX, y: wY, w: tile, h: tile };
    // Items grid (12x1), square tiles snapped
    const itemsH = tile * 12;
    const itemsY = Math.min(y + h - mBot - itemsH, wY + tile + Math.round(h*0.08));
    const itemsX = x + Math.round((w - tile)/2);
    const items = { x: itemsX, y: itemsY, w: tile, h: itemsH, rows:12, cols:1 };
    // Oils row below weapon
    const oilsH = Math.round(tile * 3);
    const oilsY = Math.min(itemsY - Math.round(h*0.02) - oilsH, y + wY + tile + Math.round(h*0.02));
    const oils = { x: itemsX, y: oilsY, w: tile, h: oilsH, rows:3, cols:1 };
    // Edge box to the right of oils (optional)
    const edge = { x: itemsX + tile + Math.round(w*0.04), y: oilsY, w: tile, h: tile };
    const L = (k,obj)=>{ ROIS[(sideKey==='P'?'left':'right')+'-'+k] = obj; };
    L('weapon', weapon); L('items', items); L('oils', oils); L('edge', edge);
    render();
    // Switch target to items for quick tweaks
    roiTarget.value = (sideKey==='P') ? 'left-items' : 'right-items';
    // run preview
    scanAndApply();
  }
  if (btnPresetLeft) btnPresetLeft.addEventListener('click', ()=>{ presetSide='P'; if(presetHint) presetHint.textContent='Draw a rectangle around the LEFT panel'; });
  if (btnPresetRight) btnPresetRight.addEventListener('click', ()=>{ presetSide='O'; if(presetHint) presetHint.textContent='Draw a rectangle around the RIGHT panel'; });
  if (btnQuickLeft) btnQuickLeft.addEventListener('click', ()=>{ QUICK.active=true; QUICK.side='P'; if (quickHint) quickHint.textContent='LEFT: Draw the WEAPON tile only'; });
  if (btnQuickRight) btnQuickRight.addEventListener('click', ()=>{ QUICK.active=true; QUICK.side='O'; if (quickHint) quickHint.textContent='RIGHT: Draw the WEAPON tile only'; });
  const wizardHint = document.getElementById('wizardHint');
  const btnWizardLeft = document.getElementById('btnWizardLeft');
  const btnWizardRight = document.getElementById('btnWizardRight');
  const btnWizardNext = document.getElementById('btnWizardNext');
  const btnWizardCancel = document.getElementById('btnWizardCancel');
  const WIZ = { active:false, side:null, step:0, rects:{} };
  function wizSetHint(){
    const s = WIZ.side==='P'?'LEFT':'RIGHT';
    const map = { 1:`${s}: Draw panel bounds`, 2:`${s}: Draw WEAPON tile`, 3:`${s}: Draw ITEM tile row #1`, 4:`${s}: Draw ITEM tile row #2 (one below)`, 5:`${s}: Draw OILS tile (optional) or press Next`, 6:`${s}: Draw EDGE box (optional) or press Next` };
    if (wizardHint) wizardHint.textContent = map[WIZ.step] || '';
  }
  function startWizard(side){ WIZ.active=true; WIZ.side=side; WIZ.step=1; WIZ.rects={}; wizSetHint(); }
  if (btnWizardLeft) btnWizardLeft.addEventListener('click', ()=> startWizard('P'));
  if (btnWizardRight) btnWizardRight.addEventListener('click', ()=> startWizard('O'));
  if (btnWizardCancel) btnWizardCancel.addEventListener('click', ()=> { WIZ.active=false; WIZ.side=null; WIZ.step=0; WIZ.rects={}; if(wizardHint) wizardHint.textContent=''; });
  if (btnWizardNext) btnWizardNext.addEventListener('click', ()=> { if (!WIZ.active) return; onWizardRect(null); });
  function onWizardRect(rect){ if (!WIZ.active) return; const sKey=(WIZ.side==='P')?'left':'right'; const norm=(r)=>{ if(!r) return null; let {x,y,w,h}=r; if(w<0){x+=w;w=-w;} if(h<0){y+=h;h=-h;} return {x,y,w,h}; };
    if (WIZ.step===1){ WIZ.rects.panel=norm(rect); WIZ.step=2; wizSetHint(); return; }
    if (WIZ.step===2){ WIZ.rects.weapon=norm(rect); WIZ.step=3; wizSetHint(); return; }
    if (WIZ.step===3){ WIZ.rects.item1=norm(rect); WIZ.step=4; wizSetHint(); return; }
    if (WIZ.step===4){ WIZ.rects.item2=norm(rect); WIZ.step=5; wizSetHint(); return; }
    if (WIZ.step===5){ WIZ.rects.oils=norm(rect); WIZ.step=6; wizSetHint(); return; }
    if (WIZ.step===6){ WIZ.rects.edge=norm(rect); WIZ.step=7; }
    const it1=WIZ.rects.item1, it2=WIZ.rects.item2; const weapon=WIZ.rects.weapon; if (it1 && it2){ const step=Math.max(8, Math.round(it2.y - it1.y)); const tileW=it1.w; ROIS[`${sKey}-items`] = { x:it1.x, y:it1.y, w:tileW, h:step*12, rows:12, cols:1 }; }
    if (weapon) ROIS[`${sKey}-weapon`]=weapon; if (WIZ.rects.oils) ROIS[`${sKey}-oils`]=Object.assign({},WIZ.rects.oils,{rows:3,cols:1}); if (WIZ.rects.edge) ROIS[`${sKey}-edge`]=WIZ.rects.edge; WIZ.active=false; WIZ.step=0; wizSetHint(); render(); scanAndApply(); }

  // Quick mode: build a 12 1 grid from a single weapon-tile rectangle
  function onQuickWeaponRect(rect){
    if (!QUICK.active || !rect) { QUICK.active=false; if (quickHint) quickHint.textContent=''; return; }
    let {x,y,w,h}=rect; if (w<0){x+=w;w=-w;} if (h<0){y+=h;h=-h;}
    const s = Math.min(w,h); // enforce square
    const sideKey = (QUICK.side==='P') ? 'left' : 'right';
    ROIS[`${sideKey}-weapon`] = { x:x, y:y, w:s, h:s };
    // scan for first item frame directly below weapon using edge brightness on full-res image
    const scoreAt = (ty)=>{ let sum=0, cnt=0; try{ const r=viewToSrcRect(x, ty, s, s); const sw=r.sw, sh=r.sh; const img=srcCtx.getImageData(r.sx, r.sy, sw, sh).data; const idx=(px,py)=>{ const i=(py*sw+px)*4; return img[i]+img[i+1]+img[i+2]; }; for(let px=2; px<sw-2; px+=Math.max(2, Math.floor(sw/24))){ sum+=idx(px,2)+idx(px,3)+idx(px,sh-3)+idx(px,sh-2); cnt+=4; } for(let py=2; py<sh-2; py+=Math.max(2, Math.floor(sh/24))){ sum+=idx(2,py)+idx(3,py)+idx(sw-3,py)+idx(sw-2,py); cnt+=4; } }catch(_){ } return cnt?sum/cnt:0; };
    const start = y + s + Math.floor(s*0.05), end = start + Math.floor(s*2.2); let bestY=start, best= -1; for(let ty=start; ty<=end; ty+=2){ const sc=scoreAt(ty); if(sc>best){ best=sc; bestY=ty; } }
    const gap = Math.max(4, bestY - (y+s)); const step = s + gap;
    // derive rows (max 12) until canvas bottom
    let rows=0; while (rows<12 && (bestY + rows*step + s) <= canvas.height) rows++;
    if (rows < 1) rows = 10; // fallback
    ROIS[`${sideKey}-items`] = { x:x, y:bestY, w:s, h:step*rows, rows:rows, cols:1 };
    QUICK.active=false; if (quickHint) quickHint.textContent=''; render(); scanAndApply();
  }

  // Presets for rows/cols by target type
  roiTarget.addEventListener('change', () => {
    const t = roiTarget.value;
    if (/items/.test(t)) { roiRows.value = '12'; roiCols.value = '1'; }
    else if (/oils/.test(t)) { roiRows.value = '3'; roiCols.value = '1'; }
    else { roiRows.value = '1'; roiCols.value = '1'; }
    render();
  });
})();
*/


// Tab switching logic
const compendiumTab = document.getElementById('compendiumTab');
const simulationTab = document.getElementById('simulationTab');
const analysisTab = document.getElementById('analysisTab');
// importTab removed; set to null
const importTab = null;
const tabCompendium = document.getElementById('tabCompendium');
const tabAnalysis = document.getElementById('tabAnalysis');
const tabSimulation = document.getElementById('tabSimulation');

// Tab switching functionality
function showTab(tabName) {
  // Hide all tabs
  compendiumTab.style.display = 'none';
  analysisTab.style.display = 'none';
  simulationTab.style.display = 'none';
  
  // Reset all tab button styles
  tabCompendium.style.background = '#111';
  if (tabAnalysis) tabAnalysis.style.background = '#111';
  tabSimulation.style.background = '#111';
  
  // Show selected tab and highlight button
  if (tabName === 'compendium') {
    compendiumTab.style.display = 'flex';
    tabCompendium.style.background = '#300';
  } else if (tabName === 'analysis') {
    analysisTab.style.display = 'flex';
    tabAnalysis.style.background = '#320';
    renderAnalysis(); // Update analysis content
  } else if (tabName === 'simulation') {
    simulationTab.style.display = 'flex';  
    tabSimulation.style.background = '#030';
    updateSimulationPreview(); // Update simulation preview
  }
}

if (tabCompendium && tabAnalysis && tabSimulation) {
  tabCompendium.addEventListener('click', () => showTab('compendium'));
  tabAnalysis.addEventListener('click', () => showTab('analysis'));
  tabSimulation.addEventListener('click', () => showTab('simulation'));
  
  // Show compendium tab by default
  showTab('compendium');
}
if (showSimBtn && simulationTab && compendiumTab) {
  showSimBtn.addEventListener('click', () => showTab('simulation'));
}

// Render analysis content
function renderAnalysis() {
  renderPlayerAnalysis('P', 1);
  renderPlayerAnalysis('O', 2);
}

function renderPlayerAnalysis(sideKey, playerNum) {
  const side = sides[sideKey];
  const weaponEl = document.getElementById(`analysisP${playerNum}Weapon`);
  const edgeEl = document.getElementById(`analysisP${playerNum}Edge`);
  const itemsEl = document.getElementById(`analysisP${playerNum}Items`);
  
  // Render weapon
  if (side.weapon) {
    weaponEl.innerHTML = renderAnalysisItem(side.weapon, 'weapon');
  } else {
    weaponEl.innerHTML = '<div class="emptySlot">No weapon equipped</div>';
  }
  
  // Render edge
  if (side.edge) {
    const edgeData = RAW_DATA[side.edge];
    if (edgeData) {
      edgeEl.innerHTML = renderAnalysisItem(edgeData, 'edge');
    } else {
      edgeEl.innerHTML = '<div class="emptySlot">No edge selected</div>';
    }
  } else {
    edgeEl.innerHTML = '<div class="emptySlot">No edge selected</div>';
  }
  
  // Render items
  const equippedItems = side.items.filter(item => item !== null);
  if (equippedItems.length > 0) {
    itemsEl.innerHTML = equippedItems.map(item => renderAnalysisItem(item, 'item')).join('');
  } else {
    itemsEl.innerHTML = '<div class="emptySlot">No items equipped</div>';
  }
}

function renderAnalysisItem(item, type) {
  if (!item) return '';
  
  const iconPath = (item && item.key) ? `${item.key}/icon.png` : `${item.bucket}/${item.slug}/icon.png`;
  const stats = item.stats || {};
  const tags = item.tags || [];
  
  // Build stats display
  const statsHtml = ['attack', 'health', 'armor', 'speed']
    .map(stat => {
      const value = stats[stat] || 0;
      if (value === 0) return '';
      const icon = `assets/${stat === 'health' ? 'health' : stat}.png`;
      return `<div class="pill"><img src="${icon}" alt="${stat}"><span>${value}</span></div>`;
    })
    .filter(s => s)
    .join('');
    
  // Build tags display  
  const tagsHtml = tags.map(tag => `<span class="analysisTag">${tag}</span>`).join('');
  
  return `
    <div class="analysisItem ${type}">
      <div class="analysisItemHeader">
        <img src="${iconPath}" alt="${item.name}">
        <div class="analysisItemName">${item.name}</div>
      </div>
      <div class="analysisItemEffect">${item.effect || 'No effect description'}</div>
      <div class="analysisItemStats">${statsHtml}</div>
      ${tagsHtml ? `<div class="analysisItemTags">${tagsHtml}</div>` : ''}
    </div>
  `;
}

// Initial render happens after details.json loads via loadData()

// Disable conflicting loaders 
window.loadData = () => console.info('loadData disabled');
window.safeLoadData = () => console.info('safeLoadData disabled');

// Start the application when DOM is ready (single, minimal boot)
function __compendiumBoot() {
  // 1) Validate that details.js actually populated the global
  if (!window.HEIC_DETAILS || typeof window.HEIC_DETAILS !== 'object') {
    console.error('HEIC_DETAILS missing. Ensure details.js assigns: window.HEIC_DETAILS = {...} and is NOT type="module".');
    return;
  }

  console.log('  HEIC_DETAILS found:', Object.keys(window.HEIC_DETAILS).length, 'items');

  // 2) Normalize RAW_DATA and build DATA_ARR
  RAW_DATA = window.HEIC_DETAILS;
  DATA_ARR = Object.entries(RAW_DATA).map(([id, item]) => {
    const tagsBase = Array.isArray(item.tags) ? item.tags.slice() : [];
    if (tagsBase.includes('Mythic') && !tagsBase.includes('Illegal')) {
      tagsBase.push('Illegal');
    }
    return {
      id,
      key: id,
      slug: item.slug || id.split('/').pop(),
      bucket: item.bucket || id.split('/')[0],   // items / weapons / sets / upgrades
      tags: tagsBase,
      stats: item.stats || { armor:0, attack:0, health:0, speed:0 },
      effect: item.effect || '',
      effects: Array.isArray(item.effects) ? item.effects : [],
      name: item.name || id
    };
  });

  console.log('  DATA_ARR built:', DATA_ARR.length, 'items');

  // 3) Expose globals your UI expects
  window.RAW_DATA  = RAW_DATA;
  window.DATA_ARR  = DATA_ARR;
  // 4) Ensure core UI scaffolding is present (slots, edges, totals)
  try { if (typeof populateEdges === "function") populateEdges(); } catch(_) {}
  try { if (typeof initSlots === "function") initSlots(); } catch(_) {}
  try { if (typeof updateTotals === "function") { updateTotals("P"); updateTotals("O"); } } catch(_) {}

  // 5) Call your app\'s entry point

  // 4) Call your app's entry point
  if (typeof window.initializeCompendiumData === 'function') {
    console.log('  Calling initializeCompendiumData...');
    window.initializeCompendiumData(DATA_ARR);
  } else {
    // If your app defines it earlier via defer, order should be fine. If not,
    // keep the data around and log a helpful message.
    console.warn('initializeCompendiumData not found at boot time. Data is ready at window.DATA_ARR.');
  }

  // 5) Tiny sanity check in console
  console.log('Compendium items:', DATA_ARR.length, DATA_ARR.slice(0,3));
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __compendiumBoot);
} else {
  // DOM already parsed; run boot immediately
  setTimeout(__compendiumBoot, 0);
}

// Ensure boot function is available globally
try { window.__compendiumBoot = __compendiumBoot; } catch(_) {}








