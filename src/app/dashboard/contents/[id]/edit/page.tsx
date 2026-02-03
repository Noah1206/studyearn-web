'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  X,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  BookOpen,
} from 'lucide-react';
import { useSession } from '@/components/providers';
import { Spinner } from '@/components/ui';
import { cn } from '@/lib/utils';

// 콘텐츠 타입 옵션
const CONTENT_TYPE_OPTIONS = [
  { id: 'video', label: '동영상', icon: Video },
  { id: 'audio', label: '오디오', icon: Mic },
  { id: 'document', label: '문서', icon: BookOpen },
  { id: 'post', label: '포스트', icon: FileText },
  { id: 'image', label: '이미지', icon: ImageIcon },
];

// 접근 레벨 옵션
const ACCESS_LEVEL_OPTIONS = [
  { id: 'public', label: '공개', desc: '모든 사용자가 볼 수 있습니다' },
  { id: 'paid', label: '유료', desc: '별도 결제를 해야 볼 수 있습니다' },
];

// 카테고리 옵션
const CATEGORY_OPTIONS = [
  { id: 'korean', label: '국어' },
  { id: 'math', label: '수학' },
  { id: 'english', label: '영어' },
  { id: 'science', label: '과학' },
  { id: 'social', label: '사회' },
  { id: 'history', label: '역사' },
  { id: 'coding', label: '코딩' },
  { id: 'art', label: '예술' },
  { id: 'music', label: '음악' },
  { id: 'study-tips', label: '공부법' },
  { id: 'exam-prep', label: '시험대비' },
  { id: 'language', label: '외국어' },
];

interface ContentData {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  access_level: string;
  price: number | null;
  thumbnail_url: string | null;
  is_published: boolean;
  category: string | null;
  tags: string[] | null;
  required_tier_id: string | null;
}

export default function ContentEditPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.id as string;

  // Use session from SessionProvider
  const { user, session, isLoading: isSessionLoading } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [content, setContent] = useState<ContentData | null>(null);

  // 폼 데이터
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'post',
    access_level: 'public',
    price: '',
    is_published: true,
    category: '',
    tags: '',
    thumbnail: null as File | null,
    thumbnailPreview: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');

  // 중복 로딩 방지
  const isLoadingRef = useRef(false);

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      // Wait for session to load
      if (isSessionLoading) {
        return;
      }

      // Redirect to login if no user
      if (!user) {
        router.push('/login?redirectTo=/dashboard/contents');
        return;
      }

      // 이미 로딩 중이면 중단 (동기적으로 체크하고 바로 설정)
      if (isLoadingRef.current) {
        return;
      }
      isLoadingRef.current = true;

      try {
        setIsLoading(true);

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const fetchUrl = `${supabaseUrl}/rest/v1/contents?id=eq.${contentId}&creator_id=eq.${user.id}&select=*`;

        try {
          const response = await fetch(fetchUrl, {
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
          });
          const data = await response.json();

          const contentData = data?.[0] || null;
          const error = response.ok ? null : new Error(`HTTP ${response.status}`);

          if (error || !contentData) {
            router.push('/dashboard/contents');
            return;
          }

          setContent(contentData);

          // 폼 데이터 초기화
          const accessLevel = ['subscribers', 'tier'].includes(contentData.access_level)
            ? 'public'
            : contentData.access_level || 'public';

          setFormData({
            title: contentData.title || '',
            description: contentData.description || '',
            content_type: contentData.content_type || 'post',
            access_level: accessLevel,
            price: contentData.price?.toString() || '',
            is_published: contentData.is_published ?? true,
            category: contentData.category || '',
            tags: contentData.tags?.join(', ') || '',
            thumbnail: null,
            thumbnailPreview: contentData.thumbnail_url || '',
          });
        } catch {
          router.push('/dashboard/contents');
        }
      } catch {
        router.push('/dashboard/contents');
      } finally {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    };

    loadData();

    // Cleanup
    return () => {
      isLoadingRef.current = false;
    };
  }, [contentId, user, isSessionLoading]); // router 제거 - 불필요한 재실행 방지

  // 입력 핸들러
  const handleInputChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  // 썸네일 변경
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, thumbnail: '파일 크기는 5MB 이하여야 합니다' }));
        return;
      }
      setFormData(prev => ({
        ...prev,
        thumbnail: file,
        thumbnailPreview: URL.createObjectURL(file),
      }));
    }
  };

  // 썸네일 제거
  const handleRemoveThumbnail = () => {
    setFormData(prev => ({
      ...prev,
      thumbnail: null,
      thumbnailPreview: '',
    }));
  };

  // 유효성 검사
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    } else if (formData.title.length < 2) {
      newErrors.title = '제목은 2자 이상이어야 합니다';
    } else if (formData.title.length > 100) {
      newErrors.title = '제목은 100자 이하여야 합니다';
    }

    if (formData.description.length > 2000) {
      newErrors.description = '설명은 2000자 이하여야 합니다';
    }

    if (formData.access_level === 'paid') {
      if (!formData.price) {
        newErrors.price = '유료 콘텐츠의 가격을 입력해주세요';
      } else {
        const price = parseInt(formData.price);
        if (isNaN(price) || price < 100) {
          newErrors.price = '가격은 100원 이상이어야 합니다';
        } else if (price > 1000000) {
          newErrors.price = '가격은 1,000,000원 이하여야 합니다';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 저장
  const handleSave = async () => {
    if (!validate()) return;
    if (!user || !session?.access_token) {
      router.push('/login?redirectTo=/dashboard/contents');
      return;
    }

    setIsSaving(true);
    setSuccessMessage('');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const accessToken = session.access_token;

    try {
      // 썸네일 업로드 (Storage API는 직접 fetch 사용)
      let thumbnailUrl = content?.thumbnail_url || null;
      if (formData.thumbnail) {
        const fileExt = formData.thumbnail.name.split('.').pop();
        const fileName = `${user.id}/${contentId}/thumbnail.${fileExt}`;

        const uploadResponse = await fetch(
          `${supabaseUrl}/storage/v1/object/content-thumbnails/${fileName}`,
          {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${accessToken}`,
              'x-upsert': 'true',
            },
            body: formData.thumbnail,
          }
        );

        if (uploadResponse.ok) {
          thumbnailUrl = `${supabaseUrl}/storage/v1/object/public/content-thumbnails/${fileName}`;
        }
      } else if (!formData.thumbnailPreview && content?.thumbnail_url) {
        thumbnailUrl = null;
      }

      // 태그 파싱
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // 가격 처리
      let price: number | null = null;
      if (formData.access_level === 'paid' && formData.price) {
        const parsed = parseInt(formData.price);
        if (!isNaN(parsed)) {
          price = parsed;
        }
      }

      // 콘텐츠 업데이트 (Native fetch 사용)
      const updateUrl = `${supabaseUrl}/rest/v1/contents?id=eq.${contentId}&creator_id=eq.${user.id}`;
      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          content_type: formData.content_type,
          access_level: formData.access_level,
          price,
          is_published: formData.is_published,
          // tags 컬럼이 DB에 없어서 일시적으로 제외
          // tags: tags.length > 0 ? tags : null,
          thumbnail_url: thumbnailUrl,
        }),
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        throw new Error(errorText || `HTTP ${updateResponse.status}`);
      }

      setSuccessMessage('변경사항이 저장되었습니다');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : '저장 중 오류가 발생했습니다.';
      setErrors({ submit: message });
    } finally {
      setIsSaving(false);
    }
  };

  // 삭제
  const handleDelete = async () => {
    if (!user || !session?.access_token) {
      router.push('/login?redirectTo=/dashboard/contents');
      return;
    }

    setIsDeleting(true);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    try {
      const deleteUrl = `${supabaseUrl}/rest/v1/contents?id=eq.${contentId}&creator_id=eq.${user.id}`;
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      router.push('/dashboard/contents');
    } catch {
      setErrors({ submit: '삭제 중 오류가 발생했습니다. 다시 시도해주세요.' });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading || isSessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <Link
              href="/dashboard/contents"
              className="flex items-center gap-2 text-gray-600 hover:text-black"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">내 콘텐츠</span>
            </Link>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-sm text-gray-400 hover:text-black transition-colors"
              >
                삭제
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="text-sm text-orange-600 hover:text-orange-700 font-bold transition-colors disabled:opacity-50"
              >
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 성공 메시지 */}
      {successMessage && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <p className="text-sm text-orange-600 font-medium">✓ {successMessage}</p>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 제목 */}
          <h1 className="text-2xl font-bold text-black">콘텐츠 수정</h1>

          {/* 에러 메시지 */}
          {errors.submit && (
            <p className="text-sm text-orange-600 font-medium">{errors.submit}</p>
          )}

          {/* 기본 정보 */}
          <section className="space-y-6 py-4">
            <h2 className="text-sm font-semibold text-black">기본 정보</h2>

            {/* 제목 */}
            <div>
              <label className="block text-sm text-black font-medium mb-1">
                제목 <span className="text-orange-600 font-bold">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="콘텐츠 제목을 입력하세요"
                className={cn(
                  "w-full py-2 text-base border-b focus:outline-none focus:border-orange-500 transition-colors bg-transparent",
                  errors.title ? 'border-orange-500' : 'border-gray-200'
                )}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-orange-600 font-medium">{errors.title}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {formData.title.length}/100자
              </p>
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm text-black font-medium mb-1">
                설명
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="콘텐츠에 대한 설명을 입력하세요"
                rows={4}
                className={cn(
                  "w-full py-2 text-base border-b focus:outline-none focus:border-orange-500 transition-colors bg-transparent resize-none",
                  errors.description ? 'border-orange-500' : 'border-gray-200'
                )}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-orange-600 font-medium">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-400">
                {formData.description.length}/2000자
              </p>
            </div>

            {/* 콘텐츠 타입 */}
            <div>
              <label className="block text-sm text-black font-medium mb-2">
                콘텐츠 타입
              </label>
              <div className="flex flex-wrap gap-3">
                {CONTENT_TYPE_OPTIONS.map((type) => {
                  const IconComponent = type.icon;
                  const isSelected = formData.content_type === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleInputChange('content_type', type.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-sm transition-colors",
                        isSelected
                          ? "text-orange-600 font-semibold"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      <IconComponent size={16} />
                      <span>{type.label}</span>
                      {isSelected && <span className="text-orange-600 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 카테고리 */}
            <div>
              <label className="block text-sm text-black font-medium mb-1">
                카테고리
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full py-2 text-base border-b border-gray-200 focus:outline-none focus:border-orange-500 transition-colors bg-transparent appearance-none cursor-pointer"
              >
                <option value="">선택 안함</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* 태그 */}
            <div>
              <label className="block text-sm text-black font-medium mb-1">
                태그
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                placeholder="태그를 쉼표로 구분하여 입력하세요 (예: 수학, 고등학교)"
                className="w-full py-2 text-base border-b border-gray-200 focus:outline-none focus:border-orange-500 transition-colors bg-transparent"
              />
              <p className="mt-1 text-xs text-gray-400">
                쉼표(,)로 구분하여 여러 태그를 입력할 수 있습니다
              </p>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* 썸네일 */}
          <section className="space-y-4 py-4">
            <h2 className="text-sm font-semibold text-black">썸네일</h2>
            <div className="flex items-start gap-6">
              {/* 썸네일 미리보기 */}
              <div className="relative">
                {formData.thumbnailPreview ? (
                  <div className="relative w-24 h-24">
                    <img
                      src={formData.thumbnailPreview}
                      alt="Thumbnail preview"
                      className="w-24 h-24 rounded object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border border-dashed border-gray-300 rounded flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>

              {/* 업로드 버튼 */}
              <div className="flex-1">
                <label className="cursor-pointer inline-block">
                  <span className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium transition-colors">
                    <Upload size={14} />
                    이미지 업로드
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-1 text-xs text-gray-400">
                  JPG, PNG, GIF (최대 5MB) · 1280 x 720px 권장
                </p>
                {errors.thumbnail && (
                  <p className="mt-1 text-sm text-orange-600 font-medium">{errors.thumbnail}</p>
                )}
              </div>
            </div>
          </section>

          <hr className="border-gray-100" />

          {/* 접근 설정 */}
          <section className="space-y-6 py-4">
            <h2 className="text-sm font-semibold text-black">접근 설정</h2>

            {/* 공개 상태 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {formData.is_published ? (
                  <Eye className="w-5 h-5 text-orange-600" />
                ) : (
                  <EyeOff className="w-5 h-5 text-gray-300" />
                )}
                <div>
                  <p className="text-sm font-medium text-black">
                    {formData.is_published ? '게시됨' : '비공개 (초안)'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formData.is_published
                      ? '다른 사용자가 볼 수 있습니다'
                      : '나만 볼 수 있습니다'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleInputChange('is_published', !formData.is_published)}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                  formData.is_published ? "bg-orange-500" : "bg-gray-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    formData.is_published ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {/* 접근 레벨 */}
            <div>
              <label className="block text-sm text-black font-medium mb-2">
                접근 권한
              </label>
              <div className="flex gap-4">
                {ACCESS_LEVEL_OPTIONS.map((level) => {
                  const isSelected = formData.access_level === level.id;
                  return (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => handleInputChange('access_level', level.id)}
                      className={cn(
                        "text-sm transition-colors",
                        isSelected
                          ? "text-orange-600 font-semibold"
                          : "text-gray-500 hover:text-gray-700"
                      )}
                    >
                      {level.label}
                      {isSelected && <span className="ml-1 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                {ACCESS_LEVEL_OPTIONS.find(l => l.id === formData.access_level)?.desc}
              </p>
            </div>

            {/* 가격 (유료일 때만) */}
            {formData.access_level === 'paid' && (
              <div>
                <label className="block text-sm text-black font-medium mb-1">
                  가격 <span className="text-orange-600 font-bold">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    placeholder="0"
                    min="100"
                    max="1000000"
                    className={cn(
                      "w-full py-2 pr-8 text-base border-b focus:outline-none focus:border-orange-500 transition-colors bg-transparent",
                      errors.price ? 'border-orange-500' : 'border-gray-200'
                    )}
                  />
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                    원
                  </span>
                </div>
                {errors.price && (
                  <p className="mt-1 text-sm text-orange-600 font-medium">{errors.price}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  최소 100원 ~ 최대 1,000,000원
                </p>
              </div>
            )}
          </section>

          {/* 하단 버튼 */}
          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => router.push('/dashboard/contents')}
              className="text-sm text-gray-400 hover:text-black transition-colors"
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="text-sm text-orange-600 hover:text-orange-700 font-bold transition-colors disabled:opacity-50"
            >
              {isSaving ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
        </div>
      </main>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-lg p-6 w-full max-w-sm mx-4">
            <h3 className="text-base font-semibold text-black mb-2">
              콘텐츠를 삭제하시겠습니까?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              삭제된 콘텐츠는 복구할 수 없습니다.
            </p>
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="text-sm text-gray-400 hover:text-black transition-colors disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-sm text-orange-600 hover:text-orange-700 font-bold transition-colors disabled:opacity-50"
              >
                {isDeleting ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
