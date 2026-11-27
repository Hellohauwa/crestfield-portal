/* Crestfield College portal — shared settings and helpers.
   Load order on every page:
   1. https://cdn.tailwindcss.com
   2. https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
   3. config.js
*/

// ---- Supabase (publishable key only — safe to use in the browser) ----
const SUPABASE_URL = 'https://jkcfkpdklmekxfhrgpeo.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_IkpTMqtJOq1ZWRNJXm22gA_QtmEMsI4';

const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

// ---- School settings (update these each term) ----
const SCHOOL = {
  name: 'Crestfield College',
  currentTerm: 1,                 // 1, 2 or 3
  currentSession: '2026/2027',
  termStartDate: '2026-09-07',    // attendance "this term" counts from this date
  address: '[SCHOOL ADDRESS]',
  phone: '[SCHOOL PHONE]',
  email: '[SCHOOL EMAIL]'
};

const TERM_NAMES = { 1: '1st Term', 2: '2nd Term', 3: '3rd Term' };
const CLASS_OPTIONS = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Daily bell times. Breaks sit between periods 3–4 and 6–7.
const PERIOD_TIMES = {
  1: ['8:00', '8:40'], 2: ['8:40', '9:20'], 3: ['9:20', '10:00'],
  4: ['10:20', '11:00'], 5: ['11:00', '11:40'], 6: ['11:40', '12:20'],
  7: ['1:00', '1:40'], 8: ['1:40', '2:20']
};
const BREAKS = [
  { before: 1, label: 'ASSEMBLY', time: '7:45 – 8:00' },
  { before: 4, label: 'SHORT BREAK', time: '10:00 – 10:20' },
  { before: 7, label: 'LUNCH BREAK', time: '12:20 – 1:00' }
];

// ---- Tailwind theme (matches the approved design) ----
if (window.tailwind) {
  window.tailwind.config = {
    theme: {
      extend: {
        colors: {
          navy: { DEFAULT: '#1E3A8A', dark: '#172E6E', soft: '#E0E7FF', tint: '#EEF2FF' },
          gold: { DEFAULT: '#D4A017', soft: '#FDF6E3', ink: '#7A5A00', light: '#FDE68A' },
          page: '#F8FAFC',
          ink: '#0F172A'
        },
        fontFamily: {
          display: ['"Plus Jakarta Sans"', 'sans-serif'],
          sans: ['Inter', 'sans-serif']
        },
        boxShadow: {
          card: '0 1px 3px rgba(15,23,42,0.06)',
          lift: '0 12px 32px rgba(15,23,42,0.08)',
          navy: '0 10px 24px rgba(30,58,138,0.2)'
        }
      }
    }
  };
}

// ---- Helpers ----
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatNaira(amount) {
  const n = Number(amount) || 0;
  return (n < 0 ? '−₦' : '₦') + Math.abs(n).toLocaleString('en-NG');
}

function formatDate(value, opts) {
  const d = typeof value === 'string' && value.length === 10 ? new Date(value + 'T00:00:00') : new Date(value);
  return d.toLocaleDateString('en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric' });
}

function toISODate(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// Nigerian secondary school grade scale
function gradeFor(total) {
  const t = Number(total);
  if (t >= 70) return { grade: 'A', remark: 'Excellent', pill: 'bg-green-100 text-green-700' };
  if (t >= 60) return { grade: 'B', remark: 'Very good', pill: 'bg-blue-100 text-navy' };
  if (t >= 50) return { grade: 'C', remark: 'Good', pill: 'bg-amber-100 text-amber-800' };
  if (t >= 45) return { grade: 'D', remark: 'Fair', pill: 'bg-orange-100 text-orange-800' };
  if (t >= 40) return { grade: 'E', remark: 'Pass', pill: 'bg-orange-100 text-orange-800' };
  return { grade: 'F', remark: 'Fail', pill: 'bg-red-100 text-red-700' };
}

function initials(name) {
  return String(name || '?').trim().split(/\s+/).filter(Boolean)
    .map((p) => p[0]).slice(0, 2).join('').toUpperCase() || '?';
}

function shortName(name) {
  const parts = String(name || '').trim().split(/\s+/);
  return parts.length > 2 ? parts[0] + ' ' + parts[parts.length - 1] : parts.join(' ');
}

// Crest used on every page
function crestSvg(size) {
  const w = size || 40, h = Math.round(w * 1.15);
  return '<svg width="' + w + '" height="' + h + '" viewBox="0 0 40 46" role="img" aria-label="Crestfield College crest">' +
    '<path d="M20 2L37 8v14c0 11-7.5 18.5-17 22C10.5 40.5 3 33 3 22V8z" fill="#1E3A8A" stroke="#D4A017" stroke-width="2.5"/>' +
    '<path d="M11 25c3-1.6 6-1.6 9 0 3-1.6 6-1.6 9 0v8c-3-1.6-6-1.6-9 0-3-1.6-6-1.6-9 0z" fill="none" stroke="#D4A017" stroke-width="1.8" stroke-linejoin="round"/>' +
    '<path d="M20 25v8" stroke="#D4A017" stroke-width="1.8"/>' +
    '<path d="M20 10l1.8 3.7 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6z" fill="#D4A017"/></svg>';
}

function mountCrests() {
  document.querySelectorAll('[data-crest]').forEach((el) => {
    el.innerHTML = crestSvg(Number(el.dataset.crest) || 40);
  });
}

// Friendly text for Supabase Auth errors
function friendlyAuthError(error) {
  const msg = (error && error.message) || '';
  if (/invalid login credentials/i.test(msg)) return 'Email or password is not correct.';
  if (/email not confirmed/i.test(msg)) return 'Please confirm your email first. Check your inbox for the link we sent.';
  if (/already registered|already been registered/i.test(msg)) return 'An account with this email already exists. Please log in.';
  if (/database error saving new user/i.test(msg)) return 'This admission number already has an account.';
  if (/password should be at least/i.test(msg)) return 'Password must be at least 8 characters.';
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts. Please wait a minute and try again.';
  return msg || 'Something went wrong. Please try again.';
}

// ---- Roles ----
const ROLE_HOME = { student: 'portal.html', teacher: 'teacher.html', admin: 'admin.html' };
function dashboardFor(role) { return ROLE_HOME[role] || 'portal.html'; }

// The logged-in user's role from user_roles: 'student' | 'teacher' | 'admin' | null (not logged in)
async function getRole() {
  const { data: s } = await sb.auth.getSession();
  if (!s.session) return null;
  const { data, error } = await sb.from('user_roles').select('role').eq('user_id', s.session.user.id).maybeSingle();
  if (error) { console.error('getRole:', error.message); return 'student'; }
  return (data && data.role) || 'student';
}

// Use at the top of each dashboard. Not logged in → login.html.
// Logged in with a different role → that role's own dashboard.
// Returns the user when the role matches, otherwise null.
async function requireRole(role) {
  const { data } = await sb.auth.getSession();
  if (!data.session) { window.location.replace('login.html'); return null; }
  const actual = await getRole();
  if (actual !== role) { window.location.replace(dashboardFor(actual)); return null; }
  return data.session.user;
}

// Send logged-in users to their dashboard (used on login/sign-up pages)
async function redirectIfLoggedIn() {
  const role = await getRole();
  if (role) window.location.replace(dashboardFor(role));
}

// Send anyone not logged in to the login page
async function requireUser() {
  const { data } = await sb.auth.getSession();
  if (!data.session) {
    window.location.replace('login.html');
    return null;
  }
  return data.session.user;
}

async function signOut() {
  await sb.auth.signOut();
  window.location.replace('login.html');
}

function pageUrl(file) {
  return new URL(file, window.location.href).href;
}

// ---- Save messages ----
// toast('Saved', true) or toast('Could not save: ' + error.message, false)
function toast(message, ok) {
  let box = document.getElementById('toast-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toast-box';
    box.setAttribute('aria-live', 'polite');
    box.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:96px;z-index:60;display:flex;flex-direction:column;gap:8px;width:min(92vw,460px)';
    document.body.appendChild(box);
  }
  const el = document.createElement('div');
  el.setAttribute('role', ok ? 'status' : 'alert');
  el.style.cssText = 'padding:12px 16px;border-radius:12px;font:600 14px/1.45 Inter,sans-serif;box-shadow:0 12px 32px rgba(15,23,42,0.18);' +
    (ok ? 'background:#F0FDF4;color:#166534;border:1px solid #BBF7D0' : 'background:#FEF2F2;color:#991B1B;border:1px solid #FECACA');
  el.textContent = message;
  box.appendChild(el);
  setTimeout(() => el.remove(), ok ? 4000 : 9000);
}
function dbError(prefix, error) {
  return prefix + (error && error.message ? ' The database said: ' + error.message : '');
}

// Current term label, e.g. "1st Term, 2026/2027"
function currentTermText() { return TERM_NAMES[SCHOOL.currentTerm] + ', ' + SCHOOL.currentSession; }
