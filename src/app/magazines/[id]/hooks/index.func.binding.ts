"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface MagazineData {
  id: string;
  image_url: string;
  category: string;
  title: string;
  description: string;
  content: string;
  tags: string[] | null;
}

export const useMagazineDetail = (id: string) => {
  const [magazine, setMagazine] = useState<MagazineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMagazine = async () => {
      try {
        setLoading(true);
        setError(null);

        // Supabase에서 magazine 데이터 조회
        const { data, error: fetchError } = await supabase
          .from("magazine")
          .select("id, image_url, category, title, description, content, tags")
          .eq("id", id)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        if (!data) {
          throw new Error("매거진을 찾을 수 없습니다.");
        }

        // 썸네일 URL 생성 (Supabase Image Transformation 사용)
        // image_url이 스토리지 경로인 경우 썸네일 URL로 변환
        let thumbnailUrl = data.image_url;

        if (data.image_url && typeof data.image_url === "string") {
          try {
            // 스토리지 경로 추출 (전체 URL인 경우 경로만 추출)
            let storagePath = data.image_url;

            if (
              data.image_url.includes(
                "/storage/v1/object/public/vibe-coding-storage/"
              )
            ) {
              const parts = data.image_url.split(
                "/storage/v1/object/public/vibe-coding-storage/"
              );
              storagePath = parts[1] || data.image_url;
            }

            if (storagePath && storagePath.trim() !== "") {
              // getPublicUrl을 사용하여 썸네일 URL 생성
              const { data: urlData } = supabase.storage
                .from("vibe-coding-storage")
                .getPublicUrl(storagePath, {
                  transform: {
                    width: 852,
                    resize: "contain",
                  },
                });

              if (urlData?.publicUrl) {
                thumbnailUrl = urlData.publicUrl;
              }
            }
          } catch (transformError) {
            console.warn(
              "썸네일 URL 생성 실패, 원본 URL 사용:",
              transformError
            );
            // 오류 발생 시 원본 URL 사용
          }
        }

        setMagazine({
          ...data,
          image_url: thumbnailUrl,
        });
      } catch (err) {
        console.error("매거진 조회 에러:", err);
        setError(
          err instanceof Error
            ? err.message
            : "데이터를 불러오는데 실패했습니다."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchMagazine();
    }
  }, [id]);

  return { magazine, loading, error };
};
