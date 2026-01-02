'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

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

// 요일
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
const WEEKDAYS_FULL = ['월요일', '화요일', '수요일', '목요일', '금요일', '토요일', '일요일'];

// 시간 슬롯 (에타 스타일)
const TIME_SLOTS = Array.from({ length: 15 }, (_, i) => i + 6); // 6시 ~ 20시

// 과목 태그 (빠른 선택용)
const SUBJECT_TAGS = [
  { id: 'korean', label: '국어', color: 'bg-rose-100 text-rose-700 hover:bg-rose-200' },
  { id: 'math', label: '수학', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
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

// 루틴 아이템 타입
interface RoutineItem {
  id: string;
  day: number; // 0-6 for week, 1-31 for month, or day number for custom
  startHour?: number;
  endHour?: number;
  title: string;
  color: string;
}

// 파일 타입 아이콘
function getFileIcon(fileName: string) {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return FileText;
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return ImageIcon;
  if (ext === 'zip') return Archive;
  return FileText;
}

// 색상 팔레트
const ROUTINE_COLORS = [
  'bg-rose-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-pink-500',
];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 콘텐츠 타입 상태
  const [contentType, setContentType] = useState<'material' | 'routine'>('material');
  const [routineType, setRoutineType] = useState<'day' | 'week' | 'month' | 'custom'>('week');
  const [customDays, setCustomDays] = useState<number>(30);
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // 루틴 추가 모달 상태
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    day: number;
    startHour?: number;
    endHour?: number;
  } | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');

  // 간소화된 상태
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
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

  // UI 상태
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // 루틴 아이템 추가
  const addRoutineItem = () => {
    if (!editingItem || !newItemTitle.trim()) return;

    // 랜덤 색상 자동 선택
    const randomColor = ROUTINE_COLORS[Math.floor(Math.random() * ROUTINE_COLORS.length)];

    const newItem: RoutineItem = {
      id: Date.now().toString(),
      day: editingItem.day,
      startHour: editingItem.startHour,
      endHour: editingItem.endHour,
      title: newItemTitle.trim(),
      color: randomColor,
    };

    setRoutineItems(prev => [...prev, newItem]);
    setShowAddModal(false);
    setEditingItem(null);
    setNewItemTitle('');
  };

  // 루틴 아이템 삭제
  const removeRoutineItem = (id: string) => {
    setRoutineItems(prev => prev.filter(item => item.id !== id));
  };

  // 시간표 셀 클릭 (Day/Week)
  const handleTimeSlotClick = (day: number, hour: number) => {
    setEditingItem({ day, startHour: hour, endHour: hour + 1 });
    setShowAddModal(true);
  };

  // 월간 캘린더 날짜 클릭
  const handleDateClick = (day: number) => {
    setEditingItem({ day });
    setShowAddModal(true);
  };

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

  // 월간 캘린더 날짜 계산
  const getMonthDays = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // 월요일 시작
    const totalDays = lastDay.getDate();

    const days: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(i);

    return days;
  };

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

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login?redirectTo=/dashboard/upload');
        return;
      }

      // subject와 grade 값 계산
      const subjectValue = getSubjectLabel();
      const gradeValue = getGradeLabel();

      if (contentType === 'routine') {
        // 루틴 데이터
        const routineData = {
          creator_id: user.id,
          title: extractTitle(),
          description: extractDescription() || null,
          subject: subjectValue,
          grade: gradeValue,
          type: 'image' as const,
          content_type: 'routine',
          routine_type: routineType,
          routine_days: routineType === 'custom' ? customDays : null,
          routine_items: routineItems,
          url: 'routine://placeholder',
          access_level: price > 0 ? 'paid' : 'public',
          price: price > 0 ? price : null,
          is_published: true,
          published_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from('contents')
          .insert(routineData);

        if (insertError) {
          console.error('Upload error:', insertError);
          setError('업로드 중 오류가 발생했어요. 다시 시도해주세요.');
          return;
        }
      } else {
        // 파일 타입 결정
        const ext = file!.name.split('.').pop()?.toLowerCase();
        let fileType: 'video' | 'pdf' | 'image' = 'pdf';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
          fileType = 'image';
        } else if (ext === 'pdf') {
          fileType = 'pdf';
        }

        // Supabase Storage에 파일 업로드
        const fileName = `${user.id}/${Date.now()}-${file!.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = `contents/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('contents')
          .upload(filePath, file!, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          // 버킷이 없는 경우 처리
          if (uploadError.message?.includes('Bucket not found')) {
            setError('파일 저장소가 설정되지 않았어요. 관리자에게 문의하세요.');
          } else {
            setError('파일 업로드에 실패했어요. 다시 시도해주세요.');
          }
          return;
        }

        // 공개 URL 가져오기
        const { data: { publicUrl } } = supabase.storage
          .from('contents')
          .getPublicUrl(filePath);

        // 썸네일 URL 설정 (이미지인 경우 원본 URL 사용)
        let thumbnailUrl = null;
        if (fileType === 'image') {
          thumbnailUrl = publicUrl;
        }

        // 콘텐츠 데이터
        const contentData = {
          creator_id: user.id,
          title: extractTitle(),
          description: extractDescription() || null,
          subject: subjectValue,
          grade: gradeValue,
          type: fileType,
          content_type: fileType,
          url: publicUrl,
          thumbnail_url: thumbnailUrl,
          access_level: price > 0 ? 'paid' : 'public',
          price: price > 0 ? price : null,
          is_published: true,
          published_at: new Date().toISOString(),
        };

        const { error: insertError } = await supabase
          .from('contents')
          .insert(contentData);

        if (insertError) {
          console.error('Upload error:', insertError);
          // 실패 시 업로드된 파일 삭제 시도
          await supabase.storage.from('contents').remove([filePath]);
          setError('업로드 중 오류가 발생했어요. 다시 시도해주세요.');
          return;
        }
      }

      // 성공 - 콘텐츠 목록으로 이동
      router.push('/dashboard/contents');
    } catch (err) {
      console.error('Upload error:', err);
      setError('업로드 중 오류가 발생했어요.');
    } finally {
      setIsLoading(false);
    }
  };

  // Day 타입 시간표 렌더링 (에타 스타일)
  const renderDaySchedule = () => (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <span className="font-medium text-gray-700">하루 시간표</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[300px]">
          {TIME_SLOTS.map(hour => {
            const item = routineItems.find(
              i => i.day === 0 && i.startHour === hour
            );
            return (
              <div
                key={hour}
                className="flex border-b border-gray-100 last:border-b-0"
              >
                <div className="w-16 py-2 px-3 text-sm text-gray-500 bg-gray-50 flex-shrink-0 border-r border-gray-100">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div
                  onClick={() => !item && handleTimeSlotClick(0, hour)}
                  className={cn(
                    'flex-1 py-2 px-3 min-h-[44px] transition-colors',
                    item ? '' : 'hover:bg-orange-50 cursor-pointer'
                  )}
                >
                  {item ? (
                    <div className={cn('px-2 py-1 rounded text-white text-sm flex items-center justify-between', item.color)}>
                      <span>{item.title}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRoutineItem(item.id);
                        }}
                        className="p-0.5 hover:bg-white/20 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-300 text-sm">+ 추가</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Week 타입 주간 시간표 렌더링
  const renderWeekSchedule = () => (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <span className="font-medium text-gray-700">주간 플래너</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* 요일 헤더 */}
          <div className="flex border-b border-gray-200">
            <div className="w-16 bg-gray-50 flex-shrink-0" />
            {WEEKDAYS.map((day, idx) => (
              <div
                key={day}
                className={cn(
                  'flex-1 py-2 text-center text-sm font-medium border-l border-gray-100',
                  idx >= 5 ? 'text-red-500' : 'text-gray-700'
                )}
              >
                {day}
              </div>
            ))}
          </div>
          {/* 시간 슬롯 */}
          {TIME_SLOTS.map(hour => (
            <div key={hour} className="flex border-b border-gray-100 last:border-b-0">
              <div className="w-16 py-2 px-2 text-xs text-gray-500 bg-gray-50 flex-shrink-0 border-r border-gray-100">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {WEEKDAYS.map((_, dayIdx) => {
                const item = routineItems.find(
                  i => i.day === dayIdx && i.startHour === hour
                );
                return (
                  <div
                    key={dayIdx}
                    onClick={() => !item && handleTimeSlotClick(dayIdx, hour)}
                    className={cn(
                      'flex-1 min-h-[40px] border-l border-gray-100 p-1 transition-colors',
                      item ? '' : 'hover:bg-orange-50 cursor-pointer'
                    )}
                  >
                    {item && (
                      <div className={cn('px-1.5 py-0.5 rounded text-white text-xs flex items-center gap-1', item.color)}>
                        <span className="truncate flex-1">{item.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRoutineItem(item.id);
                          }}
                          className="p-0.5 hover:bg-white/20 rounded flex-shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Month 타입 월간 캘린더 렌더링
  const renderMonthCalendar = () => {
    const days = getMonthDays();
    const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

    return (
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        {/* 월 네비게이션 */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <button
            onClick={() => {
              if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(prev => prev - 1);
              } else {
                setSelectedMonth(prev => prev - 1);
              }
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <span className="font-medium text-gray-900">
            {selectedYear}년 {monthNames[selectedMonth]}
          </span>
          <button
            onClick={() => {
              if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(prev => prev + 1);
              } else {
                setSelectedMonth(prev => prev + 1);
              }
            }}
            className="p-1 hover:bg-gray-200 rounded"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {WEEKDAYS.map((day, idx) => (
            <div
              key={day}
              className={cn(
                'py-2 text-center text-sm font-medium',
                idx >= 5 ? 'text-red-500' : 'text-gray-700'
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const dayItems = day ? routineItems.filter(i => i.day === day) : [];
            return (
              <div
                key={idx}
                onClick={() => day && handleDateClick(day)}
                className={cn(
                  'min-h-[80px] border-b border-r border-gray-100 p-1',
                  day ? 'hover:bg-orange-50 cursor-pointer' : 'bg-gray-50',
                  (idx + 1) % 7 === 0 && 'border-r-0'
                )}
              >
                {day && (
                  <>
                    <div className={cn(
                      'text-sm mb-1',
                      (idx % 7) >= 5 ? 'text-red-500' : 'text-gray-700'
                    )}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayItems.slice(0, 3).map(item => (
                        <div
                          key={item.id}
                          className={cn('px-1 py-0.5 rounded text-white text-xs truncate flex items-center gap-1', item.color)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="truncate flex-1">{item.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeRoutineItem(item.id);
                            }}
                            className="hover:bg-white/20 rounded flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      {dayItems.length > 3 && (
                        <div className="text-xs text-gray-500">+{dayItems.length - 3}개</div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Custom 타입 N일 플래너 렌더링
  const renderCustomPlanner = () => (
    <div className="space-y-4">
      {/* 일수 설정 */}
      <div className="flex items-center gap-3">
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

      {/* 일별 리스트 */}
      <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
        {Array.from({ length: Math.min(customDays, 30) }, (_, i) => i + 1).map(day => {
          const dayItems = routineItems.filter(i => i.day === day);
          return (
            <div
              key={day}
              className="flex border-b border-gray-100 last:border-b-0"
            >
              <div className="w-20 py-3 px-3 text-sm font-medium text-gray-700 bg-gray-50 flex-shrink-0 border-r border-gray-100">
                Day {day}
              </div>
              <div
                onClick={() => handleDateClick(day)}
                className="flex-1 py-2 px-3 min-h-[50px] hover:bg-orange-50 cursor-pointer"
              >
                {dayItems.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {dayItems.map(item => (
                      <div
                        key={item.id}
                        className={cn('px-2 py-1 rounded text-white text-sm flex items-center gap-1', item.color)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>{item.title}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRoutineItem(item.id);
                          }}
                          className="hover:bg-white/20 rounded"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-300 text-sm">+ 일정 추가</div>
                )}
              </div>
            </div>
          );
        })}
        {customDays > 30 && (
          <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
            {customDays - 30}일 더 있음 (스크롤하여 확인)
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* 심플한 헤더 */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
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

      {/* 메인 입력 영역 */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* 에러 메시지 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
            {error}
          </div>
        )}

        {/* 콘텐츠 타입 선택 */}
        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">올릴 종류</p>
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
        <div className="mb-6">
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
            className="w-full min-h-[120px] text-lg text-gray-900 placeholder-gray-400 resize-none border-0 focus:outline-none focus:ring-0"
            style={{ lineHeight: '1.6' }}
          />
        </div>

        {/* 루틴 타입 선택 (루틴일 때만) */}
        {contentType === 'routine' && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">루틴 형식</p>
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

            {/* 루틴 스케줄 에디터 */}
            <div className="mt-4">
              {routineType === 'day' && renderDaySchedule()}
              {routineType === 'week' && renderWeekSchedule()}
              {routineType === 'month' && renderMonthCalendar()}
              {routineType === 'custom' && renderCustomPlanner()}
            </div>

            {/* 추가된 루틴 요약 */}
            {routineItems.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    총 {routineItems.length}개 일정
                  </span>
                  <button
                    onClick={() => setRoutineItems([])}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    전체 삭제
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 파일 첨부 영역 (일반 자료일 때만) */}
        {contentType === 'material' && (
          <div className="mb-6">
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

        {/* 빠른 태그 선택 */}
        <div className="mb-6">
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
                className="flex-1 max-w-[200px] px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          )}
        </div>

        <div className="mb-6">
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
                className="flex-1 max-w-[200px] px-4 py-2 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              />
            </div>
          )}
        </div>

        {/* 가격 선택 */}
        <div className="mb-6">
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

      {/* 루틴 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">일정 추가</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                  setNewItemTitle('');
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 일정 정보 */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              {routineType === 'day' && editingItem?.startHour !== undefined && (
                <p>{editingItem.startHour}:00 ~ {(editingItem.endHour || editingItem.startHour + 1)}:00</p>
              )}
              {routineType === 'week' && editingItem && (
                <p>{WEEKDAYS_FULL[editingItem.day]} {editingItem.startHour}:00 ~ {(editingItem.endHour || editingItem.startHour! + 1)}:00</p>
              )}
              {(routineType === 'month' || routineType === 'custom') && editingItem && (
                <p>{routineType === 'month' ? `${editingItem.day}일` : `Day ${editingItem.day}`}</p>
              )}
            </div>

            {/* 제목 입력 */}
            <input
              type="text"
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              placeholder="무엇을 공부하나요?"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newItemTitle.trim()) {
                  addRoutineItem();
                }
              }}
            />

            {/* 버튼 */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingItem(null);
                  setNewItemTitle('');
                }}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={addRoutineItem}
                disabled={!newItemTitle.trim()}
                className={cn(
                  'flex-1 py-2.5 rounded-xl font-medium transition-colors',
                  newItemTitle.trim()
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
