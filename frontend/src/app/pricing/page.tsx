'use client';

import { Check } from 'lucide-react';
import { useState } from 'react';

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Free',
      type: 'Pay-as-you-go',
      price: { monthly: 0, yearly: 0 },
      description: 'Creators, small teams, or individual users getting started',
      features: [
        'Up to 100 verifications/month',
        'Basic manifest generation',
        'Walrus storage (5GB)',
        'Community support',
        'Standard verification speed',
        'Public certificate viewing',
        'API access (limited)',
      ],
      cta: 'Start for Free',
      highlighted: false,
    },
    {
      name: 'Pro',
      type: 'Premium Plan',
      price: { monthly: 15, yearly: 153 }, // ~15% discount yearly ($12.75/mo)
      description: 'Teams and businesses that need extended storage and features',
      features: [
        'Unlimited verifications',
        'Advanced manifest customization',
        'Walrus storage (100GB)',
        'Priority TEE verification',
        'Custom webhook endpoints',
        'Analytics & monitoring dashboard',
        'Developer SDK access',
        'Premium support',
        'White-label certificates',
        'API rate limit: 10,000/day',
      ],
      cta: 'Get Pro Plan',
      highlighted: true,
    },
    {
      name: 'Enterprise',
      type: 'Pro',
      price: { monthly: 45, yearly: 459 }, // ~15% discount yearly ($38.25/mo)
      description: 'Suitable for large-scale businesses and platforms',
      features: [
        'Dedicated TEE clusters',
        'Private Nitro Enclaves',
        'Unlimited storage & bandwidth',
        'SLA guarantees (99.9% uptime)',
        'Custom integrations',
        'Dedicated account manager',
        'On-premise deployment option',
        'Custom contract terms',
        'Advanced security features',
        'Bulk verification discounts',
      ],
      cta: 'Get Enterprise',
      highlighted: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 -mt-10 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            Pricing Plans
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Provable authenticity for every scale
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md transition-all ${
                billingPeriod === 'monthly'
                  ? 'bg-[#0083D4] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md transition-all relative ${
                billingPeriod === 'yearly'
                  ? 'bg-[#0083D4] text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 15%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`rounded-xl p-8 transition-all duration-300 ${
                plan.highlighted
                  ? 'bg-gradient-to-br from-[#0083D4]/20 to-purple-900/20 border-2 border-[#0083D4] shadow-[0_0_30px_rgba(0,131,212,0.3)] transform scale-105'
                  : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
              }`}
            >
              {/* Plan Header */}
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-2">{plan.type}</p>
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  {typeof plan.price === 'string' ? (
                    <div className="text-4xl font-bold text-white">
                      {plan.price}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-white">
                          ${billingPeriod === 'monthly' ? plan.price.monthly : Math.round(plan.price.yearly / 12)}
                        </span>
                        <span className="text-gray-400 ml-2">/month</span>
                      </div>
                      {billingPeriod === 'yearly' && plan.price.yearly > 0 && (
                        <p className="text-sm text-gray-400 mt-1">
                          ${plan.price.yearly}/year (billed annually)
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  className={`w-full py-3 rounded-lg font-medium transition-all ${
                    plan.highlighted
                      ? 'bg-[#0083D4] text-white hover:bg-[#0066a8] shadow-lg hover:shadow-xl'
                      : 'bg-gray-700 text-white hover:bg-gray-600 border border-gray-600'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>

              {/* Features List */}
              <div className="border-t border-gray-700 pt-6">
                <p className="text-sm font-medium text-gray-300 mb-4">
                  What's included:
                </p>
                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-[#0083D4] mr-3 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">
                What counts as a verification?
              </h3>
              <p className="text-gray-400 text-sm">
                One verification = one content item (image, video, document, etc.) processed through TEE and stored on-chain with a certificate.
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">
                Can I upgrade or downgrade anytime?
              </h3>
              <p className="text-gray-400 text-sm">
                Yes! You can change your plan at any time. Charges are prorated based on your usage.
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">
                What happens if I exceed my limits?
              </h3>
              <p className="text-gray-400 text-sm">
                Free tier gets throttled. Pro tier has overage charges. Enterprise has custom limits.
              </p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-2">
                Do you offer refunds?
              </h3>
              <p className="text-gray-400 text-sm">
                Yes, we offer a 30-day money-back guarantee for Pro plans if you're not satisfied.
              </p>
            </div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 text-center">
          <p className="text-gray-400 mb-4">Trusted by creators, developers, and enterprises</p>
          <div className="flex justify-center items-center gap-8 flex-wrap">
            <div className="text-white font-semibold">🔒 SOC 2 Compliant</div>
            <div className="text-white font-semibold">✅ 99.9% Uptime SLA</div>
            <div className="text-white font-semibold">⚡ Built on Sui</div>
            <div className="text-white font-semibold">🛡️ AWS Nitro TEE</div>
          </div>
        </div>
      </div>
    </div>
  );
}
