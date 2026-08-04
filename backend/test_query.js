const {pool} = require('./dist/config/db.js'); 
pool.query("SELECT count(DISTINCT r.id) FROM rfq_requests r LEFT JOIN products p ON p.id=r.product_id LEFT JOIN rfq_quotes q ON q.rfq_request_id=r.id WHERE (p.supplier_id='00000000-0000-0000-0000-000000000000' OR r.product_id IS NULL) AND (r.status='open' OR (q.status='pending' AND q.proposed_by='buyer'))")
.then(res => console.log(res.rows))
.catch(console.error)
.finally(() => process.exit(0))
