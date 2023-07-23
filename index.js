const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');

const app = express();
require('dotenv').config();
// Middleware
app.use(cors()); // to enable CORS
app.use(bodyParser.json()); // to parse JSON

app.post('/send-invoice', async (req, res) => {
  const { email, invoice } = req.body;

  console.log('print request');
  console.log(email);

  console.log(invoice);

  const storeId = invoice.storeId;
  console.log(storeId);
  console.log(invoice);

  const formatInvoiceForEmail = invoice => {
    let services = '';

    if (invoice.orderDetails && invoice.orderDetails.services) {
      invoice.orderDetails.services.forEach(service => {
        services += `${service.name}, Price: ${service.price}\n    `;
      });
    }

    let products = '';

    if (invoice.orderDetails && invoice.orderDetails.products) {
      invoice.orderDetails.products.forEach(product => {
        products += `${product.name}, Price: ${product.price}\n    `;
      });
    }

    return `
    Store ID: ${invoice.storeId}
    Cashier ID: ${invoice.cashierId}
    Customer Name: ${invoice.customerName}
    Customer Contact: ${invoice.customerContact}
    Customer Address: ${invoice.customerAddress}
    
    Products: 
    ${products}
    Services: 
    ${services}
    Payment Type: ${invoice.paymentType}
    Total Amount: ${invoice.totalAmount}
    Status: ${invoice.status}
    `;
  };

  console.log('storeID: ', invoice.storeId);
  console.log('cashierID: ', invoice.cashierId);

  let formattedInvoice = formatInvoiceForEmail(invoice);

  console.log(`Email: ${process.env.EMAIL}`);
  console.log(`Password: ${process.env.PASSWORD}`);
  // Create a Nodemailer transporter object (using Gmail for this example)
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    },
  });

  let mailOptions = {
    from: process.env.EMAIL, // sender
    to: email, // receiver
    subject: 'Invoice',
    text: `Here is your invoice:\n\n${formattedInvoice}`,
  };

  // Send email
  try {
    await transporter.sendMail(mailOptions);

    // Print Invoice
    let printer = new ThermalPrinter({
      type: PrinterTypes.EPSON, // Printer type: 'star' or 'epson'
      interface: 'printer:POS-58', // Printer interface
      options: {
        timeout: 5000, // Connection timeout (ms) - default: 3000
      },
    });

    printer.alignCenter();
    printer.println(`Invoice: \n${formattedInvoice}`);
    printer.cut(); // Cuts the paper
    await printer.execute();
    console.error('Print done!');

    res.json({ success: 'Email sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error sending email or printing invoice' });
  }
});

const port = 5000;
app.listen(port, () => console.log(`Server started on port ${port}`));
