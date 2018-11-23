$(() => {
  var subreddit = "";
  var words = [];
  var totalKarma = 0;
  var totalPosts = 0;
  var matchedKarma = 0;
  var matchedPosts = 0;
  var wordKarma = {};
  var wordPosts = {};
  var chart = null;
  var numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'decimal'
  });

  var colors = [
    'red', 'blue', 'gold', 'green',
    'pink', 'cyan', 'orange', 'lime',
    'grape', 'indigo', 'teal', 'violet'
  ];

  function init() {
    var params = new URLSearchParams(window.location.search);

    $('#subreddit').val(params.get('sr'));
    $('#words').val(params.get('words'));

    $('#indexButton').click((e) => {
      e.preventDefault();
      startIndexing();
    });

    if (params.has('sr') && params.has('words')) {
      startIndexing();
    }
  }

  function indexListing(listing) {
    listing.children.forEach((child) => {
      indexPost(child.data);
    });
  }

  function indexPost(post) {
    var title = post.title.toLowerCase();
    var matched = false;

    words.forEach((word) => {
      if (title.includes(word)) {
        wordKarma[word] = (wordKarma[word] || 0) + Number(post.score);
        wordPosts[word] = (wordPosts[word] || 0) + 1;

        if (!matched) {
          matchedPosts++;
          matchedKarma += post.score;
          matched = true;
        }
      }
    });

    totalKarma += Number(post.score);
    totalPosts++;
  }

  function percent(x, y) {
    if (y <= 0) {
      return "";
    }

    return String(Math.round(x / y * 100) + "%");
  }

  function format(x) {
    return numberFormatter.format(x);
  }

  function createLabels() {
    var labels = words.slice();
    labels.push('Other');
    return labels;
  }

  function createDataSet() {
    var set = {data: [], backgroundColor: []};

    words.forEach((word, i) => {
      set.data.push(wordKarma[word] || 0);
      set.backgroundColor.push(colors[i % colors.length]);
    });

    set.data.push(totalKarma - matchedKarma);
    set.backgroundColor.push('grey');

    return set;
  }

  function renderTable() {
    $('.total-karma').text(format(totalKarma));
    $('.total-posts').text(format(totalPosts));
    $('.matched-posts').text(format(matchedPosts));
    $('.matched-karma').text(format(matchedKarma));
    $('.percent-posts').text(percent(matchedPosts, totalPosts));
    $('.percent-karma').text(percent(matchedKarma, totalKarma));
  }

  function renderChart() {
    chart = new Chart($('#piechart'), {
      type: 'pie',
      data: {
        labels: createLabels(),
        datasets: [createDataSet()]
      },
      options: {
        responsive: true
      }
    });
  }

  function setError(msg) {
    alert(msg);
  }

  function startIndexing() {
    totalKarma = 0;
    totalPosts = 0;
    matchedKarma = 0;
    matchedPosts = 0;
    wordKarma = {};
    wordPosts = {};
    subreddit = $('#subreddit').val().trim();
    words = [];

    subreddit = subreddit.replace('/r', '');
    subreddit = subreddit.replace('/', '');

    $('#words').val().trim().split(',').forEach((word) => {
      if (word.length > 0) {
        words.push(word.toLowerCase());
      }
    });

    renderTable();

    if (chart) {
      chart.data.labels = [];
      chart.data.datasets = [];
      chart.update();
    }

    if (subreddit.length <= 0) {
      setError('Specify a subreddit');
      return;
    } else if (words.length <= 0) {
      setError('Enter keywords');
      return;
    }

    $.ajax({
      url: "https://www.reddit.com/r/" + subreddit + "/hot.json?limit=100",
      crossDomain: true,
      success: (response) => {
        indexListing(response.data);
        renderTable();
        renderChart();
      }
    });
  }

  init();
});
