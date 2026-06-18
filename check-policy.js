const { POLICIES } = require('./app/data/policies');

const policy = POLICIES.find(p => p.id === 'thai-2022-01');
console.log('Policy with ID "thai-2022-01":', policy || 'NOT FOUND');

// Show first 3 policies
console.log('\nFirst 3 policies:');
console.log(POLICIES.slice(0, 3).map(p => ({ id: p.id, title: p.title })));
