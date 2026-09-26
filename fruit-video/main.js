'use strict';
/* Picks the episode from ?ep=N, then either waits for frame capture or plays with audio. */
async function fontsReady() {
  await Promise.all(['400 40px Bangers', '400 40px Lucky', '900 40px Nunito', 'italic 800 40px Nunito', '700 40px Nunito', '800 40px Nunito'].map(f => document.fonts.load(f)));
}
const params = new URLSearchParams(location.search);
EP = EPISODES[+(params.get('ep') || 1)];
TL = EP.TL;
document.title = `Shift Happens: ${EP.title}`;
window.renderAt = renderAt;
window.audit = audit;
window.captureFrames = (start, n) => {
  const out = [];
  for (let i = 0; i < n; i++) { renderAt((start + i) / FPS); out.push(canvas.toDataURL(window.FMT || 'image/jpeg', window.Q || .93)); }
  return out;
};
window.READY = fontsReady().then(() => { renderAt(0); return TL.duration; });

if (params.has('capture')) {
  document.body.classList.add('capture');
} else {
  const audio = document.getElementById('audio'), btn = document.getElementById('play');
  audio.src = EP.audio;
  let playing = false;
  const loop = () => { renderAt(audio.currentTime); if (playing) requestAnimationFrame(loop); };
  btn.addEventListener('click', () => { audio.currentTime = audio.ended ? 0 : audio.currentTime; audio.play(); playing = true; btn.style.display = 'none'; loop(); });
  audio.addEventListener('ended', () => { playing = false; btn.style.display = ''; btn.querySelector('span').textContent = 'Watch again'; });
  window.READY.then(() => renderAt(1.2));
}
