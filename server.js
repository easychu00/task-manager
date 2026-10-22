require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Supabase 客户端 ----------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 请在 .env 中配置 SUPABASE_URL 和 SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ---------- 中间件 ----------
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- API 路由 ----------

// 获取任务列表（支持按优先级筛选，按创建时间倒序）
app.get('/api/tasks', async (req, res) => {
  try {
    const { priority } = req.query;
    let query = supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (priority && priority !== 'all') {
      query = query.eq('priority', priority);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('获取任务失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// 添加任务
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, priority } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: '任务标题不能为空' });
    }
    if (!['高', '中', '低'].includes(priority)) {
      return res.status(400).json({ error: '优先级必须为 高/中/低' });
    }
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ title: title.trim(), priority, completed: false }])
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('添加任务失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// 切换完成状态
app.patch('/api/tasks/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    // 先查当前状态
    const { data: current, error: fetchErr } = await supabase
      .from('tasks')
      .select('completed')
      .eq('id', id)
      .single();
    if (fetchErr) throw fetchErr;

    const { data, error } = await supabase
      .from('tasks')
      .update({ completed: !current.completed })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error('切换状态失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('删除任务失败:', err);
    res.status(500).json({ error: err.message });
  }
});

// ---------- 启动 ----------
app.listen(PORT, () => {
  console.log(`✅ 智能任务管理系统已启动: http://localhost:${PORT}`);
});
