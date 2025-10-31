import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface MagazineData {
  category: string;
  title: string;
  description: string;
  content: string;
  tags: string[] | null;
  imageFile?: File | null;
}

export const useSubmitMagazine = () => {
  const router = useRouter();

  const submitMagazine = async (data: MagazineData) => {
    try {
      let imageUrl = "";

      // 1. 이미지 파일이 있는 경우 Storage에 업로드
      if (data.imageFile) {
        // 1-1. 날짜 기반 경로 생성 (yyyy/mm/dd)
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, "0");
        const day = String(now.getDate()).padStart(2, "0");

        // 1-2. UUID 생성
        const uuid = crypto.randomUUID();

        // 1-3. 파일 확장자 추출 (jpg로 통일)
        const filePath = `${year}/${month}/${day}/${uuid}.jpg`;

        // 1-4. Supabase Storage에 이미지 업로드
        const { error: uploadError } = await supabase.storage
          .from("vibe-coding-storage")
          .upload(filePath, data.imageFile, {
            cacheControl: "3600",
            upsert: false,
          });

        // 1-5. 업로드 에러 체크
        if (uploadError) {
          console.error("이미지 업로드 실패:", uploadError);
          alert(`이미지 업로드에 실패하였습니다: ${uploadError.message}`);
          return false;
        }

        // 1-6. 업로드된 이미지의 Public URL 가져오기
        const {
          data: { publicUrl },
        } = supabase.storage.from("vibe-coding-storage").getPublicUrl(filePath);

        imageUrl = publicUrl;
      }

      // 2. Supabase에 magazine 데이터 등록
      const { data: insertedData, error } = await supabase
        .from("magazine")
        .insert([
          {
            image_url: imageUrl,
            category: data.category,
            title: data.title,
            description: data.description,
            content: data.content,
            tags: data.tags,
          },
        ])
        .select()
        .single();

      // 3. 에러 체크
      if (error) {
        console.error("등록 실패:", error);
        alert(`등록에 실패하였습니다: ${error.message}`);
        return false;
      }

      // 4. 등록 성공 처리
      if (insertedData) {
        // 4-1. 알림 메시지
        alert("등록에 성공하였습니다.");

        // 4-2. 상세 페이지로 이동
        router.push(`/magazines/${insertedData.id}`);
        return true;
      }

      return false;
    } catch (err) {
      console.error("예상치 못한 오류:", err);
      alert("등록 중 오류가 발생했습니다.");
      return false;
    }
  };

  return { submitMagazine };
};
