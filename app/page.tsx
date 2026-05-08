'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

type Participant = {
  id: number;
  name: string;
  category: string;
  dupr: string;
  edit_code: string;
  created_at: string;
};

export default function TournamentRegistration() {
  const categories = [
    { id: 'cat1', label: '3.29 以下 (入門組)', max: 16 },
    { id: 'cat2', label: '3.3 - 3.9 (中階組)', max: 16 },
    { id: 'cat3', label: '4.0 以上 (菁英組)', max: 16 },
    { id: 'cat4', label: '女性專場', max: 16 },
  ];

  const [activeTab, setActiveTab] = useState(categories[0].label);
  const [formData, setFormData] = useState({ name: '', dupr: '', edit_code: '' });
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 🌟 這裡新增：讓瀏覽器分頁顯示正確名稱
    document.title = "七賢國小匹克球積分賽";
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('tournament_participants').select('*').order('id', { ascending: true });
    if (!error && data) setParticipants(data);
    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.edit_code.length !== 4) { alert("請設定 4 位數修改密碼"); return; }
    if (!formData.dupr) { alert("請輸入 DUPR ID"); return; }

    // 🕵️‍♂️ 防重複姓名偵測
    const isDuplicate = participants.some(
      p => p.name.trim() === formData.name.trim() && p.category === activeTab
    );
    
    if (isDuplicate) {
      alert(`「${formData.name}」已經在【${activeTab}】名單中囉，請勿重複報名！`);
      return;
    }

    const categoryList = participants.filter(p => p.category === activeTab);
    const currentMax = categories.find(c => c.label === activeTab)?.max || 16;

    if (categoryList.length >= currentMax) {
      const waitlistNum = categoryList.length - currentMax + 1;
      if (!window.confirm(`目前正取名額已滿，報名後將列為「備取第 ${waitlistNum} 位」，確定要報名嗎？`)) return;
    }

    const { error } = await supabase.from('tournament_participants').insert([{
      name: formData.name.trim(),
      category: activeTab,
      dupr: formData.dupr,
      edit_code: formData.edit_code
    }]);

    if (!error) {
      alert("報名成功！");
      setFormData({ name: '', dupr: '', edit_code: '' });
      fetchParticipants();
    } else {
      alert("報名失敗：" + error.message);
    }
  };

  const handleCancel = async (participant: Participant) => {
    const inputCode = window.prompt("請輸入報名時設定的 4 碼密碼以取消報名：");
    if (inputCode === null) return;
    
    if (inputCode === participant.edit_code) {
      if (window.confirm("確定要取消報名嗎？")) {
        const { error } = await supabase.from('tournament_participants').delete().eq('id', participant.id);
        if (!error) {
          alert("已成功取消報名");
          fetchParticipants();
        }
      }
    } else {
      alert("密碼錯誤，無法取消！");
    }
  };

  const currentList = participants.filter(p => p.category === activeTab);
  const currentCategoryInfo = categories.find(c => c.label === activeTab);

  return (
    <main className="min-h-screen bg-slate-900 p-4 md:p-8 font-sans text-slate-100">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-2">
            七賢國小匹克球積分賽 報名系統
          </h1>
          <p className="text-slate-400">專業積分、熱血對戰，展現您的最強實力！</p>
        </header>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.label)}
              className={`px-6 py-3 rounded-full font-bold transition-all whitespace-nowrap ${activeTab === cat.label ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          <div className="md:col-span-2">
            <form onSubmit={handleRegister} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 sticky top-8">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">✍️ 填寫報名表</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-slate-500 ml-1">選手姓名</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="請輸入姓名" className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 ml-1">DUPR ID</label>
                  <input type="text" required value={formData.dupr} onChange={e => setFormData({...formData, dupr: e.target.value})} placeholder="請輸入 DUPR 帳號" className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 ml-1">修改密碼 (4 位數)</label>
                  <input type="password" maxLength={4} required value={formData.edit_code} onChange={e => setFormData({...formData, edit_code: e.target.value})} placeholder="自助取消用" className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none" />
                </div>
                <button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-black py-4 rounded-xl hover:scale-[1.02] transition-transform shadow-lg">
                  立即報名參加
                </button>
              </div>
            </form>
          </div>

          <div className="md:col-span-3">
            <div className="flex justify-between items-end mb-4">
              <h2 className="text-xl font-bold border-l-4 border-orange-500 pl-3">目前報名清單</h2>
              <span className="text-sm text-slate-400">正取名額剩餘：{Math.max(0, (currentCategoryInfo?.max || 16) - currentList.length)}</span>
            </div>

            {isLoading ? (
              <div className="text-center py-20 text-slate-500 animate-pulse">讀取名單中...</div>
            ) : (
              <div className="space-y-3">
                {currentList.length === 0 && (
                  <div className="bg-slate-800/50 border border-dashed border-slate-700 p-10 rounded-2xl text-center text-slate-500">尚無選手報名</div>
                )}
                {currentList.map((p, index) => {
                  const isWaitlist = index >= (currentCategoryInfo?.max || 16);
                  return (
                    <div key={p.id} className="bg-slate-800 border border-slate-700 p-4 rounded-xl flex justify-between items-center group hover:border-orange-500/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center">
                           <span className={`text-[10px] font-bold px-1 rounded ${isWaitlist ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'}`}>
                             {isWaitlist ? '備取' : '正取'}
                           </span>
                           <span className="font-mono text-sm">{isWaitlist ? index - 15 : index + 1}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-lg">{p.name}</span>
                          <span className="text-xs text-orange-400/70">DUPR: {p.dupr}</span>
                        </div>
                      </div>
                      <button onClick={() => handleCancel(p)} className="text-xs text-slate-500 hover:text-red-400 border border-slate-700 hover:border-red-400/50 px-3 py-1 rounded-lg transition-all">取消</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}