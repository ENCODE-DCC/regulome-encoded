// Require all components to ensure javascript load ordering
require('./app');
require('./footer');
require('./globals');
require('./testing');
require('./regulome_search');
require('./regulome_summary');
require('./regulome_help');


module.exports = require('./app');
