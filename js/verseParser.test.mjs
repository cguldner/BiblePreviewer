import test from 'node:test';
import assert from 'node:assert/strict';
import {getVerseFromString, splitReferenceDisplayText, splitVerseList} from './verseParser.mjs';

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

test('supports plain hyphen separator', () => {
    assert.deepEqual(getVerseFromString('3:16-18', ''), ['3', '16', '3', '18', '3']);
});

test('parses range ending with chapter-local shorthand', () => {
    assert.deepEqual(getVerseFromString('3:16-4', ''), ['3', '16', '3', '4', '3']);
});

test('uses previous chapter for shorthand range', () => {
    assert.deepEqual(getVerseFromString('16-18', '3'), ['3', '16', '3', '18', '3']);
});

test('updates previous chapter to range end chapter', () => {
    assert.deepEqual(getVerseFromString('3:30-4:2', ''), ['3', '30', '4', '2', '4']);
});

test('maintains chapter context across sequential entries', () => {
    let previousChapter = '';
    let output = getVerseFromString('3:16', previousChapter);
    previousChapter = output[4];
    output = getVerseFromString('18', previousChapter);
    previousChapter = output[4];
    output = getVerseFromString('4:1-2', previousChapter);

    assert.deepEqual(output, ['4', '1', '4', '2', '4']);
});


test('splits verse list using commas semicolons and and', () => {
    assert.deepEqual(splitVerseList('5:11, 6:9-11; 6:18-20 and 7:8-9'), ['5:11', '6:9-11', '6:18-20', '7:8-9']);
});

test('splits display text for and-separated references', () => {
    assert.deepEqual(
        splitReferenceDisplayText('I Corinthians 5:11, 6:9-11, 6:18-20, 7:1-3 and 7:8-9'),
        ['I Corinthians 5:11', '6:9-11', '6:18-20', '7:1-3', '7:8-9']
    );
});
