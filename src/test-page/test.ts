export { }; // TS module

const init = () => {
    console.log('Test Page Logic Initializing...');
    const resultDiv = document.getElementById('result');
    if (resultDiv) resultDiv.innerText = 'Ready. Click a button.';

    const log = (msg: string) => {
        if (resultDiv) resultDiv.textContent += '\n' + msg;
        console.log(msg);
    };

    document.getElementById('fetch-get')?.addEventListener('click', async () => {
        log('Fetching GET...');
        try {
            const res = await fetch('https://jsonplaceholder.typicode.com/todos/1');
            const data = await res.json();
            log('Fetch GET Success: ' + JSON.stringify(data).substring(0, 50) + '...');
        } catch (e) {
            log('Fetch GET Error: ' + e);
        }
    });

    document.getElementById('fetch-post')?.addEventListener('click', async () => {
        log('Fetching POST...');
        try {
            const res = await fetch('https://jsonplaceholder.typicode.com/posts', {
                method: 'POST',
                body: JSON.stringify({
                    title: 'foo',
                    body: 'bar',
                    userId: 1,
                }),
                headers: {
                    'Content-type': 'application/json; charset=UTF-8',
                },
            });
            const data = await res.json();
            log('Fetch POST Success: ' + JSON.stringify(data).substring(0, 50) + '...');
        } catch (e) {
            log('Fetch POST Error: ' + e);
        }
    });

    document.getElementById('xhr-get')?.addEventListener('click', () => {
        log('XHR GET...');
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://jsonplaceholder.typicode.com/comments?postId=1');
        xhr.onload = () => log('XHR GET Success: ' + xhr.responseText.substring(0, 50) + '...');
        xhr.onerror = () => log('XHR GET Error');
        xhr.send();
    });

    document.getElementById('untracked')?.addEventListener('click', () => {
        log('Untracked Request...');
        fetch('https://example.com').catch(e => log('Untracked fetch error (expected if CORS/network): ' + e));
    });
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
