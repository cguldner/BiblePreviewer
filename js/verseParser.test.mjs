import test from 'node:test';
import assert from 'node:assert/strict';
import {getVerseFromString} from './verseParser.mjs';

test('parses single chapter/verse and updates previous chapter', () => {
    assert.deepEqual(getVerseFromString('3:16', ''), ['3', '16', '3', '16', '3']);
});

test('parses same-chapter range', () => {
    assert.deepEqual(getVerseFromString('3:16-18', ''), ['3', '16', '3', '18', '3']);
});

test('parses cross-chapter range', () => {
    assert.deepEqual(getVerseFromString('3:16-4:2', ''), ['3', '16', '4', '2', '4']);
});

test('uses previous chapter for shorthand verse entry', () => {
    assert.deepEqual(getVerseFromString('18', '3'), ['3', '18', '3', '18', '3']);
});

test('supports en dash and em dash separators', () => {
    assert.deepEqual(getVerseFromString('3:16–18', ''), ['3', '16', '3', '18', '3']);
    assert.deepEqual(getVerseFromString('3:16—18', ''), ['3', '16', '3', '18', '3']);
});
