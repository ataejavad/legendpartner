/* The page works without this file. It adds one convenience and nothing else. */
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-copy]');
  if (!b) return;
  var link = b.getAttribute('data-copy');
  var say = function (t) { b.textContent = t; setTimeout(function () { b.textContent = 'Copy link'; }, 2200); };
  if (navigator.clipboard) navigator.clipboard.writeText(link).then(function () { say('Copied'); }, function () { say(link); });
  else say(link);
});
