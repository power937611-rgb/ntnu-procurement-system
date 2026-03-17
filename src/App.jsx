import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  Plus,
  Bell,
  CheckCircle,
  Search,
  Home,
  Calculator,
  Mail,
  Send,
  RefreshCw,
  Edit,
  Lock,
} from 'lucide-react';

// --- 模擬資料庫 (Mock Data) ---
const initialContracts = [
  {
    id: 1,
    name: '115年採購組測試專用1',
    number: 'NU21150306fortest1',
    unit: '黃有嘉',
    email: 'uca@ntnu.edu.tw',
    cc: 'ch0109@ntnu.edu.tw',
    awardDate: '2026-03-16',
    startDate: '2026-03-30',
    deadline: '2026-05-30',
    status: '履約中',
    log: '履約期限預告 已發送於 2026-03-16',
  },
  {
    id: 2,
    name: '115年採購組測試專用2',
    number: 'NU21150306fortest2',
    unit: '黃有嘉',
    email: 'uca@ntnu.edu.tw',
    cc: 'ch0109@ntnu.edu.tw',
    awardDate: '2026-03-01',
    startDate: '2026-03-31',
    deadline: '2026-03-19',
    status: '履約中',
    log: '履約期限即期通知 已發送於 2026-03-16',
  },
];

// 👇 重要：請在此填入您發布的 Google Apps Script Web App 網址
const GOOGLE_SHEET_API_URL =
  'https://script.google.com/macros/s/AKfycbwpZleGh8qN8rpiNCpH9NESbtvnBf_8M7f-IXKV3TXKDJJPj87c4W1McdjmQlrIgTM8sQ/exec';

// 日期格式化工具 (只保留 YYYY-MM-DD)
const formatDateOnly = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function App() {
  const today = new Date();
  const todayFormatted = formatDateOnly(today); // 格式：YYYY-MM-DD
  const todayDisplay = `${today.getFullYear()}/${String(
    today.getMonth() + 1
  ).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // 支援從 Google Sheets API 讀取資料
  const [contracts, setContracts] = useState(() => {
    if (!GOOGLE_SHEET_API_URL) return initialContracts;
    return [];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState('all');

  // 控制新增 Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContract, setNewContract] = useState({
    name: '',
    number: '',
    unit: '',
    email: '',
    cc: '',
    awardDate: '',
    startDate: '',
    deadline: '',
  });

  // 控制密碼驗證 Modal 的 State 與預設密碼
  const EDIT_PASSWORD = '5639';
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingEditContract, setPendingEditContract] = useState(null);

  // 控制編輯 Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingContract, setEditingContract] = useState(null);

  // 控制發送信件 Modal
  const [mailData, setMailData] = useState({
    isOpen: false,
    contractId: null,
    to: '',
    cc: '',
    subject: '',
    content: '',
  });

  // 讀取資料的函式
  const fetchData = () => {
    if (GOOGLE_SHEET_API_URL) {
      setIsLoading(true);
      fetch(GOOGLE_SHEET_API_URL)
        .then((res) => res.json())
        .then((data) => {
          setContracts(data);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('讀取試算表失敗:', err);
          setIsLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 同步至 Google Sheets
  const syncToGoogleSheet = async (action, data) => {
    if (!GOOGLE_SHEET_API_URL) return;
    try {
      await fetch(GOOGLE_SHEET_API_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, data }),
      });
    } catch (error) {
      console.error('同步至試算表失敗:', error);
    }
  };

  // 處理新增案件表單送出
  const handleAddSubmit = (e) => {
    e.preventDefault();
    const newId =
      contracts.length > 0
        ? Math.max(0, ...contracts.map((c) => Number(c.id) || 0)) + 1
        : 1;
    const contractToAdd = {
      id: newId,
      name: newContract.name,
      number: newContract.number,
      unit: newContract.unit,
      email: newContract.email,
      cc: newContract.cc,
      awardDate: newContract.awardDate,
      startDate: newContract.startDate,
      deadline: newContract.deadline,
      status: '履約中',
      log: '系統手動建立案件',
    };

    setContracts([...contracts, contractToAdd]);
    syncToGoogleSheet('add', contractToAdd);

    setShowAddModal(false);
    setNewContract({
      name: '',
      number: '',
      unit: '',
      email: '',
      cc: '',
      awardDate: '',
      startDate: '',
      deadline: '',
    });
  };

  // 處理點擊編輯按鈕
  const handleEditClick = (contract) => {
    setPendingEditContract(contract);
    setPasswordInput('');
    setPasswordError('');
    setShowPasswordModal(true);
  };

  // 處理密碼驗證
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === EDIT_PASSWORD) {
      setShowPasswordModal(false);
      setEditingContract({ ...pendingEditContract });
      setShowEditModal(true);
    } else {
      setPasswordError('密碼錯誤，請重新輸入');
    }
  };

  // 處理編輯案件送出
  const handleEditSubmit = (e) => {
    e.preventDefault();
    const updatedContracts = contracts.map((c) =>
      c.id === editingContract.id ? editingContract : c
    );
    setContracts(updatedContracts);
    syncToGoogleSheet('update', editingContract);

    setShowEditModal(false);
    setEditingContract(null);
  };

  // 開啟發送信件 Modal
  const openMailModal = (contract) => {
    setMailData({
      isOpen: true,
      contractId: contract.id,
      to: contract.email || '',
      cc: contract.cc || '',
      subject: `[履約通知] 關於「${contract.name}」履約期限提醒`,
      content: `${
        contract.unit
      } 您好，\n\n此為系統發送之提醒信件。\n\n【案件資訊】\n案號：${
        contract.number
      }\n案名：${contract.name}\n履約起始日：${formatDateOnly(
        contract.startDate
      )}\n履約期限：${formatDateOnly(
        contract.deadline
      )}\n\n請留意相關履約時程，若已結案請至系統更新狀態。\n\n敬祝 順心\n採購組 敬上`,
    });
  };

  // 處理信件送出
  const handleSendMail = async (e) => {
    e.preventDefault();
    const now = new Date();
    const timeString = `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(
      now.getHours()
    ).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updatedContracts = contracts.map((c) =>
      c.id === mailData.contractId
        ? { ...c, log: `手動發送通知信件於 ${timeString}` }
        : c
    );
    setContracts(updatedContracts);

    const target = updatedContracts.find((c) => c.id === mailData.contractId);

    if (GOOGLE_SHEET_API_URL && target) {
      try {
        await fetch(GOOGLE_SHEET_API_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send_mail',
            data: target,
            mail: {
              to: mailData.to,
              cc: mailData.cc,
              subject: mailData.subject,
              content: mailData.content,
            },
          }),
        });
      } catch (error) {
        console.error('發送郵件/同步至試算表失敗:', error);
      }
    }

    setMailData({
      isOpen: false,
      contractId: null,
      to: '',
      cc: '',
      subject: '',
      content: '',
    });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case '結案':
        return 'bg-green-100 text-green-800 border-green-200';
      case '履約中':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case '程序作業中':
        return 'bg-red-100 text-red-800 border-red-200';
      case '驗收中':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case '逾期':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case '暫停':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-500 border-gray-200';
    }
  };

  const activeContracts = contracts.filter((c) => c.status === '履約中').length;
  const overdueContracts = contracts.filter(
    (c) =>
      c.status === '履約中' && new Date(c.deadline) < new Date(todayFormatted)
  ).length;
  const sentTodayContracts = contracts.filter(
    (c) => c.log && c.log.includes(todayFormatted)
  ).length;

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800">
      {/* 側邊導覽列 */}
      <aside className="w-64 bg-blue-900 text-white flex flex-col shadow-xl">
        <div className="p-6 flex items-center space-x-3">
          <div className="bg-white p-2 rounded-lg">
            <Bell className="w-6 h-6 text-blue-900" />
          </div>
          <span className="text-xl font-bold tracking-wider">
            臺師大履約管理ＡＩ小幫手
          </span>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-blue-800 text-white'
                : 'hover:bg-blue-800/50 text-blue-100'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>系統儀表板</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('contracts');
              setFilterMode('all');
            }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'contracts'
                ? 'bg-blue-800 text-white'
                : 'hover:bg-blue-800/50 text-blue-100'
            }`}
          >
            <FileText className="w-5 h-5" />
            <span>案件管理清單</span>
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
              activeTab === 'calculator'
                ? 'bg-blue-800 text-white'
                : 'hover:bg-blue-800/50 text-blue-100'
            }`}
          >
            <Calculator className="w-5 h-5" />
            <span>履約期限計算機</span>
          </button>
        </nav>
        <div className="p-4 text-xs text-blue-300 text-center border-t border-blue-800">
          NTNU Procurement System v2.0
        </div>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm px-8 py-5 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-gray-800">
            {activeTab === 'dashboard' && '系統儀表板'}
            {activeTab === 'contracts' && '案件管理清單'}
            {activeTab === 'calculator' && '履約期限計算機'}
          </h2>
          <div className="flex items-center space-x-4">
            {isLoading && (
              <span className="text-sm font-medium text-blue-500 animate-pulse">
                ↻ 資料同步中...
              </span>
            )}
            <span className="text-sm font-medium text-gray-500">
              今日日期：{todayDisplay}
            </span>
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold border-2 border-blue-200">
              嘉
            </div>
          </div>
        </header>

        <div className="p-8">
          {/* Dashboard View */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                  title="執行中案件"
                  value={activeContracts}
                  icon={<Clock />}
                  color="blue"
                  onClick={() => {
                    setActiveTab('contracts');
                    setFilterMode('active');
                  }}
                />
                <StatCard
                  title="逾期案件警告"
                  value={overdueContracts}
                  icon={<AlertTriangle />}
                  color="red"
                  onClick={() => {
                    setActiveTab('contracts');
                    setFilterMode('overdue');
                  }}
                />
                <StatCard
                  title="今日已發信件"
                  value={sentTodayContracts}
                  icon={<CheckCircle />}
                  color="green"
                  onClick={() => {
                    setActiveTab('contracts');
                    setFilterMode('sentToday');
                  }}
                />
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-blue-600" /> 系統通知紀錄
                  (近24小時)
                </h3>
                <div className="space-y-4">
                  {contracts.map((c, index) => (
                    <div
                      key={c.id || c.number || `log-${index}`}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="mt-1">
                        {c.log && c.log.includes('逾期') ? (
                          <AlertTriangle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">
                          {c.name} ({c.number})
                        </p>
                        <p className="text-sm text-gray-500">{c.log}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Contracts View */}
          {activeTab === 'contracts' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col animate-fade-in">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-xl">
                <div className="flex items-center">
                  <div className="relative w-72">
                    <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="搜尋案名或案號..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  {filterMode !== 'all' && (
                    <div className="ml-4 flex items-center bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-lg text-sm font-medium border border-yellow-200">
                      <span>
                        篩選中：
                        {filterMode === 'overdue'
                          ? '逾期案件'
                          : filterMode === 'active'
                          ? '執行中案件'
                          : '今日已發信件'}
                      </span>
                      <button
                        onClick={() => setFilterMode('all')}
                        className="ml-2 text-yellow-600 hover:text-yellow-900 text-lg leading-none"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={fetchData}
                    className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-sm"
                    title="重新載入試算表資料"
                  >
                    <RefreshCw
                      className={`w-5 h-5 mr-1 ${
                        isLoading ? 'animate-spin text-blue-500' : ''
                      }`}
                    />{' '}
                    同步資料
                  </button>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-sm"
                  >
                    <Plus className="w-5 h-5 mr-1" /> 新增案件
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-200">
                      <th className="p-4 font-semibold">案號 / 案名</th>
                      <th className="p-4 font-semibold">請購單位</th>
                      <th className="p-4 font-semibold">履約起始日</th>
                      <th className="p-4 font-semibold">履約期限</th>
                      <th className="p-4 font-semibold">狀態</th>
                      <th className="p-4 font-semibold">系統紀錄</th>
                      <th className="p-4 font-semibold text-center">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {contracts
                      .filter((c) => {
                        const nameStr = c.name ? String(c.name) : '';
                        const numberStr = c.number ? String(c.number) : '';
                        return (
                          nameStr.includes(searchTerm) ||
                          numberStr.includes(searchTerm)
                        );
                      })
                      .filter((c) => {
                        if (filterMode === 'overdue')
                          return (
                            c.status === '履約中' &&
                            new Date(c.deadline) < new Date(todayFormatted)
                          );
                        if (filterMode === 'active')
                          return c.status === '履約中';
                        if (filterMode === 'sentToday')
                          return c.log && c.log.includes(todayFormatted);
                        return true;
                      })
                      .map((contract, index) => (
                        <tr
                          key={contract.id || contract.number || `tr-${index}`}
                          className="hover:bg-gray-50/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-medium text-gray-900">
                              {contract.name}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {contract.number}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-700">
                            {contract.unit}
                          </td>
                          <td className="p-4 text-sm text-gray-700">
                            {formatDateOnly(contract.startDate)}
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-sm font-medium ${
                                new Date(contract.deadline) <
                                  new Date(todayFormatted) &&
                                contract.status === '履約中'
                                  ? 'text-red-600'
                                  : 'text-gray-700'
                              }`}
                            >
                              {formatDateOnly(contract.deadline)}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusStyle(
                                contract.status
                              )}`}
                            >
                              {contract.status}
                            </span>
                          </td>
                          <td
                            className="p-4 text-xs text-gray-500 max-w-xs truncate"
                            title={contract.log}
                          >
                            {contract.log}
                          </td>
                          <td className="p-4 text-center flex justify-center space-x-2">
                            <button
                              onClick={() => handleEditClick(contract)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="編輯案件 (需密碼)"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => openMailModal(contract)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="發送通知信件"
                            >
                              <Mail className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* 新增案件 Modal */}
              {showAddModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center">
                      <h3 className="text-lg font-bold">新增案件</h3>
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="text-blue-200 hover:text-white text-2xl leading-none"
                      >
                        &times;
                      </button>
                    </div>
                    <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          案號
                        </label>
                        <input
                          required
                          type="text"
                          value={newContract.number}
                          onChange={(e) =>
                            setNewContract({
                              ...newContract,
                              number: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="例如: NU21150306"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          案名
                        </label>
                        <input
                          required
                          type="text"
                          value={newContract.name}
                          onChange={(e) =>
                            setNewContract({
                              ...newContract,
                              name: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="案件名稱"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          請購單位 (承辦人)
                        </label>
                        <input
                          required
                          type="text"
                          value={newContract.unit}
                          onChange={(e) =>
                            setNewContract({
                              ...newContract,
                              unit: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="例如: 黃有嘉"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            聯絡信箱 (Email)
                          </label>
                          <input
                            required
                            type="text"
                            value={newContract.email}
                            onChange={(e) =>
                              setNewContract({
                                ...newContract,
                                email: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            副本信箱 (CC)
                          </label>
                          <input
                            type="text"
                            value={newContract.cc}
                            onChange={(e) =>
                              setNewContract({
                                ...newContract,
                                cc: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          決標日期
                        </label>
                        <input
                          required
                          type="date"
                          value={newContract.awardDate}
                          onChange={(e) =>
                            setNewContract({
                              ...newContract,
                              awardDate: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            履約起始日
                          </label>
                          <input
                            required
                            type="date"
                            value={newContract.startDate}
                            onChange={(e) =>
                              setNewContract({
                                ...newContract,
                                startDate: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            履約期限
                          </label>
                          <input
                            required
                            type="date"
                            value={newContract.deadline}
                            onChange={(e) =>
                              setNewContract({
                                ...newContract,
                                deadline: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="pt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowAddModal(false)}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          儲存新增
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* 密碼驗證 Modal */}
              {showPasswordModal && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
                    <div className="bg-gray-800 px-6 py-4 text-white flex justify-between items-center">
                      <h3 className="text-lg font-bold flex items-center">
                        <Lock className="w-5 h-5 mr-2" /> 權限驗證
                      </h3>
                      <button
                        onClick={() => setShowPasswordModal(false)}
                        className="text-gray-400 hover:text-white text-2xl leading-none"
                      >
                        &times;
                      </button>
                    </div>
                    <form
                      onSubmit={handlePasswordSubmit}
                      className="p-6 space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          請輸入編輯密碼
                        </label>
                        <input
                          autoFocus
                          type="password"
                          value={passwordInput}
                          onChange={(e) => {
                            setPasswordInput(e.target.value);
                            setPasswordError('');
                          }}
                          className={`w-full border ${
                            passwordError
                              ? 'border-red-500 focus:ring-red-500'
                              : 'border-gray-300 focus:ring-gray-800'
                          } rounded-lg p-3 focus:ring-2 outline-none transition-colors`}
                          placeholder="請輸入密碼..."
                        />
                        {passwordError && (
                          <p className="text-red-500 text-sm mt-2">
                            {passwordError}
                          </p>
                        )}
                      </div>
                      <div className="pt-4 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowPasswordModal(false)}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg transition-colors font-medium"
                        >
                          確認送出
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* 編輯案件 Modal */}
              {showEditModal && editingContract && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="bg-green-600 px-6 py-4 text-white flex justify-between items-center">
                      <h3 className="text-lg font-bold flex items-center">
                        <Edit className="w-5 h-5 mr-2" /> 編輯案件資料
                      </h3>
                      <button
                        onClick={() => setShowEditModal(false)}
                        className="text-green-200 hover:text-white text-2xl leading-none"
                      >
                        &times;
                      </button>
                    </div>
                    <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          案號
                        </label>
                        <input
                          required
                          type="text"
                          value={editingContract.number}
                          onChange={(e) =>
                            setEditingContract({
                              ...editingContract,
                              number: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          案名
                        </label>
                        <input
                          required
                          type="text"
                          value={editingContract.name}
                          onChange={(e) =>
                            setEditingContract({
                              ...editingContract,
                              name: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            聯絡信箱 (Email)
                          </label>
                          <input
                            required
                            type="text"
                            value={editingContract.email}
                            onChange={(e) =>
                              setEditingContract({
                                ...editingContract,
                                email: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            副本信箱 (CC)
                          </label>
                          <input
                            type="text"
                            value={editingContract.cc}
                            onChange={(e) =>
                              setEditingContract({
                                ...editingContract,
                                cc: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-3 my-3 bg-green-50/50 -mx-6 px-6">
                        <div>
                          <label className="block text-sm font-bold text-green-800 mb-1">
                            履約起始日
                          </label>
                          <input
                            required
                            type="date"
                            value={formatDateOnly(editingContract.startDate)}
                            onChange={(e) =>
                              setEditingContract({
                                ...editingContract,
                                startDate: e.target.value,
                              })
                            }
                            className="w-full border border-green-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-green-800 mb-1">
                            履約期限
                          </label>
                          <input
                            required
                            type="date"
                            value={formatDateOnly(editingContract.deadline)}
                            onChange={(e) =>
                              setEditingContract({
                                ...editingContract,
                                deadline: e.target.value,
                              })
                            }
                            className="w-full border border-green-300 rounded-lg p-2 focus:ring-2 focus:ring-green-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="pt-2 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowEditModal(false)}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          儲存修改
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* 發送 Email Modal */}
              {mailData.isOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 animate-fade-in">
                  <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                    <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center">
                      <h3 className="text-lg font-bold flex items-center">
                        <Mail className="w-5 h-5 mr-2" /> 發送通知信件
                      </h3>
                      <button
                        onClick={() =>
                          setMailData({ ...mailData, isOpen: false })
                        }
                        className="text-blue-200 hover:text-white text-2xl leading-none"
                      >
                        &times;
                      </button>
                    </div>
                    <form onSubmit={handleSendMail} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          收件人 (To)
                        </label>
                        <input
                          required
                          type="text"
                          value={mailData.to}
                          onChange={(e) =>
                            setMailData({ ...mailData, to: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          副本 (CC)
                        </label>
                        <input
                          type="text"
                          value={mailData.cc}
                          onChange={(e) =>
                            setMailData({ ...mailData, cc: e.target.value })
                          }
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          主旨
                        </label>
                        <input
                          required
                          type="text"
                          value={mailData.subject}
                          onChange={(e) =>
                            setMailData({
                              ...mailData,
                              subject: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          信件內容
                        </label>
                        <textarea
                          required
                          value={mailData.content}
                          onChange={(e) =>
                            setMailData({
                              ...mailData,
                              content: e.target.value,
                            })
                          }
                          className="w-full border border-gray-300 rounded-lg p-3 h-48 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        ></textarea>
                      </div>
                      <div className="pt-2 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() =>
                            setMailData({ ...mailData, isOpen: false })
                          }
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center"
                        >
                          <Send className="w-4 h-4 mr-2" /> 確定送出
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Calculator View */}
          {activeTab === 'calculator' && <CalculatorView />}
        </div>
      </main>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `,
        }}
      />
    </div>
  );
}

// 統計卡片元件
function StatCard({ title, value, icon, color, onClick }) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    green: 'bg-green-50 text-green-600 border-green-100',
  };
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-6 border shadow-sm flex items-center space-x-4 ${
        colorMap[color]
      } ${
        onClick
          ? 'cursor-pointer hover:shadow-md transform hover:-translate-y-1 transition-all'
          : ''
      }`}
    >
      <div className={`p-3 rounded-lg bg-white/60 shadow-sm`}>{icon}</div>
      <div>
        <h4 className="text-sm font-medium opacity-80">{title}</h4>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
    </div>
  );
}

// 履約期限計算機元件
function CalculatorView() {
  const todayFormatted = formatDateOnly(new Date());
  const [startDate, setStartDate] = useState(todayFormatted);
  const [days, setDays] = useState(5);
  const [type, setType] = useState('workday');
  const [inclusive, setInclusive] = useState(true);
  const [endDate, setEndDate] = useState('');

  const [calendarData, setCalendarData] = useState(null);
  const [isCalendarLoading, setIsCalendarLoading] = useState(true);
  const [calendarError, setCalendarError] = useState(false);

  useEffect(() => {
    const fetchCalendar = async () => {
      setIsCalendarLoading(true);
      try {
        const years = [2024, 2025, 2026];
        const promises = years.map((y) =>
          fetch(
            `https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${y}.json`
          ).then((res) => res.json())
        );
        const results = await Promise.all(promises);

        const holidayMap = {};
        results.flat().forEach((day) => {
          holidayMap[day.date] = day.isHoliday;
        });

        setCalendarData(holidayMap);
        setCalendarError(false);
      } catch (error) {
        console.error('無法載入政府行事曆', error);
        setCalendarError(true);
      } finally {
        setIsCalendarLoading(false);
      }
    };
    fetchCalendar();
  }, []);

  useEffect(() => {
    if (!startDate || days === '' || days < 0) return;
    const start = new Date(startDate);
    let calculatedDays = parseInt(days);
    if (inclusive && calculatedDays > 0) calculatedDays -= 1;
    if (calculatedDays < 0) calculatedDays = 0;

    if (type === 'calendar') {
      start.setDate(start.getDate() + calculatedDays);
    } else if (type === 'workday') {
      let daysToAdd = calculatedDays;
      while (daysToAdd > 0) {
        start.setDate(start.getDate() + 1);
        const yyyy = start.getFullYear();
        const mm = String(start.getMonth() + 1).padStart(2, '0');
        const dd = String(start.getDate()).padStart(2, '0');
        const dateKey = `${yyyy}${mm}${dd}`;

        if (calendarData && calendarData[dateKey] !== undefined) {
          if (calendarData[dateKey] === false) daysToAdd--;
        } else {
          const dayOfWeek = start.getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) daysToAdd--;
        }
      }
    }

    const yyyy = start.getFullYear();
    const mm = String(start.getMonth() + 1).padStart(2, '0');
    const dd = String(start.getDate()).padStart(2, '0');
    setEndDate(`${yyyy}-${mm}-${dd}`);
  }, [startDate, days, type, inclusive, calendarData]);

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
      <div className="bg-blue-600 p-6 text-white text-center relative">
        <h3 className="text-2xl font-bold flex justify-center items-center">
          <Calendar className="mr-2" /> 履約期限計算機
        </h3>
        <p className="text-blue-100 mt-2 text-sm">
          {isCalendarLoading ? (
            <span className="flex items-center justify-center">
              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />{' '}
              正在同步政府行事曆...
            </span>
          ) : calendarError ? (
            <span className="text-yellow-300">
              ⚠️ 同步失敗，目前僅略過一般週末
            </span>
          ) : (
            <span className="flex items-center justify-center text-green-300 font-medium">
              <CheckCircle className="w-4 h-4 mr-1" /> 已同步 2024-2026
              人事行政總處行事曆 (含國定假日/補班)
            </span>
          )}
        </p>
      </div>

      <div className="p-8 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              第1天 (起始日)
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                天數
              </label>
              <input
                type="number"
                min="0"
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                類型
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="workday">工作天</option>
                <option value="calendar">日曆天</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-start space-x-3">
          <input
            type="checkbox"
            checked={inclusive}
            onChange={(e) => setInclusive(e.target.checked)}
            className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
          />
          <div>
            <label className="font-medium text-gray-800">
              包含第1天 (Inclusive)
            </label>
            <p className="text-sm text-gray-500 mt-1">
              勾選時，若起始日當天為工作天，即算作履約期的第1天。
            </p>
          </div>
        </div>

        <div className="mt-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-8 text-center text-white shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <Calendar className="w-48 h-48 -mr-10 -mt-10" />
          </div>
          <p className="text-blue-100 font-medium mb-2">履約到期日</p>
          <div className="text-6xl font-extrabold tracking-wider mb-2">
            {endDate}
          </div>
          <p className="text-blue-200 font-medium">
            {type === 'workday' && !isCalendarLoading && !calendarError
              ? '(已自動跳過假日並計入補班日)'
              : '(模擬計算結果)'}
          </p>
        </div>
      </div>
    </div>
  );
}
