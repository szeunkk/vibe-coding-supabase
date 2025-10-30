'use client';

import { ArrowLeft } from "lucide-react";

interface ArticleDetailData {
  imageUrl: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  detailedContent: string[];
  tags: string[];
  publishDate: string;
}

const sampleArticle: ArticleDetailData = {
  imageUrl: "https://images.unsplash.com/photo-1707989516414-a2394797e0bf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwYXJ0aWNsZSUyMG1hZ2F6aW5lfGVufDF8fHx8MTc2MTAzMjYxNHww&ixlib=rb-4.1.0&q=80&w=1080",
  category: "인공지능",
  title: "2025년 AI 트렌드: 생성형 AI의 진화와 미래",
  summary: "ChatGPT를 넘어서는 차세대 AI 기술과 산업 전반의 변화를 심층적으로 살펴봅니다",
  content: "생성형 AI는 이제 단순한 텍스트 생성을 넘어 이미지, 동영상, 음악 등 다양한 콘텐츠를 창조하고 있습니다. 2025년에는 멀티모달 AI가 주류가 되면서 여러 형태의 데이터를 동시에 처리하고 이해하는 능력이 크게 향상될 것으로 예상됩니다.",
  detailedContent: [
    "생성형 AI 기술은 2024년을 거치며 폭발적인 성장을 보였습니다. ChatGPT, Midjourney, DALL-E 3 등의 서비스가 대중화되면서 누구나 AI를 활용해 콘텐츠를 생성할 수 있는 시대가 열렸습니다. 하지만 이것은 시작에 불과합니다. 2025년에는 더욱 진화된 AI 기술이 우리 곁에 다가올 것입니다.",
    
    "멀티모달 AI는 텍스트, 이미지, 오디오, 비디오 등 다양한 형태의 데이터를 동시에 이해하고 생성할 수 있는 AI입니다. OpenAI의 GPT-4V, Google의 Gemini 등이 이미 이러한 능력을 선보였으며, 2025년에는 이러한 기술이 더욱 정교해질 것입니다. 예를 들어, 사진 한 장을 보여주면 AI가 그 장면을 설명하고, 관련된 음악을 작곡하고, 그 분위기를 담은 영상까지 제작할 수 있게 됩니다.",
    
    "기업들은 이미 AI를 핵심 경쟁력으로 인식하고 있습니다. 고객 서비스에서는 AI 챗봇이 인간 상담원 수준의 대화를 제공하며, 마케팅에서는 개인화된 콘텐츠를 자동으로 생성합니다. 제조업에서는 AI가 설계를 최적화하고, 의료 분야에서는 질병 진단과 치료 계획 수립을 지원합니다. 이러한 변화는 단순히 업무를 자동화하는 것을 넘어, 완전히 새로운 비즈니스 모델을 창출하고 있습니다.",
    
    "교육 분야에서도 AI의 역할이 확대되고 있습니다. 개인 맞춤형 학습 시스템은 각 학생의 학습 속도와 이해도를 분석해 최적의 커리큘럼을 제공합니다. AI 튜터는 24시간 언제든지 질문에 답하고, 학생의 약점을 파악해 집중적으로 학습할 수 있도록 돕습니다. 이는 교육의 접근성을 높이고, 모든 학생이 자신의 잠재력을 최대한 발휘할 수 있는 기회를 제공합니다.",
    
    "물론 AI의 발전과 함께 우려도 존재합니다. 딥페이크 기술의 악용, 개인정보 보호 문제, AI가 만든 콘텐츠의 저작권 논란 등은 해결해야 할 과제입니다. 또한 AI로 인한 일자리 변화에 대비해 교육과 재훈련 프로그램이 필요합니다. 하지만 이러한 도전을 슬기롭게 해결한다면, AI는 인류의 삶을 크게 개선하는 도구가 될 것입니다.",
    
    "2025년 AI 트렌드의 핵심은 '실용화'와 '보편화'입니다. 더 이상 AI는 미래의 기술이 아닌, 일상에서 자연스럽게 사용하는 도구가 되고 있습니다. 기업과 개인 모두 AI를 어떻게 활용할 것인지 고민하고, 준비해야 할 때입니다."
  ],
  tags: ["생성형AI", "멀티모달", "ChatGPT", "머신러닝", "GPT-4", "디지털전환"],
  publishDate: "2025년 10월 21일"
};

const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    "인공지능": "magazine-category-ai",
    "웹개발": "magazine-category-web",
    "클라우드": "magazine-category-cloud",
    "보안": "magazine-category-security",
    "모바일": "magazine-category-mobile",
    "데이터사이언스": "magazine-category-data",
    "블록체인": "magazine-category-blockchain",
    "DevOps": "magazine-category-devops",
  };
  
  return colorMap[category] || "magazine-category-default";
};

export default function GlossaryCardsDetail() {
  const onNavigateToList = () => {
    window.location.href = '/magazines';
  };

  return (
    <div className="magazine-detail-container">
      <button className="magazine-detail-back" onClick={onNavigateToList}>
        <ArrowLeft className="magazine-detail-back-icon" />
        <span>목록으로</span>
      </button>

      <article className="magazine-detail-article">
        <div className="magazine-detail-hero">
          <img 
            src={sampleArticle.imageUrl}
            alt={sampleArticle.title}
          />
          <div className="magazine-detail-hero-overlay"></div>
          <div className={`magazine-detail-category ${getCategoryColor(sampleArticle.category)}`}>
            {sampleArticle.category}
          </div>
        </div>

        <div className="magazine-detail-content-wrapper">
          <div className="magazine-detail-meta">
            <span className="magazine-detail-date">{sampleArticle.publishDate}</span>
          </div>

          <h1 className="magazine-detail-title">{sampleArticle.title}</h1>
          
          <p className="magazine-detail-summary">{sampleArticle.summary}</p>

          <div className="magazine-detail-content">
            {sampleArticle.detailedContent.map((paragraph, index) => (
              <p key={index} className="magazine-detail-paragraph">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="magazine-detail-tags">
            {sampleArticle.tags.map((tag, index) => (
              <span key={index} className="magazine-detail-tag">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </article>

      <div className="magazine-detail-footer">
        <button className="magazine-detail-back-bottom" onClick={onNavigateToList}>
          목록으로 돌아가기
        </button>
      </div>
    </div>
  );
}
