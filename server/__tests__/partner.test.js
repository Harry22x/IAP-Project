const { versions } = require('../partner');

const v1Body = [{ id: 1, title: 'Write report', dueDate: '2026-11-02' }];
const v2Body = {
    data: [{ id: 1, title: 'Write report', due: '2026-11-02' }],
    count: 1,
};
const wanted = [{ title: 'Write report', dueDate: '2026-11-02' }];

test('v1 and v2 give the page exactly the same thing', () => {
    expect(versions.v1.parse(v1Body)).toEqual(wanted);
    expect(versions.v2.parse(v2Body)).toEqual(wanted);
});

test('the wrong parser fails loudly, not quietly', () => {
    expect(() => versions.v1.parse(v2Body)).toThrow();
    expect(() => versions.v2.parse(v1Body)).toThrow('unexpected v2 shape');
});

