// تهيئة المتغيرات
let products = JSON.parse(localStorage.getItem('products')) || [];
let cart = [];
let invoicesHistory = JSON.parse(localStorage.getItem('invoicesHistory')) || [];

// تهيئة متغيرات النافذة المنبثقة
const modal = document.getElementById('invoiceModal');
const span = document.getElementsByClassName('close')[0];

// إضافة منتج جديد للمخزون
document.getElementById('addProductForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const newProduct = {
        name: document.getElementById('productName').value,
        price: parseFloat(document.getElementById('productPrice').value),
        quantity: parseInt(document.getElementById('productQuantity').value)
    };
    
    // إضافة العملية إلى سجل المنتجات
    const historyEntry = {
        name: newProduct.name,
        supplier: document.getElementById('supplierName')?.value || 'غير محدد', // تأكد من إضافة حقل المورد في النموذج
        quantity: newProduct.quantity,
        price: newProduct.price,
        timestamp: new Date().toISOString()
    };
    
    // استرجاع السجل الحالي وإضافة العملية الجديدة
    const productHistory = JSON.parse(localStorage.getItem('productHistory') || '[]');
    productHistory.push(historyEntry);
    localStorage.setItem('productHistory', JSON.stringify(productHistory));
    
    // متابعة العمليات الحالية
    const existingProduct = products.find(p => 
        p.name.toLowerCase() === newProduct.name.toLowerCase() && 
        p.price === newProduct.price
    );
    
    if (existingProduct) {
        existingProduct.quantity += newProduct.quantity;
        alert(`تم تحديث كمية المنتج "${newProduct.name}" في المخزون`);
    } else {
        newProduct.id = Date.now();
        products.push(newProduct);
        alert(`تم إضافة المنتج "${newProduct.name}" للمخزون`);
    }
    
    saveProducts();
    updateProductSelect();
    this.reset();
});

// حفظ المنتجات في LocalStorage
function saveProducts() {
    localStorage.setItem('products', JSON.stringify(products));
}

// تحديث قائمة المنتجات في select
function updateProductSelect() {
    const select = document.getElementById('productSelect');
    select.innerHTML = '<option value="">اختر المنتج</option>';
    
    products.forEach(product => {
        if (product.quantity > 0) {
            select.innerHTML += `<option value="${product.id}">${product.name} - ${product.price} جنيه (متوفر: ${product.quantity})</option>`;
        }
    });
}

// إضافة منتج للسلة
function addToCart() {
    const productId = document.getElementById('productSelect').value;
    const quantity = parseInt(document.getElementById('saleQuantity').value);
    
    if (!productId || !quantity) {
        alert('الرجاء اختيار المنتج ');
        return;
    }
    
    const product = products.find(p => p.id == productId);
    if (!product) {
        alert('المنتج غير موجود');
        return;
    }
    
    if (product.quantity < quantity) {
        alert('الكمية المطلوبة غير متوفرة في المخزن');
        return;
    }
    
    const cartItem = {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: quantity,
        total: product.price * quantity
    };
    
    cart.push(cartItem);
    product.quantity -= quantity;
    
    saveProducts();
    updateProductSelect();
    updateCart();
    
    document.getElementById('saleQuantity').value = '';
}

// تحديث عرض السلة
function updateCart() {
    const cartItems = document.getElementById('cartItems');
    const totalAmount = document.getElementById('totalAmount');
    
    cartItems.innerHTML = '';
    
    cart.forEach((item, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.name}</td>
            <td>${item.price} جنيه</td>
            <td>
                <button onclick="updateQuantity(${index}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${index}, 1)">+</button>
            </td>
            <td>${item.total} جنيه</td>
            <td>
                <button class="delete-item" onclick="removeFromCart(${index})">×</button>
            </td>
        `;
        cartItems.appendChild(row);
    });
    
    const total = cart.reduce((sum, item) => sum + item.total, 0);
    totalAmount.textContent = total + ' جنيه';
}

// تحديث الكمية في السلة
function updateQuantity(index, change) {
    const item = cart[index];
    const product = products.find(p => p.id === item.id);
    
    if (change > 0 && product.quantity < 1) {
        alert('الكمية غير متوفرة في المخزن');
        return;
    }
    
    if (item.quantity + change < 1) {
        return;
    }
    
    if (change > 0) {
        product.quantity--;
    } else {
        product.quantity++;
    }
    
    item.quantity += change;
    item.total = item.price * item.quantity;
    
    saveProducts();
    updateProductSelect();
    updateCart();
}

// حذف منتج من السلة
function removeFromCart(index) {
    const item = cart[index];
    const product = products.find(p => p.id === item.id);
    product.quantity += item.quantity;
    
    cart.splice(index, 1);
    
    saveProducts();
    updateProductSelect();
    updateCart();
}

// إضافة وعرض الفاتورة
function createInvoice() {
    if (cart.length === 0) {
        alert('السلة فارغة');
        return;
    }
    
    const now = new Date();
    const invoice = {
        id: 'INV-' + Date.now(),
        // تنسيق التاريخ الميلادي
        date: now.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }),
        // تنسيق الوقت بنظام 12 ساعة
        time: now.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true // تغيير إلى نظام 12 ساعة
        }),
        items: JSON.parse(JSON.stringify(cart)),
        total: cart.reduce((sum, item) => sum + item.total, 0)
    };
    
    invoicesHistory.push(invoice);
    localStorage.setItem('invoicesHistory', JSON.stringify(invoicesHistory));
    
    displayInvoice(invoice);
    
    cart = [];
    updateCart();
}

// عرض الفاتورة
function displayInvoice(invoice) {
    document.getElementById('invoiceNumber').textContent = invoice.id;
    document.getElementById('invoiceDate').textContent = invoice.date;
    document.getElementById('invoiceTime').textContent = invoice.time;
    
    const invoiceItems = document.getElementById('invoiceItems');
    invoiceItems.innerHTML = invoice.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.price} جنيه</td>
            <td>${item.quantity}</td>
            <td>${item.total} جنيه</td>
        </tr>
    `).join('');
    
    document.getElementById('invoiceTotalAmount').textContent = invoice.total + ' جنيه';
    modal.style.display = 'block';
}

// عرض سجل الفواتير
function showInvoicesHistory() {
    const historyModal = document.getElementById('invoicesHistoryModal');
    const invoicesList = document.getElementById('invoicesList');
    
    invoicesList.innerHTML = `
        <div style="text-align: left; margin-bottom: 15px;">
            <button onclick="confirmDeleteAllInvoices()" class="delete-all-btn" 
                    style="background-color: #e74c3c; 
                           color: white; 
                           padding: 8px 15px; 
                           border: none; 
                           border-radius: 4px; 
                           cursor: pointer;">
                حذف جميع الفواتير
            </button>
        </div>
    `;
    
    if (invoicesHistory.length === 0) {
        invoicesList.innerHTML += '<p>لا توجد فواتير سابقة</p>';
    } else {
        invoicesHistory.slice().reverse().forEach(invoice => {
            const invoiceElement = document.createElement('div');
            invoiceElement.className = 'invoice-record';
            invoiceElement.innerHTML = `
                <h3>رقم الفاتورة: ${invoice.id}</h3>
                <p>التاريخ: ${invoice.date}</p>
                <p>الوقت: ${invoice.time}</p>
                <p>الإجمالي: ${invoice.total} جنيه</p>
                <button onclick="showInvoiceDetails('${invoice.id}')" class="show-details-btn">
                    عرض التفاصيل
                </button>
            `;
            invoicesList.appendChild(invoiceElement);
        });
    }
    
    historyModal.style.display = 'block';
}

// عرض تفاصيل فاتورة معينة
function showInvoiceDetails(invoiceId) {
    const invoice = invoicesHistory.find(inv => inv.id === invoiceId);
    if (invoice) {
        displayInvoice(invoice);
        document.getElementById('invoicesHistoryModal').style.display = 'none';
    }
}

// إغلاق النوافذ المنبثقة
span.onclick = function() {
    modal.style.display = 'none';
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
    if (event.target == document.getElementById('invoicesHistoryModal')) {
        document.getElementById('invoicesHistoryModal').style.display = 'none';
    }
}

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', function() {
    updateProductSelect();
    updateCart();
});

// طباعة الفاتورة
function printInvoice() {
    const customerFormWindow = window.open('', 'customerForm', 'width=400,height=400');
    
    const formContent = `
        <html dir="rtl">
        <head>
            <title>بيانات الفاتورة</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
                
                body {
                    font-family: 'Cairo', sans-serif;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                
                .form-container {
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                
                h3 {
                    margin-bottom: 20px;
                    color: #2193b0;
                    text-align: center;
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                    color: #333;
                }
                
                input {
                    width: 100%;
                    padding: 8px;
                    border: 2px solid #ddd;
                    border-radius: 4px;
                    font-size: 14px;
                    margin-bottom: 10px;
                }
                
                input:focus {
                    border-color: #2193b0;
                    outline: none;
                    box-shadow: 0 0 0 3px rgba(33, 147, 176, 0.2);
                }
                
                .buttons {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 20px;
                }
                
                button {
                    padding: 8px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                    transition: all 0.3s ease;
                }
                
                .print-btn {
                    background: linear-gradient(135deg, #2193b0, #6dd5ed);
                    color: white;
                }
                
                .cancel-btn {
                    background: #e74c3c;
                    color: white;
                }
                
                button:hover {
                    transform: translateY(-2px);
                }

                .error {
                    color: #e74c3c;
                    font-size: 12px;
                    margin-top: -8px;
                    margin-bottom: 8px;
                }
            </style>
        </head>
        <body>
            <div class="form-container">
                <h3>بيانات الفاتورة</h3>
                <form id="customerForm">
                    <div class="form-group">
                        <label for="customerName">اسم العميل:</label>
                        <input type="text" id="customerName" value=" ">
                    </div>
                    <div class="form-group">
                        <label for="phoneNumber">رقم الهاتف:</label>
                        <input type="tel" 
                               id="phoneNumber" 
                               placeholder="" 
                               maxlength="11"
                               pattern="[0-9]{1,11}" 
                               title="الرجاء إدخال رقم هاتف صحيح">
                        <div id="phoneError" class="error"></div>
                    </div>
                    <div class="form-group">
                        <label for="discount">قيمة الخصم:</label>
                        <input type="number" id="discount" value="" min="0" step="0.01">
                    </div>
                    <div class="buttons">
                        <button type="submit" class="print-btn">طباعة الفاتورة</button>
                        <button type="button" class="cancel-btn" onclick="window.close()">إلغاء</button>
                    </div>
                </form>
            </div>
            <script>
                document.getElementById('customerForm').onsubmit = function(e) {
                    e.preventDefault();
                    
                    const phoneNumber = document.getElementById('phoneNumber').value;
                    const phoneError = document.getElementById('phoneError');
                    
                    // التحقق من صحة رقم الهاتف (يقبل من 1 إلى 11 رقم)
                    if (phoneNumber && !/^[0-9]{1,11}$/.test(phoneNumber)) {
                        phoneError.textContent = 'الرجاء إدخال رقم هاتف صحيح (11 رقم كحد أقصى)';
                        return false;
                    }
                    
                    const customerName = document.getElementById('customerName').value || 'عميل نقدي';
                    const discount = parseFloat(document.getElementById('discount').value) || 0;
                    
                    window.opener.completePrintInvoice(customerName, phoneNumber, discount);
                    window.close();
                };
                
                // التحقق من الأرقام فقط أثناء الكتابة
                document.getElementById('phoneNumber').oninput = function(e) {
                    this.value = this.value.replace(/[^0-9]/g, '');
                    document.getElementById('phoneError').textContent = '';
                };
                
                // منع لصق أي شيء غير الأرقام
                document.getElementById('phoneNumber').onpaste = function(e) {
                    let pasteData = (e.clipboardData || window.clipboardData).getData('text');
                    if (!/^[0-9]*$/.test(pasteData)) {
                        e.preventDefault();
                    }
                };
            </script>
        </body>
        </html>
    `;
    
    customerFormWindow.document.write(formContent);
    customerFormWindow.document.close();
}

// دالة إكمال طباعة الفاتورة
function completePrintInvoice(customerName, phoneNumber, discount) {
    const printWindow = window.open('', '', 'width=300,height=600');
    
    // حساب المبالغ بشكل مبسط
    const subtotal = parseFloat(document.getElementById('invoiceTotalAmount').textContent);
    const discountAmount = parseFloat(discount) || 0; // قيمة الخصم
    const finalTotal = Math.max(0, subtotal - discountAmount); // المجموع النهائي بعد الخصم (لا يقل عن صفر)
    
    const invoiceContent = `
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>طباعة الفاتورة</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
                
                body {
                    font-family: 'Cairo', sans-serif;
                    padding: 0;
                    margin: 0;
                    direction: rtl;
                    width: 80mm;
                    background-color: white;
                }
                
                .invoice-container {
                    padding: 5mm;
                }
                
                .header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .logo {
                    width: 50px;
                    height: 50px;
                }
                
                .logo img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }
                
                .store-details {
                    text-align: center;
                    flex-grow: 1;
                }
                
                .system-name {
                    font-size: 16px;
                    font-weight: bold;
                    margin-bottom: 3px;
                }
                
                .store-info {
                    font-size: 11px;
                    line-height: 1.2;
                }
                
                .customer-info {
                    margin: 8px 0;
                    padding: 5px;
                    background-color: #f9f9f9;
                    border-radius: 4px;
                    font-size: 12px;
                }
                
                .invoice-header {
                    text-align: center;
                    font-size: 11px;
                    border-top: 1px dashed #000;
                    border-bottom: 1px dashed #000;
                    padding: 3px 0;
                    margin: 5px 0;
                }
                
                .order-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 5px 0;
                    font-size: 11px;
                }
                
                .order-table th {
                    border-bottom: 1px solid #000;
                    padding: 3px;
                }
                
                .order-table td {
                    padding: 3px;
                    border-bottom: 1px dotted #ccc;
                }
                
                .total-section {
                    margin-top: 5px;
                    padding-top: 3px;
                    border-top: 1px dashed #000;
                    font-size: 12px;
                }
                
                .discount {
                    color: #e74c3c;
                    font-weight: bold;
                }
                
                .footer {
                    text-align: center;
                    margin-top: 8px;
                    padding-top: 5px;
                    border-top: 1px dashed #000;
                    font-size: 11px;
                    line-height: 1.2;
                }
                
                @media print {
                    @page {
                        margin: 0;
                        size: 80mm auto;
                    }
                    
                    html, body {
                        width: 80mm;
                        margin: 0;
                        padding: 3mm;
                    }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="header-section">
                    <div class="store-details">
                        <div class="system-name"> مطعم Sabry</div>
                        <div class="store-info">
                            <p>فرع المدينة</p>
                            <p>هاتف: 0123456789</p>
                        </div>
                    </div>
                    <div class="logo">
                        <img src="https://img.icons8.com/color/96/000000/cash-register.png" alt="شعار المتجر">
                    </div>
                </div>
                
                <div class="customer-info">
                    <p>اسم العميل: ${customerName}</p>
                    ${phoneNumber ? `<p>رقم الهاتف: ${phoneNumber}</p>` : ''}
                </div>
                
                <div class="invoice-header">
                    <p>فاتورة مبيعات</p>
                    <p>رقم الفاتورة: ${document.getElementById('invoiceNumber').textContent}</p>
                    <p>التاريخ: ${document.getElementById('invoiceDate').textContent}</p>
                    <p>الوقت: ${document.getElementById('invoiceTime').textContent}</p>
                </div>
                
                <table class="order-table">
                    <thead>
                        <tr>
                            <th>الصنف</th>
                            <th>السعر</th>
                            <th>الكمية</th>
                            <th>المجموع</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${document.getElementById('invoiceItems').innerHTML}
                    </tbody>
                </table>
                
                <div class="total-section">
                    <table style="width: 100%;">
                        <tr>
                            <td style="text-align: right;">المجموع:</td>
                            <td style="text-align: left;">${subtotal.toFixed(2)} جنيه</td>
                        </tr>
                        ${discountAmount > 0 ? `
                        <tr class="discount">
                            <td style="text-align: right;">الخصم:</td>
                            <td style="text-align: left;">- ${discountAmount.toFixed(2)} جنيه</td>
                        </tr>
                        ` : ''}
                        <tr style="font-size: 14px; font-weight: bold;">
                            <td style="text-align: right;">الإجمالي النهائي:</td>
                            <td style="text-align: left;">${finalTotal.toFixed(2)} جنيه</td>
                        </tr>
                    </table>
                </div>
                
                <div class="footer">
                    <p>شكراً لتعاملكم معنا</p>
                </div>
            </div>
        </body>
        </html>
    `;
    
    printWindow.document.write(invoiceContent);
    printWindow.document.close();
    
    printWindow.onload = function() {
        printWindow.print();
        printWindow.onafterprint = function() {
            printWindow.close();
        };
    };
}

// إغلاق نافذة سجل الفواتير
function closeInvoicesHistory() {
    document.getElementById('invoicesHistoryModal').style.display = 'none';
}

// دالة عرض المخزون
function showInventory() {
    const inventoryModal = document.getElementById('inventoryModal');
    const inventoryItems = document.getElementById('inventoryItems');
    const totalInventoryValue = document.getElementById('totalInventoryValue');
    
    inventoryItems.innerHTML = '';
    let totalValue = 0;
    
    // عرض المنتجات المتوفرة فقط (الكمية > 0)
    const availableProducts = products.filter(product => product.quantity > 0);
    
    if (availableProducts.length === 0) {
        inventoryItems.innerHTML = '<tr><td colspan="5">لا توجد منتجات متوفرة في المخزن</td></tr>';
        totalInventoryValue.textContent = '0 جنيه';
    } else {
        availableProducts.forEach(product => {
            const row = document.createElement('tr');
            const itemTotal = product.price * product.quantity;
            totalValue += itemTotal;
            
            row.innerHTML = `
                <td>${product.name}</td>
                <td>
                    <input type="number" 
                           value="${product.price}" 
                           min="0" 
                           step="0.01" 
                           class="price-input" 
                           onchange="updateProductPrice(${product.id}, this.value)"
                           style="width: 80px; text-align: center;">
                    جنيه
                </td>
                <td>${product.quantity}</td>
                <td class="item-total">${itemTotal} جنيه</td>
                <td>
                    <button onclick="confirmPriceUpdate(${product.id}, this.parentElement.parentElement)"
                            class="update-btn">
                        تحديث
                    </button>
                </td>
            `;
            inventoryItems.appendChild(row);
        });
        
        // عرض إجمالي قيمة المخزون
        totalInventoryValue.textContent = totalValue + ' جنيه';
    }
    
    // عرض النافذة المنبثقة
    inventoryModal.style.display = 'block';
}

// دالة تأكيد تحديث السعر
function confirmPriceUpdate(productId, row) {
    const priceInput = row.querySelector('.price-input');
    const newPrice = parseFloat(priceInput.value);
    
    if (confirm(`هل أنت متأكد من تحديث سعر المنتج إلى ${newPrice} جنيه؟`)) {
        updateProductPrice(productId, newPrice, row);
    }
}

// دالة تحديث سعر المنتج
function updateProductPrice(productId, newPrice, row) {
    // البحث عن المنتج
    const product = products.find(p => p.id === productId);
    if (product) {
        // تحديث السعر
        product.price = parseFloat(newPrice);
        
        // تحديث إجمالي قيمة المنتج في الجدول
        const quantity = product.quantity;
        const newTotal = newPrice * quantity;
        row.querySelector('.item-total').textContent = newTotal + ' جنيه';
        
        // تحديث إجمالي قيمة المخزون
        let totalValue = products.reduce((sum, p) => sum + (p.price * p.quantity), 0);
        document.getElementById('totalInventoryValue').textContent = totalValue + ' جنيه';
        
        // حفظ التغييرات في localStorage
        localStorage.setItem('products', JSON.stringify(products));
        
        // عرض رسالة نجاح
        alert('تم تحديث سعر المنتج بنجاح');
    }
}

// دالة إغلاق نافذة المخزون
function closeInventory() {
    const inventoryModal = document.getElementById('inventoryModal');
    if (inventoryModal) {
        inventoryModal.style.display = 'none';
    }
}

// تحديث معالج النقر خارج النوافذ المنبثقة
window.onclick = function(event) {
    const modals = [
        document.getElementById('invoiceModal'),
        document.getElementById('invoicesHistoryModal'),
        document.getElementById('inventoryModal')
    ];
    
    modals.forEach(modal => {
        if (modal && event.target == modal) {
            modal.style.display = 'none';
        }
    });
}

function showProductHistory() {
    // عرض النافذة المنبثقة لسجل المنتجات
    const modal = document.getElementById('historyModal');
    modal.style.display = 'block';

    // استرجاع سجل المنتجات من localStorage
    const productHistory = JSON.parse(localStorage.getItem('productHistory') || '[]');
    
    // تحديث الجدول بالبيانات
    const tbody = document.getElementById('historyItems');
    tbody.innerHTML = '';
    
    let totalValue = 0;
    productHistory.forEach(item => {
        const row = document.createElement('tr');
        const date = new Date(item.timestamp);
        const total = item.price * item.quantity;
        totalValue += total;
        
        row.innerHTML = `
            <td>${date.toLocaleDateString('ar-EG')}</td>
            <td>${date.toLocaleTimeString('ar-EG')}</td>
            <td>${item.name}</td>
            <td>${item.supplier}</td>
            <td>${item.quantity}</td>
            <td>${item.price} جنيه</td>
            <td>${total} جنيه</td>
        `;
        tbody.appendChild(row);
    });

    // تحديث الملخص
    document.getElementById('operationsCount').textContent = productHistory.length;
    document.getElementById('totalValue').textContent = `${totalValue} جنيه`;
}

function filterHistory() {
    const dateFilter = document.getElementById('dateFilter').value;
    const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
    const productHistory = JSON.parse(localStorage.getItem('productHistory') || '[]');
    
    const filteredHistory = productHistory.filter(item => {
        const itemDate = new Date(item.timestamp).toLocaleDateString('en-CA');
        const matchesDate = !dateFilter || itemDate === dateFilter;
        const matchesSearch = !searchFilter || 
            item.name.toLowerCase().includes(searchFilter) || 
            item.supplier.toLowerCase().includes(searchFilter);
        
        return matchesDate && matchesSearch;
    });

    // تحديث الجدول بالبيانات المفلترة
    updateHistoryTable(filteredHistory);
}

function updateHistoryTable(history) {
    const tbody = document.getElementById('historyItems');
    tbody.innerHTML = '';
    
    let totalValue = 0;
    history.forEach(item => {
        const row = document.createElement('tr');
        const date = new Date(item.timestamp);
        const total = item.price * item.quantity;
        totalValue += total;
        
        row.innerHTML = `
            <td>${date.toLocaleDateString('ar-EG')}</td>
            <td>${date.toLocaleTimeString('ar-EG')}</td>
            <td>${item.name}</td>
            <td>${item.supplier}</td>
            <td>${item.quantity}</td>
            <td>${item.price} جنيه</td>
            <td>${total} جنيه</td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('operationsCount').textContent = history.length;
    document.getElementById('totalValue').textContent = `${totalValue} جنيه`;
}

// رمز الحذف (يمكنك تغييره حسب الحاجة)
const DELETE_CODE = "1234";

function confirmDeleteAllInvoices() {
    const promptModal = window.open('', 'deleteConfirmation', 'width=400,height=200');
    
    const modalContent = `
        <html dir="rtl">
        <head>
            <title>تأكيد حذف الفواتير</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
                
                body {
                    font-family: 'Cairo', sans-serif;
                    padding: 20px;
                    text-align: center;
                }
                
                .container {
                    max-width: 300px;
                    margin: 0 auto;
                }
                
                h3 {
                    color: #e74c3c;
                    margin-bottom: 20px;
                }
                
                input {
                    width: 100%;
                    padding: 8px;
                    margin: 10px 0;
                    border: 2px solid #ddd;
                    border-radius: 4px;
                    text-align: center;
                    font-size: 16px;
                }
                
                .buttons {
                    display: flex;
                    justify-content: center;
                    gap: 10px;
                    margin-top: 20px;
                }
                
                button {
                    padding: 8px 20px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: bold;
                }
                
                .delete-btn {
                    background-color: #e74c3c;
                    color: white;
                }
                
                .cancel-btn {
                    background-color: #95a5a6;
                    color: white;
                }
                
                .error {
                    color: #e74c3c;
                    font-size: 14px;
                    margin-top: 5px;
                    display: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h3>⚠️ تحذير: حذف جميع الفواتير</h3>
                <p>الرجاء إدخال رمز الحذف للمتابعة</p>
                <input type="password" id="deleteCode" placeholder="أدخل رمز الحذف">
                <div id="errorMessage" class="error">رمز الحذف غير صحيح</div>
                <div class="buttons">
                    <button onclick="deleteAllInvoices()" class="delete-btn">حذف</button>
                    <button onclick="window.close()" class="cancel-btn">إلغاء</button>
                </div>
            </div>
            <script>
                function deleteAllInvoices() {
                    const code = document.getElementById('deleteCode').value;
                    const errorMessage = document.getElementById('errorMessage');
                    
                    if (code === '${DELETE_CODE}') {
                        window.opener.executeDeleteAllInvoices();
                        window.close();
                    } else {
                        errorMessage.style.display = 'block';
                        document.getElementById('deleteCode').value = '';
                    }
                }
                
                // إضافة استجابة لمفتاح Enter
                document.getElementById('deleteCode').addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        deleteAllInvoices();
                    }
                });
                
                // إخفاء رسالة الخطأ عند الكتابة
                document.getElementById('deleteCode').addEventListener('input', function() {
                    document.getElementById('errorMessage').style.display = 'none';
                });
            </script>
        </body>
        </html>
    `;
    
    promptModal.document.write(modalContent);
    promptModal.document.close();
}

function executeDeleteAllInvoices() {
    // حذف جميع الفواتير
    invoicesHistory = [];
    localStorage.setItem('invoicesHistory', JSON.stringify(invoicesHistory));
    
    // تحديث عرض سجل الفواتير
    const invoicesList = document.getElementById('invoicesList');
    invoicesList.innerHTML = '<p>لا توجد فواتير سابقة</p>';
    
    // إظهار رسالة نجاح
    alert('تم حذف جميع الفواتير بنجاح');
} 