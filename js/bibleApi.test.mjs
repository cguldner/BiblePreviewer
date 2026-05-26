import test from 'node:test';
import assert from 'node:assert/strict';
import {BIBLE_API_BASE_URL, DEFAULT_TRANS, buildVerseApiUrl} from './bibleApi.mjs';

if (typeof process.loadEnvFile === 'function') {
    process.loadEnvFile();
}

test('buildVerseApiUrl builds the expected verse lookup URL', () => {
    assert.equal(
        buildVerseApiUrl('JHN', '3', '16', '3', '16', DEFAULT_TRANS),
        `${BIBLE_API_BASE_URL}bibles/${DEFAULT_TRANS}/verses/JHN.3.16-JHN.3.16`
    );
});

test('Bible API returns content for a known verse lookup', {
    skip: !process.env.BIBLE_API_KEY,
}, async () => {
    const response = await fetch(buildVerseApiUrl('JHN', '3', '16', '3', '16', DEFAULT_TRANS), {
        headers: new Headers({
            'api-key': process.env.BIBLE_API_KEY,
        }),
        signal: AbortSignal.timeout(10_000),
    });

    const responseBody = await response.json();
    assert.equal(response.ok, true, `Bible API request failed with status ${response.status}`);
    assert.equal(responseBody.data.reference.includes('3:16'), true);
    assert.equal(typeof responseBody.data.content, 'string');
    assert.equal(responseBody.data.content.length > 0, true);
});
