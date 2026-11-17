export interface AiArchitectureEstimate {
  workflowApproach: string;
  tierProfile: string;
  validationMethod: string;
  blueprint: string;
}

export function getAiArchitectureEstimate(
  calcWorkload: string,
  calcScale: string,
  t: (en: string, hi: string) => string
): AiArchitectureEstimate {
  let workflowApproach = t('Grounded Citation Pipeline', 'संदर्भ-सत्यापित पाइपलाइन');
  let tierProfile = t('Standard Cloud Pod', 'मानक क्लाउड पॉड');
  const validationMethod = t('Scoped in Discovery Pilot', 'पायलट में सत्यापित');
  let blueprint = 'Hybrid Qdrant + Gemini 2.5 Flash + Private Cloud VPC';

  if (calcWorkload === 'agents') {
    workflowApproach = t('Stateful Tool Orchestration', 'स्टेटफुल टूल ऑर्केस्ट्रेशन');
    blueprint = 'LangGraph State Bus + Redis + Deterministic JSON Tooling';
  } else if (calcWorkload === 'vision') {
    workflowApproach = t('Structured Document Parsing', 'संरचित दस्तावेज़ पार्सिंग');
    blueprint = 'Multi-lingual OCR Engine + PyTorch + Fast Inference Pods';
  } else if (calcWorkload === 'predictive') {
    workflowApproach = t('Streaming Anomaly Scoring', 'स्ट्रीमिंग विसंगति स्कोरिंग');
    blueprint = 'ClickHouse + Time-series Neural Pipeline + Grafana Hub';
  }

  if (calcScale === 'enterprise') {
    tierProfile = t('Dedicated Multi-Node VPC', 'समर्पित मल्टी-नोड VPC');
  } else if (calcScale === 'startup') {
    tierProfile = t('Lean Single-Tenant Pilot', 'सिंगल-टेनेंट पायलट');
  }

  return { workflowApproach, tierProfile, validationMethod, blueprint };
}
