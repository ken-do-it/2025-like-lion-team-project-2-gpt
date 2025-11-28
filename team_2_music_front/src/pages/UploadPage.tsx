import UploadForm from "../components/sections/UploadForm";
import UploadedList from "../components/sections/UploadedList";

function UploadPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">AI Upload</p>
        <h1 className="text-3xl font-black">새로운 AI 음악 업로드</h1>
        <p className="text-white/70">AI로 만든 음악 파일을 업로드하고 메타데이터를 채워보세요.</p>
      </header>
      <UploadForm />
      <div className="space-y-3">
        <h2 className="text-xl font-semibold">내 업로드 목록 (로컬)</h2>
        <UploadedList />
      </div>
    </div>
  );
}

export default UploadPage;
