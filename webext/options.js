
var defaultOptions = {
  scoreFormat: ['predictedStars', 'matchScore', 'alreadyRated']
};

var loadedOptions;

function validateFormats(fmts) {
  var possibleFmts = ['predictedStars', 'avgStars', 'matchScore', 'alreadyRated']
  for (var i = 0; i < fmts.length; i++) {
    if (possibleFmts.indexOf(fmts[i]) == -1) {
      return false;
    }
  }
  return true;
}

function saveOptions(e) {
  e.preventDefault();
  var fmts = document.querySelector('#scoreFormat').value.split(',').map(function(x) { return x.trim() });
  if (!validateFormats(fmts)) {
    document.querySelector('#errmsg').textContent = 'Error: can\'t understand that rating info request, check for typos.';
    document.querySelector('#infomsg').textContent = '';
  } else {
    document.querySelector('#errmsg').textContent = '';
    document.querySelector('#infomsg').textContent = '';
    loadedOptions.scoreFormat = fmts;
    chrome.storage.local.set({
      bsbOptions: JSON.stringify(loadedOptions)
    }, function() {
      document.querySelector('#infomsg').textContent = 'Save successful.';
    });
  }
}

function restoreOptions() {
  chrome.storage.local.get("bsbOptions", function(result) {
    loadedOptions = result.bsbOptions ? JSON.parse(result.bsbOptions) : defaultOptions;
    document.querySelector('#scoreFormat').value = loadedOptions.scoreFormat.join(', ');
  });
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
