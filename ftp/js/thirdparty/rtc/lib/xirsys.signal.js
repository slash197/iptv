'use strict';
(function() {
    $xirsys.class.create({
        namespace: 'socket',
        constructor: function(b, a, d) {
            this.url = b;
            this.httpUrl = (!!a) ? a : b.replace('ws:', 'http:').replace('wss:', 'https:');
            this.options = $xirsys.extend(this.options, d);
            this.openSocket()
        },
        fields: {
            isClosed: true,
            readyState: 3,
            url: "",
            httpUrl: "",
            options: {},
            transport: null,
            tn: 0
        },
        methods: {
            xhrSend: function(b) {
                if (this.readyState != $xirsys.signal.CONNECTING && this.readyState != $xirsys.signal.OPEN) {
                    return false
                }
                var a = this;
                $xirsys.ajax.do({
                    url: a.httpUrl,
                    method: 'POST',
                    data: b,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8',
                        'X-Socket-Transport': 'xhrPolling'
                    }
                }).done(function(b) {
                    if (b && b.length !== 0) {
                        a.onmessage({
                            'data': b
                        })
                    }
                });
                return true
            },
            websocket: function() {
                if (!!this.options && this.options.disableWebSocket) {
                    return false
                }
                if (window.WebSocket) {
                    this.transport = window.WebSocket
                }
                if (window.MozWebSocket && navigator.userAgent.indexOf("Firefox/6.0") == -1) {
                    this.transport = window.MozWebSocket
                }
                if (!!this.transport) {
                    return {
                        'heart': true,
                        'transport': this.transport
                    }
                }
                return null
            },
            eventPolling: function() {
                if (!!this.options && this.options.disableEventSource) {
                    return false
                }
                if (!window.EventSource) {
                    return false
                }
                var a = new window.EventSource(this.httpUrl);
                a.onopen = function() {
                    d.readyState = $xirsys.signal.OPEN;
                    d.onopen()
                };
                a.onmessage = function(b) {
                    d.onmessage(b)
                };
                a.onerror = function() {
                    a.close();
                    a = undefined;
                    d.onerror()
                };
                var d = {
                    readyState: $xirsys.signal.CONNECTING,
                    send: this.xhrSend,
                    close: function() {
                        d.readyState = $xirsys.signal.CLOSED;
                        a.close();
                        a = undefined;
                        d.onclose()
                    }
                };
                return {
                    'heart': false,
                    'transport': function() {
                        return d
                    }
                }
            },
            xhrPolling: function() {
                if (!!this.options && this.options.disableXHRPolling) {
                    return false
                }
                var b;
                var a = null;
                var d = {
                    readyState: $xirsys.signal.CONNECTING,
                    send: xhrSend,
                    close: function() {
                        this.readyState = $xirsys.signal.CLOSED;
                        if (a) {
                            a.abort();
                            a = null
                        }
                        clearTimeout(b);
                        d.onclose()
                    },
                    onopen: function() {},
                    onmessage: function() {},
                    onerror: function() {},
                    onclose: function() {}
                };
                self.nextPoll();
                return {
                    'heart': false,
                    'transport': function() {
                        return d
                    }
                }
            },
            poll: function() {
                xhr = $xirsys.ajax.do({
                    url: this.httpUrl,
                    method: 'GET',
                    data: {},
                    headers: {
                        'X-Socket-Transport': 'xhrPolling'
                    }
                }).done(function($data) {
                    xhr = null;
                    if (fake.readyState == $xirsys.signal.CONNECTING) {
                        fake.readyState = $xirsys.signal.OPEN;
                        fake.onopen(fake)
                    }
                    if ($data && $data.length !== 0) {
                        fake.onmessage({
                            'data': $data
                        })
                    }
                    if (fake.readyState == $xirsys.signal.OPEN) {
                        this.nextPoll()
                    }
                }).fail(function(b) {
                    b = null;
                    fake.onerror()
                })
            },
            nextPoll: function() {
                timeout = setTimeout(function() {
                    this.poll()
                }, 100)
            },
            next: function() {
                var b = 0,
                    a = {
                        websocket: this.websocket,
                        eventPolling: this.eventPolling,
                        xhrPolling: this.xhrPolling
                    };
                for (var d in a) {
                    if (this.tn == b) {
                        var c = a[d]();
                        if (c) {
                            var e = new c.transport(this.url);
                            e.heart = c.heart;
                            return e
                        }
                        this.tn++
                    }
                    b++
                }
                return false
            },
            openSocket: function() {
                var a = this,
                    d, c = 80,
                    e = 80,
                    f = 10000;
                a.readyState = $xirsys.signal.CLOSED, a.isClosed = true;

                function g() {
                    a.isClosed = false;
                    a.readyState = $xirsys.signal.CONNECTING;
                    a.transport = a.next();
                    if (!a.transport) {
                        c = e;
                        a.tn = 0;
                        a.ondisconnect();
                        setTimeout(function() {
                            g()
                        }, f);
                        return false
                    }
                    a.transport.onopen = function() {
                        c = e;
                        if (a.transport.heart) {
                            d = setInterval(function() {
                                a.send('ping');
                                a.onheartbeat()
                            }, 20000)
                        }
                        if (a.readyState != $xirsys.signal.OPEN) {
                            a.readyState = $xirsys.signal.OPEN;
                            a.onopen()
                        }
                    };
                    a.transport.onclose = function() {
                        if (a.isClosed || a.readyState == $xirsys.signal.CLOSED) {
                            return
                        }
                        a.transport = null;
                        clearInterval(d);
                        if (a.readyState == $xirsys.signal.CLOSING) {
                            a.readyState = $xirsys.signal.CLOSED;
                            a.transport = false;
                            a.onclose()
                        } else {
                            if (a.readyState == $xirsys.signal.CONNECTING) {
                                a.tn++
                            }
                            c *= 2;
                            if (c > f) {
                                c = f
                            }
                            a.isClosed = true;
                            setTimeout(function() {
                                g()
                            }, c)
                        }
                    };
                    a.transport.onerror = function(b) {
                        a.onerror(b)
                    };
                    a.transport.onmessage = function(b) {
                        a.onmessage(b)
                    }
                }
                g();
                this.onopen = function() {};
                this.onmessage = function() {};
                this.ondisconnect = function() {};
                this.onclose = function() {};
                this.onheartbeat = function() {};
                this.onerror = function() {}
            },
            send: function(b) {
                if (!!this.transport) {
                    return this.transport.send(b)
                } else {
                    return false
                }
            },
            close: function() {
                this.readyState = $xirsys.signal.CLOSING;
                if (this.transport) {
                    this.transport.close()
                }
            },
            setURL: function(b) {
                this.url = b
            }
        },
        statics: {
            CONNECTING: 0,
            OPEN: 1,
            CLOSING: 2,
            CLOSED: 3
        }
    });
    $xirsys.class.create({
        namespace: 'signal',
        constructor: function(b) {
            if (!!b) {
                $xirsys.signal.wsList = b + "signal/list?secure=0";
                $xirsys.signal.tokenUrl = b + "signal/token"
            }
        },
        inherits: $xirsys.socket,
        fields: {
            token: "",
            wsUrl: "",
            sock: null,
            xirsys_opts: null,
            room_key: ''
        },
        methods: {
            connect: function(d) {
                var c = this;
                this.room_key = "/" + d.domain + "/" + d.application + "/" + d.room;
                this.xirsys_opts = d;
                c.getToken(null, null, function(a) {
                    c.getSocketEndpoints(function(b) {
                        c.sock = new $xirsys.socket(b + "/" + a);
                        c.sock.onmessage = c.handleService.bind(c);
                        c.sock.onopen = c.onOpen.bind(c);
                        c.sock.ondisconnect = c.onDisconnect.bind(c);
                        c.sock.onclose = c.onClose.bind(c);
                        c.sock.onerror = c.onError.bind(c)
                    })
                })
            },
            close: function() {
                this.sock.close()
            },
            send: function(b, a, d, c) {
                var e = {
                    t: "u",
                    m: {
                        f: this.room_key + "/" + this.xirsys_opts.username,
                        t: d,
                        o: b
                    },
                    p: a
                }
                if (!!c && (c == "pub" || c == "sub")) {
                    e.t = "tm";
                    e.m.o = c
                }
                var pkt = JSON.stringify(e);
				this.sock.send(pkt)
            },
            handleService: function(b) {
                var a = JSON.parse(b.data);
                if (!a.t) {
                    this.onError({
                        message: "invalid message received",
                        data: a
                    })
                }
                switch (a.t) {
                    case "u":
                        this.handleUserService(a);
                        break;
                    case "tm":
                        this.handleMCUAck(a);
                        break;
                    default:
                        console.log("don't know this packet type " + a.t)
                }
            },
            handleUserService: function(b) {
                var a = null;
                if (b.m.f) {
                    a = b.m.f.split("/");
                    a = a[a.length - 1]
                }
                switch (b.m.o) {
                    case "peers":
                        this.onPeers(b.p);
                        break;
                    case "peer_connected":
                        this.onPeerConnected(b.m.f);
                        break;
                    case "peer_removed":
                        this.onPeerRemoved(a);
                        break;
                    default:
                        this.onMessage({
                            type: b.m.o,
                            sender: b.m.f,
                            data: b.p,
                            peer: a
                        });
                        break
                }
            },
            handleMCUAck: function(b) {
                console.log("got an ack from MCU")
            },
            getToken: function(b, a, d) {
                var c = this;
                $xirsys.ajax.do({
                    url: b || $xirsys.signal.tokenUrl,
                    method: 'POST',
                    data: a || c.xirsys_opts
                }).done(function(a) {
                    if (!!a.e) {
                        c.onError(a.e);
                        return
                    }
                    c.token = a.d.token;
                    d.apply(this, [c.token])
                })
            },
            getSocketEndpoints: function(a) {
                var d = this;
                var c = $xirsys.ajax.do({
                    url: $xirsys.signal.wsList,
                    method: 'GET',
                    data: {}
                }).done(function(b) {
                    if (!!b.e) {
                        d.onError(b.e);
                        return
                    }
                    d.wsUrl = b.d.value + "/v2";
                    a.apply(this, [d.wsUrl])
                })
            },
            onOpen: function() {
                $xirsys.events.getInstance().emit($xirsys.signal.open)
            },
            onPeers: function(b) {
                $xirsys.events.getInstance().emit($xirsys.signal.peers, b)
            },
            onPeerConnected: function(b) {
                $xirsys.events.getInstance().emit($xirsys.signal.peerConnected, b)
            },
            onPeerRemoved: function(b) {
                $xirsys.events.getInstance().emit($xirsys.signal.peerRemoved, b)
            },
            onMessage: function(b) {
                $xirsys.events.getInstance().emit($xirsys.signal.message, b)
            },
            onDisconnect: function() {
                $xirsys.events.getInstance().emit($xirsys.signal.disconnected)
            },
            onClose: function() {
                $xirsys.events.getInstance().emit($xirsys.signal.closed)
            },
            onError: function(b) {
                $xirsys.events.getInstance().emit($xirsys.signal.error, b)
            }
        },
        statics: {
            wsList: $xirsys.baseUrl + "signal/list?secure=1",
            tokenUrl: $xirsys.baseUrl + "signal/token",
            open: "signalling.open",
            peers: "signalling.peers",
            peerConnected: "signalling.peer.connected",
            peerRemoved: "signalling.peer.removed",
            message: "signalling.message",
            disconnected: "signalling.disconnected",
            closed: "signalling.closed",
            error: "signalling.error"
        }
    })
})();