import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function generatePurchaseOrder(order: any, role: 'buyer' | 'supplier' | 'admin') {
  const doc = new jsPDF();
  const title = role === 'supplier' ? 'INVOICE' : 'PURCHASE ORDER';
  
  doc.setFontSize(20);
  doc.text(`THREADMARK ${title}`, 14, 22);
  
  doc.setFontSize(10);
  doc.text(`Order Number: ${order.order_number || order.id?.substring(0, 8) || 'N/A'}`, 14, 32);
  doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 14, 38);
  doc.text(`Status: ${order.status.toUpperCase()}`, 14, 44);

  // Bill To (Buyer)
  doc.setFontSize(12);
  doc.text('Bill To:', 14, 55);
  doc.setFontSize(10);
  if (order.buyer_email || role === 'buyer') {
    doc.text(`Email: ${order.buyer_email || 'Your account email'}`, 14, 62);
    if (order.buyer_business_type) {
      doc.text(`Business: ${order.buyer_business_type}`, 14, 68);
    }
  } else {
    doc.text('Account details hidden', 14, 62);
  }

  // Ship To
  doc.setFontSize(12);
  doc.text('Ship To:', 100, 55);
  doc.setFontSize(10);
  if (order.shipping_info) {
    const address = order.shipping_info.address || 'Address not provided';
    const cityState = `${order.shipping_info.city || ''} ${order.shipping_info.state || ''} ${order.shipping_info.pincode || ''}`.trim();
    doc.text(address, 100, 62);
    if (cityState) {
      doc.text(cityState, 100, 68);
    }
  } else {
    doc.text('Shipping address not provided', 100, 62);
  }

  // Items table
  const tableData = order.items?.map((item: any) => [
    item.product_name || 'Fabric',
    item.supplier_name || 'Assigned Supplier',
    `${item.quantity}m`,
    `Rs ${Number(item.price_at_order || item.price || 0).toFixed(2)}`,
    `Rs ${(item.quantity * Number(item.price_at_order || item.price || 0)).toFixed(2)}`
  ]) || [];

  autoTable(doc, {
    startY: 85,
    head: [['Product', 'Supplier', 'Quantity', 'Unit Price', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [41, 51, 92] }, // indigo-dye
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 85;
  doc.setFontSize(12);
  doc.text(`Grand Total: Rs ${Number(order.total).toFixed(2)}`, 14, finalY + 15);
  
  doc.setFontSize(8);
  doc.text('Generated securely by ThreadMark B2B Marketplace', 14, finalY + 30);

  doc.save(`ThreadMark_${title}_${order.order_number || 'Order'}.pdf`);
}
