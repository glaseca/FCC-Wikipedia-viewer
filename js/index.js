/********* Notes about using Wikipedia's API ********************
    
    -Use format=jsonfm when debugging (display is human friendly)
    -Specify formatversion=2 to get json format responses in a cleaner format
    -Cannot use list=search and prop=info in same API call
    -Note: list=search&srsearch='search text' and generator=search&gsrsearch='search text' give similar values (however gsrsearch is sorted by pageid value)
    -prop=info&inprop=url provides links
    -gsrsearch='search text' provides list of titles with 'search text' in them   
    -callback=? is used for a JSONP call since otherwise request wasn't being loaded
    -continue= is going to return continue=|| if more results can be loaded
    -gsroffset='number' use to continue paging
    -unfortunately setting gsroffset='number' won't necessarily produce the same query each time on page reload 
    -gsrprop=snippet not producing intended output, hence the work around was to use prop=extract (needs exintro initialized, otherwise exlimit=max is too large a request)
       
 *****************************************************************/
var pageNum = 1,
  sroffset, prev_sroffset, searchItem,animationComplete=false;
$(document).ready(function() {

  $('#searchText').focus();
  $('#searchText').keypress(function(e) { //keypress (or keydown) is better than keyup since we can suppress form submit on 'enter' key being pressed   
    searchItem = $('#searchText').val().replace(/\s+/g, '%20'); //user input. Also, replace space ('+' means any amount) with %20 (single space) to meet Wiki API call parameters
    var wikiLink = 'https://es.wikipedia.org/w/api.php?action=query&prop=extracts|info&exintro&exlimit=max&inprop=url&generator=search&gsroffset=&format=json&formatversion=2&callback=?&gsrsearch=' + searchItem + '&continue=';
    pageNum = 1;
    if (e.which === 13) { //if user returns enter key. Also e.keyCode is not implemented the same way by all browsers but JQuery normalizes the vale of e.which for all browsers
      document.getElementById("searchText").spellcheck=true; //spell check suggestion couldn't be animated along with searchBar, so spellcheck is initially turn off and activated here
      $(".searchBar").animate({top: "2.4%"}, 500);
      animationComplete=true;
      setTimeout(function() {wikiCall(wikiLink);}, 200); //passing wikiCall(wikiLink) would invoke function immediately. Instead we need to pass it as a function to be invoked for the delay to work.     
      e.preventDefault(); //prevents implicit submit of form when enter is pressed. API call is interupted on page refresh otherwise.
    }
  });
 /************************************************************/
  $('.fa-search').on('click', function() {
    var wikiLink = 'https://es.wikipedia.org/w/api.php?action=query&prop=extracts|info&exintro&exlimit=max&inprop=url&generator=search&gsroffset=&format=json&formatversion=2&callback=?&gsrsearch=' + $('#searchText').val().replace(/\s+/g, '%20') + '&continue=';
    pageNum = 1;
    document.getElementById("searchText").spellcheck=true;
    if(!animationComplete && $('#searchText').val()!=""){     
      $(".searchBar").animate({top: "2.4%"}, 500);
      setTimeout(function() {wikiCall(wikiLink);}, 200);
    }else{wikiCall(wikiLink);}
  }); /************************************************************/
  $('.fa-times-circle').on('click', function() {
    $('#searchText').val(""); //clears value in text box
    $(".displayResults").html(""); //clears all the appended divs
    pageNum = 1;
  });
  /************************************************************/
  $('.displayResults').on('click', '.next', function() { //.displayResults is the stationary object into which the dynamically created .next is created
    pageNum += 1;
    prev_sroffset = sroffset; //this gives the value of sroffset before it increments up when wikiCall function is called
    var wikiLink = 'https://es.wikipedia.org/w/api.php?action=query&prop=extracts|info&exintro&exlimit=max&inprop=url&generator=search&format=json&formatversion=2&callback=?&gsrsearch=' + $('#searchText').val() + '&gsroffset=' + sroffset;
    wikiCall(wikiLink);
  });
  /************************************************************/
  $('.displayResults').on('click', '.back', function() { //.displayResults is the stationary object into which the dynamically created .back is created
    var diff = sroffset - prev_sroffset;
    if (pageNum > 2) {
      pageNum -= 1;
      prev_sroffset -= diff;
      var wikiLink = 'https://es.wikipedia.org/w/api.php?action=query&prop=extracts|info&exintro&exlimit=max&inprop=url&generator=search&format=json&formatversion=2&callback=?&gsrsearch=' + $('#searchText').val() + '&gsroffset=' + prev_sroffset;
      wikiCall(wikiLink);
    } else if (pageNum === 2) {
      pageNum -= 1;
      var wikiLink = 'https://en.wikipedia.org/w/api.php?action=query&prop=extracts|info&exintro&exlimit=max&inprop=url&generator=search&format=json&formatversion=2&callback=?&gsrsearch=' + $('#searchText').val() + '&continue=';
      wikiCall(wikiLink);
    }
  });
  
});
//**********************************************************************//
//**********************************************************************//
function wikiCall(link) {
  $(".displayResults").html(""); //clears display for each new call
  $(".displayResults").append("<br>");
  $.getJSON(link, function(searchResults) {
    if (typeof searchResults.continue === 'undefined') { //if there are no further search results to load
      for (var i = 0; i < searchResults.query.pages.length; i++) {
        $(".displayResults").append("<a href=" + searchResults.query.pages[i].fullurl + "><div class='searchResultsContainer'><span style='font-weight:bold; font-size:150%; margin-bottom:100px;'>" + searchResults.query.pages[i].title + "</span><br></br>" + searchResults.query.pages[i].extract + "</div></a>");
        $(".displayResults").append("<br>");
      }
    } else {
      sroffset = searchResults.continue.gsroffset;
      for (var j = 0; j < searchResults.query.pages.length; j++) {
        $(".displayResults").append("<a href=" + searchResults.query.pages[j].fullurl + "><div class='searchResultsContainer'><span style='font-weight:bold; font-size:150%; margin-bottom:100px;'>" + searchResults.query.pages[j].title + "</span><br></br>" + searchResults.query.pages[j].extract + "</div></a>");
        $(".displayResults").append("<br>");
      }
      if (pageNum === 1) {
        $(".displayResults").append("<span class='btn btn-success next'>Cargar más</span>");
      } else {
        $(".displayResults").append("<span class='btn btn-info back'><i class='fa fa-reply'></i> Anterior</span><span class='btn btn-success next'>Cargar más</span>");
      }
    }
  }).fail(function(jqxhr, textStatus, error) { //if .getJSON call fails
    alert(textStatus + ": " + error);
  });
}