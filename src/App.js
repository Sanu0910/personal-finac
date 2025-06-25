import React, { useState, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    signInWithCustomToken
} from 'firebase/auth';
import {
    getFirestore,
    doc,
    setDoc,
    addDoc,
    collection,
    onSnapshot,
    deleteDoc,
    updateDoc,
    setLogLevel
} from 'firebase/firestore';
import { IndianRupee, Plus, Trash2, PiggyBank, Edit, Lightbulb, ChevronLeft, ChevronRight, BookOpen, BarChart2, CreditCard, Calendar, CheckCircle } from 'lucide-react';

// --- Firebase Configuration ---
// Use environment variables for Firebase config and App ID
const firebaseConfigString = process.env.REACT_APP_FIREBASE_CONFIG;
let firebaseConfig = {};
try {
    if (firebaseConfigString) {
        firebaseConfig = JSON.parse(firebaseConfigString);
    } else {
        console.warn("Firebase config (REACT_APP_FIREBASE_CONFIG) is not set. Using empty config.");
    }
} catch (error) {
    console.error("Error parsing REACT_APP_FIREBASE_CONFIG:", error);
    // Fallback to empty config if parsing fails
}

const appId = process.env.REACT_APP_APP_ID || 'default-app-id';
if (!process.env.REACT_APP_APP_ID) {
    console.warn("App ID (REACT_APP_APP_ID) is not set. Using 'default-app-id'.");
}


// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
setLogLevel('debug'); // Consider making this conditional based on environment too e.g. process.env.NODE_ENV === 'development'

// --- Financial Wisdom Data ---
const financialWisdom = [
    { book: "The Intelligent Investor", author: "Benjamin Graham", quote: "The investor's chief problem—and even his worst enemy—is likely to be himself.", rule: "Invest with a margin of safety. Never overpay for an asset." },
    { book: "The Richest Man in Babylon", author: "George S. Clason", quote: "A part of all you earn is yours to keep.", rule: "Pay yourself first. Aim to save at least 10% of your income before you spend on anything else." },
    { book: "Rich Dad Poor Dad", author: "Robert T. Kiyosaki", quote: "The rich don't work for money. They make money work for them.", rule: "Focus on acquiring income-generating assets, not liabilities that drain your wealth." }
];

// --- Tax Calculation Utilities (FY 2024-25) ---
const calculateTax = (annualSalary, regime, deductions = 0) => {
    if (annualSalary <= 0) return { totalTax: 0, taxableIncome: 0, tax: 0, cess: 0 };
    const standardDeduction = 50000;
    let taxableIncome;
    let tax = 0;
    if (regime === 'new') {
        taxableIncome = annualSalary - standardDeduction;
        if (taxableIncome <= 700000) return { totalTax: 0, taxableIncome, tax: 0, cess: 0 };
        if (taxableIncome <= 300000) { tax = 0; }
        else if (taxableIncome <= 600000) { tax = (taxableIncome - 300000) * 0.05; }
        else if (taxableIncome <= 900000) { tax = 15000 + (taxableIncome - 600000) * 0.10; }
        else if (taxableIncome <= 1200000) { tax = 45000 + (taxableIncome - 900000) * 0.15; }
        else if (taxableIncome <= 1500000) { tax = 90000 + (taxableIncome - 1200000) * 0.20; }
        else { tax = 150000 + (taxableIncome - 1500000) * 0.30; }
    } else { // Old Regime
        taxableIncome = annualSalary - standardDeduction - deductions;
        if (taxableIncome <= 500000) return { totalTax: 0, taxableIncome, tax: 0, cess: 0 };
        if (taxableIncome <= 250000) { tax = 0; }
        else if (taxableIncome <= 500000) { tax = (taxableIncome - 250000) * 0.05; }
        else if (taxableIncome <= 1000000) { tax = 12500 + (taxableIncome - 500000) * 0.20; }
        else { tax = 112500 + (taxableIncome - 1000000) * 0.30; }
    }
    const cess = tax * 0.04;
    const totalTax = tax + cess;
    return { totalTax, taxableIncome: Math.max(0, taxableIncome), tax, cess };
};

// --- Helper Components ---
const StatCard = ({ title, value, icon, bgColor, onEdit }) => (
    <div className={`p-4 md:p-6 rounded-2xl shadow-lg transition-transform transform hover:-translate-y-1 ${bgColor}`}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-200 uppercase">{title}</p>
                <p className="text-2xl md:text-3xl font-bold text-white mt-1">{value}</p>
            </div>
            <div className="p-3 bg-black bg-opacity-20 rounded-xl">{icon}</div>
        </div>
        {onEdit && (<button onClick={onEdit} className="mt-4 text-xs font-semibold text-white hover:text-gray-300 flex items-center gap-1"><Edit size={12} /> Change Salary</button>)}
    </div>
);

const SalaryModal = ({ isOpen, onClose, onSave }) => {
    const [newSalary, setNewSalary] = useState('');
    if (!isOpen) return null;
    const handleSave = () => {
        const salaryValue = parseFloat(newSalary);
        if (!isNaN(salaryValue) && salaryValue > 0) { onSave(salaryValue); onClose(); setNewSalary(''); }
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-4">Set Your Monthly Salary</h2>
                <div className="relative"><IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><input type="number" placeholder="e.g., 50000" value={newSalary} onChange={(e) => setNewSalary(e.target.value)} className="w-full bg-gray-900 text-white border-2 border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div className="flex justify-end gap-4 mt-8"><button onClick={onClose} className="py-2 px-6 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors">Cancel</button><button onClick={handleSave} className="py-2 px-6 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors">Save</button></div>
            </div>
        </div>
    );
};

const AddBillModal = ({ isOpen, onClose, onSave }) => {
    const [cardName, setCardName] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    if (!isOpen) return null;

    const handleSave = (e) => {
        e.preventDefault();
        const billAmount = parseFloat(amount);
        if (cardName && !isNaN(billAmount) && billAmount > 0 && dueDate) {
            onSave({ cardName, amount: billAmount, dueDate });
            onClose();
            setCardName(''); setAmount(''); setDueDate('');
        }
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
            <form onSubmit={handleSave} className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-6">Add Credit Card Bill</h2>
                <div className="space-y-4">
                    <input type="text" placeholder="Card Name (e.g., HDFC Millennia)" value={cardName} onChange={e => setCardName(e.target.value)} required className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg py-3 px-4 focus:outline-none" />
                    <input type="number" placeholder="Amount" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg py-3 px-4 focus:outline-none" />
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg py-3 px-4 focus:outline-none appearance-none" />
                </div>
                <div className="flex justify-end gap-4 mt-8"><button type="button" onClick={onClose} className="py-2 px-6 bg-gray-600 hover:bg-gray-500 rounded-lg">Cancel</button><button type="submit" className="py-2 px-6 bg-blue-600 hover:bg-blue-500 rounded-lg">Add Bill</button></div>
            </form>
        </div>
    );
};

const FinancialWisdomCard = ({ wisdom }) => (
    <div className="bg-gradient-to-br from-gray-700 to-gray-800 p-6 rounded-2xl shadow-lg border border-gray-600"><div className="flex items-start gap-4"><BookOpen className="text-yellow-400 mt-1 flex-shrink-0" size={24} /><div><h3 className="text-xl font-bold text-white">Financial Wisdom</h3><p className="text-sm text-gray-300 italic mt-2">"{wisdom.quote}"</p><p className="text-xs font-semibold text-gray-400 mt-1">- {wisdom.author}, {wisdom.book}</p><div className="mt-4 p-3 bg-gray-900 rounded-lg"><p className="text-gray-200 font-semibold"><Lightbulb size={16} className="inline mr-2 text-yellow-400" />Rule: <span className="font-normal">{wisdom.rule}</span></p></div></div></div></div>
);

const TaxCalculatorCard = ({ salary }) => {
    const [regime, setRegime] = useState('new');
    const [deductions, setDeductions] = useState(0);
    const annualSalary = salary * 12;
    const taxDetails = calculateTax(annualSalary, regime, deductions);
    const formatCurrency = (value) => value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });
    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg"><h3 className="text-xl font-bold text-white mb-4">Income Tax Calculator (FY 2024-25)</h3><div className="flex bg-gray-900 rounded-lg p-1 mb-4"><button onClick={() => setRegime('new')} className={`w-1/2 p-2 rounded-md font-semibold transition-colors ${regime === 'new' ? 'bg-blue-600' : 'text-gray-300'}`}>New</button><button onClick={() => setRegime('old')} className={`w-1/2 p-2 rounded-md font-semibold transition-colors ${regime === 'old' ? 'bg-blue-600' : 'text-gray-300'}`}>Old</button></div>{regime === 'old' && (<div className="mb-4"><label className="block text-sm font-medium text-gray-300 mb-1">Deductions</label><div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span><input type="number" value={deductions} onChange={e => setDeductions(Number(e.target.value))} className="w-full bg-gray-700 text-white border-2 border-gray-600 rounded-lg py-2 pl-6 pr-4 focus:outline-none" /></div></div>)}<div className="space-y-2 text-sm"><div className="flex justify-between"><span className="text-gray-400">Annual Salary:</span><span className="font-mono">{formatCurrency(annualSalary)}</span></div><div className="flex justify-between"><span className="text-gray-400">Taxable Income:</span><span className="font-mono">{formatCurrency(taxDetails.taxableIncome)}</span></div><div className="flex justify-between border-t border-gray-700 pt-2"><span className="text-gray-400">Income Tax:</span><span className="font-mono">{formatCurrency(taxDetails.tax)}</span></div><div className="flex justify-between"><span className="text-gray-400">Cess (4%):</span><span className="font-mono">{formatCurrency(taxDetails.cess)}</span></div><div className="flex justify-between text-lg font-bold border-t border-gray-500 mt-2 pt-2"><span className="text-white">Total Tax:</span><span className="font-mono text-red-400">{formatCurrency(taxDetails.totalTax)}</span></div></div></div>
    );
};

const BudgetVsActualChart = ({ expenses, salary, remainingBalance }) => {
    const actualSpending = useMemo(() => {
        const spending = { Needs: 0, Wants: 0, Other: 0 };
        expenses.forEach(expense => {
            if (['Rent', 'Utilities', 'Transport', 'Health', 'Food'].includes(expense.category)) { spending.Needs += expense.amount; }
            else if (['Entertainment', 'Shopping'].includes(expense.category)) { spending.Wants += expense.amount; }
            else { spending.Other += expense.amount; }
        });
        return spending;
    }, [expenses]);
    const chartData = [ { name: 'Needs', Budget: salary * 0.5, Actual: actualSpending.Needs }, { name: 'Wants', Budget: salary * 0.3, Actual: actualSpending.Wants }, { name: 'Savings', Budget: salary * 0.2, Actual: Math.max(0, remainingBalance) } ];
    return (
        <div className="bg-gray-800 p-6 rounded-2xl shadow-lg"><h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><BarChart2 />Budget vs. Actuals</h3><ResponsiveContainer width="100%" height={300}><BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis dataKey="name" stroke="#A0AEC0" /><YAxis stroke="#A0AEC0" tickFormatter={(value) => `₹${value/1000}k`} /><Tooltip contentStyle={{ backgroundColor: '#2D3748', border: 'none' }} cursor={{fill: '#4A5568'}} formatter={(value) => [value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }), null]} /><Legend /><Bar dataKey="Budget" fill="#4299E1" /><Bar dataKey="Actual" fill="#48BB78" /></BarChart></ResponsiveContainer></div>
    );
}

const CreditCardHub = ({ bills, onAddBill, onMarkPaid, onDelete }) => {
    const pendingBills = bills.filter(b => !b.isPaid).sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));

    return (
        <section className="bg-gray-800 p-6 rounded-2xl shadow-lg mb-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2"><CreditCard /> Credit Card Hub</h2>
                <button onClick={onAddBill} className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-semibold hover:bg-blue-500 flex items-center gap-1"><Plus size={16}/> Add Bill</button>
            </div>
            {pendingBills.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {pendingBills.map(bill => {
                        const dueDate = new Date(bill.dueDate + 'T00:00:00');
                        const today = new Date(); today.setHours(0,0,0,0);
                        const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
                        let dateColor = 'text-gray-400';
                        let borderColor = 'border-gray-700';
                        if (daysDiff < 0) {
                            dateColor = 'text-red-400';
                            borderColor = 'border-red-500';
                        } else if (daysDiff <= 5) {
                            dateColor = 'text-yellow-400';
                            borderColor = 'border-yellow-500';
                        }

                        return (
                            <div key={bill.id} className={`bg-gray-900 p-4 rounded-lg border-l-4 ${borderColor} flex flex-col justify-between`}>
                                <div>
                                    <div className="flex justify-between items-start">
                                      <p className="font-semibold text-white">{bill.cardName}</p>
                                      <button onClick={() => onDelete(bill.id)} className="text-gray-600 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                    <p className="text-2xl font-bold text-red-400 my-2">{Number(bill.amount).toLocaleString('en-IN', {style: 'currency', currency: 'INR'})}</p>
                                    <p className={`text-sm font-medium ${dateColor} flex items-center gap-1.5`}><Calendar size={14}/> Due: {dueDate.toLocaleDateString()}</p>
                                </div>
                                <button onClick={() => onMarkPaid(bill.id)} className="mt-4 w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
                                    <CheckCircle size={18} /> Mark as Paid
                                </button>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="text-center text-gray-500 py-10">No pending credit card bills. Great job!</div>
            )}
        </section>
    );
};

const MonthNavigator = ({ currentDate, setCurrentDate }) => {
    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => {
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        if (nextMonth <= new Date()) setCurrentDate(nextMonth);
    };
    const isNextMonthFuture = () => new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1) > new Date();
    return (
        <div className="flex items-center justify-center gap-4 bg-gray-800 p-3 rounded-xl mb-8 shadow-md">
            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-700 transition-colors"><ChevronLeft size={24} /></button>
            <span className="font-bold text-xl w-48 text-center">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
            <button onClick={handleNextMonth} disabled={isNextMonthFuture()} className="p-2 rounded-full hover:bg-gray-700 disabled:text-gray-600"><ChevronRight size={24} /></button>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [allExpenses, setAllExpenses] = useState([]);
    const [creditCardBills, setCreditCardBills] = useState([]);
    const [salary, setSalary] = useState(0);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Food');
    const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [wisdomIndex, setWisdomIndex] = useState(0);

    const expenseCategories = ['Food', 'Rent', 'Transport', 'Utilities', 'Entertainment', 'Health', 'Shopping', 'Other'];
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF1943', '#19D4FF', '#FF19AF'];

    useEffect(() => {
        const initialAuthToken = process.env.REACT_APP_INITIAL_AUTH_TOKEN;
        if (!process.env.REACT_APP_INITIAL_AUTH_TOKEN) {
            console.warn("Initial auth token (REACT_APP_INITIAL_AUTH_TOKEN) is not set. Will attempt anonymous sign-in if needed.");
        }

        const unsubAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    if (initialAuthToken) {
                        await signInWithCustomToken(auth, initialAuthToken);
                    } else {
                        await signInAnonymously(auth);
                    }
                } catch (error) {
                    console.error("Auth Error during initial sign-in attempt:", error);
                    // Potentially fall back to anonymous sign-in again if custom token fails
                    if (initialAuthToken && !auth.currentUser) {
                        try {
                            console.log("Attempting anonymous sign-in after custom token failure.");
                            await signInAnonymously(auth);
                        } catch (anonError) {
                            console.error("Anonymous sign-in also failed:", anonError);
                        }
                    }
                }
            }
            setIsAuthReady(true);
        });
        const wisdomInterval = setInterval(() => setWisdomIndex(prev => (prev + 1) % financialWisdom.length), 15000);
        return () => { unsubAuth(); clearInterval(wisdomInterval); };
    }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

    useEffect(() => {
        // Ensure Firebase app is initialized before trying to use Firestore services
        if (!app || !isAuthReady || !userId) {
            setIsLoading(!(!isAuthReady || !userId)); // Keep loading if auth isn't ready or no user ID
            return;
        }
        setIsLoading(true); // Set loading true at the start of data fetching

        // Check if Firestore is available/initialized (db object should exist)
        if (!db) {
            console.error("Firestore is not initialized. Skipping data fetch.");
            setIsLoading(false);
            return;
        }

        const expensesCollectionPath = `artifacts/${appId}/users/${userId}/expenses`;
        const salaryDocPath = `artifacts/${appId}/users/${userId}/profile/salary`;
        const billsCollectionPath = `artifacts/${appId}/users/${userId}/creditCardBills`;

        console.log("Attempting to fetch data for user:", userId, "appId:", appId);
        console.log("Expenses path:", expensesCollectionPath);
        console.log("Salary path:", salaryDocPath);
        console.log("Bills path:", billsCollectionPath);


        const unsubExpenses = onSnapshot(collection(db, expensesCollectionPath), (snap) => {
            setAllExpenses(snap.docs.map(doc => ({ id: doc.id, ...doc.data(), amount: Number(doc.data().amount) })));
            console.log("Expenses fetched:", snap.docs.length);
            setIsLoading(false); // Set loading to false after first successful fetch or empty snapshot
        }, (err) => {
            console.error("Expense fetch error:", err, "Path:", expensesCollectionPath);
            setIsLoading(false);
        });

        const unsubSalary = onSnapshot(doc(db, salaryDocPath), (docSnap) => { // Renamed to docSnap to avoid conflict
            setSalary(docSnap.exists() ? docSnap.data().monthlySalary : 0);
            console.log("Salary fetched, exists:", docSnap.exists());
            // Do not set isLoading here if expenses are still loading
        }, (err) => {
            console.error("Salary fetch error:", err, "Path:", salaryDocPath);
            // Do not set isLoading here
        });

        const unsubBills = onSnapshot(collection(db, billsCollectionPath), (snap) => {
            setCreditCardBills(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            console.log("Bills fetched:", snap.docs.length);
            // Do not set isLoading here
        }, (err) => {
            console.error("Bill fetch error:", err, "Path:", billsCollectionPath);
            // Do not set isLoading here
        });

        // Set loading to false only after all initial data or first snapshot is processed
        // This is tricky with multiple listeners. A common pattern is to set loading false in the "slowest" one
        // or use a counter. For simplicity, expenses often drive the main loading state.

        return () => { unsubExpenses(); unsubSalary(); unsubBills(); };
    }, [isAuthReady, userId, app, db, appId]); // Added app, db, appId as dependencies

    const filteredExpenses = useMemo(() => allExpenses.filter(expense => {
        if (!expense.createdAt || typeof expense.createdAt.toDate !== 'function') {
             console.warn("Invalid expense createdAt field:", expense);
             return false; // Skip expenses with invalid date
        }
        const expenseDate = expense.createdAt.toDate();
        return expenseDate.getFullYear() === selectedDate.getFullYear() && expenseDate.getMonth() === selectedDate.getMonth();
    }), [allExpenses, selectedDate]);

    const totalExpenses = useMemo(() => filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0), [filteredExpenses]);
    const remainingBalance = useMemo(() => salary - totalExpenses, [salary, totalExpenses]);
    const totalPendingDues = useMemo(() => creditCardBills.filter(bill => !bill.isPaid).reduce((sum, bill) => sum + Number(bill.amount), 0), [creditCardBills]);


    const pieChartData = useMemo(() => {
        const dataMap = new Map();
        filteredExpenses.forEach(exp => { dataMap.set(exp.category, (dataMap.get(exp.category) || 0) + exp.amount); });
        return Array.from(dataMap, ([name, value]) => ({ name, value }));
    }, [filteredExpenses]);

    const handleSetSalary = async (newSalary) => { if (userId && db) await setDoc(doc(db, `artifacts/${appId}/users/${userId}/profile/salary`), { monthlySalary: newSalary }); };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!description || !amount || !userId || !db) return;
        await addDoc(collection(db, `artifacts/${appId}/users/${userId}/expenses`), { description, amount: parseFloat(amount), category, createdAt: new Date() });
        setDescription(''); setAmount(''); setCategory('Food');
    };

    const handleDeleteExpense = async (id) => { if (userId && db) await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/expenses/${id}`)); };

    const handleAddBill = async (billData) => { if (userId && db) await addDoc(collection(db, `artifacts/${appId}/users/${userId}/creditCardBills`), { ...billData, isPaid: false }); };
    const handleMarkBillAsPaid = async (id) => { if (userId && db) await updateDoc(doc(db, `artifacts/${appId}/users/${userId}/creditCardBills/${id}`), { isPaid: true }); };
    const handleDeleteBill = async (id) => { if (userId && db) await deleteDoc(doc(db, `artifacts/${appId}/users/${userId}/creditCardBills/${id}`)); };

    if (isLoading) return <div className="bg-gray-900 min-h-screen flex flex-col justify-center items-center text-white"><PiggyBank size={48} className="animate-bounce" /><p className="mt-4">Loading Financials...</p></div>;
    if (!firebaseConfig.apiKey) return <div className="bg-gray-900 min-h-screen flex flex-col justify-center items-center text-white"><p>Firebase configuration is missing. Please set REACT_APP_FIREBASE_CONFIG.</p></div>;

    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans p-4 sm:p-6 lg:p-8">
            <SalaryModal isOpen={isSalaryModalOpen} onClose={() => setIsSalaryModalOpen(false)} onSave={handleSetSalary} />
            <AddBillModal isOpen={isBillModalOpen} onClose={() => setIsBillModalOpen(false)} onSave={handleAddBill} />

            <header className="mb-8 flex justify-between items-center">
                <div><h1 className="text-3xl sm:text-4xl font-bold">Expense Dashboard</h1><p className="text-gray-400 mt-1">Your complete financial overview.</p></div>
                <div className="text-xs font-mono bg-gray-800 text-gray-400 px-3 py-1 rounded-md">UID: {userId}</div>
            </header>

            <MonthNavigator currentDate={selectedDate} setCurrentDate={setSelectedDate} />

            <CreditCardHub bills={creditCardBills} onAddBill={() => setIsBillModalOpen(true)} onMarkPaid={handleMarkBillAsPaid} onDelete={handleDeleteBill} />

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* --- Left Column: Stats & Charts --- */}
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Salary" value={salary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} icon={<PiggyBank size={24} className="text-green-400"/>} bgColor="bg-gradient-to-br from-green-600 to-green-800" onEdit={() => setIsSalaryModalOpen(true)} />
                        <StatCard title="Monthly Expenses" value={totalExpenses.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} icon={<IndianRupee size={24} className="text-red-400"/>} bgColor="bg-gradient-to-br from-red-600 to-red-800" />
                        <StatCard title="Pending Dues" value={totalPendingDues.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} icon={<CreditCard size={24} className="text-yellow-400"/>} bgColor="bg-gradient-to-br from-yellow-600 to-yellow-800" />
                        <StatCard title="Balance" value={remainingBalance.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })} icon={<PiggyBank size={24} className="text-blue-400"/>} bgColor="bg-gradient-to-br from-blue-600 to-blue-800" />
                    </div>

                    <FinancialWisdomCard wisdom={financialWisdom[wisdomIndex]} />
                    {salary > 0 && <BudgetVsActualChart expenses={filteredExpenses} salary={salary} remainingBalance={remainingBalance} />}
                    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Expense Breakdown</h2>
                        {filteredExpenses.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}><PieChart><Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} outerRadius={110} fill="#8884d8" dataKey="value" nameKey="name" label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>{pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#374151', border: 'none' }} formatter={(value) => [value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }), 'Amount']} /><Legend /></PieChart></ResponsiveContainer>
                        ) : <div className="h-[300px] flex items-center justify-center text-gray-400">No expenses for this month.</div>}
                    </div>
                </div>

                {/* --- Right Column: Add, View & Calculate --- */}
                <div className="flex flex-col gap-8">
                    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus /> Add New Expense</h2>
                        <form onSubmit={handleAddExpense} className="space-y-4"><input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg py-3 px-4 focus:outline-none" /><input type="number" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} required className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg py-3 px-4 focus:outline-none" /><select value={category} onChange={(e) => setCategory(e.target.value)} required className="w-full bg-gray-900 border-2 border-gray-700 rounded-lg py-3 px-4 focus:outline-none appearance-none">{expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select><button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg">Add Expense</button></form>
                    </div>

                    {salary > 0 && <TaxCalculatorCard salary={salary} />}

                    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg flex-grow">
                        <h2 className="text-xl font-bold mb-4">Transaction History</h2>
                        <div className="space-y-3 pr-2 h-[400px] overflow-y-auto">{filteredExpenses.length > 0 ? ([...filteredExpenses].sort((a, b) => {
                           // Ensure createdAt and toDate are valid before sorting
                           const dateA = a.createdAt && typeof a.createdAt.toDate === 'function' ? a.createdAt.toDate() : new Date(0);
                           const dateB = b.createdAt && typeof b.createdAt.toDate === 'function' ? b.createdAt.toDate() : new Date(0);
                           return dateB - dateA;
                        }).map((expense) => (<div key={expense.id} className="flex justify-between items-center bg-gray-900 p-3 rounded-lg"><div><p className="font-semibold">{expense.description}</p><p className="text-sm text-gray-400">{expense.category}</p></div><div className="flex items-center gap-4"><p className="font-bold text-red-400">{Number(expense.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</p><button onClick={() => handleDeleteExpense(expense.id)} className="text-gray-500 hover:text-red-500"><Trash2 size={18}/></button></div></div>))) : <div className="text-center text-gray-500 pt-16">Transactions will appear here.</div>}</div>
                    </div>
                </div>
            </main>
        </div>
    );
}
