'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Loader2,
  Upload,
  X,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Video,
  Mic,
  FileText,
  BookOpen,
  AlertCircle,
  Check,
  Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Badge } from '@/components/ui';
import { cn, formatCurrency } from '@/lib/utils';

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
  { id: 'public', label: '공개', desc: '모든 사용자가 볼 수 있습니다', color: 'bg-green-100 text-green-700' },
  { id: 'paid', label: '유료', desc: '별도 결제를 해야 볼 수 있습니다', color: 'bg-orange-100 text-orange-700' },
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

  const [isLoading, setIsLoading] = useState(true);
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

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [contentId]);

  const loadData = async () => {
    setIsLoading(true);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // 콘텐츠 정보 로드
    const { data: contentData, error } = await supabase
      .from('contents')
      .select('*')
      .eq('id', contentId)
      .eq('creator_id', user.id)
      .single();

    if (error || !contentData) {
      router.push('/dashboard/contents');
      return;
    }

    setContent(contentData);

    // 폼 데이터 초기화
    // 기존 콘텐츠가 subscribers나 tier 접근 레벨이면 public으로 변경
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

    setIsLoading(false);
  };

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

    setIsSaving(true);
    setSuccessMessage('');
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 썸네일 업로드
      let thumbnailUrl = content?.thumbnail_url || null;
      if (formData.thumbnail) {
        const fileExt = formData.thumbnail.name.split('.').pop();
        const fileName = `${user.id}/${contentId}/thumbnail.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('content-thumbnails')
          .upload(fileName, formData.thumbnail, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('content-thumbnails')
            .getPublicUrl(fileName);
          thumbnailUrl = publicUrl;
        }
      } else if (!formData.thumbnailPreview && content?.thumbnail_url) {
        // 썸네일이 제거된 경우
        thumbnailUrl = null;
      }

      // 태그 파싱
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // 콘텐츠 업데이트
      const { error: updateError } = await supabase
        .from('contents')
        .update({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          content_type: formData.content_type,
          access_level: formData.access_level,
          price: formData.access_level === 'paid' ? parseInt(formData.price) : null,
          is_published: formData.is_published,
          category: formData.category || null,
          tags: tags.length > 0 ? tags : null,
          required_tier_id: null,
          thumbnail_url: thumbnailUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contentId)
        .eq('creator_id', user.id);

      if (updateError) throw updateError;

      setSuccessMessage('변경사항이 저장되었습니다');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving content:', error);
      setErrors({ submit: '저장 중 오류가 발생했습니다. 다시 시도해주세요.' });
    } finally {
      setIsSaving(false);
    }
  };

  // 삭제
  const handleDelete = async () => {
    setIsDeleting(true);
    const supabase = createClient();

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('contents')
        .delete()
        .eq('id', contentId)
        .eq('creator_id', user.id);

      if (error) throw error;

      router.push('/dashboard/contents');
    } catch (error) {
      console.error('Error deleting content:', error);
      setErrors({ submit: '삭제 중 오류가 발생했습니다. 다시 시도해주세요.' });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-14 flex items-center justify-between">
            <Link
              href={`/dashboard/contents/${contentId}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span className="text-sm font-medium">콘텐츠 상세</span>
            </Link>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 size={16} className="mr-1" />
                삭제
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="mr-1 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-1" />
                    저장
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 성공 메시지 */}
      {successMessage && (
        <div className="bg-green-50 border-b border-green-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2 text-green-700">
              <Check size={16} />
              <span className="text-sm">{successMessage}</span>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900">콘텐츠 수정</h1>

          {/* 에러 메시지 */}
          {errors.submit && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* 기본 정보 */}
          <Card variant="outlined">
            <CardHeader>
              <CardTitle className="text-base">기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  제목 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="콘텐츠 제목을 입력하세요"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-500">{errors.title}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {formData.title.length}/100자
                </p>
              </div>

              {/* 설명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="콘텐츠에 대한 설명을 입력하세요"
                  rows={4}
                  className={cn(
                    "w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none",
                    errors.description ? 'border-red-500' : 'border-gray-200'
                  )}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  {formData.description.length}/2000자
                </p>
              </div>

              {/* 콘텐츠 타입 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  콘텐츠 타입
                </label>
                <div className="flex flex-wrap gap-2">
                  {CONTENT_TYPE_OPTIONS.map((type) => {
                    const IconComponent = type.icon;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handleInputChange('content_type', type.id)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all",
                          formData.content_type === type.id
                            ? "border-violet-600 bg-violet-50 text-violet-700"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <IconComponent size={16} />
                        <span className="text-sm font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 카테고리 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  카테고리
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
                >
                  <option value="">선택 안함</option>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* 태그 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  태그
                </label>
                <Input
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  placeholder="태그를 쉼표로 구분하여 입력하세요 (예: 수학, 고등학교, 미적분)"
                />
                <p className="mt-1 text-xs text-gray-400">
                  쉼표(,)로 구분하여 여러 태그를 입력할 수 있습니다
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 썸네일 */}
          <Card variant="outlined">
            <CardHeader>
              <CardTitle className="text-base">썸네일</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                {/* 썸네일 미리보기 */}
                <div className="relative">
                  {formData.thumbnailPreview ? (
                    <div className="relative w-32 h-32">
                      <img
                        src={formData.thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-32 h-32 rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveThumbnail}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* 업로드 버튼 */}
                <div className="flex-1">
                  <label className="cursor-pointer inline-block">
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors">
                      <Upload size={16} />
                      이미지 업로드
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    JPG, PNG, GIF (최대 5MB)<br />
                    권장 사이즈: 1280 x 720px (16:9)
                  </p>
                  {errors.thumbnail && (
                    <p className="mt-2 text-sm text-red-500">{errors.thumbnail}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 접근 설정 */}
          <Card variant="outlined">
            <CardHeader>
              <CardTitle className="text-base">접근 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 공개 상태 */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {formData.is_published ? (
                    <Eye className="w-5 h-5 text-green-600" />
                  ) : (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {formData.is_published ? '게시됨' : '비공개 (초안)'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formData.is_published
                        ? '다른 사용자가 이 콘텐츠를 볼 수 있습니다'
                        : '나만 볼 수 있는 초안 상태입니다'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleInputChange('is_published', !formData.is_published)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    formData.is_published ? "bg-green-500" : "bg-gray-300"
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
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  접근 권한
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {ACCESS_LEVEL_OPTIONS.map((level) => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => handleInputChange('access_level', level.id)}
                      className={cn(
                        "text-left p-4 rounded-lg border-2 transition-all",
                        formData.access_level === level.id
                          ? "border-violet-600 bg-violet-50"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={level.color}>{level.label}</Badge>
                        {formData.access_level === level.id && (
                          <Check size={16} className="text-violet-600" />
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{level.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* 가격 (유료일 때만) */}
              {formData.access_level === 'paid' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    가격 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      placeholder="0"
                      min="100"
                      max="1000000"
                      className={cn(
                        "pr-8",
                        errors.price ? 'border-red-500' : ''
                      )}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                      원
                    </span>
                  </div>
                  {errors.price && (
                    <p className="mt-1 text-sm text-red-500">{errors.price}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    최소 100원 ~ 최대 1,000,000원
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 하단 버튼 */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/contents/${contentId}`)}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  변경사항 저장
                </>
              )}
            </Button>
          </div>
        </div>
      </main>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowDeleteConfirm(false)}
          />
          <div className="relative bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              콘텐츠를 삭제하시겠습니까?
            </h3>
            <p className="text-gray-500 mb-6">
              삭제된 콘텐츠는 복구할 수 없습니다. 관련된 모든 통계와 댓글도 함께 삭제됩니다.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  '삭제하기'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
