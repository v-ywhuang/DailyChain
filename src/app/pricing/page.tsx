/**
 * 定价页面 - 支付宝收款码方案
 */
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function PricingPage() {
  const router = useRouter()
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null)
  const [copied, setCopied] = useState(false)
  const [userId, setUserId] = useState<string>('')

  const QR_CODE_URL = '/payment-qrcode.png'

  // 获取当前用户信息
  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        setUserId(user.id)
      } else {
        // 未登录，跳转到登录页
        router.push('/login?redirect=/pricing')
      }
    }
    
    fetchUser()
  }, [router])
  
  const plans = [
    {
      id: 'monthly' as const,
      name: 'Pro 月付',
      price: '¥9.9',
      period: '每月',
      features: [
        '✅ 无限习惯数量',
        '✅ 每月3次补卡',
        '✅ 完整历史数据',
        '✅ 高级统计图表',
        '✅ 数据导出功能',
        '✅ 无水印分享'
      ],
      note: '首月支付后立即开通'
    },
    {
      id: 'yearly' as const,
      name: 'Pro 年付',
      price: '¥29.9',
      period: '每年',
      originalPrice: '¥118.8',
      discount: '省 ¥88.9',
      features: [
        '✅ 无限习惯数量',
        '✅ 每月3次补卡',
        '✅ 完整历史数据',
        '✅ 高级统计图表',
        '✅ 数据导出功能',
        '✅ 无水印分享',
        '🎁 相当于2.5折优惠'
      ],
      popular: true,
      note: '一次支付，全年无忧'
    }
  ]

  const handleSelectPlan = (planId: 'monthly' | 'yearly') => {
    setSelectedPlan(planId)
    setShowPaymentModal(true)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const paymentNote = selectedPlan === 'monthly' 
    ? `DailyChain_月付_${userId.slice(0, 8)}`
    : `DailyChain_年付_${userId.slice(0, 8)}`

  // Loading 状态由页面级 Suspense 处理（顶部进度条）
  // 用户身份验证在后台进行，不需要显示骨架屏

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            选择适合你的计划
          </h1>
          <p className="text-xl text-gray-600">
            解锁全部功能，让习惯养成更轻松
          </p>
        </div>

        {/* 对比表格 */}
        <div className="mb-12 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">功能对比</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-4 text-gray-700">功能</th>
                  <th className="text-center py-4 px-4 text-gray-700">Free</th>
                  <th className="text-center py-4 px-4 text-blue-600 font-bold">Pro</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-4">习惯数量</td>
                  <td className="text-center py-4 px-4">1个</td>
                  <td className="text-center py-4 px-4 text-blue-600 font-bold">♾️ 无限</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">历史数据</td>
                  <td className="text-center py-4 px-4">30天</td>
                  <td className="text-center py-4 px-4 text-blue-600 font-bold">♾️ 全部</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">热力图</td>
                  <td className="text-center py-4 px-4">✅</td>
                  <td className="text-center py-4 px-4 text-blue-600">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">趋势图</td>
                  <td className="text-center py-4 px-4">❌</td>
                  <td className="text-center py-4 px-4 text-blue-600">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">补卡功能</td>
                  <td className="text-center py-4 px-4">❌</td>
                  <td className="text-center py-4 px-4 text-blue-600 font-bold">✅ 3次/月</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">数据导出</td>
                  <td className="text-center py-4 px-4">❌</td>
                  <td className="text-center py-4 px-4 text-blue-600">✅</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4">分享水印</td>
                  <td className="text-center py-4 px-4">有</td>
                  <td className="text-center py-4 px-4 text-blue-600">无</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 价格卡片 */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative bg-white rounded-2xl shadow-lg p-8 transition-transform hover:scale-105 ${
                plan.popular ? 'ring-4 ring-blue-500' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-6 py-2 rounded-full text-sm font-bold">
                  🔥 最受欢迎
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-blue-600">
                    {plan.price}
                  </span>
                  <span className="text-gray-600">/ {plan.period}</span>
                </div>
                {plan.originalPrice && (
                  <div className="mt-2">
                    <span className="text-gray-400 line-through mr-2">
                      {plan.originalPrice}
                    </span>
                    <span className="text-green-600 font-bold">
                      {plan.discount}
                    </span>
                  </div>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="text-gray-700">
                    {feature}
                  </li>
                ))}
              </ul>

              <p className="text-sm text-gray-500 mb-6 text-center">
                {plan.note}
              </p>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors"
              >
                立即购买
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">常见问题</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-900 mb-2">
                Q: 支付后多久能开通？
              </h3>
              <p className="text-gray-600">
                A: 正常情况下1-5分钟内开通。如超过10分钟未开通，请联系客服。
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">
                Q: 可以取消订阅吗？
              </h3>
              <p className="text-gray-600">
                A: 可以随时联系客服取消。到期后自动降级为Free版本，数据会保留。
              </p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-2">
                Q: 支持哪些支付方式？
              </h3>
              <p className="text-gray-600">
                A: 目前支持支付宝扫码支付。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 支付弹窗 */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              扫码支付
            </h2>

            <div className="mb-6">
              <div className="bg-gray-100 rounded-xl p-6 mb-4">
                <div className="text-center mb-4">
                  <p className="text-gray-700 mb-2">支付金额</p>
                  <p className="text-4xl font-bold text-blue-600">
                    {selectedPlan === 'monthly' ? '¥9.9' : '¥29.9'}
                  </p>
                </div>

                {/* 收款码图片 */}
                <div className="bg-white rounded-lg p-4 mb-4 flex justify-center">
                  <Image
                    src={QR_CODE_URL}
                    alt="支付宝收款码"
                    width={240}
                    height={240}
                    className="w-full max-w-[240px]"
                    unoptimized
                  />
                </div>

                {/* 备注说明 */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800 font-bold mb-2">
                    ⚠️ 重要：支付时请添加备注
                  </p>
                  <div className="bg-white rounded px-3 py-2 mb-2 flex items-center justify-between">
                    <code className="text-sm text-gray-900 break-all">
                      {paymentNote}
                    </code>
                    <button
                      onClick={() => copyToClipboard(paymentNote)}
                      className="ml-2 text-blue-600 hover:text-blue-700"
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-yellow-700">
                    复制备注后打开支付宝扫码支付，粘贴到备注栏
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <p>✅ 支付成功后会自动开通（1-5分钟）</p>
                <p>✅ 如超过10分钟未开通，请联系客服</p>
                <p>✅ 客服微信：hzy921w</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-900 font-bold py-3 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setShowPaymentModal(false)
                  router.push('/dashboard?payment=pending')
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                已完成支付
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
