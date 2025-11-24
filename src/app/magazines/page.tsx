"use client";

import { useRouter } from "next/navigation";
import { LogIn, LogOut, PenSquare, Sparkles, User } from "lucide-react";
import { useMagazines } from "./index.binding.hook";
import { useLoginStatus } from "./index.login.logout.status.hook";

const getCategoryColor = (category: string) => {
  const colorMap: Record<string, string> = {
    인공지능: "magazine-category-ai",
    웹개발: "magazine-category-web",
    클라우드: "magazine-category-cloud",
    보안: "magazine-category-security",
    모바일: "magazine-category-mobile",
    데이터사이언스: "magazine-category-data",
    블록체인: "magazine-category-blockchain",
    DevOps: "magazine-category-devops",
  };

  return colorMap[category] || "magazine-category-default";
};

export default function GlossaryCards() {
  const router = useRouter();
  const { magazines, loading, error } = useMagazines();
  const { user, isLoggedIn, handleLogout, goToMyPage, goToLogin } = useLoginStatus();

  // 카드 클릭 시 상세페이지로 이동
  const handleCardClick = (id: string) => {
    router.push(`/magazines/${id}`);
  };

  if (loading) {
    return (
      <div className="magazine-container">
        <div className="magazine-header">
          <h1>IT 매거진</h1>
          <p className="magazine-subtitle">
            최신 기술 트렌드와 인사이트를 전합니다
          </p>
        </div>
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="magazine-container">
        <div className="magazine-header">
          <h1>IT 매거진</h1>
          <p className="magazine-subtitle">
            최신 기술 트렌드와 인사이트를 전합니다
          </p>
        </div>
        <div className="flex justify-center items-center min-h-[400px]">
          <p className="text-red-500">오류: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="magazine-container">
      <div className="magazine-header">
        <h1>IT 매거진</h1>
        <p className="magazine-subtitle">
          최신 기술 트렌드와 인사이트를 전합니다
        </p>
        <div className="magazine-header-actions">
          {isLoggedIn ? (
            // 로그인 상태: 프로필 사진, 이름, 로그아웃 버튼 표시
            <>
              <div className="flex items-center gap-3">
                {/* 프로필 사진 - 클릭 시 마이페이지로 이동 */}
                <button
                  onClick={goToMyPage}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  title="마이페이지로 이동"
                >
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  {/* 이름 - 클릭 시 마이페이지로 이동 */}
                  <span className="font-medium text-gray-700 hover:text-gray-900">
                    {user?.name}
                  </span>
                </button>
              </div>

              {/* 로그아웃 버튼 */}
              <button
                className="magazine-header-button magazine-header-button-ghost"
                onClick={handleLogout}
              >
                <LogOut className="magazine-button-icon" />
                <span className="magazine-button-text">로그아웃</span>
              </button>
            </>
          ) : (
            // 비로그인 상태: 로그인 버튼 표시
            <button
              className="magazine-header-button magazine-header-button-ghost"
              onClick={goToLogin}
            >
              <LogIn className="magazine-button-icon" />
              <span className="magazine-button-text">로그인</span>
            </button>
          )}

          {/* 공통 버튼들 */}
          <button
            className="magazine-header-button magazine-header-button-primary"
            onClick={() => router.push("/magazines/new")}
          >
            <PenSquare className="magazine-button-icon" />
            <span className="magazine-button-text">글쓰기</span>
          </button>
          <button
            className="magazine-header-button magazine-header-button-payment"
            onClick={() => router.push("/payments")}
          >
            <Sparkles className="magazine-button-icon" />
            <span className="magazine-button-text">구독하기</span>
          </button>
        </div>
      </div>

      <div className="magazine-grid">
        {magazines.map((magazine) => (
          <article
            key={magazine.id}
            className="magazine-card cursor-pointer hover:shadow-xl transition-shadow"
            onClick={() => handleCardClick(magazine.id)}
          >
            <div className="magazine-card-image">
              <img src={magazine.image_url} alt={magazine.title} />
              <div
                className={`magazine-card-category ${getCategoryColor(
                  magazine.category
                )}`}
              >
                {magazine.category}
              </div>
            </div>

            <div className="magazine-card-content">
              <h2 className="magazine-card-title">{magazine.title}</h2>
              <p className="magazine-card-summary">{magazine.description}</p>

              <div className="magazine-card-tags">
                {magazine.tags?.map((tag, tagIndex) => (
                  <span key={tagIndex} className="magazine-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
