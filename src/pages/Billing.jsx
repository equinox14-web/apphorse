import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { FileText, Plus, Download, DollarSign, CheckCircle, Clock, Repeat, Upload, Camera, TrendingDown, TrendingUp, Wallet, Image as ImageIcon, X, FileSpreadsheet, Mail } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { canAccess } from '../utils/permissions';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createMarketplaceCheckoutSession } from '../utils/marketplacePayment';
import { useTranslation, Trans } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Billing = () => {
    const { t, i18n } = useTranslation();
    const { userProfile } = useAuth();
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        paid: 0
    });

    // --- SEQUENTIAL NUMBERING & TYPES ---
    const [invoiceSeq, setInvoiceSeq] = useState(() => parseInt(localStorage.getItem('appHorse_billing_seq') || '0'));
    const [creditNoteSeq, setCreditNoteSeq] = useState(() => parseInt(localStorage.getItem('appHorse_billing_avo_seq') || '0'));

    useEffect(() => {
        localStorage.setItem('appHorse_billing_seq', invoiceSeq.toString());
    }, [invoiceSeq]);

    useEffect(() => {
        localStorage.setItem('appHorse_billing_avo_seq', creditNoteSeq.toString());
    }, [creditNoteSeq]);

    const generateNumber = (type) => {
        const year = new Date().getFullYear();
        if (type === 'credit_note') {
            const newSeq = creditNoteSeq + 1;
            setCreditNoteSeq(newSeq);
            return `AVO-${year}-${newSeq.toString().padStart(4, '0')}`;
        } else {
            const newSeq = invoiceSeq + 1;
            setInvoiceSeq(newSeq);
            return `FAC-${year}-${newSeq.toString().padStart(4, '0')}`;
        }
    };

    const formatDateFR = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    };

    const [invoices, setInvoices] = useState(() => {
        const saved = localStorage.getItem('appHorse_billing_v1');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('appHorse_billing_v1', JSON.stringify(invoices));
    }, [invoices]);

    // --- Supplier / Expenses State ---
    const [viewMode, setViewMode] = useState('client'); // 'client' or 'supplier'
    const [supplierInvoices, setSupplierInvoices] = useState(() => {
        const saved = localStorage.getItem('appHorse_billing_suppliers_v1');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('appHorse_billing_suppliers_v1', JSON.stringify(supplierInvoices));
    }, [supplierInvoices]);

    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [newExpense, setNewExpense] = useState({
        supplier: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: '',
        receipt: null // dataURL
    });

    // Camera State
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = React.useRef(null);

    // --- Expense Actions ---
    const handleSaveExpense = (e) => {
        e.preventDefault();
        const amount = parseFloat(newExpense.amount);
        if (!amount) return;

        const expense = {
            id: Date.now(),
            supplier: newExpense.supplier,
            date: newExpense.date,
            amount: amount,
            category: newExpense.category,
            receipt: newExpense.receipt
        };

        setSupplierInvoices([expense, ...supplierInvoices]);
        setShowExpenseModal(false);
        setNewExpense({ supplier: '', date: new Date().toISOString().split('T')[0], amount: '', category: '', receipt: null });
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNewExpense(prev => ({ ...prev, receipt: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const startCamera = () => {
        setShowCamera(true);
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play();
                }
            })
            .catch(err => alert("Erreur caméra: " + err.message));
    };

    const captureExpensePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg');

            setNewExpense(prev => ({ ...prev, receipt: dataUrl }));

            // Stop stream
            const stream = videoRef.current.srcObject;
            if (stream) stream.getTracks().forEach(t => t.stop());
            setShowCamera(false);
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        }
        setShowCamera(false);
    };

    // Calculate Stats
    // Exclude Drafts (no number) and Credit Notes (negative?) from specific stats if needed
    // But usually draft revenue is projected revenue.
    const totalIncome = invoices.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
    const totalExpenses = supplierInvoices.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    const netResult = totalIncome - totalExpenses;
    const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + (parseFloat(i.amount) || 0), 0);

    const getStatusColor = (status, inv) => {
        if (!inv.number) return '#9ca3af'; // Draft Gray
        if (inv.type === 'credit_note') return '#9333ea'; // Purple
        switch (status) {
            case 'paid': return '#10b981';
            case 'pending': return '#f59e0b';
            case 'overdue': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const getStatusLabel = (status, inv) => {
        if (!inv.number) return t('billing_page.invoice_list.draft');
        if (inv.type === 'credit_note') return t('billing_page.pdf.credit_note');
        switch (status) {
            case 'paid': return t('billing_page.invoice_list.status.paid');
            case 'pending': return t('billing_page.invoice_list.status.pending');
            case 'overdue': return t('billing_page.invoice_list.status.overdue');
            default: return status;
        }
    };

    // --- Chart Data ---
    const getChartData = () => {
        const data = {};

        // Initialize last 6 months
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = `${d.getFullYear()}-${d.getMonth()}`; // Unique key

            const monthName = d.toLocaleDateString(i18n.language, { month: 'short' });
            const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            const label = `${capitalizedMonth} ${d.getFullYear().toString().slice(2)}`;

            data[key] = { name: label, revenus: 0, depenses: 0, sortKey: d.getTime() };
        }

        invoices.forEach(inv => {
            if (!inv.number) return; // Ignore Drafts in charts? Or include? Let's ignore drafts.
            const d = new Date(inv.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (data[key]) {
                data[key].revenus += parseFloat(inv.amount) || 0;
            }
        });

        supplierInvoices.forEach(exp => {
            const d = new Date(exp.date);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (data[key]) {
                data[key].depenses += parseFloat(exp.amount) || 0;
            }
        });

        return Object.values(data).sort((a, b) => a.sortKey - b.sortKey);
    };
    const chartData = getChartData();


    const [showModal, setShowModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [newInvoice, setNewInvoice] = useState({
        client: '',
        horseName: '',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        status: 'pending',
        type: 'invoice', // 'invoice' or 'credit_note'
        number: null, // If null, it's a Draft
        recurrence: 'none',
        lines: [{ description: '', amount: '' }]
    });

    const handleAddLine = () => {
        setNewInvoice(prev => ({
            ...prev,
            lines: [...prev.lines, { description: '', amount: '' }]
        }));
    };

    const handleRemoveLine = (index) => {
        setNewInvoice(prev => ({
            ...prev,
            lines: prev.lines.filter((_, i) => i !== index)
        }));
    };

    const handleLineChange = (index, field, value) => {
        const newLines = [...newInvoice.lines];
        newLines[index][field] = value;
        setNewInvoice(prev => ({ ...prev, lines: newLines }));
    };

    const calculateTotal = () => {
        return newInvoice.lines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0);
    };

    const handleSaveInvoice = (e) => {
        e.preventDefault();
        const totalAmount = calculateTotal();
        // Allow negative amounts for credit notes, or zero?
        // if (totalAmount <= 0) return; 

        // Construct items based on lines
        const items = newInvoice.lines.map(line => ({
            description: line.description,
            price: parseFloat(line.amount) || 0
        }));

        if (editingId) {
            // Update existing (ONLY DRAFTS can be fully edited usually, but we check logic in handleEdit)
            const updatedInvoices = invoices.map(inv => {
                if (inv.id === editingId) {
                    // Prevent editing if finalized (Double check)
                    if (inv.number) return inv;

                    return {
                        ...inv,
                        client: newInvoice.client,
                        horseName: newInvoice.horseName,
                        date: newInvoice.date,
                        status: newInvoice.status,
                        amount: totalAmount,
                        recurrence: newInvoice.recurrence,
                        items: items
                    };
                }
                return inv;
            });
            setInvoices(updatedInvoices);
        } else {
            // Create New
            const invoice = {
                id: Math.floor(Math.random() * 1000000) + 1000,
                // If ID is random, it's confusing with Number. Let's keep ID internal.
                number: null, // Draft by default
                type: newInvoice.type || 'invoice',
                refInvoiceId: newInvoice.refInvoiceId, // For Credit Notes
                client: newInvoice.client,
                horseName: newInvoice.horseName,
                date: newInvoice.date,
                status: 'pending',
                amount: totalAmount,
                recurrence: newInvoice.recurrence,
                items: items
            };
            setInvoices([invoice, ...invoices]);
        }

        setShowModal(false);
        setEditingId(null);
        setNewInvoice({
            client: '', horseName: '', date: new Date().toISOString().split('T')[0],
            status: 'pending', type: 'invoice', number: null, recurrence: 'none',
            lines: [{ description: '', amount: '' }]
        });
    };

    const handleFinalize = (inv) => {
        if (!window.confirm(t('billing_alerts.finalize_confirm'))) return;

        const number = generateNumber(inv.type);
        setInvoices(invoices.map(i => i.id === inv.id ? { ...i, number: number } : i));
        alert(t('billing_alerts.finalize_success', { number }));
        setSelectedInvoice(null);
    };

    const handleCreateCreditNote = (inv) => {
        if (!window.confirm(t('billing_alerts.credit_note_confirm'))) return;

        // Create a draft credit note
        const creditNote = {
            id: Math.floor(Math.random() * 1000000) + 1000,
            number: null, // Draft
            type: 'credit_note',
            refInvoiceId: inv.number, // Reference the OFFICIAL number
            client: inv.client,
            horseName: inv.horseName,
            date: new Date().toISOString().split('T')[0],
            status: 'pending', // Pending refund/deduction
            amount: -Math.abs(inv.amount), // Negative amount
            recurrence: 'none',
            items: (Array.isArray(inv.items) ? inv.items : [inv.items]).map(item => ({
                description: `Avoir sur ${isObject(item) ? item.description : item}`,
                price: -Math.abs(isObject(item) ? item.price : inv.amount)
            }))
        };

        setInvoices([creditNote, ...invoices]);
        setInvoices([creditNote, ...invoices]);
        alert(t('billing_alerts.credit_note_created'));
    };

    const isObject = (val) => typeof val === 'object' && val !== null;

    const handleEdit = (inv) => {
        if (inv.number) {
            alert(t('billing_alerts.edit_locked'));
            return;
        }

        setEditingId(inv.id);

        // Transform items back to lines
        const lines = (Array.isArray(inv.items) ? inv.items : [inv.items]).map(item => {
            if (typeof item === 'object') {
                return { description: item.description, amount: item.price };
            }
            return { description: item, amount: '' };
        });

        setNewInvoice({
            client: inv.client,
            horseName: inv.horseName || '',
            date: inv.date,
            status: inv.status,
            type: inv.type || 'invoice',
            number: inv.number,
            recurrence: inv.recurrence || 'none',
            lines: lines
        });

        setSelectedInvoice(null); // Close preview
        setShowModal(true); // Open edit
    };

    const handleSendEmail = (inv) => {
        if (!inv.number) {
            alert(t('billing_alerts.send_locked'));
            return;
        }
        if (window.confirm(`Envoyer la facture #${inv.number} par email au client ?`)) {
            // Simulation
            console.log(`Sending invoice ${inv.number} to client...`);
            alert(`La facture #${inv.number} a été envoyée par email avec succès !`);
        }
    };

    const handleToggleStatus = (inv) => {
        const newStatus = inv.status === 'paid' ? 'pending' : 'paid';
        if (newStatus === 'paid' && !window.confirm(t('billing_alerts.payment_confirm'))) return;

        const updated = { ...inv, status: newStatus };
        setInvoices(invoices.map(i => i.id === inv.id ? updated : i));
        setSelectedInvoice(updated);
    };

    const handleOnlinePayment = async (inv) => {
        // 1. Get Stable's Connected Account ID
        // In a real app, this should be fetched from the Stable's public profile or passed in context
        // Here we simulate it or check local storage if we are the stable testing it essentially on ourselves (loopback)
        // OR if the user is a client view (which we simulate via toggle), we need to know WHO the stable is.
        // For simplicity, let's assume the current logged in user IS the stable for demo, 
        // OR we store the 'connected_account_id' in localStorage during Settings > Connect.

        let stableAccountId = localStorage.getItem('stripe_connected_account_id');

        // FALLBACK FOR DEMO if not set yet (Use your specific connected account ID if you have one for test)
        if (!stableAccountId) {
            alert(t('billing_alerts.online_payment_error'));
            return;
        }

        if (window.confirm(t('billing_alerts.online_payment_confirm', { number: inv.number || inv.id, amount: inv.amount }))) {
            await createMarketplaceCheckoutSession(inv, stableAccountId);
        }
    };

    const downloadInvoice = (invoice) => {
        try {
            if (!jsPDF) {
                throw new Error("La librairie jsPDF n'est pas chargée.");
            }
            const doc = new jsPDF();

            // --- HEADER ---
            // Issuer Info (The Stable)
            // Priority: 1. Firestore Billing Details (Settings), 2. LocalStorage (Legacy), 3. Fallback
            const billingDetails = userProfile?.billingDetails || {};
            const localDetails = JSON.parse(localStorage.getItem('appHorse_company_details_v1')) || {};

            const stableName = billingDetails.structureName || userProfile?.displayName || localDetails.name || "Nom de l'écurie";
            const stableAddress = billingDetails.headquartersAddress || localDetails.address || "Adresse non renseignée";

            const siret = billingDetails.siret || localDetails.siret;
            const legalTva = billingDetails.tva || localDetails.tva;

            const stableSiret = siret ? `SIRET: ${siret}` : "SIRET: Non renseigné";
            const stableTva = legalTva ? `TVA: ${legalTva}` : "TVA: Non renseigné";

            const logo = localStorage.getItem('user_logo');
            if (logo) {
                try {
                    doc.addImage(logo, 'PNG', 10, 10, 40, 40);
                } catch (e) {
                    console.warn("Logo add failed", e);
                }
            }

            doc.setFontSize(18);
            doc.setTextColor(44, 62, 80);


            doc.text(stableName.toUpperCase(), logo ? 60 : 10, 20);

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(stableAddress, logo ? 60 : 10, 27);
            doc.text(`${stableSiret} - ${stableTva}`, logo ? 60 : 10, 32);


            // Invoice Info (Right side)
            doc.setFontSize(16);
            doc.setTextColor(44, 62, 80);
            const docType = invoice.type === 'credit_note' ? t('billing_page.pdf.credit_note') : t('billing_page.pdf.invoice');
            const title = invoice.number ? `${docType} N ${invoice.number}` : `${t('billing_page.pdf.draft')} (${invoice.id})`;
            const titleWidth = doc.getTextWidth(title);
            doc.text(title, 200 - titleWidth, 20);

            doc.setFontSize(10);
            doc.setTextColor(100);
            const dateStr = `${t('billing_page.pdf.date')} ${invoice.date}`;
            const dateWidth = doc.getTextWidth(dateStr);
            doc.text(dateStr, 200 - dateWidth, 30);

            // --- CLIENT INFO ---
            doc.setFillColor(248, 249, 250);
            doc.rect(120, 50, 80, 25, 'F');
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(t('billing_page.pdf.bill_to'), 125, 56);

            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont("helvetica", "bold");
            doc.text(invoice.client, 125, 63);

            if (invoice.horseName) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.setTextColor(80);
                doc.text(`${t('billing_page.pdf.horse')} ${invoice.horseName}`, 125, 70);
            }

            // --- TABLE ---
            // Prepare body
            const tableBody = (Array.isArray(invoice.items) ? invoice.items : [invoice.items]).map(item => {
                const isObj = typeof item === 'object';
                const desc = isObj ? item.description : item;
                const price = isObj ? item.price : invoice.amount;
                return [desc, "1", price.toFixed(2) + " EUR", price.toFixed(2) + " EUR"];
            });

            autoTable(doc, {
                startY: 85,
                head: [[t('billing_page.pdf.description'), t('billing_page.pdf.qty'), t('billing_page.pdf.unit_price'), t('billing_page.pdf.total')]],
                body: tableBody,
                theme: 'grid',
                headStyles: { fillColor: [44, 62, 80], textColor: 255 },
                styles: { fontSize: 10, cellPadding: 3 },
                columnStyles: {
                    0: { cellWidth: 'auto' },
                    1: { cellWidth: 20, halign: 'center' },
                    2: { cellWidth: 30, halign: 'right' },
                    3: { cellWidth: 30, halign: 'right' }
                }
            });

            // --- TOTALS ---
            let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 150;
            const totalHT = invoice.amount * 0.8;
            const tva = invoice.amount * 0.2;
            const totalTTC = invoice.amount;

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(t('billing_page.pdf.total_ht'), 110, finalY);
            doc.text(`${totalHT.toFixed(2)} EUR`, 195, finalY, { align: 'right' });

            doc.text(t('billing_page.pdf.vat'), 110, finalY + 6);
            doc.text(`${tva.toFixed(2)} EUR`, 195, finalY + 6, { align: 'right' });

            doc.setLineWidth(0.5);
            doc.line(110, finalY + 10, 195, finalY + 10);

            doc.setFontSize(14);
            doc.setTextColor(44, 62, 80);
            doc.setFont("helvetica", "bold");
            doc.text(t('billing_page.pdf.net_to_pay'), 110, finalY + 18);
            doc.text(`${totalTTC.toFixed(2)} EUR`, 195, finalY + 18, { align: 'right' });

            // LEGAL FOOTER
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.setFont("helvetica", "normal");
            const footerText = t('billing_page.pdf.footer', { stable: stableName });
            doc.text(footerText, 105, 290, { align: 'center' });

            // --- OPEN PDF ---
            const blob = doc.output('blob');
            const url = URL.createObjectURL(blob);
            const newWindow = window.open(url, '_blank');
            if (!newWindow) {
                alert("Ouverture bloquée par le navigateur. Veuillez autoriser les pop-ups.");
            }

        } catch (error) {
            console.error("PDF FAILED:", error);
            alert("Erreur PDF: " + error.message);
        }
    };

    // --- Accounting Export (PDF Report) ---
    // Generates a comprehensive financial report (Revenue vs Expenses) for the accountant.
    const handleAccountingExport = () => {
        const doc = new jsPDF();

        // 1. Report Header
        doc.setFontSize(20);
        doc.text(t('billing_page.export_pdf.title'), 105, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`${t('billing_page.export_pdf.date')} ${new Date().toLocaleDateString('fr-FR')}`, 105, 28, { align: 'center' });

        // 2. Financial Summary Section
        doc.setFontSize(12);
        doc.text(`Revenus : ${stats.paid.toFixed(2)} €`, 14, 40);
        doc.text(`En attente : ${stats.pending.toFixed(2)} €`, 14, 46);

        const totalExpenses = supplierInvoices.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
        doc.text(`${t('billing_page.stats.expenses')} : ${totalExpenses.toFixed(2)} €`, 14, 52);

        const balance = stats.paid - totalExpenses;
        // Color coding for balance: Green if positive, Red if negative
        doc.setTextColor(balance >= 0 ? 0 : 200, balance >= 0 ? 150 : 0, 0);
        doc.text(`${t('billing_page.stats.result')} : ${balance.toFixed(2)} €`, 14, 58);
        doc.setTextColor(0, 0, 0); // Reset to black

        // 3. Prepare Data for Table
        const rows = [];

        // Add Revenues
        invoices.forEach(inv => {
            rows.push([
                formatDateFR(inv.date),
                t('billing_page.export_pdf.types.revenue'),
                `#${inv.id}`,
                inv.client,
                inv.status === 'paid' ? t('billing_page.invoice_list.status.paid') : t('billing_page.invoice_list.status.pending'),
                parseFloat(inv.amount).toFixed(2) + ' €'
            ]);
        });

        // Add Expenses
        supplierInvoices.forEach(exp => {
            rows.push([
                formatDateFR(exp.date),
                t('billing_page.export_pdf.types.expense'),
                exp.supplier,
                exp.category || "Autre",
                t('billing_page.invoice_list.status.paid'),
                "-" + parseFloat(exp.amount).toFixed(2) + ' €'
            ]);
        });

        // Sort rows by Date (Descending)
        rows.sort((a, b) => {
            const parseDate = (d) => {
                const parts = d.split('/');
                return new Date(parts[2], parts[1] - 1, parts[0]);
            };
            return parseDate(b[0]) - parseDate(a[0]);
        });

        // 4. Generate Table using autoTable
        autoTable(doc, {
            startY: 65,
            head: [t('billing_page.export_pdf.headers', { returnObjects: true })],
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66] },
            styles: { fontSize: 9 },
            // Conditional styling for Income vs Expense
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 5) {
                    const text = data.cell.raw;
                    if (text.startsWith('-')) {
                        data.cell.styles.textColor = [220, 38, 38]; // Red for expenses
                    } else {
                        data.cell.styles.textColor = [22, 163, 74]; // Green for revenue
                    }
                }
            }
        });

        // 5. Open PDF in a new tab
        // We use window.open with a blob URL to ensure it opens in the browser's PDF viewer
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        if (!newWindow) {
            alert("Pop-up bloqué. Veuillez autoriser les pop-ups pour voir le rapport.");
        }
    };

    return (
        <div className="animate-fade-in">
            {/* Dashboard Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#dcfce7', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/icons/fleche-vers-le-haut.png" alt="Revenus" style={{ width: '24px', height: '24px' }} />
                    </div>
                    <div><div style={{ fontSize: '0.9rem', color: '#666' }}>{t('billing_page.stats.income')}</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalIncome.toFixed(0)} €</div></div>
                </Card>
                <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#fee2e2', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/icons/fleche-vers-le-bas-a-gauche.png" alt="Dépenses" style={{ width: '24px', height: '24px' }} />
                    </div>
                    <div><div style={{ fontSize: '0.9rem', color: '#666' }}>{t('billing_page.stats.expenses')}</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalExpenses.toFixed(0)} €</div></div>
                </Card>
                <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#e0f2fe', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/icons/portefeuille.png" alt="Résultat" style={{ width: '24px', height: '24px' }} />
                    </div>
                    <div><div style={{ fontSize: '0.9rem', color: '#666' }}>{t('billing_page.stats.result')}</div><div style={{ fontSize: '1.5rem', fontWeight: 700, color: netResult >= 0 ? '#16a34a' : '#dc2626' }}>{netResult.toFixed(0)} €</div></div>
                </Card>
                <Card style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ background: '#fef3c7', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src="/icons/temps.png" alt="En attente" style={{ width: '24px', height: '24px' }} />
                    </div>
                    <div><div style={{ fontSize: '0.9rem', color: '#666' }}>{t('billing_page.stats.pending')}</div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{pendingAmount.toFixed(0)} €</div></div>
                </Card>
            </div>

            {/* Financial Chart */}
            <Card style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TrendingUp size={20} /> {t('billing_page.chart.title')}
                </h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                            <YAxis axisLine={false} tickLine={false} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Bar dataKey="revenus" name="Revenus" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="depenses" name="Dépenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>


            {/* Toggle View + Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', background: '#f3f4f6', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
                    <button
                        onClick={() => setViewMode('client')}
                        style={{
                            padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600,
                            background: viewMode === 'client' ? 'white' : 'transparent',
                            color: viewMode === 'client' ? '#000' : '#666',
                            boxShadow: viewMode === 'client' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        {t('billing_page.tabs.clients')}
                    </button>
                    <button
                        onClick={() => setViewMode('supplier')}
                        style={{
                            padding: '0.5rem 1.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600,
                            background: viewMode === 'supplier' ? 'white' : 'transparent',
                            color: viewMode === 'supplier' ? '#000' : '#666',
                            boxShadow: viewMode === 'supplier' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        {t('billing_page.tabs.suppliers')}
                    </button>
                </div>
            </div>


            {/* Content Switch */}
            {viewMode === 'client' ? (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
                        {canAccess('accounting') && (
                            <Button onClick={handleAccountingExport} variant="secondary" style={{ gap: '0.5rem' }} title={t('billing_page.actions.export')}>
                                <FileSpreadsheet size={18} /> <span className="hide-on-mobile">{t('billing_page.actions.export')}</span>
                            </Button>
                        )}
                        <Button onClick={() => setShowModal(true)} title={t('billing_page.actions.new_invoice')}>
                            <Plus size={18} /> <span className="hide-on-mobile">{t('billing_page.actions.new_invoice')}</span>
                        </Button>
                    </div>
                    {/* Invoices List */}
                    <Card style={{ padding: '0' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
                            <h3 style={{ margin: 0 }}>{t('billing_page.invoice_list.title')}</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {invoices.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>{t('billing_page.invoice_list.empty')}</div>}
                            {invoices.map((inv, index) => (
                                <div key={inv.id}
                                    onClick={() => setSelectedInvoice(inv)}
                                    className="responsive-row"
                                    style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '1rem 1.5rem',
                                        borderBottom: index < invoices.length - 1 ? '1px solid #f9fafb' : 'none',
                                        background: index % 2 === 0 ? 'white' : '#f9fafb',
                                        cursor: 'pointer'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#f3f4f6'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f9fafb'}
                                >
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ background: '#f3f4f6', padding: '10px', borderRadius: '8px', color: '#4b5563' }}><FileText size={20} /></div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{inv.number || t('billing_page.invoice_list.draft')}</div>
                                            <div style={{ fontSize: '0.9rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {inv.client} {inv.horseName && <span>• {inv.horseName}</span>} • {inv.date.includes('-') ? formatDateFR(inv.date) : inv.date}
                                                {inv.recurrence && inv.recurrence !== 'none' && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', background: '#f5f3ff', color: '#7c3aed', padding: '2px 6px', borderRadius: '12px' }}>
                                                        <Repeat size={12} /> {inv.recurrence === 'monthly' ? t('pricing.monthly') : t('pricing.annual')}
                                                    </span>
                                                )}
                                                {inv.type === 'credit_note' && <span style={{ fontSize: '0.75rem', background: '#e0e7ff', color: '#4338ca', padding: '2px 6px', borderRadius: '12px' }}>{t('billing_page.invoice_list.credit_note_ref', { ref: inv.refInvoiceId })}</span>}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#888', fontStyle: 'italic', marginTop: '2px' }}>
                                                {Array.isArray(inv.items) ? (
                                                    typeof inv.items[0] === 'object' ? inv.items[0].description + (inv.items.length > 1 ? ` + ${inv.items.length - 1} autres` : '') : inv.items[0]
                                                ) : inv.items}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                                        <div style={{ fontWeight: 700, fontSize: '1.1rem', color: inv.amount < 0 ? '#dc2626' : 'black' }}>{inv.amount.toFixed(2)} €</div>
                                        <div style={{
                                            padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600,
                                            background: getStatusColor(inv.status, inv) + '20', color: getStatusColor(inv.status, inv),
                                            display: 'flex', alignItems: 'center', gap: '6px'
                                        }}>
                                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(inv.status, inv) }}></span>
                                            {getStatusLabel(inv.status, inv)}
                                        </div>
                                        <Button variant="secondary" style={{ padding: '8px', borderRadius: '50%' }} onClick={(e) => { e.stopPropagation(); downloadInvoice(inv); }}>
                                            <img src="/icons/telecharger.png" alt="Download" style={{ width: '16px', height: '16px' }} />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </>
            ) : (
                <>
                    {/* SUPPLIER VIEW */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                        <Button onClick={() => setShowExpenseModal(true)} style={{ background: '#dc2626' }}>
                            <Plus size={18} /> {t('billing_page.actions.new_expense')}
                        </Button>
                    </div>

                    <Card style={{ padding: '0' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid #eee' }}>
                            <h3 style={{ margin: 0 }}>{t('billing_page.expense_list.title')}</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {supplierInvoices.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#999' }}>{t('billing_page.expense_list.empty')}</div>}
                            {supplierInvoices.map((exp, index) => (
                                <div key={exp.id} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '1rem 1.5rem',
                                    borderBottom: '1px solid #f9fafb',
                                    background: 'white'
                                }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ position: 'relative', width: '40px', height: '40px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {exp.receipt ? (
                                                <img src={exp.receipt} alt="Recu" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <Wallet size={20} color="#dc2626" />
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600 }}>{exp.supplier}</div>
                                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                                {formatDateFR(exp.date)} • <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px' }}>{exp.category || 'Divers'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#dc2626' }}>
                                        - {exp.amount.toFixed(2)} €
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </>
            )}

            {/* Preview Modal - Matches PDF */}
            {selectedInvoice && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                    paddingTop: '5vh'
                }} onClick={() => setSelectedInvoice(null)}>
                    <Card style={{ width: '95%', maxWidth: '1000px', maxHeight: '95vh', overflowY: 'auto', borderRadius: '4px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '3rem', background: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #ddd', paddingBottom: '2rem', marginBottom: '2rem' }}>
                                <div>
                                    {localStorage.getItem('user_logo') ?
                                        <img src={localStorage.getItem('user_logo')} alt="Logo" style={{ height: '60px', marginBottom: '1rem' }} /> :
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#2c3e50', margin: 0 }}>
                                            {(() => {
                                                const d = JSON.parse(localStorage.getItem('appHorse_company_details_v1')) || {};
                                                return d.name || JSON.parse(localStorage.getItem('user'))?.displayName || "Nom de l'écurie";
                                            })()}
                                        </h2>
                                    }
                                    <div style={{ color: '#6b7280', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                                        {(() => {
                                            const details = JSON.parse(localStorage.getItem('appHorse_company_details_v1')) || JSON.parse(localStorage.getItem('company_details')) || {};
                                            return (
                                                <>
                                                    {details.address || "Adresse non renseignée"}<br />
                                                    {details.siret ? `SIRET: ${details.siret}` : "SIRET: Non renseigné"}
                                                </>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <h3 style={{ fontSize: '1.5rem', color: '#2c3e50', marginBottom: '0.5rem' }}>
                                        {selectedInvoice.type === 'credit_note' ? t('billing_page.pdf.credit_note') : t('billing_page.pdf.invoice')} {selectedInvoice.number ? `N° ${selectedInvoice.number}` : `(${t('billing_page.pdf.draft')})`}
                                    </h3>
                                    <div style={{ color: '#666' }}>{t('billing_page.pdf.date')} {selectedInvoice.date.includes('-') ? formatDateFR(selectedInvoice.date) : selectedInvoice.date}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '3rem' }}>
                                <div style={{ background: '#f8f9fa', padding: '1.5rem', borderRadius: '4px', width: '250px' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#888', fontWeight: 'bold', marginBottom: '0.5rem' }}>{t('billing_page.pdf.bill_to')}</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#000' }}>{selectedInvoice.client}</div>
                                    {selectedInvoice.horseName && <div style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.5rem' }}>{t('billing_page.pdf.horse')} {selectedInvoice.horseName}</div>}
                                </div>
                            </div>
                            <div className="table-responsive">
                                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem' }}>
                                    <thead>
                                        <tr style={{ background: '#2c3e50', color: 'white', textAlign: 'left' }}>
                                            <th style={{ padding: '0.75rem', minWidth: '150px' }}>{t('billing_page.pdf.description')}</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>{t('billing_page.pdf.qty')}</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', minWidth: '100px' }}>{t('billing_page.pdf.unit_price')}</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'right', minWidth: '100px' }}>{t('billing_page.pdf.total')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(Array.isArray(selectedInvoice.items) ? selectedInvoice.items : [selectedInvoice.items]).map((item, i) => {
                                            const isObj = typeof item === 'object';
                                            return (
                                                <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                                    <td style={{ padding: '0.75rem' }}>{isObj ? item.description : item}</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>1</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{isObj ? item.price.toFixed(2) : selectedInvoice.amount} €</td>
                                                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{isObj ? item.price.toFixed(2) : selectedInvoice.amount} €</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <div style={{ width: '250px', textAlign: 'right' }}>
                                    <div style={{ padding: '0.5rem 0', color: '#666' }}>{t('billing_page.pdf.total_ht')} <span style={{ display: 'inline-block', width: '80px' }}>{(selectedInvoice.amount * 0.8).toFixed(2)} €</span></div>
                                    <div style={{ padding: '0.5rem 0', color: '#666' }}>{t('billing_page.pdf.vat')} <span style={{ display: 'inline-block', width: '80px' }}>{(selectedInvoice.amount * 0.2).toFixed(2)} €</span></div>
                                    <div style={{ padding: '1rem 0', borderTop: '1px solid #ddd', fontSize: '1.2rem', fontWeight: 700, color: '#2c3e50' }}>{t('billing_page.pdf.net_to_pay')} <span style={{ display: 'inline-block', width: '80px' }}>{selectedInvoice.amount.toFixed(2)} €</span></div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    {!selectedInvoice.number && (
                                        <>
                                            <Button variant="secondary" onClick={() => handleEdit(selectedInvoice)}>{t('billing_page.actions.edit')}</Button>
                                            <Button onClick={() => handleFinalize(selectedInvoice)}>{t('billing_page.actions.validate')}</Button>
                                        </>
                                    )}
                                    {selectedInvoice.number && selectedInvoice.type !== 'credit_note' && selectedInvoice.status !== 'paid' && (
                                        <Button
                                            onClick={() => handleOnlinePayment(selectedInvoice)}
                                            style={{ background: '#635bff', color: 'white', display: 'flex', gap: '8px', alignItems: 'center' }}
                                        >
                                            <DollarSign size={18} /> {t('billing_page.actions.pay_online')}
                                        </Button>
                                    )}
                                    {selectedInvoice.number && <Button variant="secondary" onClick={() => handleCreateCreditNote(selectedInvoice)}>{t('billing_page.actions.create_credit_note')}</Button>}
                                    {selectedInvoice.number && <Button variant="secondary" onClick={() => handleSendEmail(selectedInvoice)}><Mail size={18} /> {t('billing_page.actions.send')}</Button>}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <Button variant="secondary" onClick={() => downloadInvoice(selectedInvoice)}><Download size={18} /> {t('billing_page.actions.download_pdf')}</Button>
                                    <Button variant="secondary" onClick={() => setSelectedInvoice(null)}>{t('billing_page.actions.close')}</Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Modal for new invoice same as before */}
            {
                showModal && createPortal(
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 9999, // Darker overlay & High Z-Index
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                        paddingTop: '10vh' // Higher position
                    }}>
                        <Card style={{ width: '95%', maxWidth: '600px' }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{editingId ? t('billing_modals.invoice.edit_title') : t('billing_modals.invoice.new_title')}</h3>
                            <form onSubmit={handleSaveInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div><label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('billing_modals.invoice.client_label')}</label><input required placeholder="Ex: Jean Dupont" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }} value={newInvoice.client} onChange={e => setNewInvoice({ ...newInvoice, client: e.target.value })} /></div>
                                <div><label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('billing_modals.invoice.horse_label')}</label><input placeholder="Ex: Thunder" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }} value={newInvoice.horseName} onChange={e => setNewInvoice({ ...newInvoice, horseName: e.target.value })} /></div>

                                {/* Dynamic Lines */}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('billing_modals.invoice.lines_title')}</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        {newInvoice.lines.map((line, index) => (
                                            <div key={index} style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input
                                                    placeholder={t('billing_modals.invoice.desc_placeholder')}
                                                    required
                                                    style={{ flex: 3, minWidth: 0, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                                    value={line.description}
                                                    onChange={e => handleLineChange(index, 'description', e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    placeholder={t('billing_modals.invoice.amount_placeholder')}
                                                    required
                                                    style={{ flex: 1, minWidth: '80px', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                                    value={line.amount}
                                                    onChange={e => handleLineChange(index, 'amount', e.target.value)}
                                                />
                                                {newInvoice.lines.length > 1 && (
                                                    <Button type="button" variant="secondary" onClick={() => handleRemoveLine(index)} style={{ padding: '0.5rem', color: 'red' }}>
                                                        <Plus size={20} style={{ transform: 'rotate(45deg)' }} />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                        <Button type="button" variant="secondary" onClick={handleAddLine} style={{ marginTop: '0.5rem', alignSelf: 'start', fontSize: '0.9rem' }}>
                                            <Plus size={16} /> {t('billing_modals.invoice.add_line')}
                                        </Button>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Du</label><input type="date" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }} value={newInvoice.startDate} onChange={e => setNewInvoice({ ...newInvoice, startDate: e.target.value })} /></div>
                                    <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Au</label><input type="date" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }} value={newInvoice.endDate} onChange={e => setNewInvoice({ ...newInvoice, endDate: e.target.value })} /></div>
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#f9fafb', padding: '1rem', borderRadius: '8px' }}>
                                    <div style={{ flex: 1, fontWeight: 'bold', color: '#333' }}>{t('billing_modals.invoice.total_label')} {calculateTotal().toFixed(2)} €</div>
                                    <div style={{ flex: 1 }}><label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('billing_modals.invoice.date_label')}</label><input type="date" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }} value={newInvoice.date} onChange={e => setNewInvoice({ ...newInvoice, date: e.target.value })} /></div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('billing_modals.invoice.recurrence_label')}</label>
                                    <select
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: '#333' }}
                                        value={newInvoice.recurrence}
                                        onChange={e => setNewInvoice({ ...newInvoice, recurrence: e.target.value })}
                                    >
                                        <option value="none">{t('billing_modals.invoice.recurrence_none')}</option>
                                        <option value="monthly">{t('billing_modals.invoice.recurrence_monthly')}</option>
                                        <option value="quarterly">{t('billing_modals.invoice.recurrence_quarterly')}</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}><Button type="button" variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>{t('billing_modals.invoice.cancel')}</Button><Button type="submit" style={{ flex: 1 }}>{t('billing_modals.invoice.save')}</Button></div>
                            </form>
                        </Card>
                    </div>
                    , document.body)
            }
            {
                showExpenseModal && createPortal(
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', zIndex: 9999,
                        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
                        paddingTop: '10vh'
                    }}>
                        <Card style={{ width: '95%', maxWidth: '500px' }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>{t('billing_modals.expense.title')}</h3>
                            <form onSubmit={handleSaveExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('billing_modals.expense.supplier_label')}</label>
                                    <input required placeholder="Ex: Décathlon, Vétérinaire..." style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                        value={newExpense.supplier} onChange={e => setNewExpense({ ...newExpense, supplier: e.target.value })}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('billing_modals.expense.date_label')}</label>
                                        <input type="date" required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                            value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('billing_modals.expense.amount_label')}</label>
                                        <input type="number" required placeholder="0.00" style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', color: '#333', backgroundColor: '#fff' }}
                                            value={newExpense.amount} onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem' }}>{t('billing_modals.expense.category_label')}</label>
                                    <select
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', background: 'white', color: '#333' }}
                                        value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                    >
                                        <option value="">Sélectionner...</option>
                                        <option value="Soins / Vétérinaire">Soins / Vétérinaire</option>
                                        <option value="Alimentation">Alimentation</option>
                                        <option value="Matériel">Matériel</option>
                                        <option value="Ferrure">Ferrure</option>
                                        <option value="Infra / Ecurie">Infra / Ecurie</option>
                                        <option value="Divers">Divers</option>
                                    </select>
                                </div>

                                {/* DOCUMENT / PHOTO */}
                                <div style={{ border: '1px dashed #ddd', padding: '1rem', borderRadius: '8px', textAlign: 'center', background: '#f9fafb' }}>
                                    {newExpense.receipt ? (
                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                            <img src={newExpense.receipt} alt="Document" style={{ maxHeight: '150px', borderRadius: '8px' }} />
                                            <button
                                                type="button"
                                                onClick={() => setNewExpense({ ...newExpense, receipt: null })}
                                                style={{ position: 'absolute', top: -10, right: -10, background: '#dc2626', color: 'white', borderRadius: '50%', border: 'none', padding: '4px', cursor: 'pointer' }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                                            <div style={{ position: 'relative' }}>
                                                <input type="file" id="expense-file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={handleFileUpload} />
                                                <label htmlFor="expense-file">
                                                    <Button type="button" variant="secondary" style={{ pointerEvents: 'none' }}>
                                                        <Upload size={18} /> {t('billing_modals.expense.file_button')}
                                                    </Button>
                                                </label>
                                            </div>
                                            <Button type="button" variant="secondary" onClick={startCamera}>
                                                <Camera size={18} /> {t('billing_modals.expense.scan_button')}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                    <Button type="button" variant="secondary" onClick={() => setShowExpenseModal(false)} style={{ flex: 1 }}>{t('billing_modals.expense.cancel')}</Button>
                                    <Button type="submit" style={{ flex: 1, background: '#dc2626', border: '1px solid #dc2626' }}>{t('billing_modals.expense.save')}</Button>
                                </div>
                            </form>
                        </Card>
                    </div>
                    , document.body)
            }

            {/* CAMERA OVERLAY */}
            {
                showCamera && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'black', zIndex: 2000,
                        display: 'flex', flexDirection: 'column'
                    }}>
                        <video ref={videoRef} autoPlay playsInline style={{ flex: 1, objectFit: 'cover', width: '100%' }} />
                        <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-around', background: 'rgba(0,0,0,0)' }}>
                            <Button variant="secondary" onClick={stopCamera}>{t('billing_modals.expense.cancel')}</Button>
                            <button
                                onClick={captureExpensePhoto}
                                style={{
                                    width: '70px', height: '70px', borderRadius: '50%',
                                    background: 'white', border: '4px solid rgba(255,255,255,0.5)',
                                    cursor: 'pointer'
                                }}
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
};
export default Billing;
