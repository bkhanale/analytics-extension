(function () {
    console.log('Network Tracker Hook Loaded');

    // Utility: Glob to Regex
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

    // Utility: Deep Property Accessor
    function getNestedProperty(obj, path) {
        if (!obj || !path) return undefined;
        var keys = path.split('.');
        var current = obj;
        for (var i = 0; i < keys.length; i++) {
            if (current === null || current === undefined) return undefined;
            current = current[keys[i]];
        }
        return current;
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

    function getMatchingRule(url, method) {
        var rules = getRules();
        var matchedRule = null;
        rules.some(function (rule) {
            if (rule.methods.indexOf(method) === -1 && rule.methods.indexOf('OPTIONS') === -1) return false;
            if (matchesGlob(url, rule.urlPattern)) {
                matchedRule = rule;
                return true;
            }
            return false;
        });
        if (matchedRule) console.log('[NT Hook] Matched:', method, url, 'Rule:', matchedRule.urlPattern);
        return matchedRule;
    }

    function generateId() {
        return 'req_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    function sendEvent(log) {
        // console.log('[NT Hook] Sending:', log);
        window.postMessage({ type: 'NETWORK_EVENT', payload: log }, '*');
    }

    function safeJson(text) {
        try {
            return JSON.parse(text);
        } catch (e) {
            // Heuristic for "Dirty JSON": {"key": "value"}&other=stuff sent as text content
            // We try to find the last valid closing brace that makes a valid JSON object.
            var lastBrace = text.lastIndexOf('}');
            if (lastBrace > 0) {
                try {
                    var cleaned = text.substring(0, lastBrace + 1);
                    return JSON.parse(cleaned);
                } catch (e2) { }
            }
            return text;
        }
    }

    // PATCH FETCH
    window.fetch = async function () {
        var args = Array.prototype.slice.call(arguments);
        var resource = args[0];
        var config = args[1];
        var url = (resource instanceof Request) ? resource.url : resource.toString();
        var method = (config && config.method || ((resource instanceof Request) ? resource.method : 'GET')).toUpperCase();

        var rule = getMatchingRule(url, method);
        if (!rule) {
            return originalFetch.apply(window, args);
        }

        var id = generateId();
        var timestamp = Date.now();
        var requestBody = config && config.body;

        var reqBodyDisplay = requestBody;
        if (typeof requestBody === 'string') {
            reqBodyDisplay = safeJson(requestBody);
        }

        var log = {
            id: id,
            method: method,
            url: url,
            status: 0,
            requestBody: reqBodyDisplay,
            timestamp: timestamp,
            type: 'fetch',
            extractedRequestVar: getNestedProperty(reqBodyDisplay, rule.requestVar)
        };

        sendEvent(log);

        try {
            var response = await originalFetch.apply(window, args);
            var clone = response.clone();

            clone.text().then(function (text) {
                var resBody = safeJson(text);
                sendEvent({
                    id: id,
                    method: method,
                    url: url,
                    status: response.status,
                    requestBody: reqBodyDisplay,
                    responseBody: resBody,
                    timestamp: timestamp,
                    type: 'fetch',
                    extractedRequestVar: log.extractedRequestVar,
                    extractedResponseVar: getNestedProperty(resBody, rule.responseVar)
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
                type: 'fetch',
                extractedRequestVar: log.extractedRequestVar
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
        if (!this._nt_url) return originalSend.apply(this, arguments);

        var rule = getMatchingRule(this._nt_url, this._nt_method);
        if (!rule) {
            return originalSend.apply(this, arguments);
        }

        var id = this._nt_id;
        var method = this._nt_method;
        var url = this._nt_url;
        var timestamp = Date.now();
        var reqBodyDisplay = body;

        if (typeof body === 'string') reqBodyDisplay = safeJson(body);

        var log = {
            id: id,
            method: method,
            url: url,
            status: 0,
            requestBody: reqBodyDisplay,
            timestamp: timestamp,
            type: 'xhr',
            extractedRequestVar: getNestedProperty(reqBodyDisplay, rule.requestVar)
        };

        sendEvent(log);

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
                type: 'xhr',
                extractedRequestVar: log.extractedRequestVar,
                extractedResponseVar: getNestedProperty(resBody, rule.responseVar)
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
                type: 'xhr',
                extractedRequestVar: log.extractedRequestVar
            });
        });

        return originalSend.apply(this, arguments);
    };
})();
