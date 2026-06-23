export function triggerPrint(): void {
  document.documentElement.classList.add('printing');
  window.print();
  // Remove class after print dialog closes
  window.addEventListener(
    'afterprint',
    () => {
      document.documentElement.classList.remove('printing');
    },
    { once: true }
  );
  // Fallback: remove after timeout
  setTimeout(() => {
    document.documentElement.classList.remove('printing');
  }, 5000);
}
