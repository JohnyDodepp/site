'use strict';

// поиск
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const faDigits = '۰۱۲۳۴۵۶۷۸۹';
const toEn = str => String(str)
  .replace(/[۰-۹]/g, d => faDigits.indexOf(d))
  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

// ссылки
$$('a[href="#"]').forEach(a => {
  a.addEventListener('click', e => e.preventDefault());
});

// слайдер
(function slider() {
  const slides = $$('.hero__slide');
  const dotsBox = $('#slide-dots');
  let current = 0;
  let timer;

  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'слайд ' + (i + 1));
    b.addEventListener('click', () => { go(i); restart(); });
    dotsBox.appendChild(b);
    return b;
  });

  // переключение
  function go(n) {
    current = (n + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle('is-active', i === current));
    dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
  }

  function restart() {
    clearInterval(timer);
    timer = setInterval(() => go(current + 1), 5000);
  }

  $('#slide-next').addEventListener('click', () => { go(current + 1); restart(); });
  $('#slide-prev').addEventListener('click', () => { go(current - 1); restart(); });

  go(0);
  restart();
})();

// окно входа
(function loginModal() {
  const overlay  = $('#overlay');
  const openBtn  = $('#open-login');
  const closeBtn = $('#close-login');
  const backBtn  = $('#back-btn');
  const states   = $$('.state');

  const phone     = $('#phone');
  const phoneHint = $('#phone-hint');
  const phoneNext = $('#phone-next');

  const otpBox    = $('#otp');
  const otpInputs = $$('input', otpBox);
  const otpNext   = $('#otp-next');
  const otpError  = $('#otp-error');
  const timerEl   = $('#timer');
  const timerWrap = $('#timer-wrap');
  const resendBtn = $('#resend');

  // код
  const CORRECT_CODE = '12345';
  const COUNTDOWN = 120;
  let countdown;

  // шаги
  function showState(name) {
    states.forEach(s => { s.hidden = s.dataset.state !== name; });
    backBtn.hidden = name !== 'otp';
    if (name === 'phone') phone.focus();
    if (name === 'otp') otpInputs[0].focus();
  }

  // открыть
  function openModal() {
    resetAll();
    overlay.hidden = false;
    document.body.classList.add('modal-open');
    showState('phone');
  }

  // закрыть
  function closeModal() {
    overlay.hidden = true;
    document.body.classList.remove('modal-open');
    clearInterval(countdown);
  }

  openBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('mousedown', e => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !overlay.hidden) closeModal();
  });

  const onlyDigits = v => toEn(v).replace(/\D/g, '');

  // номер
  const phoneValid = v => v.length >= 10 && v.length <= 12;

  phone.addEventListener('input', () => {
    phone.value = onlyDigits(phone.value).slice(0, 12);
    phoneNext.disabled = !phoneValid(phone.value);
    phone.classList.remove('is-invalid');
    phoneHint.hidden = true;
  });

  phone.addEventListener('blur', () => {
    const bad = phone.value.length > 0 && !phoneValid(phone.value);
    phone.classList.toggle('is-invalid', bad);
    phoneHint.hidden = !bad;
  });

  phone.addEventListener('keydown', e => { if (e.key === 'Enter') submitPhone(); });
  phoneNext.addEventListener('click', submitPhone);

  function submitPhone() {
    if (!phoneValid(phone.value)) return;

    $('.shown-phone').textContent = phone.value;

    clearOtp();
    showState('otp');
    startCountdown();
  }

  // код из смс
  const otpValue = () => otpInputs.map(i => i.value).join('');
  const otpFull = () => otpInputs.every(i => i.value !== '');

  function clearOtp() {
    otpInputs.forEach(i => { i.value = ''; });
    otpBox.classList.remove('is-error');
    otpError.hidden = true;
    otpNext.disabled = true;
  }

  otpInputs.forEach((input, i) => {

    input.addEventListener('input', () => {
      input.value = onlyDigits(input.value).slice(-1);
      otpBox.classList.remove('is-error');
      otpError.hidden = true;
      if (input.value && otpInputs[i + 1]) otpInputs[i + 1].focus();
      otpNext.disabled = !otpFull();
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !input.value && otpInputs[i - 1]) {
        otpInputs[i - 1].value = '';
        otpInputs[i - 1].focus();
        otpNext.disabled = true;
      }
      if (e.key === 'Enter') submitOtp();
    });

    input.addEventListener('paste', e => {
      e.preventDefault();
      const digits = onlyDigits(e.clipboardData.getData('text')).slice(0, 5);
      digits.split('').forEach((d, k) => { otpInputs[k].value = d; });
      otpInputs[Math.min(digits.length, 4)].focus();
      otpNext.disabled = !otpFull();
    });
  });

  otpNext.addEventListener('click', submitOtp);

  // проверка
  function submitOtp() {
    if (!otpFull()) return;

    if (otpValue() === CORRECT_CODE) {
      clearInterval(countdown);
      showState('success');
      openBtn.classList.add('is-logged');
    } else {
      otpBox.classList.remove('is-error');
      void otpBox.offsetWidth;
      otpBox.classList.add('is-error');
      otpError.hidden = false;
      otpInputs[otpInputs.length - 1].focus();
    }
  }

  // таймер
  function startCountdown() {
    clearInterval(countdown);
    let left = COUNTDOWN;
    timerWrap.hidden = false;
    resendBtn.hidden = true;

    const tick = () => {
      const m = Math.floor(left / 60);
      const s = String(left % 60).padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;

      if (left <= 0) {
        clearInterval(countdown);
        timerWrap.hidden = true;
        resendBtn.hidden = false;
      }
      left--;
    };

    tick();
    countdown = setInterval(tick, 1000);
  }

  resendBtn.addEventListener('click', () => {
    clearOtp();
    startCountdown();
    otpInputs[0].focus();
  });

  function backToPhone() {
    clearInterval(countdown);
    showState('phone');
  }
  backBtn.addEventListener('click', backToPhone);
  $('#edit-phone').addEventListener('click', backToPhone);

  $('#done').addEventListener('click', closeModal);

  // сброс
  function resetAll() {
    phone.value = '';
    phone.classList.remove('is-invalid');
    phoneHint.hidden = true;
    phoneNext.disabled = true;
    clearOtp();
  }

  openModal();
})();
