'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  X,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Archive,
  Check,
  Loader2,
  Calendar,
  Clock,
  Copy,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { useSession } from '@/components/providers/SessionProvider';
import { LoadingSection, Spinner } from '@/components/ui/Spinner';
import { SimpleScheduleEditor, type RoutineItem } from '@/components/routine';


// 콘텐츠 타입
const CONTENT_TYPES = [
  { id: 'material', label: '일반 자료', icon: FileText, description: 'PDF, 이미지 등 학습 자료' },
  { id: 'routine', label: '루틴', icon: Calendar, description: '학습 스케줄 및 플래너' },
];

// 루틴 기간 타입
const ROUTINE_TYPES = [
  { id: 'day', label: '하루', description: '시간표 형식' },
  { id: 'week', label: '일주일', description: '주간 플래너' },
  { id: 'month', label: '한 달', description: '월간 캘린더' },
  { id: 'custom', label: '직접 설정', description: 'N일 커스텀' },
];

// (요일, 시간 슬롯은 SimpleScheduleEditor 컴포넌트로 이동)

// 과목 태그 (빠른 선택용)
const SUBJECT_TAGS = [
  { id: 'korean', label: '국어', color: 'bg-rose-100 text-rose-700 hover:bg-rose-200' },
  { id: 'math', label: '수학', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  { id: 'english', label: '영어', color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' },
  { id: 'science', label: '과학', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
  { id: 'social', label: '사회', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
  { id: 'history', label: '한국사', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
  { id: 'custom', label: '직접 입력', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
];

// 학년 태그
const GRADE_TAGS = [
  { id: 'middle', label: '중학교' },
  { id: 'high1', label: '고1' },
  { id: 'high2', label: '고2' },
  { id: 'high3', label: '고3' },
  { id: 'univ', label: '대학' },
  { id: 'cert', label: '자격증' },
  { id: 'custom', label: '직접 입력' },
];

// 가격 옵션
const PRICE_OPTIONS = [
  { value: 0, label: '무료' },
  { value: 1000, label: '1,000원' },
  { value: 3000, label: '3,000원' },
  { value: 5000, label: '5,000원' },
  { value: 10000, label: '10,000원' },
  { value: -1, label: '직접 입력' },
];

// RoutineItem 타입은 @/components/routine 에서 import

// 내 루틴 타입
interface MyRoutine {
  id: string;
  title: string;
  routine_type: string;
  routine_items: RoutineItem[];
  routine_days?: number;
  created_at: string;
}

// 파일 타입 아이콘
function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return FileText;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return ImageIcon;
  if (ext === 'zip') return Archive;
  return FileText;
}

// (색상 팔레트는 SimpleScheduleEditor 컴포넌트로 이동)

function UploadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: sessionUser, session, isLoading: isSessionLoading } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 콘텐츠 타입 상태
  const [contentType, setContentType] = useState<'material' | 'routine'>('material');
  const [routineType, setRoutineType] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [customDays, setCustomDays] = useState<number>(30);
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>([]);

  // (인라인 편집 상태, 월/년 선택 상태는 SimpleScheduleEditor 컴포넌트로 이동)

  // 간소화된 상태
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [customSubject, setCustomSubject] = useState('');
  const [showCustomSubject, setShowCustomSubject] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [customGrade, setCustomGrade] = useState('');
  const [showCustomGrade, setShowCustomGrade] = useState(false);
  const [customTags, setCustomTags] = useState<string[]>([]);
  const [price, setPrice] = useState<number>(0);
  const [customPrice, setCustomPrice] = useState('');
  const [showCustomPrice, setShowCustomPrice] = useState(false);
  const [allowPreview, setAllowPreview] = useState(true); // 미리보기 기본 활성화

  // UI 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 내 루틴 복사 상태
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [myRoutines, setMyRoutines] = useState<MyRoutine[]>([]);
  const [isLoadingRoutines, setIsLoadingRoutines] = useState(false);
  const [copiedFromTitle, setCopiedFromTitle] = useState<string | null>(null);

  // 외부에서 복사해온 루틴 데이터 로드
  useEffect(() => {
    const copyParam = searchParams.get('copy');
    if (copyParam === 'routine') {
      const savedData = localStorage.getItem('copyRoutineData');
      if (savedData) {
        try {
          const routineData = JSON.parse(savedData);

          // 콘텐츠 타입을 루틴으로 설정
          setContentType('routine');

          // 루틴 타입 설정
          if (routineData.routine_type === 'day' || routineData.routine_type === 'daily') {
            setRoutineType('day');
          } else if (routineData.routine_type === 'week' || routineData.routine_type === 'weekly') {
            setRoutineType('week');
          } else if (routineData.routine_type === 'month' || routineData.routine_type === 'monthly') {
            setRoutineType('month');
          } else if (routineData.routine_type === 'custom') {
            setRoutineType('custom');
            if (routineData.routine_days) {
              setCustomDays(routineData.routine_days);
            }
          }

          // 루틴 아이템 복사 (새 ID 부여)
          if (routineData.routine_items && routineData.routine_items.length > 0) {
            const copiedItems = routineData.routine_items.map((item: RoutineItem) => ({
              ...item,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            }));
            setRoutineItems(copiedItems);
          }

          // 원본 제목 저장 (참고용)
          if (routineData.source_title) {
            setCopiedFromTitle(routineData.source_title);
          }

          // localStorage 정리
          localStorage.removeItem('copyRoutineData');
        } catch (err) {
          console.error('Failed to parse copied routine data:', err);
        }
      }
    }
  }, [searchParams]);

  // Textarea 자동 높이 조절
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // 자동 높이 조절
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // 해시태그 파싱 (#으로 시작하는 단어 추출)
    const hashtagMatches = value.match(/#[^\s#]+/g);
    if (hashtagMatches) {
      const newTags = hashtagMatches.map(tag => tag.slice(1)); // # 제거
      setCustomTags(newTags.filter(tag =>
        !SUBJECT_TAGS.some(s => s.label === tag) &&
        !GRADE_TAGS.some(g => g.label === tag)
      ));
    }
  };

  // 파일 선택
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 50MB 제한
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('파일 크기는 50MB 이하여야 해요');
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  // 썸네일 선택
  const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 이미지 파일만 허용
    if (!selectedFile.type.startsWith('image/')) {
      setError('썸네일은 이미지 파일만 가능해요');
      return;
    }

    // 5MB 제한
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('썸네일 크기는 5MB 이하여야 해요');
      return;
    }

    setThumbnailFile(selectedFile);
    setError(null);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onload = (e) => {
      setThumbnailPreview(e.target?.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  // 썸네일 제거
  const removeThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  // 과목 태그 토글
  const toggleSubject = (subjectId: string) => {
    if (subjectId === 'custom') {
      setShowCustomSubject(!showCustomSubject);
      if (showCustomSubject) {
        setCustomSubject('');
      }
    } else {
      setSelectedSubjects(prev =>
        prev.includes(subjectId)
          ? prev.filter(s => s !== subjectId)
          : [...prev, subjectId]
      );
    }
  };

  // 학년 태그 선택
  const selectGrade = (gradeId: string) => {
    if (gradeId === 'custom') {
      setShowCustomGrade(!showCustomGrade);
      setSelectedGrade(null);
      if (showCustomGrade) {
        setCustomGrade('');
      }
    } else {
      setShowCustomGrade(false);
      setCustomGrade('');
      setSelectedGrade(selectedGrade === gradeId ? null : gradeId);
    }
  };

  // 가격 선택
  const handlePriceSelect = (value: number) => {
    if (value === -1) {
      setShowCustomPrice(true);
      setPrice(0);
    } else {
      setShowCustomPrice(false);
      setPrice(value);
      setCustomPrice('');
    }
  };

  // 직접 입력 가격
  const handleCustomPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setCustomPrice(value);
    setPrice(parseInt(value) || 0);
  };

  // 내 루틴 목록 가져오기
  const loadMyRoutines = async () => {
    setIsLoadingRoutines(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // content_data JSONB에서 루틴 정보 조회
      const { data, error } = await supabase
        .from('contents')
        .select('id, title, content_data, created_at')
        .eq('creator_id', user.id)
        .eq('content_type', 'post')
        .not('content_data->type', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // content_data에서 루틴 정보 추출하여 MyRoutine 형태로 변환
      type ContentRow = { id: string; title: string; content_data: Record<string, unknown> | null; created_at: string };
      const routines = (data || [] as ContentRow[])
        .filter((r: ContentRow) => r.content_data?.type === 'routine' && Array.isArray(r.content_data?.routine_items) && (r.content_data?.routine_items as unknown[]).length > 0)
        .map((r: ContentRow) => ({
          id: r.id,
          title: r.title,
          routine_type: r.content_data?.routine_type,
          routine_items: r.content_data?.routine_items,
          routine_days: r.content_data?.routine_days,
          created_at: r.created_at,
        }));

      setMyRoutines(routines);
    } catch (err) {
      console.error('Failed to load routines:', err);
    } finally {
      setIsLoadingRoutines(false);
    }
  };

  // 루틴 복사하기
  const copyRoutine = (routine: MyRoutine) => {
    // 루틴 타입 설정
    if (routine.routine_type === 'day' || routine.routine_type === 'daily') {
      setRoutineType('day');
    } else if (routine.routine_type === 'week' || routine.routine_type === 'weekly') {
      setRoutineType('week');
    } else if (routine.routine_type === 'month' || routine.routine_type === 'monthly') {
      setRoutineType('month');
    } else if (routine.routine_type === 'custom') {
      setRoutineType('custom');
      if (routine.routine_days) {
        setCustomDays(routine.routine_days);
      }
    }

    // 루틴 아이템 복사 (새 ID 부여)
    const copiedItems = routine.routine_items.map(item => ({
      ...item,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    }));

    setRoutineItems(copiedItems);
    setShowCopyModal(false);
  };

  // 복사 모달 열기
  const openCopyModal = async () => {
    setShowCopyModal(true);
    await loadMyRoutines();
  };

  // (루틴 아이템 관련 핸들러들은 SimpleScheduleEditor 컴포넌트로 이동)

  // 업로드 가능 여부
  const canUpload = contentType === 'routine'
    ? content.trim().length > 0 && routineItems.length > 0
    : content.trim().length > 0 && file !== null;

  // 제목 추출 (첫 줄)
  const extractTitle = () => {
    const firstLine = content.trim().split('\n')[0];
    return firstLine.slice(0, 100); // 최대 100자
  };

  // 설명 추출 (첫 줄 이후)
  const extractDescription = () => {
    const lines = content.trim().split('\n');
    return lines.slice(1).join('\n').trim();
  };

  // 모든 태그 수집
  const collectAllTags = () => {
    const tags: string[] = [];

    // 과목 태그
    selectedSubjects.forEach(id => {
      const subject = SUBJECT_TAGS.find(s => s.id === id);
      if (subject && subject.id !== 'custom') tags.push(subject.label);
    });

    // 직접 입력한 과목
    if (customSubject.trim()) {
      tags.push(customSubject.trim());
    }

    // 학년 태그
    if (selectedGrade) {
      const grade = GRADE_TAGS.find(g => g.id === selectedGrade);
      if (grade && grade.id !== 'custom') tags.push(grade.label);
    }

    // 직접 입력한 학년
    if (customGrade.trim()) {
      tags.push(customGrade.trim());
    }

    // 커스텀 태그 (해시태그에서 추출)
    tags.push(...customTags);

    return Array.from(new Set(tags)); // 중복 제거
  };

  // (월간 캘린더 날짜 계산은 SimpleScheduleEditor 컴포넌트로 이동)

  // subject 레이블 가져오기
  const getSubjectLabel = () => {
    // 선택된 과목 중 첫 번째 또는 직접 입력
    if (selectedSubjects.length > 0) {
      const firstSubject = SUBJECT_TAGS.find(s => s.id === selectedSubjects[0]);
      if (firstSubject && firstSubject.id !== 'custom') {
        return firstSubject.label;
      }
    }
    if (customSubject.trim()) {
      return customSubject.trim();
    }
    return null;
  };

  // grade 레이블 가져오기
  const getGradeLabel = () => {
    if (selectedGrade) {
      const grade = GRADE_TAGS.find(g => g.id === selectedGrade);
      if (grade && grade.id !== 'custom') {
        return grade.label;
      }
    }
    if (customGrade.trim()) {
      return customGrade.trim();
    }
    return null;
  };

  // 올리기
  const handleUpload = async () => {
    if (!canUpload) return;

    console.log('[Upload] 1. 업로드 시작...');
    setIsLoading(true);
    setError(null);

    try {
      // SessionProvider의 세션 사용 (getUser() 호출 대신)
      console.log('[Upload] 2. 세션 확인:', {
        user: sessionUser?.email,
        isLoading: isSessionLoading
      });

      if (!sessionUser) {
        console.log('[Upload] 사용자 미인증 - 로그인 페이지로 이동');
        router.push('/login?redirectTo=/dashboard/upload');
        return;
      }

      // user 변수를 sessionUser로 설정 (기존 코드 호환성)
      const user = sessionUser;

      // subject와 grade 값 계산
      console.log('[Upload] 3. subject/grade 계산...');
      const subjectValue = getSubjectLabel();
      const gradeValue = getGradeLabel();
      console.log('[Upload] 3-2. subject/grade 완료:', { subjectValue, gradeValue });

      // 썸네일 업로드 (있는 경우) - 직접 fetch 사용
      let uploadedThumbnailUrl: string | null = null;
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      const accessToken = session?.access_token || supabaseKey;

      console.log('[Upload] 4. 세션 토큰 확인:', {
        hasSessionToken: !!session?.access_token,
        tokenPreview: accessToken?.substring(0, 30) + '...'
      });
      console.log('[Upload] 4-1. 썸네일 확인:', { hasThumbnail: !!thumbnailFile });

      if (thumbnailFile) {
        console.log('[Upload] 4-2. 썸네일 업로드 시작 (직접 fetch)...');
        const thumbnailPath = `${user.id}/thumbnails/${Date.now()}-${thumbnailFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        try {
          const thumbnailResponse = await fetch(
            `${supabaseUrl}/storage/v1/object/contents/${thumbnailPath}`,
            {
              method: 'POST',
              headers: {
                'apikey': supabaseKey!,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': thumbnailFile.type || 'image/jpeg',
                'x-upsert': 'false',
                'cache-control': 'max-age=3600',
              },
              body: thumbnailFile,
            }
          );

          console.log('[Upload] 4-3. 썸네일 응답:', {
            status: thumbnailResponse.status,
            statusText: thumbnailResponse.statusText
          });

          if (thumbnailResponse.ok) {
            uploadedThumbnailUrl = `${supabaseUrl}/storage/v1/object/public/contents/${thumbnailPath}`;
            console.log('[Upload] 4-4. 썸네일 업로드 성공:', uploadedThumbnailUrl);
          } else {
            const errorData = await thumbnailResponse.json().catch(() => ({}));
            console.error('[Upload] 4-3. 썸네일 업로드 실패:', errorData);
            // 썸네일 업로드 실패는 무시하고 계속 진행
          }
        } catch (thumbnailError) {
          console.error('[Upload] 4-3. 썸네일 업로드 에러:', thumbnailError);
          // 썸네일 업로드 실패는 무시하고 계속 진행
        }
      }

      console.log('[Upload] 5. 콘텐츠 타입:', contentType);

      if (contentType === 'routine') {
        console.log('[Upload] 6. 루틴 데이터 준비...');
        // 루틴 데이터 (실제 DB 스키마에 맞게 개별 필드 사용)
        const routineData = {
          creator_id: user.id,
          title: extractTitle(),
          description: extractDescription() || null,
          type: 'pdf' as const,  // Required field (use pdf as default for routine)
          content_type: 'routine' as const,
          url: 'routine://data',  // Placeholder URL for routine type
          thumbnail_url: uploadedThumbnailUrl,
          // Individual fields (not content_data JSONB)
          subject: subjectValue,
          grade: gradeValue,
          allow_preview: allowPreview,
          routine_type: routineType,
          routine_days: routineType === 'custom' ? customDays : null,
          routine_items: routineItems,
          access_level: price > 0 ? 'paid' : 'public',
          price: price > 0 ? price : null,
          is_published: true,
          published_at: new Date().toISOString(),
        };

        console.log('[Upload] 6-1. 루틴 DB insert 시작 (직접 fetch)...');

        let insertError;
        try {
          const insertResponse = await fetch(
            `${supabaseUrl}/rest/v1/contents`,
            {
              method: 'POST',
              headers: {
                'apikey': supabaseKey!,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify(routineData),
            }
          );

          console.log('[Upload] 6-1-2. 루틴 insert 응답:', {
            status: insertResponse.status,
            statusText: insertResponse.statusText
          });

          if (!insertResponse.ok) {
            const errorData = await insertResponse.json().catch(() => ({}));
            console.error('[Upload] 루틴 insert 실패:', errorData);
            insertError = { message: errorData.message || `HTTP ${insertResponse.status}` };
          }
        } catch (fetchErr) {
          console.error('[Upload] 루틴 insert fetch 에러:', fetchErr);
          setError('루틴 저장에 실패했어요. 다시 시도해주세요.');
          return;
        }

        console.log('[Upload] 6-2. 루틴 DB insert 결과:', { error: insertError });

        if (insertError) {
          console.error('Upload error:', insertError);
          setError('업로드 중 오류가 발생했어요. 다시 시도해주세요.');
          return;
        }
      } else {
        console.log('[Upload] 6. 파일 업로드 준비...');
        // 파일 타입 결정
        const ext = file!.name.split('.').pop()?.toLowerCase();
        console.log('[Upload] 7. 파일 정보:', { name: file!.name, ext, size: file!.size });
        // DB 스키마: type은 'video' | 'pdf' | 'image' (필수)
        // content_type은 'video' | 'pdf' | 'image' | 'routine' | null
        let fileType: 'video' | 'pdf' | 'image' = 'pdf';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
          fileType = 'image';
        } else if (ext === 'pdf') {
          fileType = 'pdf';
        } else if (['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) {
          fileType = 'video';
        }

        // Supabase Storage에 파일 업로드 (직접 fetch 사용)
        // RLS policy expects: (storage.foldername(name))[1] = auth.uid()
        const filePath = `${user.id}/${Date.now()}-${file!.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        console.log('[Upload] 8. Storage 업로드 시작 (직접 fetch):', filePath);

        let uploadError;
        try {
          const uploadResponse = await fetch(
            `${supabaseUrl}/storage/v1/object/contents/${filePath}`,
            {
              method: 'POST',
              headers: {
                'apikey': supabaseKey!,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': file!.type || 'application/octet-stream',
                'x-upsert': 'false',
                'cache-control': 'max-age=3600',
              },
              body: file!,
            }
          );

          console.log('[Upload] 8-1. Storage 응답:', {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            console.error('[Upload] Storage 업로드 실패:', errorData);
            uploadError = { message: errorData.message || `HTTP ${uploadResponse.status}` };
          }
        } catch (fetchErr) {
          console.error('[Upload] 파일 업로드 fetch 에러:', fetchErr);
          setError('파일 업로드에 실패했어요. 다시 시도해주세요.');
          return;
        }

        console.log('[Upload] 9. Storage 업로드 결과:', { error: uploadError });

        if (uploadError) {
          console.error('[Upload] Storage upload error:', uploadError);
          // 버킷이 없는 경우 처리
          if (uploadError.message?.includes('Bucket not found')) {
            setError('파일 저장소가 설정되지 않았어요. 관리자에게 문의하세요.');
          } else {
            setError('파일 업로드에 실패했어요. 다시 시도해주세요.');
          }
          return;
        }

        // 공개 URL 생성 (직접 구성)
        const publicUrl = `${supabaseUrl}/storage/v1/object/public/contents/${filePath}`;
        console.log('[Upload] 9-1. Public URL:', publicUrl);

        // 썸네일 URL 설정 (업로드된 썸네일 > 이미지인 경우 원본 URL)
        let thumbnailUrl = uploadedThumbnailUrl;
        if (!thumbnailUrl && fileType === 'image') {
          thumbnailUrl = publicUrl;
        }

        // 콘텐츠 데이터 (실제 DB 스키마에 맞게 개별 필드 사용)
        const contentData = {
          creator_id: user.id,
          title: extractTitle(),
          description: extractDescription() || null,
          type: fileType,  // Required: 'video' | 'pdf' | 'image'
          content_type: fileType,  // Same as type for files
          url: publicUrl,  // Required: 파일 URL
          thumbnail_url: thumbnailUrl,
          // Individual fields (not content_data JSONB)
          subject: subjectValue,
          grade: gradeValue,
          allow_preview: allowPreview,
          access_level: price > 0 ? 'paid' : 'public',
          price: price > 0 ? price : null,
          is_published: true,
          published_at: new Date().toISOString(),
        };

        console.log('[Upload] 10. DB insert 시작 (직접 fetch)...', { title: contentData.title });

        // 직접 fetch로 DB insert (accessToken 사용)
        try {
          const insertResponse = await fetch(
            `${supabaseUrl}/rest/v1/contents`,
            {
              method: 'POST',
              headers: {
                'apikey': supabaseKey!,
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal',
              },
              body: JSON.stringify(contentData),
            }
          );

          console.log('[Upload] 11. DB insert 응답:', {
            status: insertResponse.status,
            statusText: insertResponse.statusText
          });

          if (!insertResponse.ok) {
            const errorData = await insertResponse.json().catch(() => ({}));
            console.error('[Upload] DB insert error:', errorData);
            setError('업로드 중 오류가 발생했어요. 다시 시도해주세요.');
            return;
          }
        } catch (insertErr) {
          console.error('[Upload] DB insert fetch 에러:', insertErr);
          setError('저장 중 오류가 발생했어요. 다시 시도해주세요.');
          return;
        }
      }

      // 성공 - 콘텐츠 목록으로 이동
      console.log('[Upload] 12. 업로드 성공! /content 로 이동');
      router.push('/content');
    } catch (err) {
      console.error('[Upload] 에러 발생:', err);
      setError('업로드 중 오류가 발생했어요.');
    } finally {
      console.log('[Upload] 완료 (finally)');
      setIsLoading(false);
    }
  };

  // (기존 renderDaySchedule, renderWeekSchedule 함수들은 SimpleScheduleEditor로 대체됨)

  // (기존 renderMonthCalendar, renderCustomPlanner 함수들도 SimpleScheduleEditor로 대체됨)

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 심플한 헤더 */}
      <header className="sticky top-0 z-10 bg-white">
        <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </Link>

          <h1 className="font-semibold text-gray-900">
            {contentType === 'routine' ? '루틴 올리기' : '자료 올리기'}
          </h1>

          <button
            onClick={handleUpload}
            disabled={!canUpload || isLoading}
            className={cn(
              'px-4 py-1.5 rounded-full font-medium text-sm transition-all',
              canUpload && !isLoading
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              '올리기'
            )}
          </button>
        </div>
      </header>

      {/* 메인 입력 영역 - 전체 화면, 2컬럼 레이아웃 */}
      <main className="px-4 sm:px-6 lg:px-8 py-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg max-w-4xl mx-auto lg:mx-0">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 왼쪽: 기본 정보 */}
          <div className="space-y-6">
            {/* 콘텐츠 타입 선택 */}
            <div>
              <div className="grid grid-cols-2 gap-3">
                {CONTENT_TYPES.map((type) => {
                  const Icon = type.icon;
                  const isSelected = contentType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setContentType(type.id as 'material' | 'routine')}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all',
                        isSelected
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      )}
                    >
                      <Icon className={cn('w-6 h-6 mb-2', isSelected ? 'text-orange-500' : 'text-gray-400')} />
                      <p className={cn('font-medium', isSelected ? 'text-orange-700' : 'text-gray-900')}>
                        {type.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 텍스트 입력 */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">제목 및 설명</p>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                placeholder={contentType === 'routine'
                  ? `루틴 제목을 입력하세요

예시:
수능 D-100 고3 수학 루틴
매일 미적분 3시간씩 마스터!

#수능 #수학루틴 #고3`
                  : `어떤 자료인지 알려주세요

예시:
고2 수학 미적분 정리했어요
시험 전에 보기 좋게 요약함 📝

#수학 #고2 #미적분`}
                className="w-full min-h-[160px] text-base text-gray-900 placeholder-gray-400 resize-none border border-gray-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 scrollbar-hide"
                style={{ lineHeight: '1.6' }}
              />
            </div>

            {/* 루틴 타입 선택 (루틴일 때만) */}
            {contentType === 'routine' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">루틴 형식</p>
                  <button
                    onClick={openCopyModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    내 루틴 복사
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {ROUTINE_TYPES.map((type) => {
                    const isSelected = routineType === type.id;
                    return (
                      <button
                        key={type.id}
                        onClick={() => setRoutineType(type.id as typeof routineType)}
                        className={cn(
                          'px-4 py-2 rounded-full text-sm font-medium transition-all',
                          isSelected
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        {type.label}
                      </button>
                    );
                  })}
                </div>

                {/* 복사된 루틴 알림 */}
                {copiedFromTitle && (
                  <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
                    <Copy className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-orange-800 font-medium truncate">
                        &ldquo;{copiedFromTitle}&rdquo; 루틴에서 복사됨
                      </p>
                      <p className="text-xs text-orange-600">
                        일정을 수정하고 새 제목을 입력해주세요
                      </p>
                    </div>
                    <button
                      onClick={() => setCopiedFromTitle(null)}
                      className="p-1 hover:bg-orange-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-orange-500" />
                    </button>
                  </div>
                )}

                {/* 루틴 스케줄 에디터 - 간소화된 버전 */}
                <div className="mt-4">
                  {routineType === 'custom' && (
                    <div className="flex items-center gap-3 mb-4">
                      <label className="text-sm font-medium text-gray-700">기간 설정:</label>
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={customDays}
                        onChange={(e) => setCustomDays(Math.max(1, Math.min(365, parseInt(e.target.value) || 1)))}
                        className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-center"
                      />
                      <span className="text-gray-600">일</span>
                    </div>
                  )}
                  <SimpleScheduleEditor
                    routineType={routineType}
                    items={routineItems}
                    onChange={setRoutineItems}
                    customDays={customDays}
                  />
                </div>
              </div>
            )}

            {/* 파일 첨부 영역 (일반 자료일 때만) */}
            {contentType === 'material' && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">파일 첨부</p>
                {file ? (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    {(() => {
                      const FileIcon = getFileIcon(file.name);
                      return <FileIcon className="w-8 h-8 text-orange-500" />;
                    })()}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(1)}MB
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Paperclip className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">파일 첨부하기</p>
                      <p className="text-sm text-gray-500">PDF, 이미지, ZIP (최대 50MB)</p>
                    </div>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* 오른쪽: 태그 및 설정 */}
          <div className="space-y-6 h-fit">
            {/* 썸네일 업로드 (선택) */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                썸네일 <span className="text-gray-400 font-normal">(선택)</span>
              </p>
              {thumbnailPreview ? (
                <div className="relative">
                  <img
                    src={thumbnailPreview}
                    alt="썸네일 미리보기"
                    className="w-full aspect-video object-cover rounded-xl border border-gray-200"
                  />
                  <button
                    onClick={removeThumbnail}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-orange-300 hover:bg-orange-50/50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-gray-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">썸네일 추가</p>
                    <p className="text-sm text-gray-500">이미지 파일 (최대 5MB)</p>
                  </div>
                </button>
              )}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/*"
                onChange={handleThumbnailSelect}
                className="hidden"
              />
            </div>

            {/* 과목 태그 */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">과목</p>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_TAGS.map((subject) => {
                  const isSelected = subject.id === 'custom'
                    ? showCustomSubject
                    : selectedSubjects.includes(subject.id);
                  return (
                    <button
                      key={subject.id}
                      onClick={() => toggleSubject(subject.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                        isSelected
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {isSelected && subject.id !== 'custom' && <Check className="w-3 h-3 inline mr-1" />}
                      {subject.label}
                    </button>
                  );
                })}
              </div>

              {/* 과목 직접 입력 */}
              {showCustomSubject && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="과목명 입력"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              )}
            </div>

            {/* 학년 태그 */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">학년</p>
              <div className="flex flex-wrap gap-2">
                {GRADE_TAGS.map((grade) => {
                  const isSelected = grade.id === 'custom'
                    ? showCustomGrade
                    : selectedGrade === grade.id;
                  return (
                    <button
                      key={grade.id}
                      onClick={() => selectGrade(grade.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium transition-all',
                        isSelected
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {grade.label}
                    </button>
                  );
                })}
              </div>

              {/* 학년 직접 입력 */}
              {showCustomGrade && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={customGrade}
                    onChange={(e) => setCustomGrade(e.target.value)}
                    placeholder="학년 입력 (예: 초6, 재수생)"
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              )}
            </div>

            {/* 가격 선택 */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">가격</p>
              <div className="flex flex-wrap gap-2">
                {PRICE_OPTIONS.map((option) => {
                  const isSelected = showCustomPrice
                    ? option.value === -1
                    : price === option.value && !showCustomPrice;

                  return (
                    <button
                      key={option.value}
                      onClick={() => handlePriceSelect(option.value)}
                      className={cn(
                        'px-4 py-2 rounded-full text-sm font-medium transition-all',
                        isSelected
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {/* 직접 입력 */}
              {showCustomPrice && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={customPrice}
                    onChange={handleCustomPriceChange}
                    placeholder="가격 입력"
                    className="w-32 px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <span className="text-gray-500">원</span>
                </div>
              )}

              {price > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  판매 수익의 80%가 정산됩니다
                </p>
              )}
            </div>

            {/* 미리보기 설정 */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">미리보기 허용</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    구매 전에도 콘텐츠 미리보기를 허용합니다
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowPreview(!allowPreview)}
                  className={cn(
                    'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                    allowPreview ? 'bg-orange-500' : 'bg-gray-200'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm',
                      allowPreview ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
              </div>
            </div>

            {/* 선택된 태그 미리보기 */}
            {(selectedSubjects.length > 0 || selectedGrade || customTags.length > 0 || customSubject.trim() || customGrade.trim()) && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-2">태그 미리보기</p>
                <div className="flex flex-wrap gap-1.5">
                  {collectAllTags().map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-white text-gray-600 text-sm rounded border border-gray-200"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* 하단 고정 버튼 (모바일용) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 sm:hidden">
        <button
          onClick={handleUpload}
          disabled={!canUpload || isLoading}
          className={cn(
            'w-full py-3 rounded-xl font-semibold text-center transition-all',
            canUpload && !isLoading
              ? 'bg-orange-500 text-white hover:bg-orange-600'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin mx-auto" />
          ) : (
            '올리기'
          )}
        </button>
      </div>

      {/* 내 루틴 복사 모달 */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">내 루틴 복사</h3>
              <button
                onClick={() => setShowCopyModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="max-h-[60vh] overflow-y-auto">
              {isLoadingRoutines ? (
                <LoadingSection message="루틴 불러오는 중..." />
              ) : myRoutines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <Calendar className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-600 font-medium mb-1">복사할 루틴이 없어요</p>
                  <p className="text-sm text-gray-500 text-center">
                    먼저 루틴을 만들어보세요!
                  </p>
                </div>
              ) : (
                <div className="p-2">
                  {myRoutines.map((routine) => {
                    const typeLabel =
                      routine.routine_type === 'day' || routine.routine_type === 'daily'
                        ? '하루'
                        : routine.routine_type === 'week' || routine.routine_type === 'weekly'
                        ? '일주일'
                        : routine.routine_type === 'month' || routine.routine_type === 'monthly'
                        ? '한 달'
                        : routine.routine_type === 'custom'
                        ? `${routine.routine_days || 30}일`
                        : '루틴';

                    return (
                      <button
                        key={routine.id}
                        onClick={() => copyRoutine(routine)}
                        className="w-full p-4 rounded-xl hover:bg-orange-50 transition-colors text-left border border-transparent hover:border-orange-200 mb-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate mb-1">
                              {routine.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                <Clock className="w-3 h-3" />
                                {typeLabel}
                              </span>
                              <span className="text-xs text-gray-500">
                                {routine.routine_items.length}개 일정
                              </span>
                            </div>
                          </div>
                          <Copy className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => setShowCopyModal(false)}
                className="w-full py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// Suspense로 감싸서 useSearchParams 로딩 지연 방지
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 w-64">
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 rounded-full"
            style={{
              animation: 'progress 1.5s ease-in-out infinite',
            }}
          />
        </div>
        <p className="text-gray-500 text-sm">로딩 중...</p>
        <style jsx>{`
          @keyframes progress {
            0% { width: 0%; margin-left: 0%; }
            50% { width: 70%; margin-left: 15%; }
            100% { width: 0%; margin-left: 100%; }
          }
        `}</style>
      </div>
    </div>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UploadPageContent />
    </Suspense>
  );
}
