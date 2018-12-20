function remoteGetJSON(url, onLoad) {
  var req = new XMLHttpRequest();
  var onResponse = function() {
    if (this.status != 200) {
      console.log('[bsb] bad status ' + this.status + ' when loading ' + url);
      onLoad({});
    } else {
      onLoad(JSON.parse(resp.responseText));
    }
  };
  req.addEventListener('load', onResponse);
  req.addEventListener('error', onResponse);
  req.addEventListener('abort', onResponse);
  req.open('GET', url);
  req.send();
}

function loadRatingsCache(onLoad) {
  chrome.storage.local.get('bsbRatingsCache', function(result) {
    var cacheJSON = result.bsbRatingsCache;
    onLoad(cacheJSON ? JSON.parse(cacheJSON) : {});
  });
}

function saveRatingsCache(cache) {
  chrome.storage.local.set({ bsbRatingsCache: JSON.stringify(cache) });
}

function loadOptions(onLoad) {
  chrome.storage.local.get('bsbOptions', function(result) {
    onLoad(result.bsbOptions && JSON.parse(result.bsbOptions));
  });
}
