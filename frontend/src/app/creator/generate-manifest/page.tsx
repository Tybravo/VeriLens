'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, X, Sparkles, Image, Camera, Palette, Award, Bitcoin, Code, Gamepad2, Users, Search, FileText, Bot } from 'lucide-react';

function GenerateManifestContent() {
  const searchParams = useSearchParams();
  const [modal, setModal] = useState({
    isOpen: false,
    instance: null,
    keyValues: [{ key: '', value: '' }],
    formatJSON: true,
    formatXML: false
  });

  const instances = [
    {
      id: 'ai-media',
      name: 'Authentic AI-Generated Media Verification',
      icon: <Sparkles className="w-8 h-8 text-purple-400" />,
      problem: 'As AI-generated images/videos explode, nobody knows what is real or copied AI-generated',
      solution: 'Authentic AI-Generated Media Verification — stamp creation metadata, store provenance on-chain, provide VeriLens Verified origin, show tools used, timestamps, signatures, and prevent fake AI media masquerading as real content across platforms',
      useCase: 'ai_art'
    },
    {
      id: 'digital-identity',
      name: 'Secure Digital Identity Assets',
      icon: <Image className="w-8 h-8 text-purple-400" />,
      problem: 'People create digital avatars/PFPs and get copied or impersonated',
      solution: 'Secure Digital Identity Assets (Avatars, PFPs, Digital Personas) — provide metadata provenance, hash-based authenticity, avatar-to-wallet binding, and profile linking to prevent impersonation and protect ownership across metaverse and social ecosystems',
      useCase: 'digital_identity'
    },
    {
      id: 'anti-fake-screenshots',
      name: 'Anti-Fake Screenshots & System Logs',
      icon: <Camera className="w-8 h-8 text-purple-400" />,
      problem: 'People fake screenshots of conversations, bank apps, wallet balances, and dashboards',
      solution: 'Anti-Fake Screenshots & System Logs (Web2) — capture browser, app, and OS-level screenshots securely, hash and sign artifacts, and provide tamper-evidence for dashboards, balances, and conversations with verifiable provenance',
      useCase: 'evidence_screenshot'
    },
    {
      id: 'creator-attribution',
      name: 'Creator Attribution for Digital Artists',
      icon: <Palette className="w-8 h-8 text-purple-400" />,
      problem: 'Creators get plagiarized constantly on Instagram, TikTok, YouTube, X',
      solution: 'Creator Attribution for Digital Artists & Video Editors — deliver proof of original creation, content fingerprinting, on-chain attribution, and verifiable ownership certificates across Instagram, TikTok, YouTube, and X to deter plagiarism and copycats',
      useCase: 'creator_attribution'
    },
    {
      id: 'verified-certificates',
      name: 'Verified Digital Certificates & Credentials',
      icon: <Award className="w-8 h-8 text-purple-400" />,
      problem: 'People fake: diplomas, certificates, licenses, training badges',
      solution: 'Verified Digital Certificates & Credentials — embed cryptographic signatures, anchor proofs on-chain, and enable instant verification of diplomas, licenses, and training badges for universities, HR teams, and licensing boards',
      useCase: 'digital_certificate'
    },
    {
      id: 'web3-minting',
      name: 'Provably Authentic Web3 Minting',
      icon: <Bitcoin className="w-8 h-8 text-purple-400" />,
      problem: 'Many NFTs are minted from stolen or low-quality sources',
      solution: 'Provably Authentic Web3 Minting (NFT + SUI Assets) — ensure originality, track complete edit history, tie content hash to the mint, and maintain on-chain authenticity records for platforms, marketplaces, and SUI asset creators',
      useCase: 'nft_authentic'
    },
    {
      id: 'verified-git',
      name: 'Verified Git Commits & Code Snippets',
      icon: <Code className="w-8 h-8 text-purple-400" />,
      problem: 'Developers copy/paste code and claim ownership',
      solution: 'Verified Git Commits & Code Snippets — timestamp code authenticity, prove author creation, store code fingerprints securely, and display verification badges on developer portfolios, marketplaces, and open-source projects',
      useCase: 'code_verification'
    },
    {
      id: 'game-assets',
      name: 'Game Asset Provenance',
      icon: <Gamepad2 className="w-8 h-8 text-purple-400" />,
      problem: 'Game studios struggle with asset theft and unauthorized reuse',
      solution: 'Game Asset Provenance (3D Models, Textures, Audio, Maps) — fingerprint assets, record creation and ownership, and issue authentic asset certificates compatible with Unity and Unreal pipelines for studios and creators',
      useCase: 'game_asset'
    },
    {
      id: 'verified-ugc',
      name: 'Verified User-Generated Content for Brands',
      icon: <Users className="w-8 h-8 text-purple-400" />,
      problem: 'Brands don’t trust influencer content — it can be edited or AI-generated',
      solution: 'Verified User-Generated Content (UGC) for Brands — perform verified capture, on-chain proof, watermarking, and metadata locks to ensure trustworthy influencer content for campaigns, commerce, and social engagement',
      useCase: 'brand_ugc'
    },
    {
      id: 'digital-investigations',
      name: 'Digital Investigations & Chain of Custody',
      icon: <Search className="w-8 h-8 text-purple-400" />,
      problem: 'Digital evidence gets altered or challenged in court',
      solution: 'Digital Investigations & Chain of Custody (Cybersecurity) — capture secure logs and screenshots, lock evidence in immutable storage, provide forensic-grade verification, and generate audit trails for legal and compliance proceedings',
      useCase: 'forensic_evidence'
    },
    {
      id: 'anti-fake-resume',
      name: 'Anti-Fake Resume & Portfolio Verification',
      icon: <FileText className="w-8 h-8 text-purple-400" />,
      problem: 'People fake resumes, design portfolios, and project screenshots',
      solution: 'Anti-Fake Resume & Portfolio Verification — enable app-locked capture, hash-verified code samples, verified project screenshots, and real-time metadata proofs to support recruiters, freelancers, and portfolio platforms',
      useCase: 'resume_verification'
    },
    {
      id: 'ai-agents',
      name: 'Proof-of-Creation for AI Agents',
      icon: <Bot className="w-8 h-8 text-purple-400" />,
      problem: 'In the future, AI agents will generate',
      solution: 'Proof-of-Creation for AI Agents — become the universal signature layer proving generation by agent X using model Y at time Z, with tamper-evident metadata and chain-anchored provenance for trustworthy automation',
      useCase: 'ai_agent_creation'
    }
  ];

  const openModal = (instance) => {
    setModal({
      isOpen: true,
      instance,
      keyValues: [{ key: '', value: '' }],
      formatJSON: true,
      formatXML: false
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      instance: null,
      keyValues: [{ key: '', value: '' }],
      formatJSON: true,
      formatXML: false
    });
  };

  useEffect(() => {
    const c = searchParams.get('close');
    if (c && modal.isOpen) closeModal();
  }, [searchParams]);

  const addKeyValuePair = () => {
    setModal(prev => ({
      ...prev,
      keyValues: [...prev.keyValues, { key: '', value: '' }]
    }));
  };

  const removeKeyValuePair = (index) => {
    setModal(prev => ({
      ...prev,
      keyValues: prev.keyValues.filter((_, i) => i !== index)
    }));
  };

  const updateKeyValue = (index, field, value) => {
    setModal(prev => ({
      ...prev,
      keyValues: prev.keyValues.map((kv, i) => 
        i === index ? { ...kv, [field]: value } : kv
      )
    }));
  };

  const generateManifest = async () => {
    if (!modal.instance) return;

    const customFields = {};
    modal.keyValues.forEach(({ key, value }) => {
      if (key.trim() && value.trim()) {
        customFields[key.trim()] = value.trim();
      }
    });

    const payload = {
      verilens: {
        use_case: modal.instance.useCase,
        timestamp: new Date().toISOString(),
        custom_fields: customFields
      },
      format: {
        json: modal.formatJSON,
        xml: modal.formatXML
      }
    };

    try {
      const response = await fetch('/api/generate-manifest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Manifest generated:', result);
        closeModal();
      } else {
        console.error('Failed to generate manifest');
      }
    } catch (error) {
      console.error('Error generating manifest:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            VeriLens Manifest Generator
          </h1>
          <p className="text-xl text-gray-300">
            Provably Authentic Digital Content & Assets
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 m-2">
          {instances.map((instance) => (
            <div
              key={instance.id}
              className="bg-gray-800 rounded-lg p-6 border border-gray-700 transition-all duration-300 transform hover:scale-[1.02] hover:border-[#0083D4] hover:shadow-[0_0_24px_#0083D4]"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:space-x-4 space-y-4 sm:space-y-0">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-purple-900/30 rounded-lg flex items-center justify-center border border-purple-500/30">
                    {instance.icon}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-[#0083D4] mb-2">
                    {instance.name}
                  </h3>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium text-purple-300 mb-1">
                      Problem:
                    </p>
                    <p className="text-sm text-white leading-relaxed">
                      {instance.problem}
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-sm font-medium text-purple-300 mb-1">
                      Solution:
                    </p>
                    <p className="text-sm text-white leading-relaxed">
                      {instance.solution}
                    </p>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() => openModal(instance)}
                    className="px-6 py-3 bg-[#0f79bb] text-white font-medium rounded-lg border-2 border-purple-400 hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-400/50 hover:border-purple-300 transition-all duration-300 transform hover:scale-105"
                  >
                    Generate Manifest
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {modal.isOpen && modal.instance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[2000]">
          <div className="bg-gray-800 rounded-lg p-0 max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-700 flex flex-col">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-900/30 rounded-lg flex items-center justify-center border border-purple-500/30">
                  {modal.instance.icon}
                </div>
                <h2 className="text-xl font-bold text-white">
                  {modal.instance.name}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4 p-6 overflow-y-auto flex-1">
              <h3 className="text-lg font-semibold text-white mb-4">
                Manifest Key-Value Pairs
              </h3>
              
              {modal.keyValues.map((kv, index) => (
                <div key={index} className="flex flex-col md:flex-row md:space-x-3 space-y-3 md:space-y-0">
                  <input
                    type="text"
                    placeholder="Key"
                    value={kv.key}
                    onChange={(e) => updateKeyValue(index, 'key', e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all duration-300 hover:border-blue-400 hover:shadow hover:shadow-blue-400/30"
                  />
                  <textarea
                    placeholder="Value"
                    value={kv.value}
                    onChange={(e) => updateKeyValue(index, 'value', e.target.value)}
                    rows={6}
                    className="flex-1 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 focus:outline-none transition-all duration-300 resize-none hover:border-blue-400 hover:shadow hover:shadow-blue-400/30"
                  />
                  {modal.keyValues.length > 1 && (
                    <button
                      onClick={() => removeKeyValuePair(index)}
                      className="p-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-all duration-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}

              <button
                onClick={addKeyValuePair}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                <span>Add Key-Value Pair</span>
              </button>

              <div className="pt-6 border-t border-gray-700">
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center space-x-3 bg-gray-700/50 rounded-lg p-3 border border-gray-600 hover:border-blue-400 hover:shadow hover:shadow-blue-400/30 transition-all">
                    <input
                      type="checkbox"
                      checked={modal.formatJSON}
                      onChange={(e) => setModal(prev => ({ ...prev, formatJSON: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-500 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-white text-sm">JSON format</span>
                  </label>
                  <label className="flex items-center space-x-3 bg-gray-700/50 rounded-lg p-3 border border-gray-600 hover:border-blue-400 hover:shadow hover:shadow-blue-400/30 transition-all">
                    <input
                      type="checkbox"
                      checked={modal.formatXML}
                      onChange={(e) => setModal(prev => ({ ...prev, formatXML: e.target.checked }))}
                      className="h-4 w-4 rounded border-gray-500 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-white text-sm">XML format</span>
                  </label>
                </div>
                <button
                  onClick={generateManifest}
                  className="w-full px-6 py-3 bg-[#0f79bb] text-white font-medium rounded-lg border-2 border-purple-400 hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-400/50 transition-all duration-300 transform hover:scale-105"
                >
                  Generate Manifest
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div />}> 
      <GenerateManifestContent />
    </Suspense>
  );
}
