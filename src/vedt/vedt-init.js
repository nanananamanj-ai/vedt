(function(){
  var $=function(s){return document.querySelector(s)};

  /* marquee */
  var words='BRANDS|WEDDINGS|EVENTS|PODCASTS|TRAVEL & CREATORS|MUSIC VIDEOS|REELS|HIGHLIGHTS|TEASERS|CUTDOWNS';
  var half='';
  words.split('|').forEach(function(w){half+='<span>'+w+'</span><i>•</i>'});
  $('#mq').innerHTML=half+half;

  /* reveal on scroll */
  if('IntersectionObserver' in window){
    var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');ro.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
    document.querySelectorAll('.rv').forEach(function(el){ro.observe(el)});
  }else{document.querySelectorAll('.rv').forEach(function(el){el.classList.add('in')})}

  /* active nav */
  var links=[].slice.call(document.querySelectorAll('#nav a'));
  var secs=links.map(function(a){return document.querySelector(a.getAttribute('href'))}).filter(Boolean);
  if('IntersectionObserver' in window){
    var no=new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting){
          links.forEach(function(a){a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id)});
          var cur=document.querySelector('#nav a.on');
          if(cur&&cur.scrollIntoView)cur.scrollIntoView({block:'nearest',inline:'nearest'});
        }
      });
    },{rootMargin:'-45% 0px -50% 0px'});
    secs.forEach(function(s){no.observe(s)});
  }

  /* lightbox */
  var lb=$('#lb'),fr=$('#lbFrame'),ifr=$('#lbIframe'),cap=$('#lbCap'),out=$('#lbOut'),lastFocus=null;
  function srcFor(d){
    if(d.p==='instagram')return 'https://www.instagram.com/'+(d.k==='reel'?'reel':'p')+'/'+d.c+'/embed/captioned/';
    if(d.p==='youtube')return 'https://www.youtube-nocookie.com/embed/'+d.c+'?rel=0&playsinline=1&autoplay=1';
    return 'https://player.vimeo.com/video/'+d.c+'?autoplay=1&title=0&byline=0&portrait=0&dnt=1';
  }
  function ratio(d){
    if(d.p==='instagram')return 16/9;          /* vertical media: h = w*16/9 */
    return d.a==='portrait'?16/9:9/16;         /* stored as height/width */
  }
  function open(d,caption,platform){
    lastFocus=document.activeElement;
    var r=ratio(d);                            /* height / width of the media */
    var maxH=window.innerHeight-140, maxW=Math.min(window.innerWidth-28, 980);
    var w,h;
    if(d.p==='instagram'){
      /* measured IG embed geometry: media band = 70% of iframe width,
         full card height ~= 1.31 * width + 219px of chrome */
      var MW=Math.min(maxW,430);
      w=Math.min(MW,(maxH-192)/1.32);
      if(w<240)w=240;
      h=1.32*w+192;
      if(h>maxH+40){h=maxH+40;w=(h-192)/1.32}
    }else{
      w=maxW; h=w*r;
      if(h>maxH){h=maxH;w=h/r}
    }
    fr.style.width=Math.round(w)+'px';fr.style.height=Math.round(h)+'px';
    fr.classList.toggle('ig',d.p==='instagram');
    ifr.src=srcFor(d);
    cap.textContent=caption||'';
    out.href=platform||'#';
    out.textContent='Open on '+(d.p==='instagram'?'Instagram':d.p==='youtube'?'YouTube':'Vimeo')+' »';
    lb.hidden=false;document.body.classList.add('locked');
    $('#lbX').focus();
  }
  function close(){
    lb.hidden=true;document.body.classList.remove('locked');
    ifr.src='about:blank';
    if(lastFocus)lastFocus.focus();
  }
  document.addEventListener('click',function(e){
    var card=e.target.closest('[data-embed]');
    if(card){e.preventDefault();open(JSON.parse(card.getAttribute('data-embed')),card.getAttribute('data-cap'),card.getAttribute('href'))}
  });
  $('#lbX').addEventListener('click',close);
  lb.addEventListener('click',function(e){if(e.target===lb)close()});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!lb.hidden)close()});
  window.addEventListener('resize',function(){
    if(!lb.hidden&&lastFocus){
      var card=lastFocus.closest&&lastFocus.closest('[data-embed]');
      if(card){open(JSON.parse(card.getAttribute('data-embed')),card.getAttribute('data-cap'),card.getAttribute('href'))}
    }
  });
})();
