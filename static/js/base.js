/*
 * JavaScript Pretty Date
 * Copyright (c) 2008 John Resig (jquery.com)
 * Licensed under the MIT license.
 */

// Takes an ISO time and returns a string representing how
// long ago the date represents.
function prettyDate(time){
	var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ]/g," ")),
		diff = (((new Date()).getTime() - date.getTime()) / 1000),
		
		// add in timezone offset
		diff = diff + ((new Date).getTimezoneOffset()*60);
		day_diff = Math.floor(diff / 86400);
			
	if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
		return false;
			
	return day_diff == 0 && (
			diff < 60 && "just now" ||
			diff < 120 && "1 minute ago" ||
			diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
			diff < 7200 && "1 hour ago" ||
			diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
		day_diff == 1 && "Yesterday" ||
		day_diff < 7 && day_diff + " days ago" ||
		day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
}





//======================================================================


var controller;

$(document).ready(function(){

  controller = new controller('stream');


  // setup jquery history to handle hashchange events
  $.history.init(function(){
      var pagehash = window.location.hash.substr(1,window.location.hash.length);
      controller.clearQueue();
      if (pagehash!=''){
        var searchterms = pagehash.split('|');
        controller.searchterms = searchterms;
        console.log(controller.searchterms);
        //controller.clearQueue();
        controller.resetSearchTimer();
      }else{
        $('#help').fadeIn();
      }
  });
  
  $('#searchform').submit(function(){
      var q = $('#searchquery').attr('value');
      window.location.hash = q;
      $('#help').fadeOut();
      return false;
  });
  
  $('#help a').click(function(){
    $('#help').fadeOut('slow');
  })
  
  $('#help a#close').click(function(){
    $('#help').fadeOut();
    return false;
  })
  
  $('#show_help').click(function(){
    $('#help').fadeIn();
    return false;
  })

})



function controller(id){
  this.obj = document.getElementById(id);
  this.queue = [];
  this.searchterms = []
  this.searchtimer = null;
  this.queuetimer = null;
  this.timestamptimer = null;
  
  this.startSearchTimer();
  
  var that = this;
  this.queuePop();
  this.queuetimer = setInterval(function(){
    that.queuePop();
  }, 1000); // every 1 secs
  
  this.timestamptimer = setInterval(function(){
    that.updateTimestamps();
  }, 5000); // every 5 secs
  
}

controller.prototype.startSearchTimer = function(){
  var that = this;
  this.doSearches(); // start now
  this.searchtimer = setInterval(function(){
    that.doSearches();
  }, 20000); // every 20 secs
}
controller.prototype.stopSearchTimer = function(){
  clearInterval(this.searchtimer)
}

controller.prototype.resetSearchTimer = function(){
  this.stopSearchTimer();
  this.startSearchTimer();
}

controller.prototype.clearQueue = function(){
  this.queue = [];
}

controller.prototype.doSearches = function(){
  var that = this;
  if(this.searchterms.length < 1) return false;
  $(this.searchterms).each(function(){
    //console.log('searching for: '+this);
    
    $.getJSON('http://graph.facebook.com/search?q='+escape(this)+'&callback=?', function(data){
      that.handleSearchResults(data.data);
    }); 
  })
}

controller.prototype.updateTimestamps = function(){
  $('li div.timestamp-raw', this.obj).each(function(){
    var raw = $(this).html();
    $(this).prev().html(prettyDate(raw))
  })
}

controller.prototype.handleSearchResults = function(data){
  var that = this;
  var tempqueue = [];
  $(data).each(function(){
    if(!that.isPostAlreadyInDom(this.id)){
      //no, carry on
      if(!that.isPostAlreadyInQueue(this.id)){
        //no, good to add to queue
        //console.log('adding to queue: '+this.id)
        if(this.message){
          tempqueue.push({
            id: this.id,
            html: that.renderListItem(this),
            raw: this
          })
        }
      }
    }    
  })
  this.queue = this.queue.concat(tempqueue.reverse());
}

controller.prototype.isPostAlreadyInQueue = function(post_id){
  var found = false;
  $(this.queue).each(function(){
    if (this.id == post_id){
      //console.log(post_id+' WAS found in queue');
      found = true;
    }
  })
  //console.log(post_id+' not found in queue');
  return found;
}

controller.prototype.isPostAlreadyInDom = function(post_id){
  var found = false;
  $('li', this.obj).each(function(){
    if ($(this).attr('id') == post_id){
      //console.log(post_id+' WAS found in dom');
      found = true;
    }
  })
  //console.log(post_id+' not found in dom');
  return found;
}

controller.prototype.renderListItem = function(post){
  var html = '<li id="'+post.id+'">';
  html+= '<img height="50" width="50" src="http://graph.facebook.com/'+post.from.id+'/picture">';
  html+= '<div class="body">'
  html+= '  <div class="user"><a href="http://www.facebook.com/profile.php?id='+post.from.id+'">'+post.from.name+'</a></div>';
  html+= '  <div class="message">'+post.message.substr(0,500)+'</div>';
  var datestr = post.created_time.substr(0,post.created_time.length-5)+'Z';
  console.log(datestr);
  html+= '  <div class="timestamp">'+prettyDate(datestr)+'</div>';
  html+= '  <div class="timestamp-raw" style="display:none;">'+datestr+'</div>';
  html+= '</div></li>';
  return html;
}

controller.prototype.queuePop = function(){
  var post = this.queue.shift();
  if (post){
    //console.log('shifting from queue: '+post.id)
    var newnode = $(post.html);
    
    // put it in the test and get the height
    var heighttest = $('#heighttest');
    heighttest.empty();
    heighttest.append(newnode);
    var height = heighttest.height();

    // prepare for insertion
    newnode.css('opacity', 0);
    newnode.css('top', -200);
    newnode.css('height', 0);
    
    // insert
    $(this.obj).prepend(newnode);
    
    //animate in
    newnode.animate({
      opacity: 1,
      top: 0,
      height: (height-40)
    });

    if($('li',this.obj).size()>100){
      $('li:last', this.obj).remove();
    }

  }

}





