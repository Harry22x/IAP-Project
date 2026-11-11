// partner.js: The ONE place that knows the shape of your partner's API.
const versions = {
    v1: {
        path: '/tasks',
        parse: (body) => {
            if (!Array.isArray(body)) throw new Error('unexpected v1 shape');
            return body.map((t) => ({ title: t.title, dueDate: t.dueDate }));
        },
    },
    v2: {
        path: '/v2/tasks',
        parse: (body) => {
            if (!Array.isArray(body?.data)) throw new Error('unexpected v2 shape');
            return body.data.map((t) => ({ title: t.title, dueDate: t.due }));
        },
    },
};

module.exports = { versions };

