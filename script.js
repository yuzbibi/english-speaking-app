document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------
  // Elements
  // -------------------------------------------------------
  const enInput       = document.getElementById('en-input');
  const speakInputBtn = document.getElementById('speak-input-btn');

  const startSpeechBtn       = document.getElementById('start-speech-btn');
  const speechBtnText        = document.getElementById('speech-btn-text');
  const waveform             = document.getElementById('waveform');
  const speechResultContainer= document.getElementById('speech-result-container');
  const speechResultText     = document.getElementById('speech-result-text');
  const speechFeedback       = document.getElementById('speech-feedback');
  const speechNotSupported   = document.getElementById('speech-not-supported');

  // -------------------------------------------------------
  // Speed pills
  // -------------------------------------------------------
  document.querySelectorAll('.speed-pills').forEach(group => {
    const targetId = group.dataset.target;
    const hiddenInput = document.getElementById(targetId);
    group.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        hiddenInput.value = pill.dataset.value;
      });
    });
  });

  // -------------------------------------------------------
  // Speech Synthesis
  // -------------------------------------------------------
  const synth = window.speechSynthesis;
  let voices = [];

  function loadVoices() { voices = synth.getVoices(); }
  loadVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  function speak(text, rate) {
    if (!text) return;
    synth.cancel();
    const utterThis = new SpeechSynthesisUtterance(text);
    const enVoice = voices.find(v => v.lang.startsWith('en-US') && v.name.includes('Google'))
      || voices.find(v => v.lang.startsWith('en-US'))
      || voices.find(v => v.lang.startsWith('en'));
    if (enVoice) utterThis.voice = enVoice;
    utterThis.lang = 'en-US';
    utterThis.rate = parseFloat(rate);
    synth.speak(utterThis);
  }

  // -------------------------------------------------------
  // Section 01 — 発音練習くん (Read aloud)
  // -------------------------------------------------------
  speakInputBtn.addEventListener('click', () => {
    const text = enInput.value.trim();
    if (!text) { enInput.focus(); return; }
    speak(text, document.getElementById('speed-1').value);
  });

  // -------------------------------------------------------
  // Section 02 — 話す練習くん (Speech recognition)
  // -------------------------------------------------------
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    startSpeechBtn.classList.add('hidden');
    speechNotSupported.classList.remove('hidden');
  } else {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false; // continuous=false is much more reliable across browsers
    let isRecording = false;

    function startRecording() {
      isRecording = true;
      startSpeechBtn.classList.add('recording');
      speechBtnText.textContent = '話しています... (自動で止まるまで待ってね)';
      waveform.classList.add('active');
      speechResultContainer.classList.add('hidden');
      speechFeedback.textContent = '';
      try {
        recognition.start();
      } catch(e) {
        // In case recognition is already started
        stopRecording();
      }
    }
    function stopRecording() {
      isRecording = false;
      startSpeechBtn.classList.remove('recording');
      speechBtnText.textContent = 'マイクをおして話す';
      waveform.classList.remove('active');
    }

    startSpeechBtn.addEventListener('click', () => {
      if (isRecording) {
        recognition.stop();
        stopRecording();
      } else {
        startRecording();
      }
    });

    recognition.addEventListener('result', e => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      speechResultText.textContent = transcript;
      speechResultContainer.classList.remove('hidden');
      if (e.results[0].isFinal) {
        const confidence = Math.round(e.results[0][0].confidence * 100);
        if (confidence >= 75) {
          speechFeedback.style.color = '#10B981';
          speechFeedback.textContent = `✅ よく聞き取れました！ (認識度: ${confidence}%)`;
        } else if (confidence >= 50) {
          speechFeedback.style.color = '#F97316';
          speechFeedback.textContent = `🔄 もう少しゆっくり話してみよう (認識度: ${confidence}%)`;
        } else {
          speechFeedback.style.color = '#EF4444';
          speechFeedback.textContent = `🎤 もう一度はっきり話してみよう (認識度: ${confidence}%)`;
        }
      }
    });

    recognition.addEventListener('end', () => {
      if (isRecording) stopRecording();
    });

    recognition.addEventListener('error', e => {
      stopRecording();
      speechResultContainer.classList.remove('hidden');
      if (e.error === 'no-speech') {
        speechFeedback.style.color = '#F97316';
        speechFeedback.textContent = '🎤 声が聞き取れませんでした。マイクに向かって話してみよう。';
      } else if (e.error === 'not-allowed' || e.error === 'audio-capture') {
        speechFeedback.style.color = '#EF4444';
        speechFeedback.textContent = '⚠️ マイクのアクセスがブロックされています。URLバーの横からマイクを許可してください。';
      } else {
        speechFeedback.style.color = '#EF4444';
        speechFeedback.textContent = '⚠️ エラーが発生しました (' + e.error + ')。もう一度試してください。';
      }
    });
  }
});

// -------------------------------------------------------
// Simple Nav — click to jump
// -------------------------------------------------------
(function () {
  const tabs = document.querySelectorAll('.nav-tab');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = document.getElementById(tab.dataset.target);
      if (target) {
        const top = target.getBoundingClientRect().top + window.scrollY - 20;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
})();
