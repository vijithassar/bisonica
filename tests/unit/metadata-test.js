import { data } from '../../source/data.js';
import { transplantFields } from '../../source/metadata.js';
import { encodingField } from '../../source/encodings.js';
import qunit from 'qunit';

const { module, test } = qunit;

module('unit > metadata', () => {

    const urlData = [
        { value: 1, group: 'a', label: '2020-01-01', url: 'https://example.com/a' },
        { value: 1, group: 'a', label: '2020-01-02', url: 'https://example.com/a' },
        { value: 2, group: 'b', label: '2020-01-03', url: 'https://example.com/b' },
        { value: 2, group: 'b', label: '2020-01-04', url: 'https://example.com/b' },
        { value: 2, group: 'b', label: '2020-01-05', url: 'https://example.com/b' },
        { value: 3, group: 'c', label: '2020-01-06', url: 'https://example.com/c' },
        { value: 3, group: 'c', label: '2020-01-07', url: 'https://example.com/c' },
    ];

    test('transfers urls to aggregated circular chart segments', (assert) => {
        const s = {
            data: {
                values: urlData,
            },
            mark: {
                type: 'arc',
            },
            encoding: {
                color: { field: 'group' },
                href: { field: 'url' },
                theta: { field: 'value' },
            },
        };

        const layout = data(s);

        assert.ok(layout.every((item) => item.url.startsWith('https://example.com/')));
    });

    test('transfers urls to aggregated stacked bar chart segments', (assert) => {
        const s = {
            data: {
                values: urlData,
            },
            mark: { type: 'bar' },
            encoding: {
                color: { field: 'group', type: 'nominal' },
                href: { field: 'url' },
                x: { field: 'label', type: 'temporal' },
                y: { aggregate: 'value', type: 'quantitative' },
            },
        };

        const layout = data(s);

        layout.forEach((series) => {
            series.forEach((item) => {
                const difference = Math.abs(item[1] - item[0]) !== 0;

                if (difference) {
                    const url = item[encodingField(s, 'href')];

                    assert.ok(url.startsWith('https://example.com/'));
                }
            });
        });
    });

    test('transplants urls between arbitrary data structures', (assert) => {
        const key = 'url';
        const aggregated = [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'd' }];
        const raw = [
            { type: 'a', url: 'https://www.example.com/1' },
            { type: 'a', url: 'https://www.example.com/1' },
            { type: 'a', url: 'https://www.example.com/1' },
            { type: 'b', url: 'https://www.example.com/2' },
            { type: 'c', url: 'https://www.example.com/3' },
            { type: 'd', url: 'https://www.example.com/4' },
            { type: 'd', url: 'https://www.example.com/5' },
        ];
        const matcher = (item, raw) => raw.filter((x) => x.type === item.key).map((item) => item.url);
        const badMatcher = (item, raw) => raw.filter((item) => typeof item === 'number');
        const hasUrl = (item) => typeof item[key] === 'string';

        assert.throws(
            () => transplantFields(null, raw, matcher, key),
            'requires valid aggregated data',
        );
        assert.throws(
            () => transplantFields(aggregated, null, matcher, key),
            'requires valid raw data',
        );
        assert.throws(() => transplantFields(aggregated, raw, null, key), 'requires matching function');

        const successful = transplantFields(aggregated, raw, matcher, key);
        const unsuccessful = transplantFields(aggregated, raw, badMatcher, key);

        assert.ok(Array.isArray(successful), 'returns an array');

        const originals = aggregated.every((item, index) => {
            return Object.keys(item).every((key) => successful[index][key] === aggregated[index][key]);
        });

        assert.ok(originals, 'retains all values from original aggregated data point');
        assert.ok(
            successful.filter((item) => item.key !== 'd').every((item) => hasUrl(item)),
            'transplants matching urls',
        );
        assert.ok(
            successful.filter((item) => item.key === 'd').every((item) => !hasUrl(item)),
            'does not transplant mismatched urls',
        );
        assert.ok(
            unsuccessful.every((item) => !hasUrl(item)),
            'does not transplant unmatched urls',
        );
    });
});
