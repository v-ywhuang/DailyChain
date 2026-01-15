/**
 * 管理后台 - 手动开通会员
 * 访问路径: /admin （需要添加到路由）
 */
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminPage() {
  const [email, setEmail] = useState('')
  const [plan, setPlan] = useState<'pro'>('pro')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleUpgrade = async () => {
    if (!email) {
      setMessage('请输入用户邮箱')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()

      // 查找用户
      const { data: users } = await supabase
        .from('user_profiles')
        .select('id, email, plan')
        .eq('email', email)
        .limit(1)

      if (!users || users.length === 0) {
        setMessage('❌ 未找到该用户')
        return
      }

      const user = users[0]

      // 更新为Pro
      const { error } = await supabase
        .from('user_profiles')
        .update({
          plan: 'pro',
          max_active_habits: 999,
          makeup_count: 3,
          subscription_end_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30天后
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        setMessage(`❌ 更新失败: ${error.message}`)
      } else {
        setMessage(`✅ 成功！用户 ${email} 已升级为 Pro（30天）`)
        setEmail('')
      }
    } catch (error) {
      setMessage(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            会员管理后台
          </h1>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                会员类型
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value as 'pro')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="pro">Pro（30天）</option>
              </select>
            </div>

            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
            >
              {loading ? '处理中...' : '开通会员'}
            </button>

            {message && (
              <div className={`p-4 rounded-lg ${
                message.startsWith('✅') 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}>
                {message}
              </div>
            )}
          </div>

          <div className="mt-8 pt-8 border-t">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              使用说明
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>用户支付后，在支付宝后台查看转账记录</li>
              <li>复制用户支付备注中的邮箱或用户ID</li>
              <li>在上方输入邮箱，点击&ldquo;开通会员&rdquo;</li>
              <li>系统会自动更新用户权限，用户刷新页面即可看到</li>
            </ol>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ 安全提示：</strong> 此页面应该添加密码保护或管理员权限验证。
              建议部署后修改路由为随机路径（如 /admin-{'{'}random{'}'} ）
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
