// frontend/auth.js
export function getToken(){ return localStorage.getItem('token'); }
export function setToken(t){ localStorage.setItem('token', t); }
export function clearAuth(){ localStorage.removeItem('token'); localStorage.removeItem('username'); localStorage.removeItem('role'); }
export function getHeaders(json=true){
  const h={}; if(json) h['Content-Type']='application/json';
  const t=getToken(); if(t) h['Authorization']='Bearer '+t;
  return h;
}
export function requireAuthOrRedirect(){
  const t=getToken(); if(!t){ location.href='login.html'; return null; } return t;
}
