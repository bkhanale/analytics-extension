(function () {
    console.log('Network Tracker Hook Loaded');
    // Utility: Glob to Regex (Inlined)
    function globToRegex(glob) {
        var escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&');
        var pattern = escaped.replace(/\*/g, '.*');
        return new RegExp('^' + pattern + '$', 'i');
    }

    function matchesGlob(url, glob) {
        try {
            var regex = globToRegex(glob);
            return regex.test(url);
        } catch (e) {
            console.warn('Invalid glob pattern:', glob, e);
            return false;
        }
    }

    // Logic
    var XHR = XMLHttpRequest.prototype;
    var originalOpen = XHR.open;
    var originalSend = XHR.send;
    var originalFetch = window.fetch;
    var cachedRules = null;

    function getRules() {
        if (cachedRules) return cachedRules;
        try {
            var data = document.documentElement.dataset.ntRules;
            if (data) {
                cachedRules = JSON.parse(data);
                console.log('[NT Hook] Rules loaded:', cachedRules);
                return cachedRules;
            }
        } catch (e) {
            console.error('Failed to parse NT rules', e);
        }
        return [];
    }

    // Try to load rules immediately
    getRules();

    function shouldTrack(url, method) {
        var rules = getRules();
        var match = rules.some(function (rule) {
            if (rule.methods.indexOf(method) === -1 && rule.methods.indexOf('OPTIONS') === -1) return false;
            return matchesGlob(url, rule.urlPattern);
        });
        if (match) console.log('[NT Hook] Matched:', method, url);
        return match;
    }

    function generateId() {
        return 'req_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    function sendEvent(log) {
        console.log('[NT Hook] Sending:', log);
        window.postMessage({ type: 'NETWORK_EVENT', payload: log }, '*');
    }

    function safeJson(text) {
        try { return JSON.parse(text); } catch (e) { return text; }
    }

    // PATCH FETCH
    window.fetch = async function () {
        var args = Array.prototype.slice.call(arguments);
        var resource = args[0];
        var config = args[1];
        var url = (resource instanceof Request) ? resource.url : resource.toString();
        var method = (config && config.method || ((resource instanceof Request) ? resource.method : 'GET')).toUpperCase();

        if (!shouldTrack(url, method)) {
            return originalFetch.apply(window, args);
        }

        var id = generateId();
        var timestamp = Date.now();
        var requestBody = config && config.body;

        var reqBodyDisplay = requestBody;
        if (typeof requestBody === 'string') {
            reqBodyDisplay = safeJson(requestBody);
        }

        sendEvent({
            id: id,
            method: method,
            url: url,
            status: 0,
            requestBody: reqBodyDisplay,
            timestamp: timestamp,
            type: 'fetch'
        });

        try {
            var response = await originalFetch.apply(window, args);
            var clone = response.clone();

            clone.text().then(function (text) {
                sendEvent({
                    id: id,
                    method: method,
                    url: url,
                    status: response.status,
                    requestBody: reqBodyDisplay,
                    responseBody: safeJson(text),
                    timestamp: timestamp,
                    type: 'fetch'
                });
            }).catch(function () { });

            return response;
        } catch (err) {
            sendEvent({
                id: id,
                method: method,
                url: url,
                status: -1,
                requestBody: reqBodyDisplay,
                responseBody: 'Network Error',
                timestamp: timestamp,
                type: 'fetch'
            });
            throw err;
        }
    };

    // PATCH XHR
    XHR.open = function (method, url) {
        this._nt_method = method.toUpperCase();
        this._nt_url = url.toString();
        this._nt_id = generateId();
        return originalOpen.apply(this, arguments);
    };

    XHR.send = function (body) {
        if (!this._nt_url || !shouldTrack(this._nt_url, this._nt_method)) {
            return originalSend.apply(this, arguments);
        }

        var id = this._nt_id;
        var method = this._nt_method;
        var url = this._nt_url;
        var timestamp = Date.now();
        var reqBodyDisplay = body;

        if (typeof body === 'string') reqBodyDisplay = safeJson(body);

        sendEvent({
            id: id,
            method: method,
            url: url,
            status: 0,
            requestBody: reqBodyDisplay,
            timestamp: timestamp,
            type: 'xhr'
        });

        this.addEventListener('load', function () {
            var resBody = null;
            try {
                if (this.responseType === '' || this.responseType === 'text') {
                    resBody = safeJson(this.responseText);
                } else if (this.responseType === 'json') {
                    resBody = this.response;
                } else {
                    resBody = '[' + this.responseType + ']';
                }
            } catch (e) {
                resBody = '[Error reading response]';
            }

            sendEvent({
                id: id,
                method: method,
                url: url,
                status: this.status,
                requestBody: reqBodyDisplay,
                responseBody: resBody,
                timestamp: timestamp,
                type: 'xhr'
            });
        });

        this.addEventListener('error', function () {
            sendEvent({
                id: id,
                method: method,
                url: url,
                status: -1,
                requestBody: reqBodyDisplay,
                responseBody: 'Network Error',
                timestamp: timestamp,
                type: 'xhr'
            });
        });

        return originalSend.apply(this, arguments);
    };
})();
