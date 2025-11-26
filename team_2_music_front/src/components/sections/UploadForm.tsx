import { useState } from "react";

function UploadForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [tags, setTags] = useState("");

  return (
    <div className="grid gap-8 rounded-2xl border border-white/10 bg-white/5 p-8 lg:grid-cols-[320px_1fr]">
      <div className="flex flex-col items-center gap-4">
        <p className="text-lg font-semibold">앨범 아트</p>
        <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/20 text-center text-white/70">
          <span className="material-symbols-outlined text-4xl text-primary">add_photo_alternate</span>
          <span className="text-sm">이미지를 업로드하세요</span>
          <input type="file" className="hidden" accept="image/*" />
        </label>
      </div>
      <form className="grid gap-6 text-sm text-white/80">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-white">제목</span>
          <input
            className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
            placeholder="음악의 제목을 입력하세요"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium text-white">설명</span>
          <textarea
            className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
            rows={4}
            placeholder="음악에 대한 설명을 입력하세요"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <div className="grid gap-6 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-white">장르</span>
            <input
              className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
              placeholder="예: Electronic"
              value={genre}
              onChange={(event) => setGenre(event.target.value)}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-white">분위기 / 태그</span>
            <input
              className="rounded-lg border border-white/20 bg-white/5 p-3 placeholder-white/40 focus:border-primary focus:outline-none"
              placeholder="#chill #focus"
              value={tags}
              onChange={(event) => setTags(event.target.value)}
            />
          </label>
        </div>
        <div className="flex justify-end gap-4 pt-2">
          <button type="button" className="rounded-lg border border-white/30 px-6 py-2 font-semibold text-white">
            취소
          </button>
          <button type="button" className="rounded-lg bg-primary px-6 py-2 font-semibold text-white shadow-lg">
            업로드
          </button>
        </div>
      </form>
    </div>
  );
}

export default UploadForm;
