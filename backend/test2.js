import {pool} from './dist/config/db.js';
const sql = `SELECT DISTINCT o.id,o.buyer_id,o.shipping_info,o.status,o.total,o.created_at,COALESCE(json_agg(json_build_object('product_id',i.product_id,'quantity',i.quantity,'price_at_order',i.price_at_order)) FILTER(WHERE i.supplier_id='00000000-0000-0000-0000-000000000000'),'[]') items FROM orders o JOIN order_items i ON i.order_id=o.id WHERE i.supplier_id='00000000-0000-0000-0000-000000000000' GROUP BY o.id ORDER BY o.created_at DESC`;
pool.query(sql).then(() => console.log('OK')).catch(console.error).finally(() => process.exit());
