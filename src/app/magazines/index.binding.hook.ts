import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface Magazine {
  id: string;
  image_url: string;
  category: string;
  title: string;
  description: string;
  tags: string[] | null;
}

export const useMagazines = () => {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMagazines = async () => {
      try {
        setLoading(true);

        // Supabase에서 magazine 테이블 조회 (ANON 키 사용)
        const { data, error: fetchError } = await supabase
          .from("magazine")
          .select("id, image_url, category, title, description, tags")
          .limit(10);

        if (fetchError) {
          throw fetchError;
        }

        // 조회된 image_url을 썸네일 URL로 변환
        const magazinesWithThumbnails = (data || []).map((magazine) => {
          // image_url이 없거나 null인 경우 원본 그대로 반환
          if (!magazine.image_url) {
            return magazine;
          }

          // 이미 full URL인 경우 (http:// 또는 https://로 시작) 경로 추출
          let imagePath = magazine.image_url;
          if (
            imagePath.startsWith("http://") ||
            imagePath.startsWith("https://")
          ) {
            // URL에서 storage 경로만 추출
            const urlParts = imagePath.split(
              "/storage/v1/object/public/vibe-coding-storage/"
            );
            if (urlParts.length > 1) {
              imagePath = urlParts[1];
            }
          }

          // Supabase Image Transformation을 사용하여 썸네일 생성
          const { data: thumbnailData } = supabase.storage
            .from("vibe-coding-storage")
            .getPublicUrl(imagePath, {
              transform: {
                width: 323,
                resize: "contain",
              },
            });

          return {
            ...magazine,
            image_url: thumbnailData.publicUrl,
          };
        });

        setMagazines(magazinesWithThumbnails);
        setError(null);
      } catch (err) {
        console.error("Magazine 조회 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "데이터를 불러오는데 실패했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMagazines();
  }, []);

  return { magazines, loading, error };
};
