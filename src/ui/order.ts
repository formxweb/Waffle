/**
 * Order links open WhatsApp with a prefilled message once a number is set (content.ts).
 * Until then they open an Instagram DM, which cannot be prefilled, so the message is copied
 * to the clipboard and a short note says so.
 */
export function orderLinks() {
  const toast = document.querySelector<HTMLElement>('.toast');
  let timer = 0;
  const say = (msg: string) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(timer);
    timer = window.setTimeout(() => toast.classList.remove('is-on'), 3800);
  };

  document.addEventListener('click', (e) => {
    const a = (e.target as Element).closest<HTMLAnchorElement>('a[data-channel="dm"][data-order]');
    if (!a) return;
    const text = a.dataset.order!;
    navigator.clipboard?.writeText(text).then(
      () => say('Mesajın kopyalandı. DM’e yapıştırıp gönderebilirsin.'),
      () => {},
    );
  });

  return say;
}
