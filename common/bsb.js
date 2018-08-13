

// expected hdr.js functions:
// remoteGet(url, function(response){})
// loadRatingsCache(function(cache){})
// saveRatingsCache(cache)
// loadOptions(function(options){})


// OPTIONS: just edit these by hand for the greasemonkey script.
var bsbOptions = {

  // scoreFormat: what will show up next to the title, in order.
  // Choices are predictedStars, avgStars, matchScore, alreadyRated.
  scoreFormat: ['predictedStars', 'matchScore', 'alreadyRated']
};

loadOptions(function(options) {
  bsbOptions = options || bsbOptions;
});

function toArr(arrLike) {
  return [].slice.call(arrLike);
}

function element(tag, options) {
  var e = document.createElement(tag);
  options = options || {};
  for (var o in options) {
    if (o == 'style') {
      for (var s in options[o]) {
        e[o][s] = options[o][s];
      }
    } else {
      e[o] = options[o];
    }
  }
  return e;
}

function nParent(e, n) {
  for (var i = 0; i < n; i++) {
    e = e.parentNode;
  }
  return e;
}

var ratingsCache = {};
loadRatingsCache(function(cache) {
    var now = Date.now();
    for (var c in cache) {
      if (cache[c].expires < now) {
        delete cache[c];
      }
    }
    ratingsCache = cache;
});
var RATINGS_CACHE_EXPIRY_MS = 1000*60*60; // maybe this isn't needed, but it's handy for if you crash/close the tab when trying to load ratings to dump to JSON

function getRatings(titleId, onGet) {
  var now = Date.now();
  if (titleId in ratingsCache && now < ratingsCache[titleId].expires) {
    onGet(ratingsCache[titleId]);
    return;
  }
  remoteGetRatings(titleId, function(ratings) {
    ratingsCache[titleId] = ratings;
    ratingsCache[titleId].expires = now + RATINGS_CACHE_EXPIRY_MS;
    saveRatingsCache(ratingsCache);
    onGet(ratings);
  });
}

function getDvdUrl(titleId) {
  return 'https://dvd.netflix.com/Movie/title/' + titleId;
}

function remoteGetRatings(titleId, onGet) {
  remoteGet(getDvdUrl(titleId), function(responseXML) {
    var movieDetail = responseXML.querySelector('#movieDetailStars');
    if (movieDetail) {
      var myStars = movieDetail.dataset.myrating;
      var avgStars;
      var rating = responseXML.querySelector('#ratingInfo');
      if (rating) {
        var spans = rating.querySelectorAll('span');
        avgStars = spans[1].textContent.trim().split(' ')[0];
      }
      onGet({
        found: true,
        myStars: myStars,
        alreadyRated: myStars && myStars != "0.0" && myStars != "-1.0",
        predictedStars: avgStars && movieDetail.dataset.prediction, // no avg stars == dvd-less and prediction-less, so clear this field
        avgStars: avgStars || movieDetail.dataset.prediction, // avg stars stored in dataset.prediction for some reason if no dvd plan
      });
    } else {
      onGet({ found: false });
    }
  });
}

function getTitleIdFromHref(href) {
  return href.split('?').slice(0, 1)[0].split('/').slice(-1)[0];
}

function getTitleId(wrapper) {
  var jawbone = nParent(wrapper, 14).querySelector('.jawBoneContainer');
  if (jawbone) {
    return jawbone.id;
  }
  var bobJawHitzone = nParent(wrapper, 6).querySelector('.bob-jaw-hitzone');
  if (bobJawHitzone) {
      return getTitleIdFromHref(bobJawHitzone.href);
  }
  console.log('[bsb] error, no title id containing element found for', wrapper);
}

function inJawbone(wrapper) {
  var jawbone = nParent(wrapper, 14).querySelector('.jawBoneContainer');
  if (jawbone) {
    return true;
  }
  var bobJawHitzone = nParent(wrapper, 6).querySelector('.bob-jaw-hitzone');
  if (bobJawHitzone) {
    return false;
  }
  console.log('[bsb] error, isInJawbone ran with no overlay present, ', wrapper);
}

var noRatingCache = {};

function updateScore(wrapper, titleId) {

  var inner = wrapper.querySelector('.rating-inner');
  if (!inner) {
    console.log('[bsb] error: acted on title with no .rating-inner!', wrapper);
    return;
  }

  if (wrapper.classList.contains('no-rating')) {
    noRatingCache[titleId] = true;
    wrapper.classList.remove('no-rating');
    inner.appendChild(element('span', { className: 'match-score' }));
  }

  if (!inner.classList.contains('show-match-score')) {
    inner.classList.add('show-match-score');
  }

  var matchScoreSpan = wrapper.querySelector('.match-score');
  if (titleId in noRatingCache) {
    matchScoreSpan.textContent = 'No%';
  }
  matchScoreSpan.textContent = matchScoreSpan.textContent.replace(' Match', '');

  var matchScore = matchScoreSpan.textContent.split('%')[0];

  matchScoreSpan.textContent = '';

  var ratingsSpan = matchScoreSpan.querySelector('.bsb-ratings-span');
  if (!ratingsSpan) {
    ratingsSpan = element('span', { className: 'bsb-ratings-span' });
    matchScoreSpan.appendChild(ratingsSpan);
  }

  ratingsSpan.textContent = ' (loading) ';

  getRatings(titleId, function(ratings) {
    if (wrapper.dataset.bsbExpectedTitleId != titleId) {
      console.log('[bsb] ajax took too long?', wrapper.dataset.bsbExpectedTitleId, titleId);
      return;
    }
    if (!('matchScore' in ratings)) {
      ratings.matchScore = matchScore;
    }
    if (ratings.found) {
      var scoreText = '';
      bsbOptions.scoreFormat.forEach(function(fmt) {
        if (!ratings.predictedStars && fmt == 'predictedStars') {
            // override predictedStars so dvd-less folks get the only thing they can: avgStars
            fmt = 'avgStars';
        }
        if (fmt == 'predictedStars') {
          var stars = ratings.alreadyRated ? ratings.myStars : ratings[fmt];
          scoreText += ' (' + stars + ' ★s) ';
        } else if (fmt == 'avgStars') {
          scoreText += ' (' + ratings[fmt] + ' avg★s) ';
        } else if (fmt == 'matchScore') {
          scoreText += ' ' + ratings[fmt] + '% ';
        } else if (fmt == 'alreadyRated') {
          scoreText += ratings[fmt] ? ' (Seen) ' : '';
        }else {
          console.log('[bsb] unknown scoreFormat item requested: ' + fmt);
        }
      });
      ratingsSpan.textContent = scoreText;
      if (inJawbone(wrapper)) {
        ratingsSpan.appendChild(element('a', {
          href: getDvdUrl(titleId),
          textContent: !ratings.alreadyRated ? '(Rate Here)' : '(DVD Page)'
        }));
      }
    } else {
      ratingsSpan.textContent = ' (NoDvd) ';
    }
  });
}

var observer = new MutationObserver(function(muts) {
  toArr(document.querySelectorAll('.match-score-wrapper')).forEach(function(wrapper) {
    var titleId = getTitleId(wrapper);
    if (wrapper.dataset.bsbExpectedTitleId != titleId) {
      wrapper.dataset.bsbExpectedTitleId = titleId;
      // console.log('[bsb]', titleId);
      updateScore(wrapper, titleId);
    }
  });
});

observer.observe(document.body, {
  childList: true,
  attributes: true,
  subtree: true,
});

window.addEventListener('keydown', function(e) {
  if (e.altKey && e.which == 'P'.charCodeAt(0)) {
    console.log(JSON.stringify(ratingsCache));
  }
});
