'use strict';(function(){var f=$xirsys.class.create({namespace:'connection',inherits:$xirsys.signal,constructor:function(a,b,c){f.Super.constructor.call(this,b);this.inst=a;this.opts=c||{};this.opts.secure=c.secure||1;this.peers={}},methods:{disconnect:function(){this.close()},emit:function(a,b,c){switch(a){case'message':if(!!b.to)this.send(a,b,b.to,b.type);else this.send(a,b);break;case'create':this.createRoom(b,c);break;case'join':this.joinRoom(b,c);break;case'leave':this.disconnect();break;default:this.send(a,b)}},on:function(a,b){$xirsys.events.getInstance().on(a,b)},getSessionid:function(){this.sessionId=this.sessionId||((this.xirsys_opts&&this.xirsys_opts.username)||new Date().getTime());return this.sessionId},createRoom:function(c,d){var e=this;this.inst.xirsysRequest($xirsys.simplewebrtc.roomUrl,function(b){e.inst.xirsysRequest($xirsys.simplewebrtc.iceUrl,function(a){if(!!a.e){console.error("Could not get ICE string",a.e);return}e.setupRoom(c,a.d.iceServers);d.apply(e,[(!!b.e&&b.e!="room_exists")?b.e:null,c])})})},joinRoom:function(b,c){var d=this;this.inst.xirsysRequest($xirsys.simplewebrtc.iceUrl,function(a){if(!!a.e){console.error("Could not get ICE string",a.e);return}d.setupRoom(b,a.d.iceServers);d.joinCB=c})},setupRoom:function(b,c){this.opts.room=b;this.opts.username=this.opts.username||this.getSessionid();this.peers={};this.connect(this.opts);var d=c.filter(function(a){return a.url.startsWith('stun')});var e=c.filter(function(a){return a.url.startsWith('turn')});$xirsys.events.getInstance().emit('stunservers',d);$xirsys.events.getInstance().emit('turnservers',e)},getIceServers:function(){this.inst.xirsysRequest($xirsys.simplewebrtc.iceUrl,function(a){var b=a.d.iceServers,c=b.length,d=[],e=[];for(var g=0;g<c;g++){if(b[g].url.startsWith("stun"))d.push(b[g]);else e.push(b[g])}$xirsys.events.getInstance().emit('stunservers',d);setInterval(function(){$xirsys.events.getInstance().emit('turnservers',e)},50)})},addPeer:function(a){if(a==this.opts.username)return;for(var b in this.peers){if(b==a)return}this.peers[a]={type:"video"}},removePeer:function(a){for(var b in this.peers){if(b==a){this.peers[b]=null;return}}},onMessage:function(a){f.Super.onMessage.call();$xirsys.events.getInstance().emit(a.type,a.data)},onOpen:function(){f.Super.onOpen.call();$xirsys.events.getInstance().emit('open')},onPeers:function(a){f.Super.onPeers.call(this,a);for(var b=0,c=a.users.length;b<c;b++){this.addPeer(a.users[b])}if(!!this.joinCB)this.joinCB.apply(this,[null,{clients:this.peers}])},onPeerConnected:function(a){f.Super.onPeerConnected.call(this,a);this.addPeer(a)},onPeerRemoved:function(a){f.Super.onPeerRemoved.call(this,a);$xirsys.events.getInstance().emit('remove',a)}}})})();