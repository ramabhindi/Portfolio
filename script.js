// Split hero title words into individual hoverable letters
const words = document.querySelectorAll('#hero-title .word');

words.forEach(word => {
  const text = word.getAttribute('data-text');
  word.innerHTML = text.split('').map(ch => {
    if (ch === ' ') {
      return '<span style="display:inline-block;width:0.28em"> </span>';
    }
    return `<span class="letter">${ch}</span>`;
  }).join('');
});
