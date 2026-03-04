import test from 'node:test';
import assert from 'node:assert/strict';
import {getMatchedBookId} from './bibleBooks.mjs';

test('matches book patterns case-insensitively', () => {
    assert.equal(getMatchedBookId('GENESIS'), 'Gen');
    assert.equal(getMatchedBookId('gen'), 'Gen');
});

test('distinguishes numbered john from john', () => {
    assert.equal(getMatchedBookId('John'), 'Jhn');
    assert.equal(getMatchedBookId('1 John'), '1Jn');
    assert.equal(getMatchedBookId('First John'), '1Jn');
});

test('returns empty string for unknown books', () => {
    assert.equal(getMatchedBookId('NotABook'), '');
});

test('returns stable values across repeated lookups', () => {
    for (let index = 0; index < 1000; index++) {
        assert.equal(getMatchedBookId('John'), 'Jhn');
        assert.equal(getMatchedBookId('NotABook'), '');
    }
});
